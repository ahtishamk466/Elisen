# Project Handoff

A condensed, thematic synthesis of `docs/DECISIONS.md` (the full chronological
log, ~146 entries, 2026-08-07 to 2026-08-24) for anyone picking up this
project cold. Read this first (~10-15 min), then consult DECISIONS.md for the
full reasoning behind any specific call.

---

## What this project is

**Elisen Inc.** is an aviation certification/modification business (STCs,
type-design changes, Transport Canada / TCCA approvals). Their existing
internal tool, **TPMS**, is a legacy Yii2/PHP admin app with the IA of its
database schema exposed directly as screens — one CRUD page per table, six
sibling RBAC pages, three separate report list pages, flat grids everywhere.
This repo, **elisen-admin**, is a from-scratch redesign of that system: same
data and functional coverage, rebuilt as a modern React SPA with a real
design system, consolidated navigation, and screens organized around the
tasks users actually do rather than the tables underneath them. It is a
prototype (no backend) built against Figma-supplied design tokens, client
screenshots of the legacy screens, meeting transcripts, and a requirements
PDF (`tpms-business-modules-ui-ux.pdf`), with the client reviewing and
correcting screens iteratively.

---

## Entity model

**Core hierarchy:** Project → Work Package → Activity → Task.
- A **Project** is free-text-titled per aircraft, no templates.
- A **Work Package** is a free-text grouping (e.g. "Certification Plan"),
  created only inside a project.
- An **Activity** is picked from a global catalog (Reference Data →
  Activities & Tasks), assigned a responsible person and budget hours.
  Actual hours are read-only on this side — they come from Timesheet.
- A **Task** belongs to the global catalog too, many-to-many with Activities
  (a task like "Conceptual Design" can sit under two different activities).
  `taskRequired` on an activity hides/requires the Task field at time entry.
- Deleting a package/activity with logged hours is blocked (would orphan
  time records); catalog records use Deactivate/Retire instead of Delete
  once in use.
- Budgeting level (activity vs. work-package) was **never resolved** with
  the client — UI enters budget per activity with a package roll-up, which
  works either way.

**Global vs. project-scoped records — the rule that shaped most of the app:**
Aircraft, Approvals, Deliverables, Design Data, and TCCA Projects are
**global workspaces**, never owned by a project (requirement doc §1.2 vs.
§1.3-1.5: modules get "List, CRUD", a project gets "List, assign"). A
project only **links** to existing records — it never creates or edits their
identity. The one exception: a project may edit *project-scoped tracking* on
a linked document revision (next-action person, dates, status) because
that's the project's own to-do list, not the record's identity. Vocabulary
is **"link"**, never "attach" (attach collides with the file-upload
metaphor). Linking is bidirectional where both sides are workspaces (a
project's TCCA tab and a TCCA project's Projects tab call the same
`linkProject`/`unlinkProject` verbs).

**Documents (Deliverables / Design Data):** two-level model — a Document
(number/title/type/owner) forces its first Revision; only Revisions carry
dates, next-action **person**, status (WIP → In Review → Signature Cycle →
Accepted/Superseded), and a URL. One `ProjectDocument.kind` field
distinguishes Deliverables from Design Data — they're one entity, not two,
sharing one revision system and one `documentsStore`. Drawings (Design Data)
never cross into TCCA; only Deliverable revisions can.

