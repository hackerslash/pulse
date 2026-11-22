package dev.hackerslash.pulse;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import jakarta.servlet.http.Cookie;
import java.time.Instant;
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
    @Autowired CheckRepo checks;
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
        checks.save(new Check(pub.id, now, new Prober.Result(true, 50, 200, null)));
        checks.save(new Check(pub.id, now, new Prober.Result(false, 10, 503, "HTTP 503")));
        incidents.save(new Incident(pub.id, now, "TLS error: secret-host.example"));
        incidents.save(new Incident(priv.id, now, "Connection refused"));

        String body = mvc.perform(get("/api/public/status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.monitors", hasSize(1)))
                .andExpect(jsonPath("$.monitors[0].name").value("Website"))
                .andExpect(jsonPath("$.monitors[0].uptime30d").value(50.0))
                .andExpect(jsonPath("$.monitors[0].days", hasSize(30)))
                .andExpect(jsonPath("$.monitors[0].days[29].uptime").value(50.0))
                .andExpect(jsonPath("$.monitors[0].days[0].uptime").value(nullValue()))
                .andExpect(jsonPath("$.incidents", hasSize(1)))
                .andExpect(jsonPath("$.incidents[0].monitor").value("Website"))
                .andReturn().getResponse().getContentAsString();
        assertThat(body).doesNotContain("secret-host", "10.0.0.5", "Internal DB", "503", "url");
    }

    private Monitor monitor(String name, String url, boolean isPublic) {
        Monitor m = new Monitor();
        m.name = name;
        m.url = url;
        m.isPublic = isPublic;
        m.status = Monitor.Status.UP;
        return monitors.save(m);
    }

    private static String b64(String s) {
        return Base64.getEncoder().encodeToString(s.getBytes());
    }
}
