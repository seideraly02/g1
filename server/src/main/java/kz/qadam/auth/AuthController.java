package kz.qadam.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.UUID;
import kz.qadam.config.QadamProperties;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
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

    @PostMapping("/register")
    ResponseEntity<AuthService.UserDto> register(
        @Valid @RequestBody RegistrationRequest request,
        HttpServletRequest httpRequest
    ) {
        return authenticatedResponse(authService.register(
            request.firstName(),
            request.lastName(),
            request.city(),
            request.phone(),
            request.password(),
            clientAddress(httpRequest)
        ));
    }

    @PostMapping("/login")
    ResponseEntity<AuthService.UserDto> login(
        @Valid @RequestBody LoginRequest request,
        HttpServletRequest httpRequest
    ) {
        return authenticatedResponse(authService.login(
            request.phone(),
            request.password(),
            clientAddress(httpRequest)
        ));
    }

    @GetMapping("/session")
    ResponseEntity<AuthService.UserDto> session(Authentication authentication) {
        UUID userId = (UUID) authentication.getPrincipal();
        return ResponseEntity.ok()
            .cacheControl(CacheControl.noStore())
            .body(authService.findUser(userId));
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

    private ResponseEntity<AuthService.UserDto> authenticatedResponse(AuthService.AuthResult result) {
        return ResponseEntity.ok()
            .cacheControl(CacheControl.noStore())
            .header(HttpHeaders.SET_COOKIE, sessionCookie(
                result.sessionToken(),
                Duration.ofDays(properties.sessionTtlDays())
            ).toString())
            .body(result.user());
    }

    private ResponseCookie sessionCookie(String value, Duration maxAge) {
        return ResponseCookie.from(AuthService.SESSION_COOKIE, value)
            .httpOnly(true)
            .secure(properties.sessionCookieSecure())
            .sameSite(properties.sessionCookieSameSite())
            .path("/")
            .maxAge(maxAge)
            .build();
    }

    private String clientAddress(HttpServletRequest request) {
        String suppliedSecret = request.getHeader("X-Qadam-Proxy-Secret");
        String clientAddress = request.getHeader("X-Qadam-Client-IP");
        if (constantTimeEquals(suppliedSecret, properties.trustedProxySecret())
            && clientAddress != null && clientAddress.matches("^[0-9a-fA-F:.]{3,45}$")) {
            return clientAddress;
        }
        return request.getRemoteAddr();
    }

    private static boolean constantTimeEquals(String supplied, String configured) {
        if (supplied == null || configured == null || configured.isBlank()) {
            return false;
        }
        return MessageDigest.isEqual(
            supplied.getBytes(StandardCharsets.UTF_8),
            configured.getBytes(StandardCharsets.UTF_8)
        );
    }

    public record RegistrationRequest(
        @NotBlank @Size(min = 2, max = 60) String firstName,
        @NotBlank @Size(min = 2, max = 60) String lastName,
        @NotBlank @Size(min = 2, max = 80) String city,
        @NotBlank @Size(max = 32) String phone,
        @NotBlank @Size(min = 8, max = 72) String password
    ) {}

    public record LoginRequest(
        String phone,
        String password
    ) {}
}
