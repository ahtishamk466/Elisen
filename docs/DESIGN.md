# Elisen — Design System Source of Truth

Personality: Professional, precise, structured, reliable, aviation-focused.
Reference: Asana / Jira / Linear. Anti-reference: consumer-style dashboards,
playful SaaS, glassmorphism, gradients, decorative illustrations, dense
enterprise tables, generic templates.

This file is the single source of truth for design decisions. It overrides
default assumptions. Read in full before any UI work (see CLAUDE.md rule 1).

---

## Brand

- Product name: **Elisen**
- Logo: navy (`#062B5C`) swoosh mark + "elisen" wordmark, single SVG lockup.
  Asset at `public/logo-elisen.svg` (viewBox 600×104). Use via `<img src="/logo-elisen.svg" alt="Elisen" />`.
- Favicon: the swoosh mark, `public/favicon.svg`. Navy in light mode, white in dark
  mode, switched by the SVG's own `prefers-color-scheme` style.

---

## Tokens

All values below are implemented as CSS custom properties in
`/src/styles/tokens.css` and exposed to Tailwind via `tailwind.config.ts`.
Components must only reference semantic token names — never raw hex values
or Tailwind's default palette (CLAUDE.md rule 4).

### Color — Primitive ramps

**Primary (blue)**
| Step | Hex |
|---|---|
| 25 | #EDF5FF |
| 50 | #CCDDF1 |
| 100 | #AAC6E7 |
| 200 | #7FA9DB |
| 300 | #558DCF |
| 400 | #2B71C3 |
| 500 | #0054B7 |
| 600 | #004698 |
| 700 | #00387A |
| 800 | #002A5C |
| 900 | #001C3D |
| 950 | #001125 |

**Neutral (gray)**
| Step | Hex |
|---|---|
| 25 | #FFFFFF |
| 50 | #F8FAFC |
| 100 | #F1F5F9 |
| 200 | #E2E8F0 |
| 300 | #CBD5E1 |
| 400 | #94A3B8 |
| 500 | #64748B |
| 600 | #475569 |
| 700 | #334155 |
| 800 | #1E293B |
| 900 | #0F172A |
| 950 | #020617 |

**Red (danger)**: 50 #fef2f2 · 100 #fee2e2 · 200 #fecaca · 300 #fca5a5 · 400 #f87171 · 500 #ef4444 · 600 #dc2626 · 700 #b91c1c · 800 #991b1b · 900 #7f1d1d · 950 #450a0a

**Green (success)**: 50 #ebfef4 · 100 #d0fbe3 · 200 #a4f6cd · 300 #6aebb3 · 400 #2ed994 · 500 #0abf7c · 600 #009b65 · 700 #007c54 · 800 #036243 · 900 #035139 · 950 #012d21

**Yellow (warning)**: 50 #fffdea · 100 #fff7c5 · 200 #fff085 · 300 #ffe246 · 400 #ffd01b · 500 #fbac00 · 600 #e28500 · 700 #bb5d02 · 800 #984708 · 900 #7c3a0b · 950 #481d00

### Color — Semantic tokens (mapped from primitives, approved 2026-08-07)

| Token | Source |
|---|---|
| `accent` | Primary-500 `#0054B7` |
| `accent-hover` | Primary-600 `#004698` |
| `accent-subtle` | Primary-25 `#EDF5FF` |
| `text-primary` | Neutral-950 `#020617` |
| `text-secondary` | Neutral-700 `#334155` |
| `text-muted` | Neutral-500 `#64748B` |
| `text-inverse` | Neutral-25 `#FFFFFF` |
| `border-default` | Neutral-200 `#E2E8F0` |
| `border-strong` | Neutral-400 `#94A3B8` |
| `success` / `success-subtle` | Green-600 `#009b65` / Green-50 `#ebfef4` |
| `warning` / `warning-subtle` | Yellow-600 `#e28500` / Yellow-50 `#fffdea` |
| `danger` / `danger-subtle` | Red-600 `#dc2626` / Red-50 `#fef2f2` |
| `danger-hover` / `danger-active` | Red-700 `#b91c1c` / Red-800 `#991b1b` |
| `info` / `info-subtle` | Primary-500 `#0054B7` / Primary-25 `#EDF5FF` |

### Typography

Family: `"Rethink Sans", Inter, system-ui, sans-serif`
Rethink Sans is self-hosted (2026-11-01) from `/public/fonts/rethink-sans`: variable
woff2, weights 400–700, latin and latin-ext subsets, SIL OFL (licence in `OFL.txt`).
The `@font-face` rules live in `src/styles/fonts.css`, imported by `globals.css`;
`index.html` preloads the latin file. No third-party font requests.
Weights in use: 400 (Regular), 500 (Medium), 600 (SemiBold), 700 (Bold)

