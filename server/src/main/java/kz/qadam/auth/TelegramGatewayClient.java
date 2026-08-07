package kz.qadam.auth;

import java.util.Map;
import java.util.UUID;
import kz.qadam.common.ApiException;
import kz.qadam.config.QadamProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class TelegramGatewayClient {
    private static final Logger log = LoggerFactory.getLogger(TelegramGatewayClient.class);
    private final RestClient.Builder restClientBuilder;
    private final QadamProperties properties;

    public TelegramGatewayClient(RestClient.Builder restClientBuilder, QadamProperties properties) {
        this.restClientBuilder = restClientBuilder;
        this.properties = properties;
    }

    public void sendCode(String phone, String code, UUID requestId) {
        if ("development".equalsIgnoreCase(properties.authMode())) {
            log.info("Development OTP requestId={} code={}", requestId, code);
            return;
        }
        if (properties.telegramGatewayUrl().isBlank() || properties.telegramGatewayToken().isBlank()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "TELEGRAM_NOT_CONFIGURED");
        }
        restClientBuilder.build().post()
            .uri(properties.telegramGatewayUrl())
            .headers(headers -> headers.setBearerAuth(properties.telegramGatewayToken()))
            .body(Map.of("phone_number", phone, "code", code))
            .retrieve()
            .toBodilessEntity();
    }
}
