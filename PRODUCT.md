# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Operator (inferred):** one person or a small team who self-hosts Pulse on a home server or VPS to watch their own websites, APIs and homelab services. They open `/admin` to add monitors, check why something is red, and set up outage webhooks. They often check in on a laptop at a desk, sometimes on a phone after an alert.
- **Visitor (inferred):** customers or friends of the operator who land on the public status page (`/`) to answer one question: "is it down for everyone, or just me?"

## Product Purpose

Pulse checks a list of URLs on a schedule (HTTP GET, under 400 means up), records every check, opens and resolves incidents on status changes, and POSTs a webhook on every outage and recovery. Success: the operator learns about an outage before their users do, and visitors can confirm an outage without contacting anyone.

## Positioning

A single self-hosted container that holds both the private operator console and the public status page. Nothing is sent to a third-party SaaS. The public page deliberately never shows URLs or error details.

## Operating Context

- It runs on a LAN home server (192.168.0.180:8095) in Docker, with data in an H2 file volume.
- The operator usually arrives from a Slack, Discord or Telegram webhook alert and wants the failing monitor and its error immediately.
- The dashboard polls every 5 seconds and the public page every 30 seconds.

## Capabilities and Constraints

- Monitors have a name, URL, interval (10 s to 24 h), paused state and a public/private flag.
- Status values: PENDING, UP, DOWN, plus paused.
- Per monitor: last 60 checks (heartbeat), 24 h and 30 d uptime, average latency, full history up to 30 days (retention).
- Incidents: start time, resolution time and cause (cause is shown to the admin only).
- Webhooks: name, URL, enabled flag, last delivery status, Test button. The JSON payload has `text`/`content` fields.
- Auth: a single admin password (`PULSE_PASSWORD`), HttpOnly session cookie, Basic auth for scripts.
- Stack: React 19 + Vite + TypeScript frontend with plain CSS (no UI kit), Spring Boot 4 backend. The e2e tests in `e2e/pulse.spec.ts` depend on visible labels and `data-testid`s.

## Brand Commitments

- Name: **Pulse**. The ECG/heartbeat line mark is the only existing asset (`frontend/public/favicon.svg`).
- The user rejected the first visual world outright: aurora gradient blobs, glassmorphism, purple-cyan gradients. None of it may return.

## Evidence on Hand

There are no customers, testimonials or metrics. Every number shown comes from live checks. Never fabricate uptime figures or claims.

## Product Principles

1. Red means act. Down states must be impossible to miss and quick to diagnose.
2. Numbers are the interface. Uptime, latency and durations are read constantly, so they must be legible and aligned.
3. Public is honest and minimal: status and history, never internals.
4. Calm when healthy. A dashboard of green should feel quiet, not celebratory.
