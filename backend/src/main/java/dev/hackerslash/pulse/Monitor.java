package dev.hackerslash.pulse;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
public class Monitor {

    public enum Status { PENDING, UP, DOWN }

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    @Column(nullable = false, length = 80)
    public String name;
    @Column(nullable = false, length = 2048)
    public String url;
    public int intervalSeconds = 60;
    public boolean paused;
    @Enumerated(EnumType.STRING) @Column(nullable = false)
    public Status status = Status.PENDING;
    public Instant statusSince = Instant.now();
    public Instant lastCheckedAt;
    public Integer lastLatencyMs;
    public Integer lastStatusCode;
    @Column(length = 500)
    public String lastError;
    public Instant createdAt = Instant.now();

    boolean isDue(Instant now) {
        return !paused && (lastCheckedAt == null || lastCheckedAt.plusSeconds(intervalSeconds).isBefore(now));
    }
}
