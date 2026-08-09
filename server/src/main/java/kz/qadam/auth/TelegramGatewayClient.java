package kz.qadam.auth;

import java.time.Duration;
import java.util.Map;
import java.util.UUID;
import kz.qadam.common.ApiException;
import kz.qadam.config.QadamProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Component
public class TelegramGatewayClient {
    private static final Logger log = LoggerFactory.getLogger(TelegramGatewayClient.class);
    private final RestClient restClient;
    private final QadamProperties properties;

    public TelegramGatewayClient(RestClient.Builder restClientBuilder, QadamProperties properties) {
        var requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(5));
        requestFactory.setReadTimeout(Duration.ofSeconds(5));
        this.restClient = restClientBuilder.requestFactory(requestFactory).build();
        this.properties = properties;
    }

    public void sendCode(String phone, String code, UUID requestId) {
        if (!properties.production()) {
            log.info("Development OTP requestId={} code={}", requestId, code);
            return;
        }
        if (isBlank(properties.telegramGatewayUrl()) || isBlank(properties.telegramGatewayToken())) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "TELEGRAM_NOT_CONFIGURED");
        }
        try {
            restClient.post()
                .uri(properties.telegramGatewayUrl())
                .headers(headers -> headers.setBearerAuth(properties.telegramGatewayToken()))
                .body(Map.of("phone_number", phone, "code", code))
                .retrieve()
                .toBodilessEntity();
        } catch (RestClientException error) {
            log.warn("Telegram Gateway request failed for requestId={}", requestId, error);
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "TELEGRAM_UNAVAILABLE");
        }
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
