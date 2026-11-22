---
name: Pulse
description: Self-hosted uptime monitor and public status page, set as a printed tide table.
colors:
  paper: "#f7f5ef"
  paper-hover: "#eeeadf"
  land: "#ece5d3"
  land-2: "#e2d9c2"
  field-white: "#ffffff"
  ink: "#1b1d1f"
  ink-2: "#45484b"
  ink-3: "#64676a"
  rule: "#e0d9c9"
  rule-2: "#c7bea9"
  sea-1: "#e4eff2"
  sea-2: "#c3dce4"
  sea-3: "#7fb0c2"
  sea-4: "#3d7c93"
  sea-5: "#1f5568"
  hazard: "#b8124f"
  hazard-ink: "#8e0c3c"
  hazard-tint: "#f8e6ec"
  hazard-wash: "#f9ecef"
  amber: "#e0a43a"
  amber-ink: "#8a5a08"
  amber-tint: "#f8ecd4"
typography:
  display:
    fontFamily: "Source Serif 4, Iowan Old Style, Georgia, serif"
    fontSize: "42px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Source Serif 4, Iowan Old Style, Georgia, serif"
    fontSize: "28px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.012em"
  title:
    fontFamily: "Source Serif 4, Iowan Old Style, Georgia, serif"
    fontSize: "20px"
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
    fontSize: "15.5px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.05em"
    fontFeature: "all-small-caps"
  body:
    fontFamily: "Public Sans, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "tnum, lnum"
  label:
    fontFamily: "Public Sans, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: 1
  mono:
    fontFamily: "ui-monospace, SF Mono, Cascadia Mono, Menlo, Consolas, monospace"
    fontSize: "12.5px"
    fontWeight: 400
    lineHeight: 1.4
rounded:
  cell: "1px"
  sm: "2px"
  overlay: "3px"
  switch: "10px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  section: "40px"
components:
  button:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "0 12px"
    height: "34px"
  button-hover:
    backgroundColor: "{colors.paper-hover}"
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "0 12px"
    height: "34px"
  button-quiet:
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "0 12px"
    height: "34px"
  button-quiet-hover:
    backgroundColor: "{colors.land-2}"
  button-danger:
    backgroundColor: "{colors.hazard}"
    textColor: "{colors.field-white}"
    rounded: "{rounded.sm}"
    height: "34px"
  button-danger-hover:
    backgroundColor: "{colors.hazard-ink}"
  input:
    backgroundColor: "{colors.field-white}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "0 12px"
    height: "38px"
  pill-up:
    backgroundColor: "{colors.sea-1}"
    textColor: "{colors.sea-5}"
    rounded: "{rounded.sm}"
    padding: "2px 6px"
  pill-down:
    backgroundColor: "{colors.hazard-tint}"
    textColor: "{colors.hazard-ink}"
    rounded: "{rounded.sm}"
    padding: "2px 6px"
  app-bar:
    backgroundColor: "{colors.land}"
    textColor: "{colors.ink}"
    height: "56px"
  dialog:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.overlay}"
    padding: "24px"
    width: "520px"
  toast:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.sm}"
    padding: "10px 14px"
  toast-err:
    backgroundColor: "{colors.hazard-ink}"
---

# Design System: Pulse

## Overview

**Creative North Star: "The Tide Table"**

Pulse is set like a printed nautical almanac. Every monitored service is a row in a ruled table with fixed columns, tabular figures and a strip of whole-cell history marks. The ground is warm chart paper, ink is near-black, panels and the app bar take a buff land tint, and health is read in graded chart-water blues. Outages are the one loud thing: chart magenta, a diamond-shaped mark that pulses, and a washed row. Healthy screens are quiet; a down screen is unmissable.

Density is that of a reference table, not a dashboard of cards. Structure comes from 1px hairlines rather than boxes: a full-ink rule opens every table and list, a lighter rule separates rows, and a mid rule closes. Headings, large figures and column heads are in Source Serif 4; everything you operate is in Public Sans with tabular lining numerals. The signature device is the tide chart in the monitor detail: response time drawn as one deep-blue curve over tinted depth bands (100 / 300 / 1000 ms, each band a fixed share of the height), with its peak labelled in serif italic like a high-water figure.

The user rejected the earlier aurora world (gradient blobs, glassmorphism, purple-cyan gradients) and it may not return.

**Key Characteristics:**
- Warm chart-paper ground, iron ink, buff land panels; light scheme only.
- Ruled tables, not cards: 1px hairlines, ink rule on top.
- Status carried by mark shape plus colour: blue circle, magenta diamond, amber ring, grey square.
- History as fixed whole cells, graded by response-time depth.
- Serif for headings, figures and small-caps column heads; sans for UI, tabular numerals everywhere.
- Flat paper. Shadow only on overlays and the focus halo.

