package kz.qadam;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import jakarta.servlet.http.Cookie;
import java.util.Map;
import kz.qadam.diagnostic.DiagnosticService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest(properties = {
    "qadam.auth-mode=development",
    "qadam.development-otp-code=111111",
    "qadam.security-pepper=test-security-pepper-with-more-than-32-characters"
})
@AutoConfigureMockMvc
@Testcontainers
class ReleaseSmokeTest {
    @Container
    @ServiceConnection
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired
    MockMvc mockMvc;

    @Autowired
    DiagnosticService diagnosticService;

    @Autowired
    JdbcClient jdbc;

    @Autowired
    ObjectMapper objectMapper;

    @Test
    void healthChecksDatabaseAndSessionRouteIsProtected() throws Exception {
        mockMvc.perform(get("/health"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("ok"))
            .andExpect(jsonPath("$.database").value("ok"));

        mockMvc.perform(get("/auth/session"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void diagnosticPersistsAttemptAndAnswerLevelAnalytics() {
        var questions = diagnosticService.getQuestions("history-kz");
        assertThat(questions).hasSize(5);

        Map<String, Integer> correctAnswers = Map.of(
            "history-1", 0,
            "history-2", 2,
            "history-3", 1,
            "history-4", 2,
            "history-5", 2
        );
        var answers = questions.stream()
            .map(question -> new DiagnosticService.AnswerInput(
                question.id(),
                correctAnswers.get(question.id())
            ))
            .toList();

        var result = diagnosticService.submit("history-kz", answers, null);

        assertThat(result.correct()).isEqualTo(5);
        assertThat(result.total()).isEqualTo(5);
        long storedAnswers = jdbc.sql("select count(*) from diagnostic_answers where attempt_id=:id")
            .param("id", java.util.UUID.fromString(result.attemptId()))
            .query(Long.class)
            .single();
        assertThat(storedAnswers).isEqualTo(5);
    }

    @Test
    void registrationCreatesHttpOnlySessionAndOtpIsSingleUse() throws Exception {
        String requestBody = """
            {"fullName":"Аян Серікұлы","city":"Алматы","phone":"+77015550101"}
            """;
        String response = mockMvc.perform(post("/auth/telegram/request-code")
                .contentType("application/json")
                .content(requestBody))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.resendAfterSeconds").value(60))
            .andReturn().getResponse().getContentAsString();
        JsonNode requested = objectMapper.readTree(response);
        String requestId = requested.get("requestId").asText();

        var verified = mockMvc.perform(post("/auth/telegram/verify-code")
                .contentType("application/json")
                .content("""
                    {"requestId":"%s","code":"111111"}
                    """.formatted(requestId)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.fullName").value("Аян Серікұлы"))
            .andReturn();

        Cookie session = verified.getResponse().getCookie("qadam_session");
        assertThat(session).isNotNull();
        assertThat(session.isHttpOnly()).isTrue();

        mockMvc.perform(get("/auth/session").cookie(session))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.phone").value("+77015550101"));

        mockMvc.perform(post("/auth/telegram/verify-code")
                .contentType("application/json")
                .content("""
                    {"requestId":"%s","code":"111111"}
                    """.formatted(requestId)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("CODE_EXPIRED"));

        mockMvc.perform(delete("/auth/session").cookie(session))
            .andExpect(status().isNoContent());
        mockMvc.perform(get("/auth/session").cookie(session))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void wrongOtpAttemptsPersistAndLockTheRequest() throws Exception {
        String response = mockMvc.perform(post("/auth/telegram/request-code")
                .contentType("application/json")
                .content("""
                    {"fullName":"Меруерт Асан","city":"Астана","phone":"+77015550102"}
                    """))
            .andExpect(status().isOk())
            .andReturn().getResponse().getContentAsString();
        String requestId = objectMapper.readTree(response).get("requestId").asText();

        for (int attempt = 0; attempt < 5; attempt++) {
            mockMvc.perform(post("/auth/telegram/verify-code")
                    .contentType("application/json")
                    .content("""
                        {"requestId":"%s","code":"000000"}
                        """.formatted(requestId)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_CODE"));
        }

        mockMvc.perform(post("/auth/telegram/verify-code")
                .contentType("application/json")
                .content("""
                    {"requestId":"%s","code":"111111"}
                    """.formatted(requestId)))
            .andExpect(status().isTooManyRequests())
            .andExpect(jsonPath("$.code").value("RATE_LIMITED"));
    }
}
