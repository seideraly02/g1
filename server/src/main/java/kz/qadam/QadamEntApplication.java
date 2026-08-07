package kz.qadam;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class QadamEntApplication {
    public static void main(String[] args) {
        SpringApplication.run(QadamEntApplication.class, args);
    }
}
