package dev.hackerslash.pulse;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(properties = {"spring.datasource.url=jdbc:h2:mem:flow", "pulse.tick=1h"})
@AutoConfigureMockMvc
class MonitorFlowTest {

    @Autowired MockMvc mvc;
    @Autowired MonitorRepo monitors;
    @Autowired IncidentRepo incidents;

    @Test
    void upDownRecoverLifecycle() throws Exception {
        try (var site = new TestServer(); var hook = new TestServer()) {
            mvc.perform(post("/api/webhooks").contentType(MediaType.APPLICATION_JSON)
                            .content("{\"name\":\"Hook\",\"url\":\"" + hook.url("/hook") + "\",\"enabled\":true}"))
                    .andExpect(status().isCreated());

            String body = mvc.perform(post("/api/monitors").contentType(MediaType.APPLICATION_JSON)
                            .content("{\"name\":\"Site\",\"url\":\"" + site.url("/") + "\",\"intervalSeconds\":60}"))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.status").value("PENDING"))
                    .andReturn().getResponse().getContentAsString();
            long id = Long.parseLong(body.replaceAll(".*\"id\":(\\d+).*", "$1"));
            awaitChecked(id);

            mvc.perform(post("/api/monitors/" + id + "/check")).andExpect(jsonPath("$.status").value("UP"));

            site.status = 500;
            mvc.perform(post("/api/monitors/" + id + "/check"))
                    .andExpect(jsonPath("$.status").value("DOWN"))
                    .andExpect(jsonPath("$.lastError").value("HTTP 500"));
            mvc.perform(get("/api/incidents"))
                    .andExpect(jsonPath("$[0].monitorId").value(id))
                    .andExpect(jsonPath("$[0].cause").value("HTTP 500"))
                    .andExpect(jsonPath("$[0].resolvedAt").value(nullValue()));
            assertThat(hook.received).singleElement().asString()
                    .contains("\"event\":\"down\"", "\"error\":\"HTTP 500\"", "\"text\":\"🔴 Site is DOWN", "\"content\":");

            site.status = 200;
            mvc.perform(post("/api/monitors/" + id + "/check")).andExpect(jsonPath("$.status").value("UP"));
            mvc.perform(get("/api/incidents")).andExpect(jsonPath("$[0].resolvedAt").value(notNullValue()));
            assertThat(hook.received).hasSize(2);
            assertThat(hook.received.get(1)).contains("\"event\":\"up\"", "\"downtimeSeconds\":0", "back UP");

            mvc.perform(get("/api/monitors"))
                    .andExpect(jsonPath("$[0].monitor.name").value("Site"))
                    .andExpect(jsonPath("$[0].beats", hasSize(4)))
                    .andExpect(jsonPath("$[0].uptime24h").value(75.0))
                    .andExpect(jsonPath("$[0].avgMs24h").isNumber());
            mvc.perform(get("/api/monitors/" + id + "/checks?hours=1")).andExpect(jsonPath("$", hasSize(4)));

            mvc.perform(post("/api/monitors/" + id + "/pause?paused=true")).andExpect(jsonPath("$.paused").value(true));
            mvc.perform(put("/api/monitors/" + id).contentType(MediaType.APPLICATION_JSON)
                            .content("{\"name\":\"Renamed\",\"url\":\"" + site.url("/") + "\",\"intervalSeconds\":30}"))
                    .andExpect(jsonPath("$.name").value("Renamed"))
                    .andExpect(jsonPath("$.status").value("UP"));

            mvc.perform(delete("/api/monitors/" + id)).andExpect(status().isNoContent());
            mvc.perform(delete("/api/monitors/" + id)).andExpect(status().isNotFound());
            assertThat(incidents.findAll()).isEmpty();
        }
    }

    @Test
    void webhookTestAndFailureAreRecorded() throws Exception {
        try (var hook = new TestServer()) {
            String body = mvc.perform(post("/api/webhooks").contentType(MediaType.APPLICATION_JSON)
                            .content("{\"name\":\"T\",\"url\":\"" + hook.url("/t") + "\",\"enabled\":false}"))
                    .andReturn().getResponse().getContentAsString();
            long id = Long.parseLong(body.replaceAll(".*\"id\":(\\d+).*", "$1"));

            mvc.perform(post("/api/webhooks/" + id + "/test"))
                    .andExpect(jsonPath("$.lastStatusCode").value(200))
                    .andExpect(jsonPath("$.lastError").value(nullValue()));
            assertThat(hook.received).singleElement().asString().contains("\"event\":\"test\"");

            hook.status = 404;
            mvc.perform(post("/api/webhooks/" + id + "/test")).andExpect(jsonPath("$.lastError").value("HTTP 404"));

            mvc.perform(delete("/api/webhooks/" + id)).andExpect(status().isNoContent());
            mvc.perform(get("/api/webhooks")).andExpect(jsonPath("$[?(@.id == " + id + ")]", empty()));
        }
    }

    @Test
    void rejectsInvalidInput() throws Exception {
        mvc.perform(post("/api/monitors").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"x\",\"url\":\"ftp://nope\",\"intervalSeconds\":60}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("url must start with http:// or https://"));
        mvc.perform(post("/api/monitors").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"x\",\"url\":\"https://a.b\",\"intervalSeconds\":1}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", startsWith("intervalSeconds")));
        mvc.perform(post("/api/webhooks").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"x\",\"url\":\"nope\",\"enabled\":true}"))
                .andExpect(status().isBadRequest());
    }

    private void awaitChecked(long id) throws InterruptedException {
        for (int i = 0; i < 100 && monitors.findById(id).orElseThrow().lastCheckedAt == null; i++) Thread.sleep(50);
    }
}
