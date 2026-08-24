package kz.qadam.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.UUID;
import kz.qadam.common.ApiException;
import kz.qadam.config.QadamProperties;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;

class TelegramGatewayClientTest {
    @Test
    void acceptsOnlyAnExplicitSuccessfulGatewayResponse() throws Exception {
        withGatewayResponse("{\"ok\":true,\"result\":{}}", client ->
            assertThatCode(() -> client.sendCode("+77015550101", "123456", UUID.randomUUID()))
                .doesNotThrowAnyException()
        );
    }

    @Test
    void mapsOnlyKnownMissingAccountError() throws Exception {
        withGatewayResponse("{\"ok\":false,\"error\":\"PHONE_NUMBER_NOT_FOUND\"}", client ->
            assertThatThrownBy(() -> client.sendCode("+77015550101", "123456", UUID.randomUUID()))
                .isInstanceOfSatisfying(ApiException.class, error -> {
                    assertThat(error.code()).isEqualTo("TELEGRAM_NOT_LINKED");
                    assertThat(error.status().value()).isEqualTo(400);
                })
        );
    }

    @Test
    void treatsOtherGatewayErrorsAsUnavailable() throws Exception {
        withGatewayResponse("{\"ok\":false,\"error\":\"ACCESS_TOKEN_INVALID\"}", client ->
            assertThatThrownBy(() -> client.sendCode("+77015550101", "123456", UUID.randomUUID()))
                .isInstanceOfSatisfying(ApiException.class, error ->
                    assertThat(error.code()).isEqualTo("TELEGRAM_UNAVAILABLE")
                )
        );
    }

    private void withGatewayResponse(String response, ClientAssertion assertion) throws Exception {
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/", exchange -> {
            byte[] body = response.getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, body.length);
            exchange.getResponseBody().write(body);
            exchange.close();
        });
        server.start();
        try {
            var properties = new QadamProperties(
                "https://example.test",
                "production",
                true,
                "Lax",
                30,
                "security-pepper-with-more-than-32-characters",
                "http://127.0.0.1:" + server.getAddress().getPort(),
                "gateway-token",
                "",
                "trusted-proxy-secret-with-more-than-32-characters"
            );
            assertion.run(new TelegramGatewayClient(properties, new ObjectMapper()));
        } finally {
            server.stop(0);
        }
    }

    @FunctionalInterface
    private interface ClientAssertion {
        void run(TelegramGatewayClient client);
    }
}
