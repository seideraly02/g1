package kz.qadam.auth;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import java.time.Duration;
import kz.qadam.config.QadamProperties;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
public class AuthController {
    private final AuthService authService;
    private final QadamProperties properties;

    public AuthController(AuthService authService, QadamProperties properties) {
        this.authService = authService;
        this.properties = properties;
    }

    @PostMapping("/telegram/request-code")
    AuthService.CodeRequest requestCode(@Valid @RequestBody RegistrationRequest request) {
        return authService.requestCode(request.fullName(), request.city(), request.phone());
    }

    @PostMapping("/telegram/verify-code")
    ResponseEntity<AuthService.UserDto> verifyCode(@Valid @RequestBody VerifyCodeRequest request) {
        AuthService.AuthResult result = authService.verifyCode(request.requestId(), request.code());
        return ResponseEntity.ok()
            .header(HttpHeaders.SET_COOKIE, sessionCookie(result.sessionToken(), Duration.ofDays(30)).toString())
            .body(result.user());
    }

    @GetMapping("/session")
    AuthService.UserDto session(
        @CookieValue(name = AuthService.SESSION_COOKIE, required = false) String sessionToken
    ) {
        return authService.requireSession(sessionToken);
    }

    @DeleteMapping("/session")
    ResponseEntity<Void> signOut(
        @CookieValue(name = AuthService.SESSION_COOKIE, required = false) String sessionToken
    ) {
        authService.revokeSession(sessionToken);
        return ResponseEntity.status(HttpStatus.NO_CONTENT)
            .header(HttpHeaders.SET_COOKIE, sessionCookie("", Duration.ZERO).toString())
            .build();
    }

    private ResponseCookie sessionCookie(String value, Duration maxAge) {
        return ResponseCookie.from(AuthService.SESSION_COOKIE, value)
            .httpOnly(true)
            .secure(properties.sessionCookieSecure())
            .sameSite("Lax")
            .path("/")
            .maxAge(maxAge)
            .build();
    }

    public record RegistrationRequest(
        @NotBlank String fullName,
        @NotBlank String city,
        @NotBlank String phone
    ) {}

    public record VerifyCodeRequest(
        @NotBlank String requestId,
        @NotBlank @Pattern(regexp = "\\d{6}") String code
    ) {}
}