| Level | Size | Line-height |
|---|---|---|
| xs | 13px | 18px |
| sm | 14px | 20px |
| base | 16px | 24px |
| lg | 18px | 26px |
| xl | 20px | 28px |
| 2xl | 24px | 32px |
| 3xl | 32px | 40px |
| 4xl | 40px | 48px |

Note: source spec showed 3xl/Bold at 30px/40px — treated as a typo,
normalized to 32px across all weights at that level.

### Spacing

Base unit: 4px grid.

| Token | Value |
|---|---|
| xxss | 2px |
| xs | 4px |
| sm | 8px |
| base | 12px |
| lg | 16px |
| xl | 20px |
| 2xl | 24px |
| 3xl | 32px |
| 4xl | 40px |
| 5xl | 48px |
| 6xl | 60px |

`xs` rose from 12px/16px to 13px/18px on 2026-11-01: at the 0.9 UI scale 12px
rendered at about 10.8px. It is the smallest text in the app; tags grew 2px with it.

Table headings: one size for every list table, `text-sm font-semibold
text-text-secondary`; padding stays per table. List tables that lead with an
identifier use `patterns/StackedCell`: identifier `sm` semibold primary, the
confirming line `xs` secondary on one line with the full text on hover.

### Stat pair (label + value)

Every label/value stat in the app — detail cards, summary strips, header
stat bands — renders through `patterns/Stat.tsx`. **Fixed spec, do not
hand-roll it:**

| Part | Size | Weight | Colour |
|---|---|---|---|
| Label | 13px (`text-xs`) | Regular (400) | Neutral 500 (`text-text-muted`) |
| Value | 14px (`text-sm`) | SemiBold (600) | Neutral 950 (`text-text-primary`) |

Spacing between them: **2px** (`mt-xxss`).

The component owns only the pair. Layout around it — grid placement,
divider rules, padding between stats — belongs to the caller, so a divided
strip and a plain card grid share one typography and differ only in their
own wrapper.

### Record page

Every detail page (Project, TCCA project, Approval, Certification Basis) has the
same shape, Figma "Opt-2 – Project Details":

- The header holds a `BackLink` ("Go back to all <records>") and only
  tab-specific controls such as a search. When the record is missing, the header
  keeps the `<h1>` title instead.
- The body is `RecordLayout`: a 320px `IdentityCard` beside `SectionTabs` and the
  open tab, stacked card-first below `laptop`. The card stays beside every tab
  (user decision, 2026-11-01).
- The card carries the identifier as the page's only `<h1>` (`2xl` bold), one
  subtitle line (`sm` secondary), status badges, a ⋮ `ActionsMenu` for record
  actions (never header buttons), and key `Stat`s under one divider.
- Tables beside the card size their columns to measured need (header with its
  sort icon, or widest value, plus padding). Where those needs add up to more
  than the tab's width, the table scrolls inside its own frame. It never wraps
  dates or clips headers.

Exception, Certification Basis (user decision, 2026-11-01): its identity is a
full-width `IdentityCard` band (`layout="band"`) above the tabs, not the side
card. A basis has only a few facts, and its main content is one wide rule table
that needs the page's width. It has no Overview tab; the page opens on
Regulations. Other record pages keep the side card.

Known exception: `ProjectIdentityCard`'s Due date and Contract value are
client-fixed `base` bold pairs with an icon, not `Stat`s. They stay until the
client agrees to move them onto `Stat`.

### Shape & Depth

Radius — **8px is the standard corner radius for rectangular surfaces**
(revised 2026-08-07; superseded an earlier 4px-max rule from the same day
— see docs/DECISIONS.md for both entries).

`radius-sm: 8px` — every rectangular surface: buttons, inputs, selects,
textareas, cards, sections, dialogs, table containers.
`radius-xs: 4px` — **tags** (see "Tags" below) and compact controls (the
16px checkbox): 8px on a 16px box reads as a circle and becomes
indistinguishable from a radio.
`radius-full: 9999px` — circular controls only: radio, toggle track/thumb,
step markers, status dots.

**Tags are 4px, always.** Every `Badge` — Status, Active, health, priority,
count chips — uses `radius-xs`. A tag is a small pill sitting *inside* a
card or a table cell; at that size the 8px surface radius reads as a
rounded box competing with its container rather than a label attached to a
value. Revised 2026-08-22 (superseded "badges" in the 8px list above).

There are deliberately no `md` / `lg` radius tokens; the scale expresses
one rectangular radius, one compact-control radius, and full-round.

