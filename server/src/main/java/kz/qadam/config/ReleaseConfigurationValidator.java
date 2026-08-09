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
        if (!properties.production()) {
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