## Colors

A warm paper-and-ink neutral base with one blue family for health, one magenta for outage and one amber for degradation; nothing decorative.

### Primary
- **Chart Water** (sea-1 to sea-5): the health scale. Deep Chart Water (sea-4) is the up mark, the fastest tick (under 100 ms), the 99.9%+ day cell and the checked switch. Abyss Blue (sea-5) is the focus ring, the tide curve, the crest label and up-state text on pale fills. Shoal Blue (sea-3) and Shallows (sea-2) are the slower tick grades and tide bands; Surface Water (sea-1) fills up pills and the first tide band.

### Secondary
- **Chart Magenta** (hazard): the outage colour. Down marks, down ticks and day cells, outage hatching, the danger button, invalid-field borders and alert-strip borders.
- **Deep Magenta** (hazard-ink): magenta text on paper or on tints (down badges, ongoing incidents, error copy, the down count in the ledger) and the error toast.
- **Magenta Tint / Magenta Wash** (hazard-tint, hazard-wash): fills behind outage content. The wash tints a down row at rest; the tint is the hovered down row, alert strips, form errors and the partial/major verdict block.

### Tertiary
- **Lamp Amber** (amber): pending ring mark, 95-99% day cells, the notice border. Never used for a healthy check. **Amber Ink** and **Amber Tint** are its text and fill.

