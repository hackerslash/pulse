package dev.hackerslash.pulse;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
public class Webhook {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    @Column(nullable = false, length = 80)
    public String name;
    @Column(nullable = false, length = 2048)
    public String url;
    public boolean enabled = true;
    public Instant lastSentAt;
    public Integer lastStatusCode;
    @Column(length = 500)
    public String lastError;
    public Instant createdAt = Instant.now();
}
