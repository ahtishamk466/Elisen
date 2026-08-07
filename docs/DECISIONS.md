# Decisions Log

Significant technical and design decisions, dated and reasoned.

Entries follow this format:
```
## [Date] — [Decision Title]
**Context:** ...
**Choice:** ...
**Rationale:** ...
```

## 2026-08-07 — Design tokens sourced from Figma style guide export
**Context:** User provided a full style guide export (color ramps, type scale,
spacing, shadows, button/input/checkbox/toggle/radio specs) as screenshots.
**Choice:** Extracted primitive color ramps (Primary, Neutral, Red, Green,
Yellow), typography scale, spacing scale, and two named shadows exactly as
given. For token categories not covered by the export (semantic text/border
color mapping, accent mapping, radius, motion, breakpoints, z-index), proposed
conventions and got explicit approval before writing tokens.css.
**Rationale:** Phase 3 requires either real values or approved conventions —
never invented values. Component-level specs (Button, Input, Checkbox,
Toggle, Radio) were captured in DESIGN.md for reference but NOT built yet;
user chose to defer actual component builds to Phase 8, after a calibration
screen locks the pattern (Phase 7).

## 2026-08-07 — Normalized 3xl/Bold type size typo
**Context:** Source spec showed 3xl at 32px/40px for Regular/Medium/SemiBold
but 30px/40px for Bold — inconsistent within the same level.
**Choice:** Normalized to 32px/40px for all weights at the 3xl level.
**Rationale:** A single type level should not change point size by font
weight; treated as a data-entry typo in the source export.

## 2026-08-07 — Added generic shadow-sm/md/lg alongside named shadows
**Context:** Source spec only provided two named shadows (`shadow-button`,
`shadow-textfield`), but Phase 3's token checklist calls for a generic
sm/md/lg elevation scale for general-purpose use (cards, modals, dropdowns).
**Choice:** Added a conventional dark, low-opacity sm/md/lg shadow scale
using neutral-950 as the shadow color, kept the two named shadows separate.
**Rationale:** The two named shadows are light-colored and specific to
button/textfield components; they don't work as general elevation shadows
on light surfaces. Flagging for visual review at calibration (Phase 7).

## 2026-08-07 — Project creation & detail UX: hybrid of Opt-1 and Opt-2
**Context:** Two reference UI option sets provided for the Projects area.
Opt-1 = stepper-based creation drawer with a conditional TCCA step.
Opt-2 = single long creation form, no TCCA at creation, but much deeper
project-detail flows (Work Packages, TCCA sub-tabs, empty states, modals).
**Choice:** Hybrid. Opt-1's creation entry (stepper + "TCCA approval
required?" question that conditionally adds a TCCA step with an
applicability-only checklist) + Opt-2's project-detail management surface
(WP accordion, TCCA sub-tabs, empty states) — with corrections where either
option conflicted with the client transcripts (see chat spec 2026-08-07:
removed Revision section from project creation, de-required Contract
Value/Scope, removed time-entry fields from Add Activity, restored
two-level document→revision flow, single aircraft, consolidated tabs,
fixed destructive-action button semantics).
**Rationale:** Transcripts confirm TCCA creation should be embeddable in
the project flow (Harris endorsed Faizan's proposal) but approval need is
often discovered after creation ("part of the quote they might or might
not say they want an approval") — so both entry points are required, which
neither option alone provided. Budgeting level (Activity vs Work Package)
remains unresolved with the client; UI shows budget per activity with WP
roll-up so either final answer fits without rework.

## 2026-08-07 — Semantic tokens added for danger hover/active
**Context:** Button's danger variant used `bg-red-700` / `bg-red-800` for its
hover and active states. The red ramp exists in tokens.css but was never
wired into the Tailwind theme, so those classes resolved to *transparent* —
the destructive button had no visible hover or pressed state.
**Choice:** Added `--color-danger-hover` (red-700) and `--color-danger-active`
(red-800) as semantic tokens, wired them into the Tailwind theme, and pointed
Button at them. Did not expose the raw red/green/yellow ramps as utilities.
**Rationale:** CLAUDE.md rule 4 says components use semantic tokens, not
primitives — so the fix is a named semantic pair, not ramp access. Exposing
ramps nothing else consumes would be premature (rule 12).

## 2026-08-07 — Drawer body uses block flow, not grid
**Context:** The Drawer's scroll area was `grid content-start gap-lg` inside a
flex column. The grid stretched its rows to equal heights (~128px each), and
because each FormSection is `overflow-hidden`, every section rendered only
its first field — the rest was clipped invisibly.
**Choice:** Drawer body is now `flex-1 space-y-lg overflow-y-auto` (block flow).
**Rationale:** Block flow sizes children to their content and scrolls
predictably. Noted in the component so it isn't "tidied" back into a grid.

## 2026-08-07 — Spacing token names collide with Tailwind's maxWidth scale
**Context:** Our spacing scale reuses key names (`sm`, `lg`, `xl`, `2xl`,
`3xl`...) that Tailwind's built-in `maxWidth` scale also uses (`max-w-sm` =
24rem by default). `theme.extend.spacing` merges into `maxWidth`/`minWidth`
resolution for shared key names, so `max-w-sm` silently resolved to our
8px spacing token instead of Tailwind's 24rem — a real bug caught while
building the Form Input specimen (input field collapsed to a sliver).
**Choice:** Never use `max-w-{token}` / `min-w-{token}` / `max-h-{token}` /
`min-h-{token}` with our named spacing steps (xxss, xs, sm, base, lg, xl,
2xl, 3xl, 4xl, 5xl, 6xl). Use Tailwind's numeric width scale (`w-96`, etc.)
or an explicit arbitrary value instead when a max/min constraint is needed.
**Rationale:** Plain `w-*`/`h-*`/`p-*`/`m-*`/`gap-*` derive from
`theme('spacing')` intentionally and are safe — this collision is specific
to `maxWidth`/`minWidth`, which Tailwind defines as a separate named scale.
