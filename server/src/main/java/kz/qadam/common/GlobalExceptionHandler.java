package kz.qadam.common;

import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ApiException.class)
    ResponseEntity<Map<String, String>> handleApiException(ApiException error) {
        return ResponseEntity.status(error.status()).body(Map.of("code", error.code()));
    }

    @ExceptionHandler({MethodArgumentNotValidException.class, HttpMessageNotReadableException.class})
    ResponseEntity<Map<String, String>> handleValidationException() {
        return ResponseEntity.badRequest().body(Map.of("code", "VALIDATION_ERROR"));
    }

    @ExceptionHandler(DataAccessException.class)
    ResponseEntity<Map<String, String>> handleDatabaseException(DataAccessException error) {
        log.error("Database operation failed", error);
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
            .body(Map.of("code", "DATABASE_UNAVAILABLE"));
    }
}
