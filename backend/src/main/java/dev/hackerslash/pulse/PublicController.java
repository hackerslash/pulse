package dev.hackerslash.pulse;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.IntStream;
import org.springframework.data.domain.Limit;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
public class PublicController {

    record Day(LocalDate date, Double uptime) {}

    record PublicMonitor(Long id, String name, Monitor.Status status, Instant statusSince, Double uptime30d, Integer avgMs24h, List<Day> days) {}

    record PublicIncident(Long id, String monitor, Instant startedAt, Instant resolvedAt) {}

    record Status(List<PublicMonitor> monitors, List<PublicIncident> incidents) {}

    static final int DAYS = 30;

    private final MonitorRepo monitors;
    private final CheckRepo checks;
    private final IncidentRepo incidents;

    PublicController(MonitorRepo monitors, CheckRepo checks, IncidentRepo incidents) {
        this.monitors = monitors;
        this.checks = checks;
        this.incidents = incidents;
    }

    @GetMapping({"/admin", "/admin/"})
    String admin() {
        return "forward:/index.html";
    }

    // ponytail: days are UTC calendar days; make the zone configurable if viewers care about local midnight
    @GetMapping("/api/public/status")
    @ResponseBody
    Status status() {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        Instant from = today.minusDays(DAYS - 1).atStartOfDay(ZoneOffset.UTC).toInstant();
        Map<Long, Map<LocalDate, long[]>> daily = new HashMap<>();
        for (Object[] r : checks.daily(from)) {
            LocalDate d = r[1] instanceof java.sql.Date sd ? sd.toLocalDate() : (LocalDate) r[1];
            daily.computeIfAbsent(((Number) r[0]).longValue(), k -> new HashMap<>())
                    .put(d, new long[] {((Number) r[2]).longValue(), ((Number) r[3]).longValue()});
        }

        List<Monitor> shown = monitors.findAll().stream().filter(m -> m.isPublic && !m.paused)
                .sorted((a, b) -> a.name.compareToIgnoreCase(b.name)).toList();
        Map<Long, String> names = new HashMap<>();
        Instant dayAgo = Instant.now().minus(Duration.ofDays(1));

        List<PublicMonitor> list = shown.stream().map(m -> {
            names.put(m.id, m.name);
            Map<LocalDate, long[]> byDay = daily.getOrDefault(m.id, Map.of());
            long total = 0, up = 0;
            for (long[] v : byDay.values()) { total += v[0]; up += v[1]; }
            List<Day> days = IntStream.range(0, DAYS).mapToObj(i -> {
                LocalDate d = today.minusDays(DAYS - 1 - i);
                long[] v = byDay.get(d);
                return new Day(d, v == null || v[0] == 0 ? null : 100.0 * v[1] / v[0]);
            }).toList();
            Double avg = (Double) checks.stats(m.id, dayAgo).getFirst()[2];
            return new PublicMonitor(m.id, m.name, m.status, m.statusSince, total == 0 ? null : 100.0 * up / total,
                    avg == null ? null : (int) Math.round(avg), days);
        }).toList();

        List<PublicIncident> recent = incidents.findAllByOrderByStartedAtDesc(Limit.of(100)).stream()
                .filter(i -> names.containsKey(i.monitorId)).limit(10)
                .map(i -> new PublicIncident(i.id, names.get(i.monitorId), i.startedAt, i.resolvedAt)).toList();
        return new Status(list, recent);
    }
}
