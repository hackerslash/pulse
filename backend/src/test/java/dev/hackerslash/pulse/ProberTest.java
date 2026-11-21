package dev.hackerslash.pulse;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.ServerSocket;
import java.time.Duration;
import org.junit.jupiter.api.Test;

class ProberTest {

    final Prober prober = new Prober(Duration.ofMillis(500));

    @Test
    void classifiesResponses() throws Exception {
        try (var s = new TestServer()) {
            var ok = prober.probe(s.url("/"));
            assertThat(ok.up()).isTrue();
            assertThat(ok.statusCode()).isEqualTo(200);

            s.status = 503;
            var bad = prober.probe(s.url("/"));
            assertThat(bad.up()).isFalse();
            assertThat(bad.error()).isEqualTo("HTTP 503");

            s.status = 204;
            assertThat(prober.probe(s.url("/slow")).error()).isEqualTo("Timed out after 0s");
        }
    }

    @Test
    void reportsConnectionRefused() throws Exception {
        int port;
        try (var sock = new ServerSocket(0)) { port = sock.getLocalPort(); }
        var r = prober.probe("http://127.0.0.1:" + port + "/");
        assertThat(r.up()).isFalse();
        assertThat(r.error()).isEqualTo("Connection refused");
    }

    @Test
    void reportsDnsFailure() {
        assertThat(prober.probe("http://pulse-test.invalid/").error()).isEqualTo("DNS lookup failed");
    }

    @Test
    void humanDurations() {
        assertThat(MonitorService.human(Duration.ofSeconds(42))).isEqualTo("42s");
        assertThat(MonitorService.human(Duration.ofMinutes(5))).isEqualTo("5m");
        assertThat(MonitorService.human(Duration.ofMinutes(135))).isEqualTo("2h 15m");
        assertThat(MonitorService.human(Duration.ofHours(50))).isEqualTo("2d 2h");
    }
}