### Neutral
- **Chart Paper** (paper): page ground, default button fill, dialog and login card surface.
- **Paper Hover** (paper-hover): hover on rows, default buttons and segmented options; the skeleton sweep.
- **Buff Land** (land): app bar, login backdrop, code/payload blocks, paused badge, the top tide band. **Deep Land** (land-2) is the quiet-button hover.
- **Field White** (#ffffff): text inputs, search field and segmented control only. Never a page or panel surface.
- **Iron Ink** (ink): text, the opening rule of every table, the primary button, selected segment and tab underline, toasts and tooltips. **Ink 2** is secondary text and column heads; **Ink 3** is muted text, placeholders, paused state.
- **Rule / Rule 2** (rule, rule-2): row separators and closing rules / control borders, ledger dividers and the app bar's bottom edge.

### Named Rules
**The Magenta Means Act Rule.** Hazard magenta appears only where something is down, failing or destructive. A healthy screen contains none of it.

**The Depth Grading Rule.** Healthy history is graded, never flat green: checks under 100 ms are sea-5, under 300 ms sea-4, under 1 s sea-3, and 1 s or slower a striped sea-4 cell (never amber, which belongs to pending and degraded uptime). Public day cells follow the same ladder by uptime: 99.9%+ sea-4, 99-99.9% sea-3, 95-99% amber, under 95% hazard; missing data is a hatched empty cell.

**The Ink Is for Doing Rule.** Solid ink fill marks the primary action and the selected state. The only other ink surfaces are transient overlays (toast, day tooltip).

## Typography

**Display Font:** Source Serif 4 (with Iowan Old Style, Georgia), self-hosted variable 200-900, roman and italic.
**Body Font:** Public Sans (with system-ui), self-hosted variable 100-900.
**Label/Mono Font:** system monospace stack for hosts, URLs, errors and payloads.

**Character:** an almanac serif for everything that is read as a title or a figure, and a plain civic sans for everything that is clicked. Numbers are tabular and lining across the whole page.

### Hierarchy
- **Display** (600, 42px, 1.2, -0.025em): the public verdict line only. 30px under 720px.
- **Headline** (600, 28px, 1.2): page headings (Monitors, login). The detail title runs 34px at -0.02em; dialog titles 24px.
- **Title** (600, 20px, 1.2): panel headings, the incident log, public section heads (22px).
- **Figure** (600 serif, 20px, 1.1, tabular): ledger values. The lead figure runs 32px at -0.02em, detail ledger 24px, public 30-day uptime 16px.
- **Column head** (600 serif, 15.5px, all-small-caps, 0.05em, ink-2): table column heads and ledger labels.
- **Body** (400, 15px, 1.5): default UI text; 14px for secondary lines, notes and table cells. Long prose capped at 56ch.
- **Label** (500, 14px, 1): buttons, tabs, segmented options, status badges (13.5px). Field labels are 600 at 13.5px.
- **Mono** (12.5px): hostnames, URLs, error text; 0.88em inline.
- **Serif italic** (12.5px): tide-chart soundings and the crest figure; 16px for the "no successful checks" note.

### Named Rules
**The Tabular Figures Rule.** Every number is tabular and lining, and every numeric column is right-aligned, so polling changes values without moving anything.

**The Two Voices Rule.** Serif is for reading (headings, figures, column heads); sans is for operating. Public service names are the one sans heading (600, 16px), because they read as row labels.

## Layout

Content sits in a 1320px column centred with 24px gutters (16px under 720px). The app bar is a full-width sticky 56px band whose inner padding tracks the same column. The admin workspace is one column until 1280px, then a main table plus a 300px incident-log column with a 40px gap. The detail view puts its two tables side by side from 900px. The public page is a narrower 880px column.

The monitor table is a fixed grid: mark (12px), service (min 200px), state (136px), 24h uptime (64px), response (76px), 40-check strip (198px), last checked (72px). Columns never reflow while data updates. Under 900px each row restacks into three lines (mark, name and state; tick strip showing the last 30 checks; uptime, response, checked) with inline "24 h" / "Resp." prefixes replacing the hidden header. Under 720px the ledger becomes a three-column grid, the bar wraps the verdict onto its own line, and action buttons collapse to 36px icons.

Spacing is set per component rather than from a strict scale, clustering on 4 / 8 / 12-14 / 16-18 / 24 / 40px. Rows are at least 58px tall with 8px by 12px padding; data-table cells use 9px by 8px with flush outer edges.

## Elevation & Depth

The system is flat paper. Depth comes from tint (buff land behind paper, washes behind outages) and from rules, not from shadows. Shadows exist only on things that float above the page: dialogs, toasts, the switch knob, and the 3px blue focus halo on fields.

### Shadow Vocabulary
- **Overlay** (`box-shadow: 0 2px 6px rgba(27,29,31,0.08), 0 20px 48px -12px rgba(27,29,31,0.3)`): modal dialogs, over a 36% ink backdrop.
- **Toast** (`box-shadow: 0 10px 28px -10px rgba(27,29,31,0.5)`): the bottom-right toast stack.
- **Field focus** (`box-shadow: 0 0 0 3px rgba(61,124,147,0.18)`): inputs and search with a sea-5 border.

### Named Rules
**The Flat Paper Rule.** Nothing resting on the page casts a shadow. A surface earns a shadow only by floating over the page (dialog, toast).

## Shapes

Corners are nearly square: 2px on buttons, fields, pills, badges, notices and cards; 3px on dialogs; 1px on tick and day cells. Fully round shapes are reserved for the up and pending marks, the switch track and knob, and the chart cursor dot. Borders are 1px hairlines; the one heavier edge is the 2px ink top on the login card and the 2px ink underline on the selected tab.

Status marks are a shape system, 10px by default (12px in the detail title, 16px in the public verdict): **up** a filled sea-4 circle, **down** a hazard square rotated 45 degrees into a diamond that pulses (1.6s, to 35% opacity), **pending** a 2px amber ring, **paused** a 2px ink-3 square outline.

### Named Rules
**The Hairline Rule.** Every table and list opens with a 1px ink rule, separates rows with 1px rule, and closes with 1px rule-2. No boxed cards.

**The Whole Cell Rule.** History is a fixed count of discrete cells (40 checks at 3px with 2px gaps; 30 days in a 30-column grid with 3px gaps). Empty slots are hatched placeholders; the count never changes and cells never merge into a line.

## Components

### Buttons
Plain, squared and quiet, with ink reserved for the one thing to do.
- **Shape:** near-square (2px), 34px tall, 12px side padding, 500 weight at 14px, 7px icon gap. Small is 30px; block is 40px full width; icon-only is 34px square.
- **Default:** paper fill, rule-2 border, ink text. Hover: paper-hover fill with an ink-3 border; active: land.
- **Primary:** ink fill and border, paper text; hover goes to pure black, active to ink-2. Carries an inline kbd hint (e.g. N).
- **Quiet:** transparent fill and border; hover fills land-2.
- **Danger:** hazard fill, white text, hover hazard-ink. **Danger quiet** is hazard-ink text that washes on hover.
- **Transitions:** 150ms on background, border and colour, eased `cubic-bezier(0.2, 0.7, 0.2, 1)`.

### Status Badges and Pills
- **Badge (in rows):** text only, 13.5px 500, coloured by state (up ink-2, down hazard-ink 600, pending amber-ink, paused ink-3).
- **Badge (detail state line):** the same text on a 2px tinted chip: sea-1/sea-5 up, hazard-tint down, amber-tint pending, land paused.
- **Pill (incident tables):** 12px 600, min 40px wide, sea-1/sea-5 for Resolved, hazard-tint/hazard-ink for Ongoing.

### Cards / Containers
- **Corner Style:** 2px (login card), 3px (dialog).
- **Background:** paper on a land backdrop.
- **Shadow Strategy:** none on the login card; dialogs use the Overlay shadow.
- **Border:** 1px rule-2; the login card adds a 2px ink top edge.
- **Internal Padding:** 24-28px. Dialogs have a head (24px serif title, ink-2 subtitle), body, and a foot of right-aligned buttons above a 1px rule.

### Inputs / Fields
- **Style:** 38px tall, field white, 1px rule-2 border, 2px radius, 12px side padding, 15px text. Labels sit above in 600 13.5px ink-2, with optional hints in 400 ink-3.
- **Focus:** border turns sea-5 with a 3px translucent sea halo; global focus elsewhere is a 2px sea-5 outline at 2px offset.
- **Error:** hazard border; form errors are a hazard-tint strip with a hazard border and hazard-ink text.
- **Segmented control:** a joined white strip of 36px options split by rule lines; the selected option is solid ink with paper text.
- **Switch:** 36 by 20px track in rule-2, sea-4 when on; white 16px knob slides 16px in 180ms.

### Navigation
- **App bar:** sticky 56px buff-land band with a rule-2 bottom edge. Left: the Pulse mark (ECG line in a rounded square) and a 21px serif wordmark, then the overall verdict as one inline line with its status mark (hazard-ink 600 when anything is down). Right: quiet buttons, the primary New monitor button, then an icon-only log-out button.
- **Tabs (filters):** text tabs, 34px, 14px 500 in ink-3; hover ink; selected ink 600 with a 2px inset ink underline.
- **Back link:** borderless ink-2 text with a back chevron and an Esc kbd hint.

### Monitor Row (signature)
The live row of the tide table. Columns: status mark; name (15px 600) over host in mono ink-3; state badge with duration; 24h uptime; response; the 40-check tick strip; last checked over interval, right-aligned. Hover fills paper-hover. A down row is washed hazard-wash (hazard-tint on hover) with uptime and host error in hazard-ink. A paused row drops to ink-3 with ticks at 45% opacity. Loading rows use a horizontal paper-hover sweep (1.4s linear).

### Ledger
A ruled line of figures beside a heading, never tiles: small-caps label over a serif figure, items separated by 1px rule-2 verticals. The first figure on the dashboard runs large (32px). The detail ledger sits between an ink top rule and a rule-2 bottom, and omits figures that have no value. Down counts turn hazard-ink.

### Tide Chart (signature)
Response time over depth bands: 240px tall (200px on mobile), bands from paper (fastest) through sea-1 and sea-2 to land, dashed sea-3 contours at 100 / 300 / 1000 ms with serif-italic soundings in the left margin, a 1px ink baseline, and a 1.75px sea-5 curve. Outage spans are hatched in hazard at 45 degrees. The peak carries a serif-italic crest label; pointing shows a dotted cursor, a sea-5 dot ringed in paper, and a readout in the axis line.

### Day Strip (public)
Thirty whole cells per service, 30px tall (26px mobile), coloured by the Depth Grading Rule, with first and last date figures beneath and an ink tooltip on hover. A legend of 10px swatches follows the list.

### Verdict Block (public)
One plain-language sentence in Display serif beside a 16px status mark, with an "Updated" stamp beneath. When anything is down the block becomes a hazard-bordered hazard-tint panel with the sentence in hazard-ink.

## Do's and Don'ts

### Do:
- **Do** open every table and list with a 1px ink rule and separate rows with 1px rule hairlines.
- **Do** pair every status colour with its mark shape: sea circle, magenta diamond, amber ring, grey square.
- **Do** grade healthy history by depth (sea-5, sea-4, sea-3, striped sea-4 for 1 s+) instead of a single green.
- **Do** set every number in tabular lining figures and right-align numeric columns.
- **Do** keep corners at 2px (1px on cells, 3px on dialogs).
- **Do** use Source Serif 4 for headings, figures and small-caps column heads, and Public Sans for controls and body.
- **Do** keep motion short and eased (150-180ms, `cubic-bezier(0.2, 0.7, 0.2, 1)`), and drop all of it under reduced motion.

### Don't:
- **Don't** bring back aurora gradient blobs, glassmorphism or purple-cyan gradients.
- **Don't** use hazard magenta for anything that is not down, failing or destructive.
- **Don't** put resting content in shadowed or rounded cards; shadows belong to dialogs and toasts only.
- **Don't** fill a surface with solid ink unless it is the primary action, a selected state, or a transient overlay.
- **Don't** merge or smooth history marks into sparklines or area charts; the cell count is fixed.
- **Don't** use field white as a page or panel surface; it belongs inside inputs only.
- **Don't** let polling move layout: columns and row heights stay fixed while values change.
