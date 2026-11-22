package dev.hackerslash.pulse;

import java.time.Duration;
import java.time.Instant;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

@Service
public class MonitorService {

    private static final Logger log = LoggerFactory.getLogger(MonitorService.class);

    private final MonitorRepo monitors;
    private final CheckRepo checks;
    private final IncidentRepo incidents;
    private final Prober prober;
    private final Notifier notifier;
    private final TransactionTemplate tx;
    private final Duration retry;
    private final String canary;
    private final ExecutorService pool = Executors.newVirtualThreadPerTaskExecutor();
    private final Set<Long> inFlight = ConcurrentHashMap.newKeySet();

    MonitorService(MonitorRepo monitors, CheckRepo checks, IncidentRepo incidents, Prober prober, Notifier notifier, TransactionTemplate tx,
                   @Value("${pulse.retry:20s}") Duration retry, @Value("${pulse.canary:}") String canary) {
        this.monitors = monitors;
        this.checks = checks;
        this.incidents = incidents;
        this.prober = prober;
        this.notifier = notifier;
        this.tx = tx;
        this.retry = retry;
        this.canary = canary.strip();
    }

    @Scheduled(fixedDelayString = "${pulse.tick:1s}")
    void tick() {
        Instant now = Instant.now();
        for (Monitor m : monitors.findAll()) {
            if (m.isDue(now)) checkAsync(m.id);
        }
    }

    void checkAsync(Long id) {
        if (!inFlight.add(id)) return;
        pool.submit(() -> {
            try {
                check(id, true);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            } catch (Exception e) {
                log.error("check failed for monitor {}", id, e);
            } finally {
                inFlight.remove(id);
            }
        });
    }

    public void check(Long id) {
        try {
            check(id, false);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    /**
     * confirm: a failure is probed again after pulse.retry before it counts, so a restart or one dropped request is no
     * outage; and if pulse.canary is unreachable too, this host is offline and nothing is recorded (a gray gap).
     */
    void check(Long id, boolean confirm) throws InterruptedException {
        Monitor m = monitors.findById(id).orElse(null);
        if (m == null) return;
        Prober.Result probed = prober.probe(m.url, m.secret);
        if (confirm && !probed.up()) {
            if (!retry.isZero()) {
                Thread.sleep(retry);
                probed = prober.probe(m.url, m.secret);
            }
            if (!probed.up() && !canary.isEmpty() && !prober.probe(canary).up()) {
                log.warn("{}: {}, but the canary is unreachable too; no result recorded", m.name, probed.error());
                tx.executeWithoutResult(s -> monitors.touch(id, Instant.now()));
                return;
            }
        }
        Prober.Result r = probed;
        Instant now = Instant.now();
        Monitor.Status next = r.up() ? Monitor.Status.UP : Monitor.Status.DOWN;
        boolean changed = next != m.status;

        tx.executeWithoutResult(s -> {
            if (!monitors.existsById(id)) return;
            checks.save(new Check(id, now, r));
            monitors.recordCheck(id, next, changed ? now : m.statusSince, now, r.latencyMs(), r.statusCode(), r.error(),
                    r.degraded(), r.detail());
            if (!changed) return;
            if (next == Monitor.Status.DOWN) {
                incidents.save(new Incident(id, now, r.error()));
            } else {
                incidents.findFirstByMonitorIdAndResolvedAtIsNull(id).ifPresent(i -> i.resolvedAt = now);
            }
        });

        if (next == Monitor.Status.DOWN && changed) {
            notifier.outage(Notifier.Event.DOWN, m, r.error(), null);
        } else if (next == Monitor.Status.UP && m.status == Monitor.Status.DOWN) {
            notifier.outage(Notifier.Event.UP, m, null, Duration.between(m.statusSince, now));
        }
    }

    @Transactional
    public void delete(Long id) {
        checks.deleteByMonitorId(id);
        incidents.deleteByMonitorId(id);
        monitors.deleteById(id);
    }

    @Scheduled(cron = "0 17 3 * * *")
    @Transactional
    void prune() {
        int n = checks.deleteOlderThan(Instant.now().minus(Duration.ofDays(30)));
        log.info("pruned {} checks older than 30 days", n);
    }

    static String human(Duration d) {
        long s = d.toSeconds();
        if (s < 60) return s + "s";
        if (s < 3600) return s / 60 + "m";
        if (s < 86400) return s / 3600 + "h " + s % 3600 / 60 + "m";
        return s / 86400 + "d " + s % 86400 / 3600 + "h";
    }
}