**Approvals:** a certificate has **no single date** — it's granted by its
first Revision and re-issued whenever it changes (renamed from "Issue" to
"Revision" mid-project, per the client's own settled terminology). Coverage
is two separate assign lists (`Approval ↔ Aircraft` models, `Approval ↔
Serial Numbers`), mirroring the legacy join tables exactly. `Primary
Approval` is a boolean checkbox on the certificate (not a "primary
aircraft").

**Aircraft vs. Serial Numbers:** two records, never merge into one grid —
this was tried twice and reverted twice. Aircraft is a *type* (model,
manufacturer, type certificates); Serial Numbers is an *airframe* (which
type, serial/registration, plus eleven owner/contact fields — real personal
data, which is why it's a record, not a column). Serials are unique **per
model**, never globally (the same number can exist under two manufacturers).
Two tabs of one workspace, `?tab=serials` deep-linkable — same shape as
Deliverables/Design Data.

**TCCA tracking:** one certificate per TCCA project; a single tracked
document list (merged "Doc Status" + "Deliverable Revision"); one standard
checklist per TCCA project (unticked = N/A, ticked = in progress, dated =
complete); linking is bidirectional with Elisen projects. Created only in
its own workspace, linked from a project — same rule as Approvals/Documents.

**Timesheet vs. Hours Worked vs. Hours by Person:** three different zoom
levels/audiences over the same underlying rows, not three redundant
screens. Timesheet = one employee, self-service, raw rows. Hours Worked →
All Entries = everyone, admin, raw rows (audit/validation). Hours Worked →
By Person = everyone, **aggregated** roll-up (who's tracking how). Once an
entry is `validated`, the owning employee's own Timesheet view drops to
View + Duplicate only; only Hours Worked (the admin) can toggle validation
and still fully edit. Actual hours come from the timesheet (the only record
that knows *who*); budget comes from the activity. Overtime/banked/
non-project hours are never folded into Actual against a budget.

---

## Tech stack & conventions

React 19 + Vite + TypeScript + Tailwind v4 + Zustand + react-router-dom v7.
Dev server on port 5180 (5173 is used by an unrelated project in the same
workspace). Storybook hosts the design-system inventory (`/components/ui`,
`/components/patterns`) — real screens live in the app, never as Storybook
stories (`/components/features/*`).

- **Import direction:** `features → patterns → ui`, never sideways (e.g.
  `features/timesheet` must not import from `features/projects` — when both
  needed the same card shape, it was duplicated locally rather than
  cross-imported).
- **Token discipline:** semantic tokens only — no raw hex, no Tailwind
  default palette, no arbitrary values (CLAUDE.md rule 4). The one
  deliberately flagged exception: a literal `margin: 3` (Person Detail's
  stat-band inset) to match a reference screenshot pixel-for-pixel, since
  the nearest tokens (2px/4px) didn't match. Everything else on that page
  uses tokens.
- **~200-line file guideline:** propose a split before continuing past it
  (e.g. `PersonWorkPackageCard` was split out of `PersonProjectPanel.tsx`
  once both crossed the limit).
- **Form standard (CLAUDE.md rule 9 / Storybook `DrawerFormStandard`):**
  every control full-width of its field column; every field has a
  placeholder (concrete example or prompt, and where a value is derivable
  the placeholder is the suggestion a blank submit takes); one short help
  line or none; `active` is always an `ActiveSelect` dropdown, never a
  checkbox.
- Every Edit screen is **Cancel + Save Changes**, one screen, all fields at
  once — never a multi-step Continue flow. Stepper is for *creation* only.

---

## Design system standing rules

These are durable, cross-cutting, and got re-applied whenever a new screen
touched the same concern. Full "why" lives in DESIGN.md/COMPONENTS.md/
DECISIONS.md — this is just the rule.

- **Tags are 4px radius (`radius-xs`), always** — every `Badge` (status,
  active, health, priority, count chips). 8px (`radius-sm`) is for
  rectangular surfaces (cards, inputs, buttons, dialogs); `radius-full` for
  circular controls only.
- **One `Stat` component** (`patterns/Stat.tsx`) for every label/value pair
  in the app: label 12px regular Neutral 500, value 14px semibold Neutral
  950, 2px between. `DetailField` and `Fact` are thin aliases over it. Was
  hand-rolled five different ways before this existed — don't reinvent it.
- **Truncate + tooltip for long free text**, 2-line clamp + native `title`
  (`patterns/Truncate.tsx`), paired with a `maxWidth` on the `<td>`. **Short
  codes/IDs never wrap or clamp** — `whitespace-nowrap` (or `DetailField`'s
  `nowrap` prop) instead; a code needs to be read whole, not hovered.
- **Standard View/Edit split:** View is never a form — always `DetailCard` +
  `DetailField` (patterns/DetailView.tsx), never a disabled input (a
  disabled input dims a real value to the same grey as an empty
  placeholder, making them indistinguishable). Edit always shows real,
  enabled inputs.
- **Every drawer names the record it acts on** in its title (e.g. `Add
  Aircraft "3200-00 — STC — Cabin Interior Modification"`).
- **Pagination → `AutoLoadFooter`**, not page numbers. `Pagination.tsx` was
  deleted outright (client wants auto-load-on-scroll everywhere); the
  footer keeps the same placement contract — last child inside the table's
  own card, one top border, never a second box.
- **`TableTabs`** — one table sliced several ways renders as the *first*
  child inside the table's card (mirrors `AutoLoadFooter` as the last
  child), never as floating pill buttons above it.
- **Selection standard:** `SearchableSelect` (single choice) + `MultiSelect`
  (many, with removable chips underneath — a bare count answers "how many"
  never "which"). `Select` is a thin adapter over `SearchableSelect` so ~60
  existing call sites upgraded without rewrites. `searchThreshold` defaults
  to 5 (data-driven: any list past 5 options gets a search box
  automatically). **Name fields are the one exception — always searchable
  regardless of length** (`PersonSelect`, `searchThreshold={0}`), since
  typing beats scanning once you know who you want.
- **No dots on tags.** `Badge` has no `dot` prop at all (removed structurally
  so it can't creep back) — every badge already states its meaning in
  words.
- **Progress meters, one style everywhere** (`ProgressMeter`/`BudgetInline`/
  `HealthSummary`): track always `neutral-300`; fill 0-100% capped, colour
  only (green/amber/red); no rescaling, no over-budget notch. **Figures
  stay black** (`text-text-primary`) — colour's only job is the bar; a
  negative Remaining value is the one kept exception (stays danger-red,
  paired with its minus sign as the non-colour cue). Always **"used"**,
  never **"done"** — it's hours spent against budget, not work completion,
  and "130% done" is nonsense.
- **Table columns are left-aligned, headings and values, figures included**
  (including hours). Right-alignment was tried and reverted — decimal
  alignment doesn't pay for itself on one-decimal hours, and it separates
  the figure from its heading.
- **Card headers are white**, never `neutral-50` (same as the page
  background — a collapsed card had no visible edge).
- **Every popup positions itself inside the viewport** — `usePanelPosition`
  (select panels) / `useDropdown` (menus): opens upward when there's no
  room below, caps `maxHeight`, clamps horizontally. Never let a screen
  position a panel itself.
- **`DrawerFormStandard`** (Storybook) is the canonical reference for every
  new drawer — read it before building one (CLAUDE.md rule 9).
- **Global records are created in the workspace, linked in a project** — see
  Entity model above. `ProjectApprovalsTab`, `ProjectDocumentsTab`,
  `ProjectTccaTab` are the reference shape; copy one for a new record type.
- **Date format:** `Aug 20, 2026` is the only format a user reads
  (`lib/formatDate.ts`); ISO stays for storage/sorting/`<input type="date">`
  only. `DateText` in a table cell may stack the year under the day/month
  only when the column is genuinely tight — never force it either way.

---

## Known technical gotchas

- **Tailwind v4's `divide-x` utility silently does nothing.** `divide-x
  divide-border-default` compiles to zero CSS rule — Tailwind v4 emits the
  `@property --tw-divide-x-reverse` custom property but never the actual
  border utility, so every "divided" child renders `border-left-width: 0`
  and the dividers are simply invisible. Fix: explicit `border-l
  border-border-default … first:border-l-0`. Found and fixed on the Person
  Detail stat strip (2026-08-21), then again on `ProjectWorkPackagesTab` and
  `ProjectTeamTab` when `Stat` was unified (2026-08-22) — **check for any
  remaining `divide-x` before reusing it anywhere.**
- **`element.click()` in tests only fires the `click` event.** Dropdown/menu
  outside-click dismissal listens on `mousedown`, so a `.click()`-based test
  can pass against a UI that's broken for every real user (this exact thing
  shipped and passed verification before being caught). Always drive
  menus/dropdowns with a full `mousedown → mouseup → click` sequence.
- **Nested portalled dropdowns close their parent menu on click** unless
  marked. Every portalled select panel must carry `data-dropdown-panel`;
  `useDropdown`'s outside-click handler ignores anything inside one. Forgot
  this once and it broke every filter menu with a `Select` inside it.
- **Z-index must be ordered by "what can spawn what," not by visual
  importance.** Dropdowns are portaled to `document.body` and usually opened
  *from inside* a Drawer, so `--z-dropdown` must exceed `--z-modal` or the
  panel paints invisibly behind the drawer with no error. Current order:
  sticky 1000 < modal 1100 < dropdown 1200 < dialog 1300 < toast 1400 <
  tooltip 1500.
- **A panel pinned to `trigger.bottom` and never capped can render off-screen
  with no way to scroll it back** (it's `position: fixed`, re-anchors on
  scroll). Always cap `maxHeight` to available space and flip upward when
  there's no room below — this is what `usePanelPosition`/`useDropdown` do
  centrally; don't hand-roll positioning per screen.
- **`sr-only` escapes its scroll container** if no ancestor is `position:
  relative` — `position: absolute` falls back to the initial containing
  block (the document), so an off-screen label deep in a clipped rail can
  add thousands of pixels to document scroll height while looking
  invisible. Every scroll container needs `relative`.
- **Tailwind's `theme.extend.spacing` bleeds into `maxWidth`/`minWidth`
  resolution** when key names collide (our `sm`/`lg`/`xl`/etc. spacing
  tokens vs. Tailwind's own `maxWidth` scale) — `max-w-sm` can silently
  resolve to an 8px spacing token instead of Tailwind's 24rem default. Never
  use `max-w-{token}`/`min-w-{token}`/`max-h-{token}`/`min-h-{token}` with
  the named spacing scale; use the numeric width scale or an explicit
  arbitrary value instead.
- **`table-fixed` `<col>` widths silently ignore `calc()`.** A `<col>`
  honours plain `px` and plain `%` but falls back to an even split if given
  `calc(40% - 264px)`, with no warning. Measure real pixel floors via
  `useElementWidth`/`ResizeObserver` and write real numbers, not calc
  expressions.
- **A disabled `<Input>` and an empty one render in the same grey** (opacity
  applied to the whole field) — this was shipped three separate times
  (Aircraft, Activity/Task drawers) before "View is never a form, always
  `DetailCard`/`DetailField`" became the enforced standard.
- **`String(jsxChildrenArray)` comma-joins instead of concatenating.** A
  `<Select>` adapter reading `<option>` labels via `String(props.children)`
  turned `{n}-{sub} {title}` into `"3200,-,00, ,STC — Cabin…"` — use a
  `textOf()` walker that flattens children the way a native `<option>`
  renders them.
- **JSX attribute strings don't process backslash/HTML escapes** the way JS
  string literals do — a `&rsquo;` copied from a JS string into a JSX
  attribute renders literally on screen.
- **A column is usually sized by its heading, not its data** — this bit the
  project multiple times (Validated → Valid., Required, Task Required,
  Approval Holder → Holder, etc.). When measuring a table for overflow,
  check every `th.scrollWidth` against its rendered width, not just the
  table total, and remember `Column.shortLabel`/threshold patterns exist
  for this.
- **`Button`'s tertiary variant hardcodes `text-text-primary`**; appending
  `text-accent` via `className` doesn't reliably win on specificity — use
  `!text-accent` (important modifier) to actually override it.

---

## Major UX/architecture decisions and why

**Six-screens-become-two-or-three is a recurring pattern, always for the
same reason.** The legacy app exposes its database schema as navigation —
one page per table. This repo repeatedly found that 2-6 sibling pages were
really one workspace at different zoom levels, and consolidated:
- **RBAC** (Users, Routes, Permissions, Rules, Roles, Assignments — 6) → 3
  pages grouped by job/frequency: Users (daily), Roles & Permissions
  (occasional), System (rare/developer). Includes recursive, cycle-safe role
  inheritance.
- **Lookup Tables** (Companies, Contacts, Aircraft, Serial Numbers, ATA
  Chapter, ATA Sub Chapter — 6 flat grids) → 3 parent+child workspaces
  (Companies & Contacts, Aircraft & Serial Numbers as tabs, ATA Chapters as
  an accordion/master-detail).
- **Reports** (3 category pages) → 1 page, 3 labelled sections, one search +
  category filter; run-with-parameters moved into a drawer instead of
  columns on the list.
- **Projects Review** (7 legacy tabs, each a hardcoded WHERE clause over the
  same table) → 1 filterable list with 8 preset chips (reduced to their real
  WHERE-clause axes: status × type, with Priorities as a re-sorted view, not
  a third axis) plus a filter menu that composes with the chip — something
  the legacy screen's siblings-with-no-cross-links structure couldn't do at
  all.
- **Approvals/Approval Revisions** and **Deliverables/Design Data** each
  collapsed from 2 sidebar entries to 1, with tabs inside — same underlying
  workspace, just navigation that had lagged the data model.

**Master-detail over wide tables, wherever a row's detail is itself a
table.** Work Packages (cross-project), Person Detail (Hours by Person's
per-person drill-down), and ATA Chapters all converged on the same rail +
detail-pane shape once a "table inside a table row" proved unreadable. It's
the same pattern for a reason — someone who's learned one has learned the
others.

**Health/budget math is computed once, centrally** (`lib/projectHealth.ts`),
identically at activity/work-package/project level, so a percentage can't
mean two different things on two screens. `no-budget` is a first-class
state (not "0%"), and health rolls up from activities, not from a project
row's own stale fields (the row fields are a fallback only). Over-100% is
never clamped or hidden — it's the single most important fact on an
over-budget row, so the label became "Budget used" (not "Progress", which
implies completion) rather than the number being suppressed.

**Table-width firefighting was constant and is a genuine methodology, not
noise.** Nearly every list table went through repeated "measure the real
rendered floor of each column, don't guess" passes (`table-fixed` +
percentage or pixel `<col>` widths derived from actual content, `fixed` vs.
`flex` column kinds, gutter tuning 32px↔24px↔16px depending on what's
actually true at 1280px). The lesson recorded most often: **verify by
measuring `scrollWidth`/rendered pixels in the browser, not by reading the
code or eyeballing a screenshot** — several "obvious" fixes were wrong until
measured.

**Global vs. project-scoped, and the create/link split**, is the single
biggest architectural decision in the project (see Entity model above) — it
came from a specific transcript exchange (the "Toyota analogy": a brake pad
needs the model, an oil change needs the specific car and its owner) and
from re-reading the legacy schema and requirement doc directly rather than
inferring from screenshots. It's the shape every new global record type
(Aircraft, Approvals, Documents, TCCA) was built to match.

**Per-section edit drawers over one big edit page.** Only Proposal, Notes,
and Aircraft on Project Detail carry an edit affordance; each opens its own
narrow drawer touching only its own fields. Dates/Scope stay on the shared
creation wizard since those fields are genuinely part of project creation.
This replaced an earlier approach of reopening the shared multi-step drawer
at one step, which exposed unrelated fields.

---

## Trade-offs made under tension / things flagged as reversible

These are judgment calls under conflicting or evolving instructions, not
settled law — check DECISIONS.md's dated entry before assuming either side
is final.

- **Radius:** the client set 4px-max, then reversed to 8px standard, same
  day (2026-08-07). Now further split: 8px standard, 4px for tags (2026-08-22,
  superseding an earlier "tags are 8px" DESIGN.md line).
- **Column gutters, Projects List:** 24px → 32px (client asked ~50px,
  32px was the affordable ceiling, 2026-08-21) → **back to 24px**
  (2026-08-22, because 32px + 9 data-dense columns couldn't fit 1280px
  without horizontal scroll, and "no scrolling" was the more recently
  repeated requirement). Explicitly flagged as choosing the newer
  requirement over the older one, not silently overriding it.
- **PhoneInput width:** capped at 220px ("keep it narrow") → reversed to
  full width (breaks the shared right edge with other fields) — both were
  explicit user instructions, the second walking back the first.
- **Contacts layout:** compact horizontal row (matches the legacy table it
  replaced) → collapsible stacked-FormField entries (matches
  `AircraftEditDrawer`'s shared pattern) — consistency with one shared
  pattern won over each screen echoing its own legacy table shape.
- **Budget column alignment, Projects List:** left → right-aligned
  (2026-08-21, to close the trailing-space gap before Status) → **reverted
  to left** (2026-08-21, later same window, for consistency with every
  other column on the table). Check the column's current state in the code
  before assuming either decision stands.
- **Aircraft/Serial Numbers:** merged into one grid → split into two tabs
  → the split is now considered settled (three independent sources agree:
  zero schema field overlap, the requirement doc lists them as two
  features, and the client explicitly invoked the Toyota analogy twice) —
  but it's worth knowing this one was tried the "efficient" way first and
  corrected.
- **`neutral-100` (#F1F5F9) used in place of a client-specified `#F0F5F9`**
  — a 1-value difference in one channel, treated as colour-picker noise
  rather than a real distinct token. Flagged, not silently substituted; open
  to reverting to the literal hex if that reasoning turns out wrong.
- **Person Detail's `3px` inset margin** is a literal (non-token) value,
  a deliberate one-off exception to "semantic tokens only," kept narrowly
  scoped to matching one reference screenshot pixel-for-pixel.

---

## Open questions / unresolved items

Explicitly flagged in the log as unresolved with the client, or as known
gaps:

- **Budgeting level** — activity vs. work-package — still unresolved; the
  current per-activity-with-roll-up shape works for either eventual answer.
- **Document number uniqueness** — globally unique or per-project? Current
  data/behavior assumes per-project; old UI copy assumed global.
- **TCCA Project ↔ Approval link** — dropped (`tccaProjectId`) because there's
  no real FK in the legacy schema (`tccaproject` references by
  certificate + issue number instead); open item if the client wants it
  wired up from the TCCA side.
- **Approval-side project linking / Approval Issues as a child collection**
  — explicitly deferred during the Aircraft/Approvals/Documents global-
  workspace pass, kept small on purpose to stay reviewable.
- **Capacity/availability** — not in the data model at all. Hours by Person
  and Team tabs answer "how is this person tracking against budget," never
  "is this person overloaded." §1.8 Project Analysis (cross-project version
  of the Team tab) is unbuilt.
- **Banked hours (§5.2 "Banked Hours (profile)")** — exists per timesheet
  entry, no per-person accrued balance.
- **Hours Worked query/report (§2.2)** — unbuilt.
- **GCP module** — deferred placeholder throughout (TCCA Reports tab, sidebar).
- **PDF/Excel export** — HTML/CSV/Text are live in `ExportMenu`; PDF/Excel
  pending a library choice.
- **Design Approval Holder as free text vs. searchable select** — changed to
  a picked value (must exist as a Company first); flagged as a possible
  regression if the client wants free-text-with-suggestions back.
- **Approval Dashboard** (§1.5, "approval-centric status view") — a third
  tab slot exists for it; nothing built because nothing's been specified.
- **Activity-Task link's own `active` flag** — the store supports
  `setLinkActive` but no UI exposes toggling a single pairing; only
  deactivating a whole Activity or Task exists today.
- **Work Packages nav item** — hidden from the sidebar at the client's
  request ("for now"), but the route/page/links are all still live and
  reachable directly; re-adding it to `NAV` is a one-line change if wanted.
- **Residual horizontal scroll inside table containers** (not page-level) on
  a few dense tables below ~1400px — Timesheet, Hours Worked, Projects
  Review — documented in-code as accepted, not silently eaten; each is a
  candidate for the "two more column merges" fix noted in the log if it
  becomes a priority.

---

## Where to look for more detail

- **`docs/DECISIONS.md`** — the full, dated, reasoned chronological log.
  This handoff is a distillation of it; when a rule here seems surprising or
  you need the original context/screenshot/transcript reference, search
  DECISIONS.md by keyword or date.
- **`docs/DESIGN.md`** — design tokens (color ramps, semantic tokens, type
  scale, spacing, radius, shadows, motion, breakpoints, z-index), the `Stat`
  pair spec, and component specs. Read in full before any UI work
  (CLAUDE.md rule 1).
- **`docs/COMPONENTS.md`** — full component inventory, one line per
  component/variant/location/purpose, plus several standing cross-cutting
  rules (stats-follow-filters, search-threshold, status-tags-no-dot,
  progress-meter styling, table-columns-left-aligned, popup positioning,
  z-index layering, control heights) written up in more depth than this
  handoff carries.
- **`docs/SECURITY.md`** — short frontend security baseline: no secrets in
  client code, no `dangerouslySetInnerHTML`/`eval`, client-side route guards
  are UI convenience only (flag real gating as needing server enforcement),
  no real-looking fake user data (obviously-fake placeholders only, e.g.
  `@elisen.example` domain for the real usernames kept in Access fixtures).
- **`CLAUDE.md`** — the working rules file for anyone (human or agent)
  making changes: read DESIGN.md first, never write raw styled elements,
  check COMPONENTS.md before building, semantic tokens only, every screen
  ships loading/empty/error states, accessibility is non-negotiable, the
  `DrawerFormStandard`, log decisions, flag conflicts rather than silently
  picking a side, import-direction rule, ~200-line file guideline.
