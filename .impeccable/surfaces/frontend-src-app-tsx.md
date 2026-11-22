---
version: 1
slug: "frontend-src-app-tsx"
primary_target: "frontend/src/App.tsx"
related_targets: ["frontend/src/StatusPage.tsx"]
---

## Scope

Both Pulse surfaces, one world. `/admin` (dashboard, login, detail, forms, webhooks) is the Operate surface. `/` (public status) is its read-mostly sibling. The user rejected the prior aurora/glass world, which is the anti-reference.

## Direction contract

THESIS: Uptime as a calm native instrument. Pulse should feel like a first-party macOS dark-mode app: slate glass materials over a deep slate ground, the ledger tables and tide chart from the almanac world kept as structure. It refuses both the earlier neon aurora (multicolour blobs, glow, gradient text) and the light paper ledger, which the user found "very AI" and not modern.

OWN-WORLD: Deep slate ground (#0a0d12) with a faint monochrome slate light at the top edge, never coloured blobs. Glass is reserved for floating chrome: the sticky bar, panels, dialogs and toasts use translucent slate with backdrop blur and saturation, a 1px white hairline at 7–12% and a soft inner top highlight. Apple dark system colours carry meaning: green #30D158 up, red #FF453A down, yellow #FFD60A pending, blue #0A84FF for actions, focus and selection. Source Serif 4 (headings, figures, small-caps heads) and Public Sans (UI, tabular numerals) are kept. Corners are continuous 8 / 12 / 16 px. Motion is a short, smooth ease-out (200–240 ms) on state change only.

STORY: Unchanged. The operator spots red at once, opens it, reads the error and the response curve, and acts. A visitor reads one verdict and each service's 30-day row.

FIRST VIEWPORT: Unchanged composition. A glass top bar (mark, wordmark, verdict, actions with a filled blue New monitor button), then the Monitors heading with an inline ledger, a search field and a segmented filter control, then the monitor table as a single glass panel of hairline rows, with the incident log as a glass side panel at ≥1280px. Public: masthead, a glass verdict card tinted by state, glass service list with 30-day day strips.

FORM: seed: none (pinned). User, verbatim: "I like the UI but has very ai feel no modern vibe slate like color. I like fonts but I want a dark apple glass like smooth". Layout, fonts and the tide-chart signature carry over from the almanac build (seed:ee802babe17f9f62). The material, palette and controls move to Apple dark glass: segmented controls, filled buttons and capsule badges.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Recorded deviations

- No row sparklines. The craft floor refuses sparklines standing in for content, and the real 40-check tick strip carries the row, graded by response-time depth.
- Monitor detail is an in-page view (hash route; Escape and Back return), not a modal, per the floor's modal refusal. The create/edit form and webhooks stay as dialogs because they need protected focus.
- The detail summary is a ruled ledger line that omits figures with no value, not a tile grid.
