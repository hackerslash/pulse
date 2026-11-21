package dev.hackerslash.pulse;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;
import tools.jackson.databind.json.JsonMapper;

@Component
public class Notifier {

    public enum Event { DOWN, UP, TEST }

    private static final Logger log = LoggerFactory.getLogger(Notifier.class);
    private final HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
    private final WebhookRepo webhooks;
    private final TransactionTemplate tx;
    private final JsonMapper json;

    Notifier(WebhookRepo webhooks, TransactionTemplate tx, JsonMapper json) {
        this.webhooks = webhooks;
        this.tx = tx;
        this.json = json;
    }

    public void outage(Event event, Monitor m, String error, Duration downFor) {
        String text = event == Event.DOWN
                ? "🔴 " + m.name + " is DOWN — " + error + "\n" + m.url
                : "🟢 " + m.name + " is back UP after " + MonitorService.human(downFor) + "\n" + m.url;
        log.info("alert: {}", text.replace('\n', ' '));
        var monitor = Map.of("id", m.id, "name", m.name, "url", m.url);
        var payload = payload(event, text);
        payload.put("monitor", monitor);
        if (error != null) payload.put("error", error);
        if (downFor != null) payload.put("downtimeSeconds", downFor.toSeconds());
        webhooks.findByEnabledTrue().forEach(w -> deliver(w, payload));
    }

    public Webhook test(Webhook w) {
        deliver(w, payload(Event.TEST, "✅ Pulse test notification for \"" + w.name + "\""));
        return webhooks.findById(w.id).orElseThrow();
    }

    private static Map<String, Object> payload(Event event, String text) {
        var p = new LinkedHashMap<String, Object>();
        p.put("event", event.name().toLowerCase());
        p.put("text", text);
        p.put("content", text);
        p.put("at", Instant.now().toString());
        return p;
    }

    private void deliver(Webhook w, Map<String, Object> payload) {
        Integer code = null;
        String error = null;
        try {
            var req = HttpRequest.newBuilder(URI.create(w.url))
                    .timeout(Duration.ofSeconds(10))
                    .header("Content-Type", "application/json")
                    .header("User-Agent", "Pulse-Uptime/1.0")
                    .POST(HttpRequest.BodyPublishers.ofString(json.writeValueAsString(payload))).build();
            code = client.send(req, HttpResponse.BodyHandlers.discarding()).statusCode();
            if (code >= 300) error = "HTTP " + code;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            error = "Interrupted";
        } catch (Exception e) {
            error = e.getClass().getSimpleName() + (e.getMessage() == null ? "" : ": " + e.getMessage());
        }
        if (error != null) log.warn("webhook {} failed: {}", w.name, error);
        Integer c = code;
        String err = error;
        tx.executeWithoutResult(s -> webhooks.recordDelivery(w.id, Instant.now(), c, err));
    }
}
