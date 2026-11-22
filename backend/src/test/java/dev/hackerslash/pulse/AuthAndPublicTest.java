package dev.hackerslash.pulse;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import jakarta.servlet.http.Cookie;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Base64;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(properties = {"spring.datasource.url=jdbc:h2:mem:auth", "pulse.password=s3cret", "pulse.tick=1h"})
@AutoConfigureMockMvc
class AuthAndPublicTest {

    @Autowired MockMvc mvc;
    @Autowired MonitorRepo monitors;
    @Autowired DailyStatRepo dailyStats;
    @Autowired IncidentRepo incidents;
    @Autowired Auth auth;

    @Test
    void adminApiRequiresSessionOrBasic() throws Exception {
        mvc.perform(get("/api/monitors")).andExpect(status().isUnauthorized()).andExpect(header().doesNotExist("WWW-Authenticate"));
        mvc.perform(get("/api/webhooks")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/monitors").header("Authorization", "Basic " + b64("any:wrong"))).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/monitors").header("Authorization", "Basic " + b64("any:s3cret"))).andExpect(status().isOk());
        mvc.perform(get("/actuator/health")).andExpect(status().isOk());

        mvc.perform(post("/api/login").contentType(MediaType.APPLICATION_JSON).content("{\"password\":\"nope\"}"))
                .andExpect(status().isUnauthorized()).andExpect(jsonPath("$.error").value("Wrong password"));
        Cookie session = mvc.perform(post("/api/login").contentType(MediaType.APPLICATION_JSON).content("{\"password\":\"s3cret\"}"))
                .andExpect(status().isOk())
                .andExpect(header().string("Set-Cookie", allOf(containsString("pulse_session="), containsString("HttpOnly"), containsString("SameSite=Lax"))))
                .andReturn().getResponse().getCookie("pulse_session");
        mvc.perform(get("/api/me").cookie(session)).andExpect(status().isOk());
        mvc.perform(get("/api/me").cookie(new Cookie("pulse_session", "99999999999.forged"))).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/me").cookie(new Cookie("pulse_session", session.getValue().replaceFirst("^\\d+", "99999999999")))).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/logout")).andExpect(header().string("Set-Cookie", containsString("Max-Age=0")));
    }

    @Test
    void sessionsDieWhenPasswordChanges() {
        String token = auth.issue();
        assertThat(auth.valid(token)).isTrue();
        assertThat(new Auth("other").valid(token)).isFalse();
        assertThat(new Auth("").valid(token)).isFalse();
    }

    @Test
    void publicStatusHidesPrivateMonitorsAndDetails() throws Exception {
        Monitor pub = monitor("Website", "https://secret-host.example/health", true);
        Monitor priv = monitor("Internal DB", "http://10.0.0.5:5432", false);
        Instant now = Instant.now();
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        stat(pub.id, today, 2, 1);
        stat(pub.id, today.minusDays(40), 8, 8);
        stat(priv.id, today, 5, 0);
        incidents.save(new Incident(pub.id, now, "TLS error: secret-host.example"));
        incidents.save(new Incident(priv.id, now, "Connection refused"));

        String body = mvc.perform(get("/api/public/status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.granularity").value("day"))
                .andExpect(jsonPath("$.monitors", hasSize(1)))
                .andExpect(jsonPath("$.monitors[0].name").value("Website"))
                .andExpect(jsonPath("$.monitors[0].uptime").value(90.0))
                .andExpect(jsonPath("$.monitors[0].buckets", hasSize(90)))
                .andExpect(jsonPath("$.monitors[0].buckets[89].uptime").value(50.0))
                .andExpect(jsonPath("$.monitors[0].buckets[49].uptime").value(100.0))
                .andExpect(jsonPath("$.monitors[0].buckets[0].uptime").value(nullValue()))
                .andExpect(jsonPath("$.incidents", hasSize(1)))
                .andExpect(jsonPath("$.incidents[0].monitor").value("Website"))
                .andReturn().getResponse().getContentAsString();
        assertThat(body).doesNotContain("secret-host", "10.0.0.5", "Internal DB", "503", "url");
    }

    @Test
    void publicStatusGroupsByWeekAndMonth() throws Exception {
        Monitor pub = monitor("Grouped", "https://example.com", true);
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        stat(pub.id, today, 2, 1);
        stat(pub.id, today.minusDays(40), 8, 8);

        mvc.perform(get("/api/public/status?granularity=week"))
                .andExpect(jsonPath("$.granularity").value("week"))
                .andExpect(jsonPath("$.monitors[?(@.name == 'Grouped')].buckets.length()", contains(26)))
                .andExpect(jsonPath("$.monitors[?(@.name == 'Grouped')].buckets[25].uptime", contains(50.0)))
                .andExpect(jsonPath("$.monitors[?(@.name == 'Grouped')].uptime", contains(90.0)));
        mvc.perform(get("/api/public/status?granularity=month"))
                .andExpect(jsonPath("$.monitors[?(@.name == 'Grouped')].buckets.length()", contains(12)))
                .andExpect(jsonPath("$.monitors[?(@.name == 'Grouped')].buckets[11].uptime", contains(50.0)));
        mvc.perform(get("/api/public/status?granularity=year")).andExpect(status().isBadRequest());
    }

    private Monitor monitor(String name, String url, boolean isPublic) {
        Monitor m = new Monitor();
        m.name = name;
        m.url = url;
        m.isPublic = isPublic;
        m.status = Monitor.Status.UP;
        return monitors.save(m);
    }

    private void stat(Long monitorId, LocalDate day, long total, long up) {
        DailyStat d = new DailyStat(monitorId, day);
        d.total = total;
        d.up = up;
        dailyStats.save(d);
    }

    private static String b64(String s) {
        return Base64.getEncoder().encodeToString(s.getBytes());
    }
}
