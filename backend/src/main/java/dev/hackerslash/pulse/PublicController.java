package dev.hackerslash.pulse;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.data.domain.Limit;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.server.ResponseStatusException;

@Controller
public class PublicController {

    enum Granularity {
        DAY(90), WEEK(26), MONTH(12);

        final int buckets;

        Granularity(int buckets) {
            this.buckets = buckets;
        }

        LocalDate start(LocalDate today, int i) {
            int back = buckets - 1 - i;
            return switch (this) {
                case DAY -> today.minusDays(back);
                case WEEK -> today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)).minusWeeks(back);
                case MONTH -> today.withDayOfMonth(1).minusMonths(back);
            };
        }
    }

    record Bucket(LocalDate start, Double uptime) {}

    record PublicMonitor(Long id, String name, Monitor.Status status, Instant statusSince, Double uptime, List<Bucket> buckets) {}

    record PublicIncident(Long id, String monitor, Instant startedAt, Instant resolvedAt) {}

    record Status(String granularity, List<PublicMonitor> monitors, List<PublicIncident> incidents) {}

    private final MonitorRepo monitors;
    private final DailyStatRepo dailyStats;
    private final IncidentRepo incidents;

    PublicController(MonitorRepo monitors, DailyStatRepo dailyStats, IncidentRepo incidents) {
        this.monitors = monitors;
        this.dailyStats = dailyStats;
        this.incidents = incidents;
    }

    @GetMapping({"/admin", "/admin/"})
    String admin() {
        return "forward:/index.html";
    }

    // ponytail: buckets are UTC calendar days/ISO weeks/months; make the zone configurable if viewers care about local midnight
    @GetMapping("/api/public/status")
    @ResponseBody
    Status status(@RequestParam(defaultValue = "day") String granularity) {
        Granularity g;
        try {
            g = Granularity.valueOf(granularity.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "granularity must be day, week or month");
        }
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        List<LocalDate> starts = new ArrayList<>();
        for (int i = 0; i < g.buckets; i++) starts.add(g.start(today, i));

        Map<Long, long[][]> sums = new HashMap<>();
        for (DailyStat s : dailyStats.findByStatDayGreaterThanEqual(starts.getFirst())) {
            int i = starts.size() - 1;
            while (i > 0 && s.statDay.isBefore(starts.get(i))) i--;
            long[] cell = sums.computeIfAbsent(s.monitorId, k -> new long[g.buckets][2])[i];
            cell[0] += s.total;
            cell[1] += s.up;
        }

        List<Monitor> shown = monitors.findAll().stream().filter(m -> m.isPublic && !m.paused)
                .sorted((a, b) -> a.name.compareToIgnoreCase(b.name)).toList();
        Map<Long, String> names = new HashMap<>();
        List<PublicMonitor> list = shown.stream().map(m -> {
            names.put(m.id, m.name);
            long[][] cells = sums.getOrDefault(m.id, new long[g.buckets][2]);
            long total = 0, up = 0;
            List<Bucket> buckets = new ArrayList<>();
            for (int i = 0; i < g.buckets; i++) {
                total += cells[i][0];
                up += cells[i][1];
                buckets.add(new Bucket(starts.get(i), cells[i][0] == 0 ? null : 100.0 * cells[i][1] / cells[i][0]));
            }
            return new PublicMonitor(m.id, m.name, m.status, m.statusSince, total == 0 ? null : 100.0 * up / total, buckets);
        }).toList();

        List<PublicIncident> recent = incidents.findAllByOrderByStartedAtDesc(Limit.of(100)).stream()
                .filter(i -> names.containsKey(i.monitorId)).limit(10)
                .map(i -> new PublicIncident(i.id, names.get(i.monitorId), i.startedAt, i.resolvedAt)).toList();
        return new Status(g.name().toLowerCase(), list, recent);
    }
}
