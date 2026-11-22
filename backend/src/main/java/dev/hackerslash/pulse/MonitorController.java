package dev.hackerslash.pulse;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import org.springframework.data.domain.Limit;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api")
public class MonitorController {

    record MonitorForm(
            @NotBlank @Size(max = 80) String name,
            @NotBlank @Size(max = 2048) @Pattern(regexp = "^https?://\\S+$", message = "must start with http:// or https://") String url,
            @Min(10) @Max(86400) int intervalSeconds,
            Boolean isPublic) {}

    record Beat(Instant t, boolean up, int ms, Integer code, String error) {
        static Beat of(Check c) { return new Beat(c.checkedAt, c.up, c.latencyMs, c.statusCode, c.error); }
    }

    record MonitorView(Monitor monitor, Double uptime24h, Double uptime30d, Integer avgMs24h, List<Beat> beats) {}

    private final MonitorRepo monitors;
    private final CheckRepo checks;
    private final IncidentRepo incidents;
    private final MonitorService service;

    MonitorController(MonitorRepo monitors, CheckRepo checks, IncidentRepo incidents, MonitorService service) {
        this.monitors = monitors;
        this.checks = checks;
        this.incidents = incidents;
        this.service = service;
    }

    // ponytail: 3 queries per monitor per poll, fine for ~100 monitors; batch into one grouped query beyond that
    @GetMapping("/monitors")
    List<MonitorView> list() {
        Instant now = Instant.now();
        return monitors.findAll().stream().map(m -> {
            Object[] day = checks.stats(m.id, now.minus(Duration.ofDays(1))).getFirst();
            Object[] month = checks.stats(m.id, now.minus(Duration.ofDays(30))).getFirst();
            List<Beat> beats = checks.findByMonitorIdOrderByCheckedAtDesc(m.id, Limit.of(60)).reversed().stream().map(Beat::of).toList();
            Double avg = (Double) day[2];
            return new MonitorView(m, uptime(day), uptime(month), avg == null ? null : (int) Math.round(avg), beats);
        }).toList();
    }

    @GetMapping("/monitors/{id}/checks")
    List<Beat> history(@PathVariable Long id, @RequestParam(defaultValue = "24") @Min(1) @Max(720) int hours) {
        return checks.findByMonitorIdAndCheckedAtAfterOrderByCheckedAt(id, Instant.now().minus(Duration.ofHours(hours)))
                .stream().map(Beat::of).toList();
    }

    @PostMapping("/monitors")
    @ResponseStatus(HttpStatus.CREATED)
    Monitor create(@Valid @RequestBody MonitorForm f) {
        Monitor m = new Monitor();
        apply(m, f);
        m = monitors.save(m);
        service.checkAsync(m.id);
        return m;
    }

    @PutMapping("/monitors/{id}")
    Monitor update(@PathVariable Long id, @Valid @RequestBody MonitorForm f) {
        Monitor m = find(id);
        boolean urlChanged = !m.url.equals(f.url());
        apply(m, f);
        m = monitors.save(m);
        if (urlChanged) service.checkAsync(id);
        return m;
    }

    @PostMapping("/monitors/{id}/pause")
    Monitor pause(@PathVariable Long id, @RequestParam boolean paused) {
        Monitor m = find(id);
        m.paused = paused;
        return monitors.save(m);
    }

    @PostMapping("/monitors/{id}/check")
    Monitor checkNow(@PathVariable Long id) {
        find(id);
        service.check(id);
        return find(id);
    }

    @DeleteMapping("/monitors/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void delete(@PathVariable Long id) {
        find(id);
        service.delete(id);
    }

    @GetMapping("/incidents")
    List<Incident> incidents(@RequestParam(defaultValue = "25") @Min(1) @Max(200) int limit) {
        return incidents.findAllByOrderByStartedAtDesc(Limit.of(limit));
    }

    private Monitor find(Long id) {
        return monitors.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "monitor not found"));
    }

    private static void apply(Monitor m, MonitorForm f) {
        m.name = f.name().strip();
        m.url = f.url().strip();
        m.intervalSeconds = f.intervalSeconds();
        if (f.isPublic() != null) m.isPublic = f.isPublic();
    }

    private static Double uptime(Object[] row) {
        long total = ((Number) row[0]).longValue();
        return total == 0 ? null : 100.0 * ((Number) row[1]).longValue() / total;
    }
}
