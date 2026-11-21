package dev.hackerslash.pulse;

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

@Component
public class Prober {

    public record Result(boolean up, int latencyMs, Integer statusCode, String error) {}

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
        long start = System.nanoTime();
        try {
            var req = HttpRequest.newBuilder(URI.create(url))
                    .timeout(timeout)
                    .header("User-Agent", "Pulse-Uptime/1.0")
                    .GET().build();
            int code = client.send(req, HttpResponse.BodyHandlers.discarding()).statusCode();
            int ms = elapsed(start);
            return code < 400 ? new Result(true, ms, code, null) : new Result(false, ms, code, "HTTP " + code);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return new Result(false, elapsed(start), null, "Interrupted");
        } catch (Exception e) {
            return new Result(false, elapsed(start), null, describe(e));
        }
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
