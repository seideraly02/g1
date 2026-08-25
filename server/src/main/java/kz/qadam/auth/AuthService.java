package kz.qadam.auth;

import java.security.SecureRandom;
import java.sql.Timestamp;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.UUID;
import kz.qadam.common.ApiException;
import kz.qadam.common.TokenHasher;
import kz.qadam.config.QadamProperties;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    public static final String SESSION_COOKIE = "qadam_session";
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final int LOGIN_PHONE_LIMIT = 5;
    private static final int LOGIN_FINGERPRINT_LIMIT = 20;
    private static final String LOGIN_WINDOW = "15 minutes";
    private static final int REGISTRATION_PHONE_LIMIT = 3;
    private static final int REGISTRATION_FINGERPRINT_LIMIT = 10;
    private static final String REGISTRATION_WINDOW = "15 minutes";

    private final JdbcClient jdbc;
    private final TokenHasher hasher;
    private final PasswordEncoder passwordEncoder;
    private final QadamProperties properties;
    private final String dummyPasswordHash;

    public AuthService(
        JdbcClient jdbc,
        TokenHasher hasher,
        PasswordEncoder passwordEncoder,
        QadamProperties properties
    ) {
        this.jdbc = jdbc;
        this.hasher = hasher;
        this.passwordEncoder = passwordEncoder;
        this.properties = properties;
        this.dummyPasswordHash = passwordEncoder.encode(UUID.randomUUID().toString());
    }

    @Transactional(noRollbackFor = ApiException.class)
    public AuthResult register(
        String rawFirstName,
        String rawLastName,
        String rawCity,
        String rawPhone,
        String password,
        String remoteAddress
    ) {
        String firstName = normalizeName(rawFirstName);
        String lastName = normalizeName(rawLastName);
        String city = normalizeCity(rawCity);
        String phone = normalizePhone(rawPhone);
        validatePassword(password);
        String phoneFingerprint = hasher.hash(phone);
        String requestFingerprint = hasher.hash(remoteAddress == null ? "unknown" : remoteAddress);
        lockRateLimitKey("register-phone:" + phoneFingerprint);
        lockRateLimitKey("register-request:" + requestFingerprint);
        enforceRegistrationRateLimit(phoneFingerprint, requestFingerprint);
        jdbc.sql("""
                insert into registration_attempts(phone_fingerprint,request_fingerprint)
                values(:phone,:request)
                """)
            .param("phone", phoneFingerprint)
            .param("request", requestFingerprint)
            .update();

        boolean alreadyRegistered = jdbc.sql("select exists(select 1 from users where phone=:phone)")
            .param("phone", phone)
            .query(Boolean.class)
            .single();
        if (alreadyRegistered) {
            throw new ApiException(HttpStatus.CONFLICT, "PHONE_ALREADY_REGISTERED");
        }
        String passwordHash = passwordEncoder.encode(password);

        UUID userId;
        try {
            userId = jdbc.sql("""
                    insert into users(full_name,first_name,last_name,city,phone,password_hash)
                    values(:fullName,:firstName,:lastName,:city,:phone,:passwordHash)
                    returning id
                    """)
                .param("fullName", firstName + " " + lastName)
                .param("firstName", firstName)
                .param("lastName", lastName)
                .param("city", city)
                .param("phone", phone)
                .param("passwordHash", passwordHash)
                .query(UUID.class)
                .single();
        } catch (DuplicateKeyException error) {
            throw new ApiException(HttpStatus.CONFLICT, "PHONE_ALREADY_REGISTERED");
        }
        return createSession(userId);
    }

    @Transactional(noRollbackFor = ApiException.class)
    public AuthResult login(String rawPhone, String password, String remoteAddress) {
        String phone = normalizeLoginPhone(rawPhone);
        String phoneFingerprint = hasher.hash(phone);
        String requestFingerprint = hasher.hash(remoteAddress == null ? "unknown" : remoteAddress);
        lockRateLimitKey("login-phone:" + phoneFingerprint);
        lockRateLimitKey("login-request:" + requestFingerprint);
        enforceLoginRateLimit(phoneFingerprint, requestFingerprint);

        UUID attemptId = jdbc.sql("""
                insert into login_attempts(phone_fingerprint,request_fingerprint)
                values(:phone,:request)
                returning id
                """)
            .param("phone", phoneFingerprint)
            .param("request", requestFingerprint)
            .query(UUID.class)
            .single();

        LoginUser user = jdbc.sql("select id,password_hash from users where phone=:phone")
            .param("phone", phone)
            .query((rs, rowNum) -> new LoginUser(
                rs.getObject("id", UUID.class),
                rs.getString("password_hash")
            ))
            .optional()
            .orElse(null);

        String candidateHash = user == null || user.passwordHash() == null
            ? dummyPasswordHash
            : user.passwordHash();
        boolean passwordLengthValid = password != null
            && password.length() <= 72
            && password.getBytes(java.nio.charset.StandardCharsets.UTF_8).length <= 72;
        boolean hashMatches = passwordEncoder.matches(
            passwordLengthValid ? password : "",
            candidateHash
        );
        boolean valid = passwordLengthValid && hashMatches;
        if (!valid || user == null || user.passwordHash() == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS");
        }

        jdbc.sql("update login_attempts set succeeded=true where id=:id")
            .param("id", attemptId)
            .update();
        return createSession(user.id());
    }

    public UUID findSessionUser(String token) {
        if (token == null || token.isBlank()) {
            return null;
        }
        return jdbc.sql("""
                select user_id from sessions
                where token_hash=:hash and revoked_at is null and expires_at>now()
                """)
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

    public UserDto findUser(UUID id) {
        return jdbc.sql("""
                select id,
                    coalesce(first_name, split_part(full_name, ' ', 1)) first_name,
                    coalesce(last_name, nullif(substr(full_name, length(split_part(full_name, ' ', 1)) + 2), '')) last_name,
                    city,phone,created_at
                from users where id=:id
                """)
            .param("id", id)
            .query((rs, rowNum) -> new UserDto(
                rs.getString("id"),
                rs.getString("first_name"),
                rs.getString("last_name") == null ? "" : rs.getString("last_name"),
                rs.getString("city"),
                rs.getString("phone"),
                rs.getTimestamp("created_at").toInstant().toString()
            ))
            .single();
    }

    private AuthResult createSession(UUID userId) {
        String sessionToken = randomToken();
        Instant expiresAt = Instant.now().plus(Duration.ofDays(properties.sessionTtlDays()));
        jdbc.sql("insert into sessions(user_id,token_hash,expires_at) values(:user,:hash,:expires)")
            .param("user", userId)
            .param("hash", hasher.hash(sessionToken))
            .param("expires", Timestamp.from(expiresAt))
            .update();
        return new AuthResult(sessionToken, findUser(userId));
    }

    private void enforceLoginRateLimit(String phoneFingerprint, String requestFingerprint) {
        if (countLoginAttempts("phone_fingerprint", phoneFingerprint) >= LOGIN_PHONE_LIMIT
            || countLoginAttempts("request_fingerprint", requestFingerprint) >= LOGIN_FINGERPRINT_LIMIT) {
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "RATE_LIMITED");
        }
    }

    private void enforceRegistrationRateLimit(String phoneFingerprint, String requestFingerprint) {
        if (countAttempts("registration_attempts", "phone_fingerprint", phoneFingerprint,
                REGISTRATION_WINDOW) >= REGISTRATION_PHONE_LIMIT
            || countAttempts("registration_attempts", "request_fingerprint", requestFingerprint,
                REGISTRATION_WINDOW) >= REGISTRATION_FINGERPRINT_LIMIT) {
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "RATE_LIMITED");
        }
    }

    private long countLoginAttempts(String column, String value) {
        return countAttempts("login_attempts", column, value, LOGIN_WINDOW, "succeeded=false and ");
    }

    private long countAttempts(String table, String column, String value, String window) {
        return countAttempts(table, column, value, window, "");
    }

    private long countAttempts(
        String table,
        String column,
        String value,
        String window,
        String predicate
    ) {
        String sql = "select count(*) from " + table + " where " + predicate + column
            + "=:value and created_at > now() - cast(:window as interval)";
        return jdbc.sql(sql)
            .param("value", value)
            .param("window", window)
            .query(Long.class)
            .single();
    }

    private void lockRateLimitKey(String value) {
        jdbc.sql("select 1 from pg_advisory_xact_lock(hashtextextended(:value, 0))")
            .param("value", value)
            .query(Integer.class)
            .single();
    }

    private static String randomToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static String normalizeName(String value) {
        String normalized = value == null ? "" : value.trim().replaceAll("\\s+", " ");
        if (normalized.length() < 2 || normalized.length() > 60) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR");
        }
        return normalized;
    }

    private static String normalizeCity(String value) {
        String normalized = value == null ? "" : value.trim().replaceAll("\\s+", " ");
        if (normalized.length() < 2 || normalized.length() > 80) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR");
        }
        return normalized;
    }

    private static String normalizePhone(String phone) {
        String normalized = phone == null ? "" : phone.replaceAll("[\\s()-]", "");
        if (!normalized.matches("^\\+77\\d{9}$")) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_PHONE");
        }
        return normalized;
    }

    private static String normalizeLoginPhone(String phone) {
        try {
            return normalizePhone(phone);
        } catch (ApiException error) {
            return "+70000000000";
        }
    }

    private static void validatePassword(String password) {
        int byteLength = password == null
            ? 0
            : password.getBytes(java.nio.charset.StandardCharsets.UTF_8).length;
        if (password == null || password.length() < 8 || password.length() > 72 || byteLength > 72) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR");
        }
    }

    public record UserDto(
        String id,
        String firstName,
        String lastName,
        String city,
        String phone,
        String createdAt
    ) {}
    public record AuthResult(String sessionToken, UserDto user) {}
    private record LoginUser(UUID id, String passwordHash) {}
}
