package kz.qadam.api;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.sql.Timestamp;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestClient;

@RestController
public class QadamApiController {
    private static final Logger log = LoggerFactory.getLogger(QadamApiController.class);
    private static final SecureRandom random = new SecureRandom();
    private static final String COOKIE = "qadam_session";
    private final JdbcClient jdbc;
    private final ObjectMapper json;
    private final String authMode;
    private final boolean secureCookie;
    private final String telegramUrl;
    private final String telegramToken;

    public QadamApiController(JdbcClient jdbc, ObjectMapper json,
            @Value("${qadam.auth-mode}") String authMode,
            @Value("${qadam.session-cookie-secure}") boolean secureCookie,
            @Value("${qadam.telegram-gateway-url}") String telegramUrl,
            @Value("${qadam.telegram-gateway-token}") String telegramToken) {
        this.jdbc = jdbc;
        this.json = json;
        this.authMode = authMode;
        this.secureCookie = secureCookie;
        this.telegramUrl = telegramUrl;
        this.telegramToken = telegramToken;
    }

    @GetMapping("/health")
    Map<String, String> health() { return Map.of("status", "ok"); }

    @PostMapping("/auth/telegram/request-code")
    CodeRequest requestCode(@Valid @RequestBody Registration input) {
        String phone = normalizePhone(input.phone());
        Integer recent = jdbc.sql("select count(*) from otp_requests where phone=:phone and created_at > now() - interval '60 seconds'")
            .param("phone", phone).query(Integer.class).single();
        if (recent > 0) throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "RATE_LIMITED");
        String code = "%06d".formatted(random.nextInt(1_000_000));
        UUID id = UUID.randomUUID();
        Instant expires = Instant.now().plus(Duration.ofMinutes(5));
        jdbc.sql("insert into otp_requests(id,full_name,city,phone,code_hash,expires_at) values(:id,:name,:city,:phone,:hash,:expires)")
            .param("id", id).param("name", input.fullName().trim()).param("city", input.city().trim())
            .param("phone", phone).param("hash", hash(code)).param("expires", Timestamp.from(expires)).update();
        if ("development".equalsIgnoreCase(authMode)) {
            log.info("Development OTP requestId={} code={}", id, code);
        } else {
            sendTelegramCode(phone, code);
        }
        return new CodeRequest(id.toString(), expires.toString(), 60);
    }

    @PostMapping("/auth/telegram/verify-code")
    UserDto verifyCode(@Valid @RequestBody VerifyCode input, HttpServletResponse response) {
        var row = jdbc.sql("select id,full_name,city,phone,code_hash,attempts,expires_at,used_at from otp_requests where id=:id")
            .param("id", UUID.fromString(input.requestId())).query((rs, n) -> new OtpRow(
                rs.getObject("id", UUID.class), rs.getString("full_name"), rs.getString("city"), rs.getString("phone"),
                rs.getString("code_hash"), rs.getInt("attempts"), rs.getTimestamp("expires_at").toInstant(),
                rs.getTimestamp("used_at") == null ? null : rs.getTimestamp("used_at").toInstant())).optional()
            .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "INVALID_CODE"));
        if (row.usedAt() != null || row.expiresAt().isBefore(Instant.now())) throw new ApiException(HttpStatus.BAD_REQUEST, "CODE_EXPIRED");
        if (row.attempts() >= 5) throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "RATE_LIMITED");
        if (!MessageDigest.isEqual(row.codeHash().getBytes(StandardCharsets.UTF_8), hash(input.code()).getBytes(StandardCharsets.UTF_8))) {
            jdbc.sql("update otp_requests set attempts=attempts+1 where id=:id").param("id", row.id()).update();
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_CODE");
        }
        UUID userId = jdbc.sql("insert into users(full_name,city,phone) values(:name,:city,:phone) on conflict(phone) do update set full_name=excluded.full_name,city=excluded.city,verified_at=now() returning id")
            .param("name", row.fullName()).param("city", row.city()).param("phone", row.phone()).query(UUID.class).single();
        jdbc.sql("update otp_requests set used_at=now() where id=:id").param("id", row.id()).update();
        String token = UUID.randomUUID() + "." + UUID.randomUUID();
        jdbc.sql("insert into sessions(user_id,token_hash,expires_at) values(:user,:hash,now()+interval '30 days')")
            .param("user", userId).param("hash", hash(token)).update();
        response.addHeader("Set-Cookie", COOKIE + "=" + token + "; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000" + (secureCookie ? "; Secure" : ""));
        return userById(userId);
    }

    @GetMapping("/auth/session")
    UserDto session(@CookieValue(name = COOKIE, required = false) String token) {
        UUID userId = sessionUser(token);
        if (userId == null) throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED");
        return userById(userId);
    }

    @DeleteMapping("/auth/session")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void signOut(@CookieValue(name = COOKIE, required = false) String token, HttpServletResponse response) {
        if (token != null) jdbc.sql("update sessions set revoked_at=now() where token_hash=:hash").param("hash", hash(token)).update();
        response.addHeader("Set-Cookie", COOKIE + "=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0" + (secureCookie ? "; Secure" : ""));
    }

    @GetMapping("/subjects")
    List<SubjectDto> subjects() {
        return jdbc.sql("select id,name from subjects order by sort_order").query(SubjectDto.class).list();
    }

    @GetMapping("/diagnostic/{subjectId}")
    List<QuestionDto> questions(@PathVariable String subjectId) {
        return jdbc.sql("select id,topic,prompt,options::text from questions where subject_id=:subject order by sort_order limit 5")
            .param("subject", subjectId).query((rs, n) -> {
                try { return new QuestionDto(rs.getString("id"), rs.getString("topic"), rs.getString("prompt"), json.readValue(rs.getString("options"), new TypeReference<List<String>>() {})); }
                catch (Exception e) { throw new IllegalStateException(e); }
            }).list();
    }

    @PostMapping("/diagnostic/{subjectId}/submit")
    DiagnosticResult submit(@PathVariable String subjectId, @Valid @RequestBody DiagnosticSubmission input,
            @CookieValue(name = COOKIE, required = false) String token) {
        if (input.answers().size() != 5) throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_ANSWERS");
        var results = new ArrayList<AnswerResult>();
        int correct = 0;
        for (AnswerInput answer : input.answers()) {
            var question = jdbc.sql("select correct_option,explanation from questions where id=:id and subject_id=:subject")
                .param("id", answer.questionId()).param("subject", subjectId)
                .query((rs, n) -> new CorrectAnswer(rs.getInt("correct_option"), rs.getString("explanation"))).optional()
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "INVALID_QUESTION"));
            boolean isCorrect = answer.selectedIndex() == question.index();
            if (isCorrect) correct++;
            results.add(new AnswerResult(answer.questionId(), isCorrect, question.index(), question.explanation()));
        }
        UUID attemptId = UUID.randomUUID();
        jdbc.sql("insert into diagnostic_attempts(id,user_id,subject_id,correct_count,total_count) values(:id,:user,:subject,:correct,:total)")
            .param("id", attemptId).param("user", sessionUser(token)).param("subject", subjectId)
            .param("correct", correct).param("total", input.answers().size()).update();
        return new DiagnosticResult(attemptId.toString(), input.answers().size(), correct, true, results);
    }

    private UserDto userById(UUID id) {
        return jdbc.sql("select id,full_name,city,phone,verified_at from users where id=:id").param("id", id)
            .query((rs, n) -> new UserDto(rs.getString("id"), rs.getString("full_name"), rs.getString("city"), rs.getString("phone"), rs.getTimestamp("verified_at").toInstant().toString())).single();
    }

    private UUID sessionUser(String token) {
        if (token == null || token.isBlank()) return null;
        return jdbc.sql("select user_id from sessions where token_hash=:hash and revoked_at is null and expires_at>now()")
            .param("hash", hash(token)).query(UUID.class).optional().orElse(null);
    }

    private void sendTelegramCode(String phone, String code) {
        if (telegramUrl.isBlank() || telegramToken.isBlank()) throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "TELEGRAM_NOT_CONFIGURED");
        RestClient.create().post().uri(telegramUrl).header("Authorization", "Bearer " + telegramToken)
            .body(Map.of("phone_number", phone, "code", code)).retrieve().toBodilessEntity();
    }

    private static String normalizePhone(String phone) {
        String value = phone.replaceAll("[\\s()-]", "");
        if (!value.matches("^\\+77\\d{9}$")) throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_PHONE");
        return value;
    }

    private static String hash(String value) {
        try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8))); }
        catch (Exception e) { throw new IllegalStateException(e); }
    }

    @ExceptionHandler(ApiException.class)
    org.springframework.http.ResponseEntity<Map<String, String>> apiError(ApiException error) {
        return org.springframework.http.ResponseEntity.status(error.status).body(Map.of("code", error.code));
    }

    public record Registration(@NotBlank String fullName, @NotBlank String city, @NotBlank String phone) {}
    public record VerifyCode(@NotBlank String requestId, @Pattern(regexp="\\d{6}") String code) {}
    public record CodeRequest(String requestId, String expiresAt, int resendAfterSeconds) {}
    public record UserDto(String id, String fullName, String city, String phone, String verifiedAt) {}
    public record SubjectDto(String id, String name) {}
    public record QuestionDto(String id, String topic, String text, List<String> options) {}
    public record AnswerInput(@NotBlank String questionId, int selectedIndex) {}
    public record DiagnosticSubmission(List<@Valid AnswerInput> answers) {}
    public record AnswerResult(String questionId, boolean isCorrect, int correctIndex, String explanation) {}
    public record DiagnosticResult(String attemptId, int total, int correct, boolean insufficientData, List<AnswerResult> answers) {}
    private record CorrectAnswer(int index, String explanation) {}
    private record OtpRow(UUID id, String fullName, String city, String phone, String codeHash, int attempts, Instant expiresAt, Instant usedAt) {}
    private static class ApiException extends RuntimeException {
        final HttpStatus status; final String code;
        ApiException(HttpStatus status, String code) { this.status = status; this.code = code; }
    }
}
