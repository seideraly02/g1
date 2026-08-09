package kz.qadam.diagnostic;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.UUID;
import kz.qadam.auth.AuthService;
import kz.qadam.common.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DiagnosticService {
    private static final int DIAGNOSTIC_QUESTION_COUNT = 5;
    private final JdbcClient jdbc;
    private final ObjectMapper objectMapper;
    private final AuthService authService;

    public DiagnosticService(JdbcClient jdbc, ObjectMapper objectMapper, AuthService authService) {
        this.jdbc = jdbc;
        this.objectMapper = objectMapper;
        this.authService = authService;
    }

    public List<QuestionDto> getQuestions(String subjectId) {
        return jdbc.sql("select id,topic,prompt,options::text from questions where subject_id=:subject order by sort_order limit :limit")
            .param("subject", subjectId)
            .param("limit", DIAGNOSTIC_QUESTION_COUNT)
            .query((rs, rowNum) -> new QuestionDto(
                rs.getString("id"),
                rs.getString("topic"),
                rs.getString("prompt"),
                readOptions(rs.getString("options"))
            ))
            .list();
    }

    @Transactional
    public DiagnosticResult submit(String subjectId, List<AnswerInput> answers, String sessionToken) {
        validateAnswers(answers);
        UUID userId = authService.requireSessionUserId(sessionToken);

        List<AnswerResult> results = new ArrayList<>();
        int correctCount = 0;
        for (AnswerInput answer : answers) {
            CorrectAnswer correctAnswer = jdbc.sql("select correct_option,explanation,jsonb_array_length(options) option_count from questions where id=:id and subject_id=:subject")
                .param("id", answer.questionId())
                .param("subject", subjectId)
                .query((rs, rowNum) -> new CorrectAnswer(
                    rs.getInt("correct_option"),
                    rs.getString("explanation"),
                    rs.getInt("option_count")
                ))
                .optional()
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "INVALID_QUESTION"));

            if (answer.selectedIndex() < 0 || answer.selectedIndex() >= correctAnswer.optionCount()) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_ANSWERS");
            }
            boolean isCorrect = answer.selectedIndex() == correctAnswer.index();
            if (isCorrect) {
                correctCount++;
            }
            results.add(new AnswerResult(
                answer.questionId(),
                isCorrect,
                correctAnswer.index(),
                correctAnswer.explanation()
            ));
        }

        UUID attemptId = UUID.randomUUID();
        jdbc.sql("insert into diagnostic_attempts(id,user_id,subject_id,correct_count,total_count) values(:id,:user,:subject,:correct,:total)")
            .param("id", attemptId)
            .param("user", userId)
            .param("subject", subjectId)
            .param("correct", correctCount)
            .param("total", answers.size())
            .update();

        return new DiagnosticResult(
            attemptId.toString(),
            answers.size(),
            correctCount,
            true,
            results
        );
    }

    private void validateAnswers(List<AnswerInput> answers) {
        if (answers == null || answers.size() != DIAGNOSTIC_QUESTION_COUNT) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_ANSWERS");
        }
        var uniqueQuestionIds = new HashSet<String>();
        for (AnswerInput answer : answers) {
            if (answer == null || answer.questionId() == null || !uniqueQuestionIds.add(answer.questionId())) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_ANSWERS");
            }
        }
    }

    private List<String> readOptions(String value) {
        try {
            return objectMapper.readValue(value, new TypeReference<List<String>>() {});
        } catch (JsonProcessingException error) {
            throw new IllegalStateException("Invalid question options in database", error);
        }
    }

    public record QuestionDto(String id, String topic, String text, List<String> options) {}
    public record AnswerInput(String questionId, int selectedIndex) {}
    public record AnswerResult(String questionId, boolean isCorrect, int correctIndex, String explanation) {}
    public record DiagnosticResult(
        String attemptId,
        int total,
        int correct,
        boolean insufficientData,
        List<AnswerResult> answers
    ) {}
    private record CorrectAnswer(int index, String explanation, int optionCount) {}
}
