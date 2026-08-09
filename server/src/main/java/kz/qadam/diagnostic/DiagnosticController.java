package kz.qadam.diagnostic;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.UUID;
import org.springframework.security.core.Authentication;
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
        Authentication authentication
    ) {
        List<DiagnosticService.AnswerInput> answers = request.answers().stream()
            .map(answer -> new DiagnosticService.AnswerInput(answer.questionId(), answer.selectedIndex()))
            .toList();
        UUID userId = authentication != null && authentication.getPrincipal() instanceof UUID id ? id : null;
        return diagnosticService.submit(subjectId, answers, userId);
    }

    public record DiagnosticSubmission(@NotNull List<@Valid AnswerRequest> answers) {}
    public record AnswerRequest(@NotBlank String questionId, @NotNull Integer selectedIndex) {}
}
