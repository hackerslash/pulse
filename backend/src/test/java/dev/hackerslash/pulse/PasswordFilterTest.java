package dev.hackerslash.pulse;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(properties = {"spring.datasource.url=jdbc:h2:mem:auth", "pulse.password=s3cret"})
@AutoConfigureMockMvc
class PasswordFilterTest {

    @Autowired MockMvc mvc;

    @Test
    void requiresPasswordForApiOnly() throws Exception {
        mvc.perform(get("/api/monitors")).andExpect(status().isUnauthorized()).andExpect(header().string("WWW-Authenticate", "Basic realm=\"Pulse\""));
        mvc.perform(get("/api/monitors").header("Authorization", "Basic " + b64("any:wrong"))).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/monitors").header("Authorization", "Basic " + b64("any:s3cret"))).andExpect(status().isOk());
        mvc.perform(get("/actuator/health")).andExpect(status().isOk());
    }

    private static String b64(String s) {
        return java.util.Base64.getEncoder().encodeToString(s.getBytes());
    }
}
