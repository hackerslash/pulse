package dev.hackerslash.pulse;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "daily_stats", uniqueConstraints = @UniqueConstraint(columnNames = {"monitorId", "statDay"}))
public class DailyStat {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    public Long monitorId;
    public LocalDate statDay;
    public long total;
    public long up;

    protected DailyStat() {}

    DailyStat(Long monitorId, LocalDate statDay) {
        this.monitorId = monitorId;
        this.statDay = statDay;
    }
}
