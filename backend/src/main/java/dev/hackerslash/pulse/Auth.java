package dev.hackerslash.pulse;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class Auth extends OncePerRequestFilter {

    static final String COOKIE = "pulse_session";
    static final Duration TTL = Duration.ofDays(30);

    private final byte[] passwordHash;
    private final byte[] key;
    private final boolean configured;

    public Auth(@Value("${pulse.password:}") String password) {
        this.configured = !password.isEmpty();
        this.passwordHash = sha256(password);
        this.key = sha256("pulse-session:" + password);
    }

    boolean configured() {
        return configured;
    }

    boolean matches(String given) {
        return configured && given != null && MessageDigest.isEqual(sha256(given), passwordHash);
    }

    String issue() {
        long exp = Instant.now().plus(TTL).getEpochSecond();
        return exp + "." + sign(exp);
    }

    boolean valid(String token) {
        if (!configured || token == null) return false;
        int dot = token.indexOf('.');
        if (dot < 0) return false;
        try {
            long exp = Long.parseLong(token.substring(0, dot));
            return exp > Instant.now().getEpochSecond()
                    && MessageDigest.isEqual(sign(exp).getBytes(StandardCharsets.UTF_8), token.substring(dot + 1).getBytes(StandardCharsets.UTF_8));
        } catch (NumberFormatException e) {
            return false;
        }
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest req) {
        String uri = req.getRequestURI();
        return !uri.startsWith("/api/") || uri.startsWith("/api/public/") || uri.equals("/api/login") || uri.equals("/api/logout");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain) throws ServletException, IOException {
        if (valid(cookie(req)) || validBasic(req.getHeader(HttpHeaders.AUTHORIZATION))) {
            chain.doFilter(req, res);
            return;
        }
        res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        res.setContentType("application/json");
        res.getWriter().write("{\"error\":\"unauthorized\"}");
    }

    private boolean validBasic(String header) {
        if (header == null || !header.startsWith("Basic ")) return false;
        try {
            String decoded = new String(Base64.getDecoder().decode(header.substring(6)), StandardCharsets.UTF_8);
            return matches(decoded.substring(decoded.indexOf(':') + 1));
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    private static String cookie(HttpServletRequest req) {
        if (req.getCookies() == null) return null;
        for (Cookie c : req.getCookies()) if (c.getName().equals(COOKIE)) return c.getValue();
        return null;
    }

    private String sign(long exp) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(key, "HmacSHA256"));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(mac.doFinal(Long.toString(exp).getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    private static byte[] sha256(String s) {
        try {
            return MessageDigest.getInstance("SHA-256").digest(s.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}

@RestController
@RequestMapping("/api")
class AuthController {

    record Login(String password) {}

    private final Auth auth;

    AuthController(Auth auth) {
        this.auth = auth;
    }

    // ponytail: fixed 1s delay on failure slows brute force; add per-IP lockout if exposed to the internet at scale
    @PostMapping("/login")
    ResponseEntity<Map<String, Object>> login(@RequestBody Login body, jakarta.servlet.http.HttpServletRequest req) throws InterruptedException {
        if (!auth.configured()) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of("error", "PULSE_PASSWORD is not set on the server"));
        }
        if (!auth.matches(body.password())) {
            Thread.sleep(1000);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Wrong password"));
        }
        return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE, cookie(auth.issue(), Auth.TTL, req.isSecure())).body(Map.of("ok", true));
    }

    @PostMapping("/logout")
    ResponseEntity<Void> logout(jakarta.servlet.http.HttpServletRequest req) {
        return ResponseEntity.noContent().header(HttpHeaders.SET_COOKIE, cookie("", Duration.ZERO, req.isSecure())).build();
    }

    @GetMapping("/me")
    Map<String, Object> me() {
        return Map.of("ok", true);
    }

    private static String cookie(String value, Duration maxAge, boolean secure) {
        return ResponseCookie.from(Auth.COOKIE, value).httpOnly(true).sameSite("Lax").path("/").maxAge(maxAge).secure(secure).build().toString();
    }
}
