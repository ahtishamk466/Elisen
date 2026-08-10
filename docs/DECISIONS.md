# Decisions Log

Significant technical and design decisions, dated and reasoned.

Entries follow this format:
```
## [Date] — [Decision Title]
**Context:** ...
**Choice:** ...
**Rationale:** ...
```

## 2026-08-07 — Radius reverted from 4px-max to 8px standard
**Context:** Earlier the same day, the user set an explicit rule: 4px maximum
corner radius everywhere, based on a button reference screenshot, and I
removed the `radius-md`/`radius-lg` tokens entirely to enforce it. Later the
same day, the user asked for buttons/cards/tables to use 8px "so it looks
smooth" — a direct reversal of that rule.
**Choice:** Bumped the single `--radius-sm` token from 4px to 8px (same
mechanism as before — one token, no per-component overrides), so every
rectangular surface moved together and stayed consistent. Did not silently
apply this; flagged the contradiction with the earlier rule before making
the change.
**Rationale:** The user is the design authority and can revise their own
prior instruction — CLAUDE.md rule 11 requires flagging the conflict, not
picking a side, so I surfaced it and proceeded on their explicit new
instruction rather than treating the old rule as immutable.

## 2026-08-07 — Primary CTA/sidebar tone moved from 900 to 700
**Context:** User felt the primary navy (buttons, sidebar, active pagination)
was too dark, and pointed at Primary-700 (`#00387A`) from the token ramp in
Storybook as the reference.
**Choice:** Replaced base `primary-900` usage with `primary-700` in the real
app components only — `Button` (primary variant), `Checkbox` (checked
state), `Pagination` (active page), `AppShell` (sidebar background).
Button's hover/active states shifted down one step each (700→800→900) to
preserve the darken-on-interaction progression. AppShell's active/hover nav
item moved from 800 to 600, since a highlight needs to read lighter than
its dark sidebar background — 800 would have been darker than the new 700
background and reversed that relationship.
**Rationale:** The `/styles/*.stories.tsx` foundation specimens (Buttons,
FormControls) were deliberately left untouched — those document the
client's originally-approved style guide reference, not derived output, so
they shouldn't drift just because a real-component color choice changed.

## 2026-08-07 — Deliverables, Design Data and Approvals tabs; unified document store
**Context:** Last three Project Detail tabs, from the transcripts plus the
user's Opt-2 reference tables.
**Choice:** (1) Strict two-level model — Document (number/title/type/owner
only) forces its first Revision; revisions carry all dates, a *person* as
next action (feeds their to-do list — the reference's date field was a
mistake), status (WIP → In Review → Signature Cycle → Accepted /
Superseded) and URL. (2) One generic ProjectDocumentsTab serves both
Deliverables and Design Data; drawings add aircraft + ATA columns and are
excluded from anything TCCA. (3) "Link existing" reuses any pool revision
on another project (searchable by aircraft for drawings), with a reuse
marker when a revision came from a different project. (4) Deliverable
revisions can optionally name a TCCA project at creation, which
auto-creates the TCCA tracking link — the transcript's only mechanism for
docs entering a TCCA project. (5) The old tccaStore revision pool was
replaced by a single documentsStore shared by the Deliverables tab and
the TCCA Documents tab, so both surfaces show the same records.
(6) Approvals = registry of issued certificates (number, authority
TCCA/FAA/EASA, type, aircraft, issue date, producing TCCA project);
projects tie to their own approvals or to earlier ones they modify.
**Rationale:** Every rule is transcript-traceable: forced first revision,
revision-level tracking "by law", drawings never crossing to TCCA,
revision reuse across projects, and change-projects referencing original
certificates.

