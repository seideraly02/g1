package kz.qadam.config;

import java.util.Arrays;
import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "qadam")
public record QadamProperties(
    String frontendOrigins,
    String authMode,
    boolean sessionCookieSecure,
    String sessionCookieSameSite,
    int sessionTtlDays,
    String securityPepper,
    int passwordBcryptStrength,
    String trustedProxySecret
) {
    public boolean production() {
        return "production".equalsIgnoreCase(authMode);
    }

    public List<String> allowedOrigins() {
        if (frontendOrigins == null || frontendOrigins.isBlank()) {
            return List.of();
        }
        return Arrays.stream(frontendOrigins.split(","))
            .map(String::trim)
            .filter(value -> !value.isBlank())
            .distinct()
            .toList();
    }
}
