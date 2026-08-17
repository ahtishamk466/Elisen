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
Weights in use: 400 (Regular), 500 (Medium), 600 (SemiBold), 700 (Bold)

| Level | Size | Line-height |
|---|---|---|
| xs | 12px | 16px |
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

### Shape & Depth

Radius — **8px is the standard corner radius for rectangular surfaces**
(revised 2026-08-07; superseded an earlier 4px-max rule from the same day
— see docs/DECISIONS.md for both entries).

`radius-sm: 8px` — every rectangular surface: buttons, inputs, selects,
textareas, cards, sections, dialogs, badges, table containers.
`radius-xs: 4px` — compact controls only (the 16px checkbox): 8px on a
16px box reads as a circle and becomes indistinguishable from a radio.
`radius-full: 9999px` — circular controls only: radio, toggle track/thumb,
step markers, status dots.

There are deliberately no `md` / `lg` radius tokens; the scale expresses
one rectangular radius, one compact-control radius, and full-round.

Shadows (from source spec):
- `shadow-button`: `3px 3px 4px 0 rgba(255,255,255,0.20)`
- `shadow-textfield`: `0 1px 2px 0 #F8FAFC`

Border widths: `default: 1px` · `strong: 2px`

### Motion

Durations: `fast: 150ms` · `base: 250ms` · `slow: 400ms`
Easing: `standard: cubic-bezier(0.4, 0, 0.2, 1)` · `enter: cubic-bezier(0, 0, 0.2, 1)` · `exit: cubic-bezier(0.4, 0, 1, 1)`

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
