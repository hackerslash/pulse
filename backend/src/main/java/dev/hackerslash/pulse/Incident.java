package dev.hackerslash.pulse;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(indexes = @Index(columnList = "monitorId, resolvedAt"))
public class Incident {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    public Long monitorId;
    public Instant startedAt;
    public Instant resolvedAt;
    @Column(length = 500)
    public String cause;

    protected Incident() {}

    Incident(Long monitorId, Instant startedAt, String cause) {
        this.monitorId = monitorId;
        this.startedAt = startedAt;
        this.cause = cause;
    }
}
