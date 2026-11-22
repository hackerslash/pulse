package dev.hackerslash.pulse;

import java.io.InputStream;
import java.net.ConnectException;
import java.net.URI;
import java.net.UnknownHostException;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.http.HttpTimeoutException;
import java.nio.channels.UnresolvedAddressException;
import java.time.Duration;
import javax.net.ssl.SSLException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

@Component
public class Prober {

    /** degraded: up, but a JSON {"up": n, "total": m} reply says fewer than 70% of its items work (0 items: no information). */
    public record Result(boolean up, int latencyMs, Integer statusCode, String error, boolean degraded, String detail) {
        Result(boolean up, int latencyMs, Integer statusCode, String error) {
            this(up, latencyMs, statusCode, error, false, null);
        }
    }

    private static final JsonMapper JSON = JsonMapper.builder().build();

    private final Duration timeout;
    private final HttpClient client;

    public Prober(@Value("${pulse.timeout:10s}") Duration timeout) {
        this.timeout = timeout;
        this.client = HttpClient.newBuilder()
                .connectTimeout(timeout)
                .followRedirects(HttpClient.Redirect.NORMAL)
                .build();
    }

    public Result probe(String url) {
        return probe(url, null);
    }

    public Result probe(String url, String secret) {
        long start = System.nanoTime();
        try {
            var req = HttpRequest.newBuilder(URI.create(url))
                    .timeout(timeout)
                    .header("User-Agent", "Pulse-Uptime/1.0");
            if (secret != null) req.header("Authorization", "Bearer " + secret);
            var res = client.send(req.GET().build(), HttpResponse.BodyHandlers.ofInputStream());
            int code = res.statusCode();
            try (InputStream body = res.body()) {
                int ms = elapsed(start);
                if (code >= 400) return new Result(false, ms, code, "HTTP " + code);
                boolean json = res.headers().firstValue("Content-Type").orElse("").contains("json");
                return json ? score(body.readNBytes(1 << 20), ms, code) : new Result(true, ms, code, null);
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return new Result(false, elapsed(start), null, "Interrupted");
        } catch (Exception e) {
            return new Result(false, elapsed(start), null, describe(e));
        }
    }

    static Result score(byte[] body, int ms, int code) {
        JsonNode n;
        try {
            n = JSON.readTree(body);
        } catch (RuntimeException e) {
            return new Result(true, ms, code, null);
        }
        if (n == null || !n.path("up").isIntegralNumber() || !n.path("total").isIntegralNumber()) return new Result(true, ms, code, null);
        int up = n.get("up").asInt(), total = n.get("total").asInt();
        if (total <= 0) return new Result(true, ms, code, null, false, "Nothing checked yet");
        String detail = up + "/" + total + " up";
        double share = (double) up / total;
        if (share >= 0.7) return new Result(true, ms, code, null, false, detail);
        if (share >= 0.2) return new Result(true, ms, code, null, true, detail);
        return new Result(false, ms, code, detail, false, detail);
    }

    private String describe(Throwable e) {
        for (Throwable t = e; t != null; t = t.getCause()) {
            if (t instanceof UnknownHostException || t instanceof UnresolvedAddressException) return "DNS lookup failed";
        }
        for (Throwable t = e; t != null; t = t.getCause()) {
            if (t instanceof HttpTimeoutException) return "Timed out after " + timeout.toSeconds() + "s";
            if (t instanceof ConnectException) return "Connection refused";
            if (t instanceof SSLException) return "TLS error: " + t.getMessage();
        }
        String msg = e.getMessage();
        return e.getClass().getSimpleName() + (msg == null ? "" : ": " + msg);
    }

    private static int elapsed(long start) {
        return (int) ((System.nanoTime() - start) / 1_000_000);
    }
}
