package kz.qadam.common;

import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.util.HexFormat;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import kz.qadam.config.QadamProperties;
import org.springframework.stereotype.Component;

@Component
public class TokenHasher {
    private static final String ALGORITHM = "HmacSHA256";
    private final byte[] secret;

    public TokenHasher(QadamProperties properties) {
        this.secret = properties.securityPepper().getBytes(StandardCharsets.UTF_8);
    }

    public String hash(String value) {
        try {
            Mac mac = Mac.getInstance(ALGORITHM);
            mac.init(new SecretKeySpec(secret, ALGORITHM));
            return HexFormat.of().formatHex(mac.doFinal(value.getBytes(StandardCharsets.UTF_8)));
        } catch (GeneralSecurityException error) {
            throw new IllegalStateException("Unable to hash security token", error);
        }
    }

    public boolean matches(String value, String expectedHash) {
        byte[] actual = hash(value).getBytes(StandardCharsets.US_ASCII);
        byte[] expected = expectedHash.getBytes(StandardCharsets.US_ASCII);
        return MessageDigest.isEqual(actual, expected);
    }
}
