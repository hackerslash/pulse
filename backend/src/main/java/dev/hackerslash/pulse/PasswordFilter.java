package dev.hackerslash.pulse;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class PasswordFilter extends OncePerRequestFilter {

    private final byte[] password;

    public PasswordFilter(@Value("${pulse.password:}") String password) {
        this.password = password.getBytes(StandardCharsets.UTF_8);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest req) {
        return password.length == 0 || !req.getRequestURI().startsWith("/api/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain) throws ServletException, IOException {
        String h = req.getHeader("Authorization");
        if (h != null && h.startsWith("Basic ")) {
            try {
                String decoded = new String(Base64.getDecoder().decode(h.substring(6)), StandardCharsets.UTF_8);
                byte[] given = decoded.substring(decoded.indexOf(':') + 1).getBytes(StandardCharsets.UTF_8);
                if (MessageDigest.isEqual(given, password)) {
                    chain.doFilter(req, res);
                    return;
                }
            } catch (IllegalArgumentException ignored) {
            }
        }
        res.setHeader("WWW-Authenticate", "Basic realm=\"Pulse\"");
        res.sendError(HttpServletResponse.SC_UNAUTHORIZED);
    }
}
