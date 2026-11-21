package dev.hackerslash.pulse;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/webhooks")
public class WebhookController {

    record WebhookForm(
            @NotBlank @Size(max = 80) String name,
            @NotBlank @Size(max = 2048) @Pattern(regexp = "^https?://\\S+$", message = "must start with http:// or https://") String url,
            boolean enabled) {}

    private final WebhookRepo webhooks;
    private final Notifier notifier;

    WebhookController(WebhookRepo webhooks, Notifier notifier) {
        this.webhooks = webhooks;
        this.notifier = notifier;
    }

    @GetMapping
    List<Webhook> list() {
        return webhooks.findAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    Webhook create(@Valid @RequestBody WebhookForm f) {
        return webhooks.save(apply(new Webhook(), f));
    }

    @PutMapping("/{id}")
    Webhook update(@PathVariable Long id, @Valid @RequestBody WebhookForm f) {
        return webhooks.save(apply(find(id), f));
    }

    @PostMapping("/{id}/test")
    Webhook test(@PathVariable Long id) {
        return notifier.test(find(id));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void delete(@PathVariable Long id) {
        webhooks.delete(find(id));
    }

    private Webhook find(Long id) {
        return webhooks.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "webhook not found"));
    }

    private static Webhook apply(Webhook w, WebhookForm f) {
        w.name = f.name().strip();
        w.url = f.url().strip();
        w.enabled = f.enabled();
        return w;
    }
}
