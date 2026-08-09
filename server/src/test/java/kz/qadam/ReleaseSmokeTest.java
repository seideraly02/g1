package kz.qadam;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Map;
import kz.qadam.diagnostic.DiagnosticService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest
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
}
