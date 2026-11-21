package dev.hackerslash.pulse;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "checks", indexes = @Index(columnList = "monitorId, checkedAt"))
public class Check {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    public Long monitorId;
    public Instant checkedAt;
    public boolean up;
    public int latencyMs;
    public Integer statusCode;
    @Column(length = 500)
    public String error;

    protected Check() {}

    Check(Long monitorId, Instant checkedAt, Prober.Result r) {
        this.monitorId = monitorId;
        this.checkedAt = checkedAt;
        this.up = r.up();
        this.latencyMs = r.latencyMs();
        this.statusCode = r.statusCode();
        this.error = r.error();
    }
}
