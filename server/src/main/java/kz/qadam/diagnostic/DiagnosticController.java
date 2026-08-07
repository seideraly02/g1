package kz.qadam.diagnostic;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.util.List;
import kz.qadam.auth.AuthController;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/diagnostic/{subjectId}")
public class DiagnosticController {
    private final DiagnosticService diagnosticService;

    public DiagnosticController(DiagnosticService diagnosticService) {
        this.diagnosticService = diagnosticService;
    }

    @GetMapping
    List<DiagnosticService.QuestionDto> questions(@PathVariable String subjectId) {
        return diagnosticService.getQuestions(subjectId);
    }

    @PostMapping("/submit")
    DiagnosticService.DiagnosticResult submit(
        @PathVariable String subjectId,
        @Valid @RequestBody DiagnosticSubmission request,
        @CookieValue(name = AuthController.SESSION_COOKIE, required = false) String sessionToken
    ) {
        List<DiagnosticService.AnswerInput> answers = request.answers().stream()
            .map(answer -> new DiagnosticService.AnswerInput(answer.questionId(), answer.selectedIndex()))
            .toList();
        return diagnosticService.submit(subjectId, answers, sessionToken);
    }

    public record DiagnosticSubmission(List<@Valid AnswerRequest> answers) {}
    public record AnswerRequest(@NotBlank String questionId, int selectedIndex) {}
}
