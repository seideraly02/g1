package kz.qadam.catalog;

import java.util.List;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/subjects")
public class SubjectController {
    private final JdbcClient jdbc;

    public SubjectController(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @GetMapping
    List<SubjectDto> subjects() {
        return jdbc.sql("select id,name from subjects order by sort_order")
            .query(SubjectDto.class)
            .list();
    }

    public record SubjectDto(String id, String name) {}
}
