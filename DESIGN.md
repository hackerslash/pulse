---
name: Pulse
description: Self-hosted uptime monitor and public status page, built as a calm dark-glass instrument.
colors:
  slate-ground: "#0a0d12"
  slate-ground-top: "#0d1118"
  ink: "#eceff4"
  ink-2: "#b4bcc8"
  ink-3: "#8a93a3"
  hairline: "rgba(255, 255, 255, 0.07)"
  hairline-strong: "rgba(255, 255, 255, 0.12)"
  fill: "rgba(255, 255, 255, 0.06)"
  fill-2: "rgba(255, 255, 255, 0.1)"
  fill-3: "rgba(255, 255, 255, 0.14)"
  glass: "rgba(26, 31, 40, 0.58)"
  glass-strong: "rgba(30, 35, 45, 0.78)"
  segment-track: "rgba(118, 118, 128, 0.2)"
  segment-thumb: "rgba(99, 99, 102, 0.62)"
  system-blue: "#0a84ff"
  system-blue-light: "#409cff"
  blue-tint: "rgba(10, 132, 255, 0.16)"
  system-green: "#30d158"
  green-tint: "rgba(48, 209, 88, 0.14)"
  system-red: "#ff453a"
  red-ink: "#ff6b62"
  red-tint: "rgba(255, 69, 58, 0.16)"
  red-wash: "rgba(255, 69, 58, 0.07)"
  system-yellow: "#ffd60a"
  yellow-tint: "rgba(255, 214, 10, 0.14)"
  system-orange: "#ff9f0a"
typography:
  display:
    fontFamily: "Source Serif 4, Iowan Old Style, Georgia, serif"
    fontSize: "42px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Source Serif 4, Iowan Old Style, Georgia, serif"
    fontSize: "30px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.012em"
  title:
    fontFamily: "Source Serif 4, Iowan Old Style, Georgia, serif"
    fontSize: "19px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.012em"
  figure:
    fontFamily: "Source Serif 4, Iowan Old Style, Georgia, serif"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: 1.1
    fontFeature: "tnum, lnum"
  column-head:
    fontFamily: "Source Serif 4, Iowan Old Style, Georgia, serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.05em"
    fontFeature: "all-small-caps"
  body:
    fontFamily: "Public Sans, -apple-system, BlinkMacSystemFont, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "tnum, lnum"
  control:
    fontFamily: "Public Sans, -apple-system, BlinkMacSystemFont, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: 1
  label:
    fontFamily: "Public Sans, -apple-system, BlinkMacSystemFont, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.35
  public-headline:
    fontFamily: "Public Sans, -apple-system, BlinkMacSystemFont, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.015em"
  public-body:
    fontFamily: "Public Sans, -apple-system, BlinkMacSystemFont, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: 1.3
  mono:
    fontFamily: "ui-monospace, SF Mono, Cascadia Mono, Menlo, Consolas, monospace"
    fontSize: "12.5px"
    fontWeight: 400
    lineHeight: 1.4
