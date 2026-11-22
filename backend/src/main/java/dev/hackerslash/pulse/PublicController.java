package dev.hackerslash.pulse;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.data.domain.Limit;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
public class PublicController {

    enum Granularity {
        DAY(900, 96), WEEK(7200, 84), MONTH(28800, 90);

        final long seconds;
        final int cells;

        Granularity(long seconds, int cells) {
            this.seconds = seconds;
            this.cells = cells;
        }
    }

    record Bucket(Instant start, Double uptime, Double degraded) {}

    record PublicMonitor(Long id, String name, Monitor.Status status, boolean degraded, String detail, Instant statusSince, Double uptime,
                         List<Bucket> buckets) {}

    record PublicIncident(Long id, String monitor, Instant startedAt, Instant resolvedAt) {}

    record Status(String granularity, long bucketSeconds, List<PublicMonitor> monitors, List<PublicIncident> incidents) {}

    private final MonitorRepo monitors;
    private final CheckRepo checks;
    private final IncidentRepo incidents;
    private final SettingsController settings;

    PublicController(MonitorRepo monitors, CheckRepo checks, IncidentRepo incidents, SettingsController settings) {
        this.monitors = monitors;
        this.checks = checks;
        this.incidents = incidents;
        this.settings = settings;
    }

    @GetMapping({"/admin", "/admin/"})
    String admin() {
        return "forward:/index.html";
    }

    // ponytail: unauthenticated aggregate over up to 30 days of checks, uncached; add a short TTL cache if exposed beyond a LAN
    // ponytail: cells align to epoch multiples (UTC), so the newest cell is partial and 2h/8h cells start at odd local hours in some zones
    @GetMapping("/api/public/status")
    @ResponseBody
    Status status() {
        Granularity g = settings.granularity();
        long first = Instant.now().getEpochSecond() / g.seconds - (g.cells - 1);

        Map<Long, long[][]> sums = new HashMap<>();
        for (Object[] r : checks.buckets(Instant.ofEpochSecond(first * g.seconds), g.seconds)) {
            long i = ((Number) r[1]).longValue() - first;
            if (i < 0 || i >= g.cells) continue;
            long[] cell = sums.computeIfAbsent(((Number) r[0]).longValue(), k -> new long[g.cells][3])[(int) i];
            cell[0] += ((Number) r[2]).longValue();
            cell[1] += ((Number) r[3]).longValue();
            cell[2] += ((Number) r[4]).longValue();
        }

        List<Monitor> shown = monitors.findAll().stream().filter(m -> m.isPublic && !m.paused)
                .sorted((a, b) -> a.name.compareToIgnoreCase(b.name)).toList();
        Map<Long, String> names = new HashMap<>();
        List<PublicMonitor> list = shown.stream().map(m -> {
            names.put(m.id, m.name);
            long[][] cells = sums.getOrDefault(m.id, new long[g.cells][3]);
            long total = 0, up = 0;
            List<Bucket> buckets = new ArrayList<>();
            for (int i = 0; i < g.cells; i++) {
                total += cells[i][0];
                up += cells[i][1];
                buckets.add(new Bucket(Instant.ofEpochSecond((first + i) * g.seconds), cells[i][0] == 0 ? null : 100.0 * cells[i][1] / cells[i][0],
                        cells[i][0] == 0 ? null : 100.0 * cells[i][2] / cells[i][0]));
            }
            return new PublicMonitor(m.id, m.name, m.status, m.degraded, m.lastDetail, m.statusSince, total == 0 ? null : 100.0 * up / total, buckets);
        }).toList();

        List<PublicIncident> recent = incidents.findAllByOrderByStartedAtDesc(Limit.of(100)).stream()
                .filter(i -> names.containsKey(i.monitorId)).limit(10)
                .map(i -> new PublicIncident(i.id, names.get(i.monitorId), i.startedAt, i.resolvedAt)).toList();
        return new Status(g.name().toLowerCase(), g.seconds, list, recent);
    }
}
