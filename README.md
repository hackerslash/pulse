# Pulse

Self-hosted uptime monitor: a Spring Boot API that checks your URLs on a schedule, plus a glassmorphism React dashboard. It records every check, opens and resolves incidents, and sends an outage webhook when a monitor goes down or comes back up.

```
backend/   Spring Boot 4 · Java 21 · JPA + H2 (file) · virtual-thread checker
frontend/  React 19 · Vite · TypeScript · hand-rolled SVG charts, no UI libs
e2e/       Playwright tests that boot both and drive the real UI
```

## Run it

```bash
docker compose up -d --build        # http://localhost:8080
PULSE_PASSWORD=secret docker compose up -d --build   # protect the API with HTTP Basic (any username)
```

Data lives in the `pulse-data` volume (`/data/pulse.mv.db`). Checks older than 30 days are pruned nightly.

## Develop

```bash
cd backend && ./mvnw spring-boot:run          # API on :8080 (needs JDK 21)
cd frontend && npm i && npm run dev           # UI on :5173, proxies /api to :8080
```

## Test

```bash
cd backend && ./mvnw test                     # prober, lifecycle, webhooks, auth
cd frontend && npm test                       # formatters
cd backend && ./mvnw -DskipTests package && cd ../e2e && npm i && npx playwright install chromium && npm test
```

## How checks work

- Every second the scheduler picks monitors that are due (interval 10 s – 24 h) and probes each on a virtual thread.
- `GET` with a 10 s timeout, following redirects. Status below 400 = **up**; anything else, a timeout, or a DNS/TLS/connect error = **down**.
- A status change records an incident and fires every enabled webhook.

## Webhooks

Managed in the UI (bell icon). Each enabled webhook gets a JSON `POST`:

```json
{
  "event": "down",
  "text": "🔴 API is DOWN — HTTP 502\nhttps://api.example.com",
  "content": "🔴 API is DOWN — HTTP 502\nhttps://api.example.com",
  "monitor": { "id": 1, "name": "API", "url": "https://api.example.com" },
  "error": "HTTP 502",
  "at": "2026-11-22T10:00:00Z"
}
```

`event` is `down`, `up` (which carries `downtimeSeconds`) or `test`. `text` fits Slack incoming webhooks and `content` fits Discord. The **Test** button sends a sample and shows the delivery result.

## API

| Method | Path | |
|---|---|---|
| GET | `/api/monitors` | monitors + 24h/30d uptime, avg latency, last 60 checks |
| POST/PUT/DELETE | `/api/monitors[/{id}]` | `{name, url, intervalSeconds}` |
| POST | `/api/monitors/{id}/check` | check now |
| POST | `/api/monitors/{id}/pause?paused=true` | pause / resume |
| GET | `/api/monitors/{id}/checks?hours=24` | history (max 720h) |
| GET | `/api/incidents?limit=25` | latest incidents |
| GET/POST/PUT/DELETE | `/api/webhooks[/{id}]` | `{name, url, enabled}` |
| POST | `/api/webhooks/{id}/test` | send a test payload |

Keyboard: `N` new monitor · `/` search · `Esc` close.