Shadows (from source spec):
- `shadow-button`: `3px 3px 4px 0 rgba(255,255,255,0.20)`
- `shadow-textfield`: `0 1px 2px 0 #F8FAFC`

Border widths: `default: 1px` · `strong: 2px`

### Motion

Durations: `fast: 150ms` · `base: 250ms` · `slow: 400ms`
Easing: `standard: cubic-bezier(0.4, 0, 0.2, 1)` · `enter: cubic-bezier(0, 0, 0.2, 1)` · `exit: cubic-bezier(0.4, 0, 1, 1)`

### UI scale

`--ui-scale: 0.9`. The whole app renders at 90% of every size on this page, like
browser zoom set to 90%. Text, spacing, control heights, px column widths and
icons all scale together. User request, 2026-10-30 at 80% ("still very zoomed
in" at full size), raised to 90% on 2026-11-01 ("seems very zoomed out"). The
80% scale replaced the same day's token-by-token "compact" pass, which shrank
text and spacing but left px widths and the sidebar full-size. At 90% a
1440-wide screen lays out like a 1280 one did at 80%.

- **Design at 100%.** Every token and spec on this page is the unscaled value.
  Never pre-shrink a size to make room; change `--ui-scale` instead.
- **Applied once**, as `zoom` on `<html>` (`globals.css`).
- **Full window height** is `h-viewport` / `min-h-viewport`, never
  `h-screen`. Under zoom, `100vh` is measured before the scale shrinks it, so
  `h-screen` leaves a blank band at the bottom.
- **Screen coordinates.** Code that turns screen coordinates
  (`getBoundingClientRect`, `window.inner*`) into CSS px goes through
  `layoutRect()` in `ui/usePanelPosition.ts`. That measures the screen ÷ layout
  ratio, so portalled panels line up with their triggers in any browser.

### Breakpoints

Mobile 375 · Tablet 768 · Laptop 1280 · Desktop 1440

### Z-index

`sticky: 1000` · `modal: 1100` · `dropdown: 1200` · `dialog: 1300` · `toast: 1400` · `tooltip: 1500`

Ordered by **what can spawn what**, not by importance. Dropdowns are portal-
rendered and are usually opened from inside a drawer, so the dropdown layer sits
above the modal layer — reverse them and the panel paints behind the drawer and
the control looks dead. A `ConfirmDialog` opened from a row menu covers that
menu; a toast can fire from inside the dialog. See docs/COMPONENTS.md →
"Layering", and the `Patterns/Overview` → DropdownLayering regression story.

---

## Component specs (reference only — not yet built)

The following specs were provided ahead of Phase 7 calibration. They are
recorded here for reference. Actual components will be built in Phase 8,
against a locked calibration screen, and may be refined from what's below.

### Button
Variants: Primary, Secondary, Tertiary
Sizes: Small, Medium, Large, X Large
States: Default, Focused, Hover, Pressed, Loading, Disabled
- Primary: solid navy fill (Primary-800/900 range), white text, leading/trailing icon slots
- Secondary: outlined, neutral border, fills light on hover/pressed
- Tertiary: text-only, underline on focus/hover, icon slots

### Form Input / Form Group
States: Default, Focused, Typing, Typed, Disabled, Error
Structure: Title (with required marker + char counter), Description, input
with leading/trailing icon slots, Help Text below. Error state shows red
border + red help text replacing help text.

### Checkbox / Toggle / Radio
States: Selected, Deselected × Disabled (No/Yes)
Sizes: Small, Medium
Each paired with a label; required marker supported.

---

## Decisions log

See [DECISIONS.md](DECISIONS.md) for dated entries.


## Shared form and read-only section cards (2026-10-31)

All FormSection and DetailCard consumers use one neutral section treatment:
- `section-header`: Neutral-100 (#F1F5F9).
- `section-surface`: Neutral-25 (white).
- `section-border`: Neutral-400 (#94A3B8), 1px perimeter and header divider.
- Header padding: lg; heading: base/semibold/text-primary. Section headers display titles and optional semantic badges only; no descriptive subtitle line or reserved subtitle spacing.
- Content padding: lg. Form controls retain their existing focus and validation styles.

Required/Optional are neutral textual badges, not selection states. Permanent section headers do not use accent highlights. Accent/selected tokens remain reserved for interactive state. This standard is shared globally through FormSection/DetailCard, not applied to every table/chart/container border. It supersedes the earlier Create Basis-only required/optional emphasis treatment.

Section header subtitles are omitted globally (2026-10-31). Page descriptions, record Description fields, control help, validation messages and step progress remain unchanged.
