package dev.hackerslash.pulse;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

interface MonitorRepo extends JpaRepository<Monitor, Long> {

    @Modifying
    @Query("""
        update Monitor m set m.status = :status, m.statusSince = :since, m.lastCheckedAt = :at,
        m.lastLatencyMs = :ms, m.lastStatusCode = :code, m.lastError = :error where m.id = :id""")
    void recordCheck(Long id, Monitor.Status status, Instant since, Instant at, Integer ms, Integer code, String error);
}

interface CheckRepo extends JpaRepository<Check, Long> {

    List<Check> findByMonitorIdOrderByCheckedAtDesc(Long monitorId, Limit limit);

    List<Check> findByMonitorIdAndCheckedAtAfterOrderByCheckedAt(Long monitorId, Instant after);

    @Query("select count(c), coalesce(sum(case when c.up then 1 else 0 end), 0), avg(case when c.up then c.latencyMs end) from Check c where c.monitorId = :id and c.checkedAt > :after")
    List<Object[]> stats(Long id, Instant after);

    @Query(value = "select monitor_id, cast(checked_at as date), count(*), sum(case when up then 1 else 0 end) from checks where checked_at >= :after group by monitor_id, cast(checked_at as date)", nativeQuery = true)
    List<Object[]> daily(Instant after);

    @Modifying
    void deleteByMonitorId(Long monitorId);

    @Modifying
    @Query("delete from Check c where c.checkedAt < :before")
    int deleteOlderThan(Instant before);
}

interface IncidentRepo extends JpaRepository<Incident, Long> {

    Optional<Incident> findFirstByMonitorIdAndResolvedAtIsNull(Long monitorId);

    List<Incident> findAllByOrderByStartedAtDesc(Limit limit);

    @Modifying
    void deleteByMonitorId(Long monitorId);
}

interface WebhookRepo extends JpaRepository<Webhook, Long> {

    List<Webhook> findByEnabledTrue();

    @Modifying
    @Query("update Webhook w set w.lastSentAt = :at, w.lastStatusCode = :code, w.lastError = :error where w.id = :id")
    void recordDelivery(Long id, Instant at, Integer code, String error);
}