rounded:
  s: "8px"
  m: "12px"
  l: "16px"
  surface: "20px"
  capsule: "999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "20px"
  xl: "24px"
  2xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.system-blue}"
    textColor: "#ffffff"
    typography: "{typography.control}"
    rounded: "{rounded.s}"
    padding: "0 12px"
    height: "32px"
  button-primary-hover:
    backgroundColor: "{colors.system-blue-light}"
  button-secondary:
    backgroundColor: "{colors.fill-2}"
    textColor: "{colors.ink}"
    typography: "{typography.control}"
    rounded: "{rounded.s}"
    padding: "0 12px"
    height: "32px"
  button-secondary-hover:
    backgroundColor: "{colors.fill-3}"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.s}"
    height: "32px"
  button-quiet-hover:
    backgroundColor: "{colors.fill}"
    textColor: "{colors.ink}"
  button-danger:
    backgroundColor: "{colors.system-red}"
    textColor: "#ffffff"
    rounded: "{rounded.s}"
    height: "32px"
  input:
    backgroundColor: "{colors.fill}"
    textColor: "{colors.ink}"
    rounded: "{rounded.s}"
    padding: "0 12px"
    height: "38px"
  input-focus:
    backgroundColor: "{colors.fill-2}"
  segmented-track:
    backgroundColor: "{colors.segment-track}"
    padding: "2px"
  segmented-thumb:
    backgroundColor: "{colors.segment-thumb}"
    textColor: "#ffffff"
    typography: "{typography.label}"
    height: "28px"
  badge-capsule-up:
    backgroundColor: "{colors.green-tint}"
    textColor: "{colors.system-green}"
    rounded: "{rounded.capsule}"
    padding: "4px 10px"
  badge-capsule-down:
    backgroundColor: "{colors.red-tint}"
    textColor: "{colors.red-ink}"
    rounded: "{rounded.capsule}"
    padding: "4px 10px"
  glass-panel:
    backgroundColor: "{colors.glass}"
    textColor: "{colors.ink}"
    rounded: "{rounded.l}"
    padding: "18px 20px 14px"
  glass-card-public:
    backgroundColor: "{colors.glass}"
    rounded: "{rounded.surface}"
    padding: "28px"
  monitor-row:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    padding: "8px 16px"
    height: "60px"
  monitor-row-down:
    backgroundColor: "{colors.red-wash}"
---

# Design System: Pulse

## Overview

**Creative North Star: "The Native Instrument"**

Pulse reads like a first-party macOS dark-mode utility that happens to keep a ledger. A deep slate ground carries translucent slate panels, with true blurred glass kept for the chrome that floats above the page; inside the panels, the structure is the old almanac's: ruled ledger figures, hairline tables, small-caps column heads in a book serif, and a banded response-time "tide" chart. The glass is the material, the ledger is the grammar. Nothing decorates; every colour on screen is a state or an action.

Density is operator-grade. A monitor row is 60px tall and carries name, host or error, state, 24-hour uptime, response, a 40-check tick strip and last-checked time on one line. The public page is the same world at a slower reading pace: one verdict card, then each service's 30-day day strip.

