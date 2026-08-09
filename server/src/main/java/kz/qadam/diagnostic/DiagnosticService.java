package kz.qadam.diagnostic;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
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

    public DiagnosticService(JdbcClient jdbc, ObjectMapper objectMapper) {
        this.jdbc = jdbc;
        this.objectMapper = objectMapper;
    }

    public List<QuestionDto> getQuestions(String subjectId) {
        List<QuestionDto> questions = jdbc.sql("select id,topic,prompt,options::text from questions where subject_id=:subject and is_active=true order by sort_order limit :limit")
            .param("subject", subjectId)
            .param("limit", DIAGNOSTIC_QUESTION_COUNT)
            .query((rs, rowNum) -> new QuestionDto(
                rs.getString("id"),
                rs.getString("topic"),
                rs.getString("prompt"),
                readOptions(rs.getString("options"))
            ))
            .list();
        if (questions.size() < DIAGNOSTIC_QUESTION_COUNT) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "QUESTION_BANK_INCOMPLETE");
        }
        return questions;
    }

    @Transactional
    public DiagnosticResult submit(String subjectId, List<AnswerInput> answers, UUID userId) {
        validateAnswers(answers);

        List<String> questionIds = answers.stream().map(AnswerInput::questionId).toList();
        Map<String, CorrectAnswer> correctAnswers = jdbc.sql("select id,correct_option,explanation,jsonb_array_length(options) option_count from questions where subject_id=:subject and is_active=true and id in (:ids)")
            .param("subject", subjectId)
            .param("ids", questionIds)
            .query((rs, rowNum) -> new CorrectAnswer(
                rs.getString("id"),
                rs.getInt("correct_option"),
                rs.getString("explanation"),
                rs.getInt("option_count")
            ))
            .list()
            .stream()
            .collect(Collectors.toMap(CorrectAnswer::id, Function.identity()));

        if (correctAnswers.size() != answers.size()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_QUESTION");
        }

        List<AnswerResult> results = new ArrayList<>();
        int correctCount = 0;
        for (AnswerInput answer : answers) {
            CorrectAnswer correctAnswer = correctAnswers.get(answer.questionId());
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

        for (int index = 0; index < answers.size(); index++) {
            AnswerInput answer = answers.get(index);
            AnswerResult result = results.get(index);
            jdbc.sql("insert into diagnostic_answers(attempt_id,question_id,selected_option,is_correct) values(:attempt,:question,:selected,:correct)")
                .param("attempt", attemptId)
                .param("question", answer.questionId())
                .param("selected", answer.selectedIndex())
                .param("correct", result.isCorrect())
                .update();
        }

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
            if (
                answer == null ||
                answer.questionId() == null ||
                answer.questionId().isBlank() ||
                !uniqueQuestionIds.add(answer.questionId())
            ) {
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
    private record CorrectAnswer(String id, int index, String explanation, int optionCount) {}
}
