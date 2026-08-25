package kz.qadam;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import jakarta.servlet.http.Cookie;
import java.util.Map;
import kz.qadam.diagnostic.DiagnosticService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest(properties = {
    "qadam.auth-mode=development",
    "qadam.password-bcrypt-strength=10",
    "qadam.session-cookie-secure=true",
    "qadam.security-pepper=test-security-pepper-with-more-than-32-characters"
})
@AutoConfigureMockMvc
@Testcontainers
class ReleaseSmokeTest {
    @Container
    @ServiceConnection
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:17-alpine");

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
        mockMvc.perform(get("/subjects"))
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
    void registrationLoginSessionAndLogoutUsePasswordWithoutReturningIt() throws Exception {
        String registration = """
            {
              "firstName":"Аян",
              "lastName":"Серікұлы",
              "city":"Алматы",
              "phone":"+77015550101",
              "password":"strong-pass-101"
            }
            """;
        var registered = mockMvc.perform(post("/auth/register")
                .contentType("application/json")
                .content(registration))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.firstName").value("Аян"))
            .andExpect(jsonPath("$.lastName").value("Серікұлы"))
            .andExpect(jsonPath("$.password").doesNotExist())
            .andReturn();

        Cookie session = registered.getResponse().getCookie("qadam_session");
        assertThat(session).isNotNull();
        assertThat(session.isHttpOnly()).isTrue();
        assertThat(registered.getResponse().getHeader("Set-Cookie"))
            .contains("HttpOnly", "Secure", "SameSite=Lax", "Path=/", "Max-Age=2592000");
        String passwordHash = jdbc.sql("select password_hash from users where phone=:phone")
            .param("phone", "+77015550101")
            .query(String.class)
            .single();
        assertThat(passwordHash).startsWith("$2").doesNotContain("strong-pass-101");

        mockMvc.perform(get("/auth/session").cookie(session))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.phone").value("+77015550101"));
        var loggedOut = mockMvc.perform(delete("/auth/session").cookie(session))
            .andExpect(status().isNoContent())
            .andReturn();
        assertThat(loggedOut.getResponse().getHeader("Set-Cookie"))
            .contains("HttpOnly", "Secure", "SameSite=Lax", "Path=/", "Max-Age=0");
        mockMvc.perform(get("/auth/session").cookie(session))
            .andExpect(status().isUnauthorized());

        var loggedIn = mockMvc.perform(post("/auth/login")
                .contentType("application/json")
                .content("""
                    {"phone":"+77015550101","password":"strong-pass-101"}
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.password").doesNotExist())
            .andReturn();
        assertThat(loggedIn.getResponse().getCookie("qadam_session")).isNotNull();
        assertThat(loggedIn.getResponse().getHeader("Set-Cookie"))
            .contains("HttpOnly", "Secure", "SameSite=Lax", "Path=/", "Max-Age=2592000");
    }

    @Test
    void duplicateAndLegacyPhonesCannotBeClaimed() throws Exception {
        jdbc.sql("""
                insert into users(full_name,city,phone)
                values('Legacy User','Астана','+77015550102')
                """)
            .update();

        String request = """
            {
              "firstName":"Меруерт",
              "lastName":"Асан",
              "city":"Астана",
              "phone":"+77015550102",
              "password":"strong-pass-102"
            }
            """;
        mockMvc.perform(post("/auth/register")
                .contentType("application/json")
                .content(request))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.code").value("PHONE_ALREADY_REGISTERED"));

        mockMvc.perform(post("/auth/login")
                .contentType("application/json")
                .content("""
                    {"phone":"+77015550102","password":"strong-pass-102"}
                    """))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS"));
    }

    @Test
    void failedLoginUsesGenericErrorAndIsRateLimited() throws Exception {
        for (int attempt = 0; attempt < 5; attempt++) {
            mockMvc.perform(post("/auth/login")
                    .contentType("application/json")
                    .content("""
                        {"phone":"+77015550103","password":"wrong-password"}
                        """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS"));
        }

        mockMvc.perform(post("/auth/login")
                .contentType("application/json")
                .content("""
                    {"phone":"+77015550103","password":"wrong-password"}
                    """))
            .andExpect(status().isTooManyRequests())
            .andExpect(jsonPath("$.code").value("RATE_LIMITED"));
    }

    @Test
    void registrationIsRateLimitedByClientBeforeUnboundedAccountGrowth() throws Exception {
        for (int attempt = 0; attempt < 10; attempt++) {
            String phone = "+770155502" + String.format("%02d", attempt);
            mockMvc.perform(post("/auth/register")
                    .with(request -> {
                        request.setRemoteAddr("203.0.113.10");
                        return request;
                    })
                    .contentType("application/json")
                    .content("""
                        {
                          "firstName":"Аян",
                          "lastName":"Серікұлы",
                          "city":"Алматы",
                          "phone":"%s",
                          "password":"strong-pass-rate"
                        }
                        """.formatted(phone)))
                .andExpect(status().isOk());
        }

        mockMvc.perform(post("/auth/register")
                .with(request -> {
                    request.setRemoteAddr("203.0.113.10");
                    return request;
                })
                .contentType("application/json")
                .content("""
                    {
                      "firstName":"Аян",
                      "lastName":"Серікұлы",
                      "city":"Алматы",
                      "phone":"+77015550210",
                      "password":"strong-pass-rate"
                    }
                    """))
            .andExpect(status().isTooManyRequests())
            .andExpect(jsonPath("$.code").value("RATE_LIMITED"));
    }

    @Test
    void registrationIsAlsoRateLimitedByPhone() throws Exception {
        String body = """
            {
              "firstName":"Аян",
              "lastName":"Серікұлы",
              "city":"Алматы",
              "phone":"+77015550300",
              "password":"strong-pass-phone"
            }
            """;
        mockMvc.perform(post("/auth/register").contentType("application/json").content(body))
            .andExpect(status().isOk());
        for (int attempt = 0; attempt < 2; attempt++) {
            String remoteAddress = "203.0.113." + (30 + attempt);
            mockMvc.perform(post("/auth/register")
                    .with(request -> {
                        request.setRemoteAddr(remoteAddress);
                        return request;
                    })
                    .contentType("application/json")
                    .content(body))
                .andExpect(status().isConflict());
        }
        mockMvc.perform(post("/auth/register")
                .with(request -> {
                    request.setRemoteAddr("203.0.113.40");
                    return request;
                })
                .contentType("application/json")
                .content(body))
            .andExpect(status().isTooManyRequests())
            .andExpect(jsonPath("$.code").value("RATE_LIMITED"));
    }

    @Test
    void loginIsAlsoRateLimitedByClientFingerprint() throws Exception {
        for (int attempt = 0; attempt < 20; attempt++) {
            String phone = "+770155504" + String.format("%02d", attempt);
            mockMvc.perform(post("/auth/login")
                    .with(request -> {
                        request.setRemoteAddr("203.0.113.50");
                        return request;
                    })
                    .contentType("application/json")
                    .content("""
                        {"phone":"%s","password":"wrong-password"}
                        """.formatted(phone)))
                .andExpect(status().isUnauthorized());
        }
        mockMvc.perform(post("/auth/login")
                .with(request -> {
                    request.setRemoteAddr("203.0.113.50");
                    return request;
                })
                .contentType("application/json")
                .content("""
                    {"phone":"+77015550420","password":"wrong-password"}
                    """))
            .andExpect(status().isTooManyRequests())
            .andExpect(jsonPath("$.code").value("RATE_LIMITED"));
    }

    @Test
    void successfulLoginDoesNotConsumeFailureQuota() throws Exception {
        String registration = """
            {
              "firstName":"Аян",
              "lastName":"Серікұлы",
              "city":"Алматы",
              "phone":"+77015550500",
              "password":"strong-pass-success"
            }
            """;
        mockMvc.perform(post("/auth/register")
                .with(request -> {
                    request.setRemoteAddr("203.0.113.60");
                    return request;
                })
                .contentType("application/json")
                .content(registration))
            .andExpect(status().isOk());

        for (int attempt = 0; attempt < 6; attempt++) {
            mockMvc.perform(post("/auth/login")
                    .with(request -> {
                        request.setRemoteAddr("203.0.113.60");
                        return request;
                    })
                    .contentType("application/json")
                    .content("""
                        {"phone":"+77015550500","password":"strong-pass-success"}
                        """))
                .andExpect(status().isOk());
        }
    }
}
