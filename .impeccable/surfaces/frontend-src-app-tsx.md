---
version: 1
slug: "frontend-src-app-tsx"
primary_target: "frontend/src/App.tsx"
related_targets: ["frontend/src/StatusPage.tsx"]
---

## Scope

Both Pulse surfaces, one world. `/admin` (dashboard, login, detail, forms, webhooks) is the Operate surface. `/` (public status) is its read-mostly sibling. The user rejected the prior aurora/glass world, which is the anti-reference.

## Direction contract

THESIS: Uptime as an almanac. Every service is a row in a printed tide table: fixed columns, tabular figures, and history laid out as whole-cell day and check marks. It refuses the dark neon SaaS dashboard of cards and glows, and its white Statuspage-clone opposite.

OWN-WORLD: Admiralty chart and almanac paper. Off-white chart paper ground (#F7F5EF), iron-black ink, buff land tint for panels. Healthy marks in graded chart-water blues (pale to deep). Outages in chart magenta (#C2185B), pending in light-amber. Source Serif 4 sets headings, big figures and small-caps column heads; Public Sans sets the UI with tabular numerals. Every rule is a 1px hairline with 2px radius at most. No gradients, glass, glow or shadows beyond a 1px lift on overlays.

STORY: The operator sees at once whether anything is magenta, opens it, reads the error and response curve, and acts (check now, pause, edit, webhooks). A visitor sees one plain-language verdict, then each service's 30-day row, and leaves knowing if it is just them.

FIRST VIEWPORT: Admin: a top bar with the Pulse mark and wordmark left, the overall verdict as a single inline status line, and actions right (Status page, Webhooks, New monitor as the solid ink button, log out). Beside the Monitors heading, a ruled ledger line of five inline figures (overall 24h uptime large in serif, monitors, up, down, average response). Then the main work area: a full-width monitor table (status mark, name and host, state and duration, 24h uptime, response, 40-check tick strip, last checked), with the incident log as a right column at ≥1200px. Public: masthead, verdict line set large in serif, then one table row per service with a 30-day cell strip and date figures under it.

FORM: Grounded candidate 6 of 7 (tide tables / nautical almanac). seed:ee802babe17f9f62. Signature move: response time plotted as a tide curve over chart-style depth bands (tinted contour bands at 100 / 300 / 1000 ms, each band a fixed share of the height) in the detail view, with the crest labelled like a high-water figure. Row ticks are graded by depth the same way. Raises: from the centre-rail reference, one-device-pixel hairline rules everywhere and no rounded cards; from the warm consumer app, solid ink colour reserved strictly for actionable controls; from the event catalog, history marks are fixed whole cells that repack, never stretch; from the star atlas, every figure tabular and right-aligned in its column; from the split-flap concourse (competitive, kept), rows are live entities and columns never move, so polling changes values, never layout.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Recorded deviations

- No row sparklines. The craft floor refuses sparklines standing in for content, and the real 40-check tick strip carries the row, graded by response-time depth.
- Monitor detail is an in-page view (hash route; Escape and Back return), not a modal, per the floor's modal refusal. The create/edit form and webhooks stay as dialogs because they need protected focus.
- The detail summary is a ruled ledger line that omits figures with no value, not a tile grid.
