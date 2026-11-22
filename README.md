<p align="center">
  <img src="frontend/public/logo.png" alt="Pulse heartbeat logo" width="80" height="80">
</p>

<h1 align="center">Pulse</h1>

<p align="center">Self-hosted uptime monitoring and a public status page for your websites, APIs, and homelab services.</p>

<p align="center">
  <img alt="Java 21" src="https://img.shields.io/badge/Java-21-B45309">
  <img alt="Spring Boot 4" src="https://img.shields.io/badge/Spring%20Boot-4-3F7D20">
  <img alt="React 19" src="https://img.shields.io/badge/React-19-087EA4">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178C6">
  <img alt="Vite" src="https://img.shields.io/badge/Vite-6D28D9">
  <img alt="H2 Database" src="https://img.shields.io/badge/H2-Database-1A4D85">
  <img alt="Docker Compose" src="https://img.shields.io/badge/Docker-Compose-1769AA">
</p>

Pulse checks your URLs on a schedule, records uptime and latency, and sends webhooks when a service goes down or recovers. Spring Boot serves the React dashboard, public status page, and API from a single container. Check history is stored in an embedded H2 database.

## Features

- **HTTP monitoring** with per-service intervals from 10 seconds to 24 hours, manual checks, and pause controls.
- **Group health**: a monitor can send a Bearer token, and a JSON reply with `up` and `total` counts is scored, so one monitor covers a whole group of components (70% or more working is up, 20–70% degraded, under 20% down).
- **Admin dashboard** at `/admin` with password sign-in, recent checks, latency, uptime, and incident history.
- **Public status page** at `/` with uptime bars and recent incidents for published, unpaused monitors. It shows service names and status while keeping monitored URLs and error details private.
- **Outage and recovery webhooks** with delivery status and a test button. Payloads include fields for Slack and Discord.

## Quick start

Install Git, OpenSSL, and Docker with the Compose plugin, then run these commands from a fresh checkout.

```bash
git clone https://github.com/hackerslash/pulse.git
cd pulse
(umask 077 && printf 'PULSE_PASSWORD=%s\n' "$(openssl rand -hex 24)" > .env)
docker compose up -d --build
```

1. Open [the admin dashboard](http://localhost:8080/admin) and sign in with the `PULSE_PASSWORD` value in `.env`.
2. Add a monitor with a name, an HTTP or HTTPS URL, and a check interval. Enable public visibility for any service you want to publish.
3. Open [the public status page](http://localhost:8080/) to see what visitors see. In the dashboard’s **Settings**, choose **1 day**, **1 week**, or **1 month** of uptime history.

Compose stores the H2 database in the `pulse-data` volume at `/data`. Pulse prunes raw checks older than 30 days each night. Admin sign-in is disabled when `PULSE_PASSWORD` is empty. Set `PULSE_TITLE` in `.env` to name the public page after your service; the header shows it in place of the Pulse logo. To change the password, update `.env` and run `docker compose up -d --force-recreate` to recreate the container. Existing sessions expire immediately after the new password takes effect.

## Development

Use Java 21 and Node.js 24. The Maven wrapper is included. From the repository root, run the backend and frontend in separate terminals.

```bash
cd backend
PULSE_PASSWORD=local-dev-password ./mvnw spring-boot:run
```

```bash
cd frontend
npm ci
npm run dev
```

Vite serves the UI at [localhost:5173](http://localhost:5173) and proxies API requests to Spring Boot on port 8080. The backend stores local data in `backend/data` by default.

### Tests

From the repository root, install frontend dependencies with the development steps above, then run:

```bash
(cd backend && ./mvnw test)
(cd frontend && npm test)
(cd backend && ./mvnw -DskipTests package)
(cd e2e && npm ci && npx playwright install chromium && npm test)
```

The Playwright suite starts its own backend and frontend with a temporary database.

## How checks work

- Every second the scheduler picks monitors that are due (interval 10 s – 24 h) and probes each on a virtual thread.
- `GET` with a 10 s timeout, following redirects. Status below 400 = **up**; anything else, a timeout, or a DNS/TLS/connect error = **down**.
- A failed scheduled check is probed again 20 s later (`pulse.retry`, `0s` turns it off) and counts only if that fails too, so a restart or one dropped request is no outage. **Check now** reports at once.
- Set `PULSE_CANARY` to a URL that is always up (for example `https://www.cloudflare.com/cdn-cgi/trace`). When a failure is confirmed and the canary fails too, the host running Pulse is offline: nothing is recorded, so that time shows gray instead of as an outage, and checks resume on their own.
- With a token set, the request carries `Authorization: Bearer <token>`. The token is never returned by the API.
- A JSON reply with integer `up` and `total` fields is scored: under 20% working is **down**, 20–70% is **degraded** (shown yellow, no incident or webhook), 70% or more is **up**; `total` 0 counts as up with no information. The public page shows the `up/total` count.
- An outage opens an incident and a recovery resolves it. Each transition triggers enabled webhooks.

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

Send a session cookie or HTTP Basic credentials for admin API calls. For HTTP Basic, use any username and the configured admin password. The public status, login, and logout endpoints also accept unauthenticated requests.

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/public/status` | public: the page title, published monitors with uptime buckets for the configured window (96 × 15 min, 84 × 2 h or 90 × 8 h), last 10 incidents |
| GET/PUT | `/api/settings` | `{granularity: "day"\|"week"\|"month"}`, sets the public window |
| POST | `/api/login` | Submit `{password}` to set the session cookie |
| POST | `/api/logout` | Clear the session cookie |
| GET | `/api/me` | Verify the current admin session or HTTP Basic credentials |
| GET | `/api/monitors` | monitors + 24h/30d uptime, avg latency, last 60 checks |
| POST/PUT/DELETE | `/api/monitors[/{id}]` | `{name, url, intervalSeconds, isPublic, secret?}` (omit `secret` to keep it, `""` to clear it) |
| POST | `/api/monitors/{id}/check` | check now |
| POST | `/api/monitors/{id}/pause?paused=true` | pause / resume |
| GET | `/api/monitors/{id}/checks?hours=24` | history (max 720h) |
| GET | `/api/incidents?limit=25` | latest incidents |
| GET/POST/PUT/DELETE | `/api/webhooks[/{id}]` | `{name, url, enabled}` |
| POST | `/api/webhooks/{id}/test` | send a test payload |

Keyboard: `N` new monitor · `/` search · `Esc` close.

## Third-party fonts

The bundled fonts ship with their upstream license notices in [`frontend/public/fonts/`](frontend/public/fonts).