Two earlier worlds were rejected by the user and are anti-references. The neon aurora glassmorphism (multicolour blobs, glow, gradient text) was rejected first. The light paper almanac (warm paper #f7f5ef, ink rules, magenta hazard) was rejected next as "very AI" and not modern. This world keeps the almanac's layout, fonts and tide chart and drops its paper; it keeps glass and drops the aurora's colour.

**Key Characteristics:**
- Deep slate ground lit only by faint monochrome slate radial light, never hued blobs.
- Blurred glass (28px blur, 170% saturation) only on floating chrome: the sticky bar, dialogs, toasts and tooltips. In-flow panels are translucent slate fills without blur. Both are edged by a white hairline and an inset top highlight.
- Apple dark system colours carry meaning only: green up, red down, yellow pending, blue action/focus/selection.
- Source Serif 4 for headings, figures and small-caps heads; Public Sans for every control and body line; tabular numerals everywhere.
- Continuous corners on an 8 / 12 / 16 / 20px scale; capsules for state badges.
- Short ease-out motion (200ms state, 240ms entry) and full reduced-motion and reduced-transparency fallbacks.

## Colors

A near-monochrome slate field where the only saturated colour is Apple's dark system palette, each hue bound to one meaning.

### Primary
- **System Blue** (system-blue): filled primary button ("New monitor", "Start monitoring"), focus outline (2px, 2px offset), focus rings on inputs, text selection, `accent-color`, and the tide chart's light blue curve (system-blue-light). Blue never signals a state.
- **Light System Blue** (system-blue-light): primary hover, caret, tide curve, crest label and cursor dot.

### Secondary (status palette)
- **System Green** (system-green): up. Up marks, tick strips, day cells at 99.9%+, capsule badge text, the "on" switch track, and the green stroke in the logo.
- **System Red** (system-red) and **Red Ink** (red-ink): down. Solid red for marks, ticks, day cells and the danger button; the lighter red-ink for down text on glass (row error, badge, ledger alert, ongoing incidents). **Red Tint** backs capsules, alert strips and form errors; **Red Wash** tints a whole down row.
- **System Yellow** (system-yellow): pending, plus the config notice bar on its tint.
- **System Orange** (system-orange): only the 95–99% day cell on the public strip.

### Neutral
- **Slate Ground** (slate-ground) fading from **Slate Ground Top** (slate-ground-top): the page, under three faint slate radial lights (two at the top corners, one below the fold) at 22–26% alpha, fixed to the viewport.
- **Ink / Ink 2 / Ink 3** (ink, ink-2, ink-3): primary text, secondary text and quiet controls, then metadata, column heads, hosts and placeholders.
- **Hairline / Hairline Strong** (hairline, hairline-strong): row and list dividers at 7%, glass rings, ledger column rules and input strokes at 12%.
- **Fill 1–3** (fill, fill-2, fill-3): inert control surfaces stepping 6 / 10 / 14% white: search and inputs, secondary buttons and kbd, hover.
- **Glass / Glass Strong** (glass, glass-strong): in-flow panels at 58% opacity (no blur); dialogs, toasts and tooltips at 78% with blur. The sticky bar uses its own **Bar** token (bar-bg, rgba(14, 18, 24, 0.74)) under blur; under `prefers-reduced-transparency` it turns opaque #0e1218 and every backdrop blur is removed.
- **Segment Track / Thumb** (segment-track, segment-thumb): the system grey pair used only by segmented controls.

### Named Rules
**The Meaning-Only Colour Rule.** Every saturated pixel is a state or an action. Green, red and yellow mean up, down and pending; blue means "you can act here" or "this has focus". No hue is used for decoration, branding or section colour-coding.

**The Monochrome Light Rule.** The ground's light is slate grey at low alpha. Coloured blobs, aurora gradients, glows that bloom past an element and gradient text are refused; the user rejected them in the aurora world.

## Typography

**Display Font:** Source Serif 4 (with Iowan Old Style, Georgia)
**Body Font:** Public Sans (with -apple-system, BlinkMacSystemFont, system-ui)
**Label/Mono Font:** ui-monospace (SF Mono, Cascadia Mono, Menlo, Consolas)

Both families are self-hosted as variable woff2 (latin and latin-ext subsets) from `/fonts`.

**Character:** A book serif set tight and bold for headings and figures, against a neutral civic sans for the working UI. The serif gives the dark glass a ledger's authority; the sans keeps controls feeling native.

### Hierarchy
- **Display** (600, 42px, 1.2, -0.025em): the public verdict ("All systems operational", "Partial outage"); 30px on phones.
- **Headline** (600, 30px, 1.2): page sections ("Monitors"); the detail title runs at 34px, -0.02em (28px on phones); dialog heads at 24px.
- **Title** (600, 19px): panel and log heads ("Incident log", "Response time"); public section heads at 21px; the wordmark at 21px.
- **Figure** (600, 20px, tabular lining): ledger values. The first figure in the Monitors ledger is the hero at 32px, -0.02em; detail ledger values at 24px.
- **Column Head** (600, 15px, all small caps, 0.05em, ink-3): table heads and ledger labels. The public masthead line uses the same voice at 500.
- **Body** (400, 15px, 1.5): running text; descriptions cap at 56ch.
- **Control** (500, 14px): buttons, badges, verdict, back link.
- **Label** (500, 13px): segmented controls, small buttons, secondary cell text.
- **Mono** (400, 12.5px): hosts, URLs, webhook endpoints, payload samples; URL inputs use 14px mono. Mono is for addresses only: a row's error message is Public Sans 500 13px in red-ink.

### Named Rules
**The Two-Voice Rule.** Serif speaks for structure (headings, figures, column heads, tide soundings in italic); sans speaks for everything you click or read in running text. A control is never set in the serif.

**The Tabular Rule.** Every numeral is tabular and lining, set on `body`, so uptime, response and time columns align without per-cell effort.

## Layout

The operator console is a centred 1320px workspace (32px top, 24px sides, 64px bottom). At 1280px and wider it splits into a fluid main column and a 300px incident log aside, aligned to the top; below that the log stacks under the table. The sticky glass bar is 56px tall and pads its contents to the same 1320px measure.

The Monitors section head sets the headline left and the ledger right, wrapping together. Under it, a toolbar carries a search field (up to 360px) and the segmented filter. The table is one glass panel of hairline-divided rows on a fixed column grid (10px mark, service, 136px state, 64px uptime, 76px response, 198px ticks, 72px checked).

Monitor detail is an in-page view at the same 1320px measure (Escape or Back returns), stacking back link, title with actions, state line, optional red alert strip, a glass ledger, the tide chart panel, then two equal panels (recent checks, incidents) from 900px up.

The public page is a 720px reading column: 68px masthead, verdict card, services card, incidents card, footer, separated by 20px.

Spacing steps in practice are 8 / 12 / 16 / 20 / 24 / 32px, with 4–6px gaps inside controls.

**Responsive.** Below 900px the table hides its head row and each monitor row becomes a three-line grid (mark, name and badge; the last 30 ticks stretched full width; uptime, response and checked with inline "24 h" and "Resp." labels). Below 720px the bar wraps with icon-only actions and the verdict on its own line, gutters drop to 16px, the ledger becomes a 3-column grid, the detail ledger 2 columns, the tide plot 200px tall, the webhook form one column, and public day strips tighten to 2px gaps with only the first and last date shown, and the public incidents table drops its Started column, moving the start time under the service name in 12.5px ink-3.

## Elevation & Depth

Depth comes from translucency first and shadow second, in two tiers. Floating chrome (the sticky bar, dialogs, toasts and day tooltips) is true glass: a translucent slate fill with `backdrop-filter: blur(28px) saturate(170%)`. In-flow containers (the table, incident log, detail ledger, panels, verdict card, public sections and login card) are translucent slate fills over the lit ground with no blur. Both tiers carry a 1px white ring (7% on panels, 12% on dialogs, toasts and login) and a 6–8% white inset highlight on the top edge. Large surfaces add a soft black drop with negative spread so the shadow sits under, never around. Content inside panels (rows, lists, tables) is flat and divided only by hairlines.

### Shadow Vocabulary
- **Glass edge** (`box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06)`): the top highlight on every glass surface and on fill buttons.
- **Panel** (`box-shadow: inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 1px rgba(255,255,255,0.07)`): log, detail ledger, chart and data panels, public sections.
- **Table / verdict lift** (`0 20px 40px -24px rgba(0, 0, 0, 0.6)` on the table; `0 24px 60px -30px rgba(0, 0, 0, 0.7)` on the verdict card): added to the panel ring.
- **Sheet** (`inset 0 1px 0 rgba(255,255,255,0.08), 0 0 0 1px rgba(255,255,255,0.12), 0 30px 80px -20px rgba(0,0,0,0.7)`): dialogs and the login card; toasts use `0 16px 40px -12px`.
- **Segment thumb** (`0 2px 6px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.08)`): the selected segment.
- **Primary button** (`inset 0 1px 0 rgba(255,255,255,0.2), 0 1px 2px rgba(0,0,0,0.4)`): a top highlight and a small neutral drop; no coloured shadow.

### Named Rules
**The Glass-For-Chrome Rule.** Backdrop blur is for surfaces that float over content: the sticky bar, dialogs, toasts and tooltips. In-flow containers (table, log, panels, ledger, verdict card, public sections, login) are translucent fills without blur. Rows, cells and controls are never their own glass.

**The Hairline Edge Rule.** A glass surface is defined by its 1px white ring and inset top highlight, not by a border colour or a heavy shadow. With `prefers-reduced-transparency`, the glass tokens fall back to opaque slate (#161b23 panels, #1c222b sheets) and keep the same edge.

## Shapes

Continuous, moderate corners on a fixed scale: 8px for controls (buttons, inputs, search, row focus), 12px for inset blocks (alert strip, notice, toggle row, webhook list, payload), 16px for panels and the table, 20px for the public cards and login. Dialogs sit at 18px and toasts at 14px. Segmented controls use the native nested pair (9px track, 7px thumb). State badges in the detail state line are full capsules; check-result pills are 6px. Status marks are flat geometric glyphs with no halo: up is a filled circle, down a rotated square (diamond), pending a yellow ring, paused a grey rounded-square outline. Ticks are 3px bars with 2px radius; day cells 3px.

## Components

### Buttons
Native and quiet; only one filled blue per view.
- **Shape:** gently rounded (8px), 32px tall, 12px side padding, 7px icon gap; 28px small, 40px block (login).
- **Primary:** filled system blue, white label, a 20% white top highlight and a neutral 1px drop; hover lightens to system-blue-light. Holds the shortcut kbd on a 20% white chip.
- **Secondary:** 10% white fill with ink label; hover 14%.
- **Quiet:** transparent, ink-2 label; hover gains 6% fill and ink. Used for bar actions ("Status page", "Webhooks") and back links.
- **Danger:** filled system red for confirmed destruction; **danger-quiet** is an icon button in red-ink with a red-tint hover. Delete is two-step: the trash icon reveals "Confirm delete".
- **Press / Focus:** `scale(0.97)` on press, 200ms ease; focus is the global 2px system-blue outline at 2px offset.

### Segmented Control
The filter tabs (All / Up / Down / Paused), chart range and check-interval picker share one control: a 2px-padded system-grey track (9px), 28–32px segments (7px), ink-2 labels at 500. The selected segment lifts to a 62% grey thumb with white text and the segment-thumb shadow.

### Chips / Badges
- **Row badge:** plain text in the state colour (ink-2 for up, red-ink 600 for down, yellow pending, ink-3 paused) with duration ("Down · 22m").
- **Capsule badge (detail state line):** full capsule, state tint background, state colour text, 4px 10px.
- **Result pill (tables):** 6px radius, 12px 600, green or red tint with status code or "Resolved"/"Ongoing".

### Cards / Containers
- **Corner Style:** 16px panels, 20px public cards.
- **Background:** glass fill (58%), no blur; floating sheets glass-strong (78%) with blur.
- **Shadow Strategy:** panel ring plus glass edge; see Elevation.
- **Public verdict card:** tinted by state with a vertical gradient over the glass (green 10%→3% with a 22% green ring when up; red 16%→5% with a 35% red ring for partial or major), mark plus 42px serif verdict and a stamp line.
- **Internal Padding:** 18px 20px 14px panels; 28px verdict; 24px dialogs; 32px 28px login.

### Inputs / Fields
- **Style:** 38px tall, 8px corners, 6% fill, inset 1px ring at 12%; labels 13.5px 600 ink-2 with optional ink-3 hint.
- **Focus:** fill steps to 10%, ring turns system blue with a 3px blue halo at 30%. The search field follows the same focus with a leading icon and a `/` kbd.
- **Error:** inset ring in system red; form errors sit in a red-tint block with light red text.
- **Switch:** 42×26px native-style switch, grey 32% track, white 22px knob, system green when on, 240ms slide.

### Navigation
The sticky 56px glass bar (bar-bg rgba(14, 18, 24, 0.74) under the 28px blur, 7% hairline below): logo mark and serif wordmark, the verdict ("All systems operational" in ink-2, or "2 services down" in red-ink 600 with the red diamond), then right-aligned quiet actions, the filled blue "New monitor" with its `N` kbd, and an icon-only sign-out. On phones it wraps to two lines with icon-only actions.

### Monitor Row
The core unit. A full-width button row in the table panel: mark, name (15px 600, lock icon if private) over the host in 12.5px mono, or, when down, the error in Public Sans 500 13px red-ink, state badge, uptime and response in tabular 14px 500, the tick strip, and checked time over its interval. Hover lifts to 4% white; a down row carries the red wash throughout and red-tint on hover; a paused row goes ink-3 and fades its ticks to 40%. Loading rows are a slow skeleton sweep.

### Tick Strip
Forty 3px ticks, 2px apart, 22px tall, one per check. Up ticks are graded by response depth: solid green under 100ms, 75% at 100–300ms, 52% at 300ms–1s, and a dashed green bar beyond 1s. Down ticks are solid red; empty slots are 6% fill.

### Tide Chart (signature)
The response-time chart, carried from the almanac. A 240px plot on a banded, non-linear scale: depth bands under 100ms, 100–300ms, 300ms–1s and above get fixed shares of the height, shaded in faint blue (0 / 7% / 13%) with a slate top band. Dashed 14% white contours mark 100ms, 300ms and 1s, labelled at left as italic serif "soundings". The curve is a 2px light-blue line; the peak is labelled with an italic serif crest. Outages are red 45° hatching over the full height. Pointer or tap shows a dashed cursor, a light-blue dot and a readout in the caption. When every check failed, the bands drop and a capsule reads "No successful checks in this range" in red-ink italic serif.

### Day Strip (public)
Thirty equal cells, 32px tall, 3px gaps, 2px corners, per service: 80% green at 99.9%+, 45% green at 99–99.9%, orange at 95–99%, red under 95%, fill when empty. Hover brightens a cell and shows a blurred glass-strong tooltip with date and uptime. One "30 days ago … Today" axis closes the card; no per-row dates, no legend.

### Public page
Hosted-status-page layout, set entirely in Public Sans (`.public` points --serif at --sans, so headings drop the serif here while the dashboard keeps Source Serif 4). Header: logo, 17px wordmark, hairline-divided "Status", and "Updated …" at right (hidden on phones). A glass verdict card with a 40px solid circle (green check, red alert, grey while loading), an 18px/600 headline and one ink-3 line; outages add a red 30% ring. "System status" card with the date range at right; each row is name + 7px dot, ink-3 state (only down is coloured), "100% uptime", then 32px day cells. Section titles 15px/600; table heads 12px sans.

### Disclosure
The webhook payload `<details>` hides the native marker and leads its summary (ink-2, 500) with a drawn 14px chevron that rotates 90° over 200ms when open; the sample sits in a 12px-corner, 30% black inset block in 12.5px mono.

### Dialogs and Toasts
Native `<dialog>` sheets (520px, 720px wide) in blurred glass-strong with the sheet shadow over a 50% slate backdrop blurred 6px; they pop in over 240ms (8px rise, 98% scale). Heads pair a 24px serif title with a round 28px close button. Toasts stack bottom-right in blurred glass-strong, 14px corners, a green check or red alert icon, and auto-dismiss after 3.8s.

### Ledger
Inline figures separated by 12% vertical hairlines: small-caps label over a serif figure. Used in the Monitors head (hero figure first) and as the glass detail ledger, which omits figures that have no value. A non-zero Down figure turns red-ink.

## Do's and Don'ts

### Do:
- **Do** give new in-flow containers a translucent glass fill without blur, reserve backdrop blur for floating chrome, and edge both with the 1px white ring and the 6–8% inset top highlight.
- **Do** bind each system colour to its one meaning: green up, red down, yellow pending, blue action, focus and selection.
- **Do** set headings, figures and column heads in Source Serif 4 600, and every control in Public Sans 500.
- **Do** keep numerals tabular and lining, and right-align numeric columns.
- **Do** keep motion to state changes: 200ms colour and background transitions, 240ms entries, all on `cubic-bezier(0.22, 0.8, 0.24, 1)`. A down mark pulses twice (0.8s each) when it appears and then holds still; only loading skeletons loop.
- **Do** stay on the 8 / 12 / 16 / 20px corner scale, with capsules only for state badges.
- **Do** keep the public page free of URLs and error details; it shows names, states and uptime only.

### Don't:
- **Don't** use multicolour blobs, hued ambient gradients, glow, coloured drop shadows or gradient text; the aurora world was rejected for exactly this. Drop shadows are neutral black; colour appears in box-shadow only as 1px state rings and the 3px blue input focus ring.
- **Don't** bring back the light paper almanac: no warm paper grounds, ink-rule borders or magenta hazard colour.
- **Don't** use colour for decoration, branding or category coding; a hue that isn't a state or an action doesn't belong.
- **Don't** make rows, cells or controls their own glass, or stack glass inside glass.
- **Don't** add row sparklines; the 40-check tick strip carries the row.
- **Don't** set controls in the serif or use the system face for display type.
- **Don't** add kickers or eyebrow labels above headings.
