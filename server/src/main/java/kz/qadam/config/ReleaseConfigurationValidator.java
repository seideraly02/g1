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
        if (!properties.production()) {
            require(properties.developmentOtpCode() != null
                    && properties.developmentOtpCode().matches("\\d{6}"),
                "DEVELOPMENT_OTP_CODE must contain exactly 6 digits in development");
            return;
        }
        require(properties.sessionCookieSecure(), "SESSION_COOKIE_SECURE must be true in production");
        require(properties.sessionTtlDays() > 0 && properties.sessionTtlDays() <= 90,
            "SESSION_TTL_DAYS must be between 1 and 90");
        require(properties.securityPepper() != null && properties.securityPepper().length() >= 32,
            "SECURITY_PEPPER must contain at least 32 characters");
        require(properties.telegramGatewayUrl() != null && !properties.telegramGatewayUrl().isBlank(),
            "TELEGRAM_GATEWAY_URL is required in production");
        require(properties.telegramGatewayToken() != null && !properties.telegramGatewayToken().isBlank(),
            "TELEGRAM_GATEWAY_TOKEN is required in production");
        require(properties.developmentOtpCode() == null || properties.developmentOtpCode().isBlank(),
            "DEVELOPMENT_OTP_CODE must be empty in production");
        require(properties.trustedProxySecret() != null && properties.trustedProxySecret().length() >= 32,
            "TRUSTED_PROXY_SECRET must contain at least 32 characters in production");
        require(properties.sessionCookieSameSite() != null
                && properties.sessionCookieSameSite().matches("(?i)Lax|Strict|None"),
            "SESSION_COOKIE_SAME_SITE must be Lax, Strict, or None");
        require(!properties.allowedOrigins().isEmpty(), "FRONTEND_ORIGINS is required in production");

        URI gatewayUri = URI.create(properties.telegramGatewayUrl());
        require("https".equalsIgnoreCase(gatewayUri.getScheme()),
            "TELEGRAM_GATEWAY_URL must use HTTPS in production");
        require(gatewayUri.getHost() != null && !gatewayUri.getHost().equalsIgnoreCase("localhost"),
            "TELEGRAM_GATEWAY_URL must not use localhost in production");

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
