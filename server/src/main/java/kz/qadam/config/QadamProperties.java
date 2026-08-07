package kz.qadam.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "qadam")
public record QadamProperties(
    String authMode,
    boolean sessionCookieSecure,
    String telegramGatewayUrl,
    String telegramGatewayToken
) {}