## 2026-08-07 — Work Packages tab built per the transcript hierarchy
**Context:** User asked for the Work Packages flow on Project Detail,
grounded in the meeting transcripts.
**Choice:** Project → Work Package → Activity (→ Task) as expandable
cards: free-text package titles with NO templates or defaults (packages
differ per aircraft — client-explicit); activities picked from the
standard catalog (who does the work), each with a responsible person and
budget hours; actual hours read-only (they belong to Time Entry — "time
tracking is kept completely separate"); tasks shown as read-only chips
from the standard activity–task associations. Budget entered per activity
with a per-package roll-up — the activity-vs-package budgeting level is
still unresolved with the client, and this shape works for either answer.
Deleting a package or activity with logged hours is blocked with an
explanation, since it would orphan time records (the "what happens to the
old information" concern from the transcript).
**Rationale:** Every structural choice traces to a transcript statement;
the demo data reproduces the client's own worked example (Certification
Plan: Airworthiness drafts at 12h, Delegate checks at 3h).

## 2026-08-07 — TCCA flow: corrected structure from user's Opt-2 reference
**Context:** User asked for a transcript-grounded review of their TCCA flow
(Opt-2 screens) before building it.
**Choice:** (1) Two-level structure — the project's TCCA tab and the
standalone `/tcca-projects` list both lead to a per-TCCA-project detail
with its own tabs; sub-modules no longer sit beside the list. (2) "Doc
Status" and "Deliverable Revision" merged into one Documents tab: one
linked-revision list carrying the government-interaction fields
(involvement, sent date, accepted/comments). (3) One standard checklist
per TCCA project — applicability at creation, completion dates on the
Checklist tab (unticked = N/A, ticked = in progress, dated = complete).
(4) Added the missing linked-Elisen-projects panel with two-way
navigation and multi-link support. (5) Project Completion Checklist
report generates a real downloadable record; other report cards disabled
pending Jalal's definitions. (6) GCP stays a deferred placeholder.
(7) Only deliverable revisions cross into TCCA — drawings never do.
**Rationale:** Each correction traces to explicit transcript statements
(one certificate per TCCA project; single tracked doc list; checklist
tick-then-date logic; informational cross-links; drawings tracked on the
Elisen side only; GCP and reports unresolved with the client).

## 2026-08-07 — radius-xs (4px) added for compact controls
**Context:** After radius-sm moved to 8px, the 16px checkbox rendered as a
circle — indistinguishable from a radio button.
**Choice:** New `--radius-xs: 4px` used only by compact controls; the 8px
standard stays for cards, tables, inputs, buttons and dialogs.
**Rationale:** The 8px decision targeted CTAs/cards/tables; a corner
radius at half the control's height destroys the square affordance that
tells users "this is a checkbox."

## 2026-08-07 — Fixed: typing in Drawer/ConfirmDialog form fields lost focus every keystroke
**Context:** User reported the Add Project drawer wouldn't let them type
continuously — only the first character of a field registered. Reproduced:
the field's value updated correctly in state, but focus jumped away to the
dialog panel after every single keystroke.
**Root cause:** `Drawer` and `ConfirmDialog` each had a
`useEffect(() => { ...; panelRef.current?.focus() ... }, [open, onClose])`.
Callers (`AddProjectDrawer`) pass an inline arrow function as `onClose`
(`requestClose`), which is a new function identity on every render. Every
keystroke → state update → re-render → new `onClose` reference → effect's
dependency array changed → effect re-ran → `.focus()` called again →
focus ripped away from the input back to the dialog panel, one character
after another.
**Choice:** Split into two effects. The one that calls `.focus()` now
depends only on `[open]`, so it fires once per open/close transition, not
per render. The keydown listener (Escape/Tab-trap) still needs the latest
callback but no longer needs to be in the dependency array — it reads the
callback through a ref (`onCloseRef.current`) that's updated every render
without retriggering the effect.
**Rationale:** This is a correctness bug, not a style choice — any overlay
component that both (a) focuses itself on open and (b) accepts a callback
prop is vulnerable to this exact pattern if the caller doesn't memoize the
callback. Fixing it in the two shared patterns (Drawer, ConfirmDialog)
protects every current and future screen that uses them, rather than
asking every caller to remember to wrap their close handler in
`useCallback`.

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

## 2026-08-07 — Storybook is reference-only; real screens live in the app
**Context:** The Add Project flow was built and shown to the user entirely
as Storybook stories (`ProjectsListPage.stories.tsx`,
`AddProjectDrawer.stories.tsx`). The user corrected this: Storybook is their
design-system reference for us to consult (colors, type, spacing, which
component to reuse) — not where product screens live or get reviewed.
**Choice:** Deleted the two feature story files. Wired real routing
(`react-router-dom`) in `src/app/App.tsx` so `/projects` renders
`ProjectsListPage` as an actual page at a URL. Moved `index.html` from
`public/` to the project root, where Vite requires it (it was silently
being served unprocessed from `public/` before — a second bug this
surfaced). Dev server runs on port 5180 (5173 collides with the unrelated
`/frontend` TPMS project also in this workspace).
**Rationale:** `/components/ui` and `/components/patterns` keep their
stories — those genuinely are the design-system inventory Storybook exists
for (CLAUDE.md rule 8b). `/components/features/*` compose those into actual
product screens and must be reviewed as running application pages, not
as isolated stories.
**New dependency:** `react-router-dom@7` — the standard client-side router
for a React SPA with multiple named screens; needed as soon as there is
more than one real page to navigate between.

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

## 2026-08-10 — Timesheet & Hours Worked: merged Timesheet Entry into a drawer, kept Hours Worked separate
**Context:** User's own app had three menu items — Hours Worked, Timesheet,
Timesheet Entry — and asked for a senior UX review of whether to merge them.
Screenshots showed Timesheet Entry was already just the create/edit form
behind Timesheet's own "+Add" button (a personal list), while Hours Worked
was a structurally different admin, cross-employee, bulk-oriented table
(23k+ rows, checkboxes) reusing the same columns.
**Choice:** Built two screens, not three: `TimesheetListPage` (`/timesheet`,
scoped to the signed-in employee) and `HoursWorkedPage` (`/hours-worked`,
admin, all employees) — both render the shared `TimesheetTable` and open the
same `TimesheetEntryDrawer` for Add/Edit instead of a separate full-page
"Timesheet Entry" screen. Also resolved two edge cases flagged during the
review rather than leaving them open: (1) once an entry is `validated`, the
employee's own Timesheet table drops Edit/Delete down to View + Duplicate
only — self-validated entries shouldn't be self-editable; (2) Hours Worked
alone gets `canValidate`, exposing Mark/Unmark validated and retaining full
Edit/Delete even on validated rows, since the admin is the approval
authority and needs to be able to correct mistakes after the fact.
**Rationale:** Matches the "Option A" recommendation from the UX review —
removes the genuinely redundant navigation (list + its own full-page create
form) without forcing the admin's bulk/dense-table workflow into a
single-entry drawer pattern, which would have been the main risk of a full
3-way merge.

## 2026-08-10 — Drawer conventions: named records, grouped actions, no nested boxes
**Context:** Reviewing the Aircraft edit drawer, the user raised three issues
that applied well beyond that one screen.
**Choice — applied to every add/edit drawer in the app:**
1. **Every drawer names the record it acts on.** Titles now read
   `Add Aircraft “3200-00 — STC — Cabin Interior Modification”`. Added
   `projectLabel()` / `useProjectLabel()`
   (`features/projects/useProjectLabel.ts`) so project-scoped drawers resolve
   the label from `projectId` themselves rather than threading a prop through
   every tab. TCCA drawers name their TCCA project; the timesheet drawer names
   project · employee · date.
2. **Footer actions are grouped.** `Drawer`'s footer moved from
   `justify-between` to `justify-end`, so the secondary (Cancel) always sits
   immediately beside the primary (Save Changes) instead of being pushed to
   the opposite edge. Removed the `<span />` spacers every caller used to
   force that old layout. `AddProjectDrawer`'s wizard Back button now joins the
   same right-hand group.
3. **No box-in-a-box.** Repeated entries inside a `FormSection` are separated
   by a `border-t` rule, not their own bordered card — the FormSection is
   already the container. Applied to the Aircraft drawer's entry list.
**Rationale:** (1) is a straightforward orientation win — the user should never
have to guess which record a drawer is mutating. (2) and (3) were fixed in the
shared `Drawer` / section markup rather than per-screen, so future drawers
inherit the correct behaviour instead of repeating the old pattern.

## 2026-08-10 — Per-section edit drawers for Proposal / Notes / Aircraft; aircraft becomes a list
**Context:** User specified that only Proposal, Notes and Aircraft carry an
edit affordance, each opening its own state — and supplied reference screens
showing a scoped drawer per section with Back / Save Changes, plus an Aircraft
drawer supporting multiple aircraft ("Add Another Aircraft", delete per entry).
**Choice:** (1) Replaced the earlier approach where every section's pencil
reopened the shared `AddProjectDrawer` at a step (which exposed unrelated
fields) with three dedicated drawers: `ProposalEditDrawer`, `NotesEditDrawer`,
`AircraftEditDrawer`. Each holds only its own fields, prefilled, and saves a
narrow `Partial<ProjectListRow>` patch. (2) These three cards use a dots (⋮)
trigger via a new `variant="menu"` on the local `Card` helper; Dates and Scope
keep the pencil and still use the shared wizard, since their fields are
genuinely part of project creation. (3) **Data model change:** the three flat
`aircraftModelName/Number/Manufacturer` fields became
`aircraft: AircraftEntry[]` on `ProjectListRow`, and the Aircraft section was
removed from the create/edit wizard's step 2 — aircraft is now managed only
from its own drawer.
**Rationale:** A project can apply to more than one aircraft type, which the
flat fields could not express; the reference screens made that requirement
explicit. Keeping Dates/Scope on the shared wizard avoids duplicating the
validated creation form for fields that already live there.

## 2026-08-10 — Project Detail header shows a back link, not a repeated title
**Context:** The page title (`3200-00`) appeared both in the AppShell header
and again in the detail card immediately below it.
**Choice:** Added an optional `headerLeft` slot to `AppShell`; Project Detail
passes "← Go back to all projects" instead of the default `<h1>{title}</h1>`,
and the in-page back button was removed. `title` is still required and still
the default, so every other screen is unchanged.
**Rationale:** The card is the authoritative place for the project identity;
repeating it wasted the header row, which is better spent on navigation.

## 2026-08-10 — Project Detail sidebar rebuilt to match the reference card exactly
**Context:** User flagged the top-left sidebar card as not matching the
provided design screenshot: it should be one unified card (number + actions
menu + title + company/type + priority/status pills + hours + due date +
contract value + people-with-avatars), not a separate full-width header bar
above a plainer sidebar.
**Choice:** Removed the standalone header bar; merged the project number and
`ActionsMenu` back into the top of the sidebar card itself (number stays on
its own short row, so a long title still can't push the menu around — same
goal as the original "move the menu" request, different layout). Priority is
now a `Badge` pill in this card specifically (`PRIORITY_TONE` added to
`lib/projectDisplay.ts`) — the list table's Priority column stays plain text
per the earlier, separate decision; these are different screens. Due date now
renders human-readable ("Jul 4, 2026" via a local `formatDate`) in this card
only. Contact and Person responsible each get a small initials `Avatar`
(local helper, `accent`/`success` subtle tokens — no new primitives).
**Rationale:** The screenshot is the authoritative reference for this specific
card; matching it took priority over the earlier header-bar approach, which
solved the same "long title" concern differently. Scope stayed limited to the
sidebar card, as asked — other date fields on the page (e.g. the Overview
tab's Dates card) were left in ISO format.

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
