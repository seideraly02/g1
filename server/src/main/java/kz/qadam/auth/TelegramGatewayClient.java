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
import org.springframework.web.client.HttpClientErrorException;
import tools.jackson.databind.ObjectMapper;

@Component
public class TelegramGatewayClient {
    private static final Logger log = LoggerFactory.getLogger(TelegramGatewayClient.class);
    private final RestClient restClient;
    private final QadamProperties properties;
    private final ObjectMapper objectMapper;

    public TelegramGatewayClient(QadamProperties properties, ObjectMapper objectMapper) {
        var requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(5));
        requestFactory.setReadTimeout(Duration.ofSeconds(5));
        this.restClient = RestClient.builder().requestFactory(requestFactory).build();
        this.properties = properties;
        this.objectMapper = objectMapper;
    }

    public void sendCode(String phone, String code, UUID requestId) {
        if (!properties.production()) {
            log.info("Development OTP prepared for requestId={}", requestId);
            return;
        }
        if (isBlank(properties.telegramGatewayUrl()) || isBlank(properties.telegramGatewayToken())) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "TELEGRAM_NOT_CONFIGURED");
        }
        try {
            GatewayResponse response = restClient.post()
                .uri(properties.telegramGatewayUrl())
                .headers(headers -> headers.setBearerAuth(properties.telegramGatewayToken()))
                .body(Map.of("phone_number", phone, "code", code))
                .retrieve()
                .body(GatewayResponse.class);
            requireSuccessfulResponse(response);
        } catch (HttpClientErrorException.BadRequest error) {
            throw gatewayError(readError(error.getResponseBodyAsString()), requestId);
        } catch (RestClientException error) {
            log.warn("Telegram Gateway request failed for requestId={}", requestId);
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "TELEGRAM_UNAVAILABLE");
        }
    }

    private void requireSuccessfulResponse(GatewayResponse response) {
        if (response == null || !Boolean.TRUE.equals(response.ok())) {
            throw gatewayError(response == null ? null : response.error(), null);
        }
    }

    private RuntimeException gatewayError(String error, UUID requestId) {
        if ("PHONE_NUMBER_NOT_FOUND".equals(error) || "PHONE_NOT_REGISTERED".equals(error)) {
            if (requestId != null) {
                log.info("Telegram account is unavailable for requestId={}", requestId);
            }
            return new ApiException(HttpStatus.BAD_REQUEST, "TELEGRAM_NOT_LINKED");
        }
        return new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "TELEGRAM_UNAVAILABLE");
    }

    private String readError(String body) {
        try {
            return objectMapper.readValue(body, GatewayResponse.class).error();
        } catch (RuntimeException error) {
            return null;
        }
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private record GatewayResponse(Boolean ok, String error) {}
}
