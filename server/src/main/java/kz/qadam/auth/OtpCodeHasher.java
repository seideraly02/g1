package kz.qadam.auth;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class OtpCodeHasher {
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(12);

    public String hash(String code) {
        return encoder.encode(code);
    }

    public boolean matches(String code, String encodedHash) {
        return encoder.matches(code, encodedHash);
    }
}
