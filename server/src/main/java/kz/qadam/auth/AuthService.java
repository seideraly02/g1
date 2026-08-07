package kz.qadam.auth;

import java.security.SecureRandom;
import java.sql.Timestamp;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import kz.qadam.common.ApiException;
import kz.qadam.common.Sha256Hasher;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private static final SecureRandom RANDOM = new SecureRandom();
    private final JdbcClient jdbc;
    private final Sha256Hasher hasher;
    private final TelegramGatewayClient telegramGateway;

    public AuthService(JdbcClient jdbc, Sha256Hasher hasher, TelegramGatewayClient telegramGateway) {
        this.jdbc = jdbc;
        this.hasher = hasher;
        this.telegramGateway = telegramGateway;
    }

    @Transactional
    public CodeRequest requestCode(String fullName, String city, String rawPhone) {
        String phone = normalizePhone(rawPhone);
        Integer recent = jdbc.sql("select count(*) from otp_requests where phone=:phone and created_at > now() - interval '60 seconds'")
            .param("phone", phone)
            .query(Integer.class)
            .single();
        if (recent > 0) {
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "RATE_LIMITED");
        }

        String code = "%06d".formatted(RANDOM.nextInt(1_000_000));
        UUID requestId = UUID.randomUUID();
        Instant expiresAt = Instant.now().plus(Duration.ofMinutes(5));
        jdbc.sql("insert into otp_requests(id,full_name,city,phone,code_hash,expires_at) values(:id,:name,:city,:phone,:hash,:expires)")
            .param("id", requestId)
            .param("name", fullName.trim())
            .param("city", city.trim())
            .param("phone", phone)
            .param("hash", hasher.hash(code))
            .param("expires", Timestamp.from(expiresAt))
            .update();

        telegramGateway.sendCode(phone, code, requestId);
        return new CodeRequest(requestId.toString(), expiresAt.toString(), 60);
    }

    @Transactional
    public AuthResult verifyCode(String rawRequestId, String code) {
        UUID requestId = parseRequestId(rawRequestId);
        OtpRow otp = jdbc.sql("select id,full_name,city,phone,code_hash,attempts,expires_at,used_at from otp_requests where id=:id")
            .param("id", requestId)
            .query((rs, rowNum) -> new OtpRow(
                rs.getObject("id", UUID.class),
                rs.getString("full_name"),
                rs.getString("city"),
                rs.getString("phone"),
                rs.getString("code_hash"),
                rs.getInt("attempts"),
                rs.getTimestamp("expires_at").toInstant(),
                rs.getTimestamp("used_at") == null ? null : rs.getTimestamp("used_at").toInstant()
            ))
            .optional()
            .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "INVALID_CODE"));

        if (otp.usedAt() != null || otp.expiresAt().isBefore(Instant.now())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "CODE_EXPIRED");
        }
        if (otp.attempts() >= 5) {
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "RATE_LIMITED");
        }
        if (!hasher.matches(code, otp.codeHash())) {
            jdbc.sql("update otp_requests set attempts=attempts+1 where id=:id")
                .param("id", requestId)
                .update();
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_CODE");
        }

        UUID userId = jdbc.sql("insert into users(full_name,city,phone) values(:name,:city,:phone) on conflict(phone) do update set full_name=excluded.full_name,city=excluded.city,verified_at=now() returning id")
            .param("name", otp.fullName())
            .param("city", otp.city())
            .param("phone", otp.phone())
            .query(UUID.class)
            .single();
        jdbc.sql("update otp_requests set used_at=now() where id=:id").param("id", requestId).update();

        String sessionToken = UUID.randomUUID() + "." + UUID.randomUUID();
        jdbc.sql("insert into sessions(user_id,token_hash,expires_at) values(:user,:hash,now()+interval '30 days')")
            .param("user", userId)
            .param("hash", hasher.hash(sessionToken))
            .update();
        return new AuthResult(sessionToken, findUser(userId));
    }

    public UserDto requireSession(String token) {
        UUID userId = findSessionUser(token);
        if (userId == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED");
        }
        return findUser(userId);
    }

    public UUID findSessionUser(String token) {
        if (token == null || token.isBlank()) {
            return null;
        }
        return jdbc.sql("select user_id from sessions where token_hash=:hash and revoked_at is null and expires_at>now()")
            .param("hash", hasher.hash(token))
            .query(UUID.class)
            .optional()
            .orElse(null);
    }

    public void revokeSession(String token) {
        if (token != null && !token.isBlank()) {
            jdbc.sql("update sessions set revoked_at=now() where token_hash=:hash")
                .param("hash", hasher.hash(token))
                .update();
        }
    }

    private UserDto findUser(UUID id) {
        return jdbc.sql("select id,full_name,city,phone,verified_at from users where id=:id")
            .param("id", id)
            .query((rs, rowNum) -> new UserDto(
                rs.getString("id"),
                rs.getString("full_name"),
                rs.getString("city"),
                rs.getString("phone"),
                rs.getTimestamp("verified_at").toInstant().toString()
            ))
            .single();
    }

    private static UUID parseRequestId(String value) {
        try {
            return UUID.fromString(value);
        } catch (IllegalArgumentException error) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_CODE");
        }
    }

    private static String normalizePhone(String phone) {
        String normalized = phone.replaceAll("[\\s()-]", "");
        if (!normalized.matches("^\\+77\\d{9}$")) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_PHONE");
        }
        return normalized;
    }

    public record CodeRequest(String requestId, String expiresAt, int resendAfterSeconds) {}
    public record UserDto(String id, String fullName, String city, String phone, String verifiedAt) {}
    public record AuthResult(String sessionToken, UserDto user) {}
    private record OtpRow(
        UUID id,
        String fullName,
        String city,
        String phone,
        String codeHash,
        int attempts,
        Instant expiresAt,
        Instant usedAt
    ) {}
}
