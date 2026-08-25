package kz.qadam.config;

import java.net.URI;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class ReleaseConfigurationValidator implements ApplicationRunner {
    private final QadamProperties properties;

    public ReleaseConfigurationValidator(QadamProperties properties) {
        this.properties = properties;
    }

    @Override
    public void run(ApplicationArguments args) {
        require("production".equalsIgnoreCase(properties.authMode())
                || "development".equalsIgnoreCase(properties.authMode()),
            "AUTH_MODE must be exactly production or development");
        require(properties.sessionTtlDays() > 0 && properties.sessionTtlDays() <= 90,
            "SESSION_TTL_DAYS must be between 1 and 90");
        require(properties.securityPepper() != null && properties.securityPepper().length() >= 32,
            "SECURITY_PEPPER must contain at least 32 characters");
        require(properties.passwordBcryptStrength() >= 10 && properties.passwordBcryptStrength() <= 14,
            "PASSWORD_BCRYPT_STRENGTH must be between 10 and 14");
        require(properties.sessionCookieSameSite() != null
                && properties.sessionCookieSameSite().matches("(?i)Lax|Strict|None"),
            "SESSION_COOKIE_SAME_SITE must be Lax, Strict, or None");

        if (!properties.production()) {
            return;
        }
        require(properties.sessionCookieSecure(), "SESSION_COOKIE_SECURE must be true in production");
        require(properties.trustedProxySecret() != null && properties.trustedProxySecret().length() >= 32,
            "TRUSTED_PROXY_SECRET must contain at least 32 characters in production");
        require(!properties.allowedOrigins().isEmpty(), "FRONTEND_ORIGINS is required in production");

        for (String origin : properties.allowedOrigins()) {
            URI uri = URI.create(origin);
            require("https".equalsIgnoreCase(uri.getScheme()), "Every production frontend origin must use HTTPS");
            require(uri.getHost() != null && !uri.getHost().equalsIgnoreCase("localhost"),
                "Localhost is not allowed in production frontend origins");
        }
    }

    private static void require(boolean condition, String message) {
        if (!condition) {
            throw new IllegalStateException(message);
        }
    }
}
