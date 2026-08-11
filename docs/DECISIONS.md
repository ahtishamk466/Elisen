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

## 2026-08-10 — Lookup Tables: 6 flat grids consolidated into 3 parent+child pages
**Context:** The old Maintenance → Lookup Tables holds six flat grids —
Companies (214), Contacts (256), Aircraft (128), Serial Numbers (49), ATA
Chapter (116), ATA Sub Chapter (615). They're really three parent→child pairs
split across disconnected pages, the same tables-not-tasks IA the RBAC module
had. User asked for a simpler UX and specified that ATA Chapter → Sub Chapter
should work like Work Package → Activity.
**Choice:** Three pages under the Admin nav item (which previously had no
children): (1) **Companies & Contacts** — contacts managed inside the company
drawer as divider-separated rows; page search also matches contact names and
shows a "contact: X" chip, preserving the one thing the flat Contacts page was
good at. (2) **Aircraft & Serials** — serials managed inside the model drawer;
search matches serial/registration. (3) **ATA Chapters** — the WP→Activity
treatment: each chapter is a collapsed `AccordionSection` card
(`05 — TIME LIMITS… · 4 sections`) whose sections live inside with per-row
edit/delete and an "Add Section" action; search spans chapter + section text
and auto-expands matching cards; ordering follows the Sort field.
**Cross-cutting:** Deactivate is the primary lifecycle (inactive records are
hidden from pickers but keep history); Delete stays but is guarded with the
child count and nudges toward Deactivate — same shape as role deletion.
**Integration:** `StepBasicInfo` Company/Contact selects now read the lookup
store instead of the hardcoded `COMPANIES`/`CONTACTS` arrays (now removed from
`projectFixtures.ts`): only active companies list, and Contact is disabled
until a company is chosen, then scoped to that company's active contacts.
**Contacts use one Full Name field** (user request): `CompanyContact.fullName`
replaces first/last. It matches how the rest of the app already consumes a
contact (`ProjectListRow.contactName` is a single string) and keeps the
picker option, the search hint and the drawer input identical. Trade-off
accepted: no sorting or "Lastname, First" formatting by surname — add a
separate field later if the client needs it.
**Child lists render as compact rows with column headers** (Full Name ·
Telephone · Active for contacts; Serial · Registration · Comment · Active for
serials) rather than stacked FormFields — they read as the tables they
replace and stay short when a parent has several children. Inputs carry
`aria-label`s since the visible headers aren't per-row labels.
**Provenance:** Company/aircraft/chapter records are verbatim from the
screenshots (business reference data, not personal data), plus the
companies/contacts/aircraft the project fixtures already referenced so pickers
stay consistent. Representative subset, not the full 214/615.
**Follow-up (not this pass):** wiring aircraft and ATA pickers into project
Aircraft and drawing classification — currently free text.

## 2026-08-10 — Header toolbar controls standardised on Button size="lg"
**Context:** In the header toolbar the search field and CTA rendered at
different heights — `Input`/`Select` are `h-11` (44px) but `Button` defaults to
`size="md"` (`h-9`, 36px), so the pair looked misaligned.
**Choice:** Every control in a page's `headerActions` uses `size="lg"` (44px),
matching the field height exactly — including the triggers inside `ExportMenu`
and `TimesheetFilterMenu`. Applied on Projects, TCCA Projects, Timesheet,
Hours Worked, Roles & Permissions and Reports.
**Rationale:** The `lg` size already exists for exactly this case, so no new
token, arbitrary height or wrapper CSS was needed. Buttons *inside* page
content (empty-state actions, drawer footers) keep the `md` default — only the
field-adjacent toolbar row is standardised.

## 2026-08-10 — TCCA Project Detail header cleanup
**Context:** Three corrections on the TCCA detail screen: the page title
repeated the number already shown in the card below it; every Overview section
carried its own pencil; and the actions menu sat tight against the number,
where a long description could crowd it.
**Choice:** (1) The AppShell header now uses `headerLeft` for just the back
link ("Back to TCCA Projects"), matching Project Detail — the number lives in
the card only. (2) Removed the per-section pencils from Details and Notes;
`TccaOverviewTab` is read-only and no longer takes `onEdit`. Editing is the
header actions menu, one obvious place. (3) Status badge and actions menu moved
to a `shrink-0` group pinned to the card's right edge, so neither a long number
nor a long description can shift them.
**Rationale:** Same reasoning as the Project Detail pass — one edit entry point
per record beats a pencil on every card, and pinning the trigger right keeps it
in a fixed position regardless of content length.

## 2026-08-10 — Global shell & list conventions: sidebar profile, header toolbar, row-click
**Context:** Three cross-cutting requests — move the Admin User profile out of
the header into the sidebar with working Profile/Logout; put each list page's
heading, search and CTA on one line; make table rows open the View screen
rather than hiding View in the 3-dot menu.
**Choice:**
1. **Profile moved to the sidebar foot.** New `patterns/SidebarProfile.tsx`
   with a portaled menu (Profile · Logout). Profile opens a read-only drawer
   showing the signed-in user's account, roles and effective access — pulled
   live from the access store, so the header identity and User Access Control
   agree. Logout confirms, then a new `stores/sessionStore.ts` flips
   `signedIn`, and `app/SignedOutScreen.tsx` replaces the app until "Sign back
   in". There is no auth backend — flagged per SECURITY.md rule 8 that real
   session termination must be server-enforced.
2. **`AppShell.headerActions`** renders page controls on the heading line,
   right-aligned. Every list page moved its search / filter / CTA there:
   Projects, TCCA Projects, Timesheet, Hours Worked, Users, Roles &
   Permissions, Reports. Roles & Permissions lifted its per-tab search and
   "Add" state up to the page so the header can host them per active tab.
3. **Whole-row click opens View** on every table, with a `hover:bg-accent-subtle`
   affordance and `cursor-pointer`. The Actions cell calls `stopPropagation`
   so the 3-dot menu never double-fires. Each table keeps a real `<button>` or
   `<Link>` in its first cell as the keyboard path — a clickable `<tr>` alone
   is not reachable by keyboard or screen reader. "View" stays in the menu too
   for discoverability.
**Conflicts flagged (CLAUDE.md rule 11):**
- The request specified **10px** spacing between the search field and CTA. The
  spacing scale has no 10px step (`sm` 8px → `base` 12px), and rule 4 forbids
  arbitrary values, so `gap-sm` (8px) was used — the same gap already pairing
  buttons in drawer footers.
- `SidebarProfile` imports the session and access stores from `patterns/`,
  which no other pattern does. Accepted deliberately: AppShell already
  hardcodes this app's nav, routes and logo, so the shell is app chrome rather
  than a reusable primitive. Scoped to the shell only.
**Bug fixed along the way:** `useDropdown` always positioned menus below the
trigger, so the bottom-anchored profile menu opened off-screen. It now measures
the rendered menu and flips above the trigger when it would overflow.

## 2026-08-10 — Access fixtures: real screenshot data, with provenance recorded
**Context:** The first Access build was mostly authored data — only the 9 role
names were verbatim from the client's screens. When the user asked where the
values came from, that was disclosed, and they directed: *"Don't keep dummy
data. Use whatever data you can get from the screenshots. If something is
missing, add relevant values based on the context, but keep the fields and
actions aligned with the actual UI."*
**Verbatim from the client's six User Access Control screens:**
- 9 role names + descriptions (Roles grid).
- 16 permission names/descriptions (Permissions grid), including the
  non-kebab `Admin - RBAC` — kept exactly as spelled.
- Route strings from both panes of the Routes shuttle: `/activity/*`,
  `/activity-task/index_detail`, `/atachapter/view_modal`, `/actions/*`,
  `/activities/*`, `/activity-tasks/*`, `/*`.
- ~20 usernames, the union of the Users and Assignments grids (the latter
  contributes Sysadmin, tony.francis, clement.neveux, paul.thomas).
- **Rules: none.** The Rules grid returned no results and every Rule Name
  cell on both Roles and Permissions was blank, so `ACCESS_RULES = []` and
  the previously-invented `isOwner` rule was deleted.
**Contextual fill (documented in `lib/accessFixtures.ts`):** role→permission
grants, user→role assignments, permission→route mapping and the inheritance
chain. None of these are visible in the screenshots — each lives behind a
grid's eye icon that wasn't captured. Derived from the role-name ladder
(Employee → Supervisor → Manager; Client-Employee → Client-Manager) and the
meeting transcripts, now anchored to the real permission names. Two inactive
users are also fill: the client's Users grid was filtered to Status = Active,
so inactive accounts exist off-screen.
**SECURITY.md rule 9 conflict (flagged per CLAUDE.md rule 11, resolution
approved):** rule 9 forbids real-looking user data in the repo, but fidelity
wanted the real employee list. Resolution — keep the real **usernames** so
the screen matches what the client recognises, but write all emails on the
reserved `@elisen.example` domain (the stray `aamiriqbal@mi6.global` test
account became `lloyd@elisen.example`). Role, permission and route names are
system configuration rather than personal data, so those stay 100% verbatim.
**Field alignment:** the Roles grid gained a **Rule Name** column to match
the client's, rendering `—` throughout since no rules exist. `AccessRole`
gained an optional `ruleId`, and `RoleDrawer` now preserves it on edit.
**Bug surfaced by real data:** `moduleOf()` did `id.split('-')[0]`, which
turned `Admin - RBAC` into a stray `"Admin "` group. Now trimmed and
lowercased, so it groups with `admin-user-*` correctly.

## 2026-08-10 — Reports: one grouped page instead of three pages or tabs
**Context:** The old system has three separate report list pages — Project
Management (7), Time Tracking (4), GCP (3) — each a grid with "Parameter
1/2/3" columns and a run icon. User asked: three pages (their Option 1) or
one page with three tabs (Option 2)?
**Choice:** Neither literally — one `/reports` page with three labeled
sections of `ReportCard` tiles and a single search box that filters across
all categories; empty categories disappear while searching. Parameters moved
out of the list entirely: a ready report with parameters opens
`RunReportDrawer` (`Run Report "Hours Worked"`, date/select fields, start ≤
end validation, Cancel + Generate Report); a ready report with no parameters
downloads immediately, like the PCC card. Reports whose data model doesn't
exist render as the established `pending` card variant with the reason
(Open Queries & Quotations ×2 — not tracked here yet; the three GCP
reports — module deferred). Ready reports generate real HTML downloads from
the live stores via `lib/reportGenerators.ts` (same document style as
`pccReport.ts`): Approvals, Project Status, TCCA Projects, TCCA Priority
(open TCCAs ranked by linked-project priority), Open Deliverables — Action-On
(open revisions on one person's desk), Detailed Time, Hours Worked
(+Individual), Hours Worked — Summary (per-employee totals; the old
payroll-group parameter is dropped because this app doesn't model payroll
groups). Sidebar "Reports" became a leaf link — AppShell gained `TOP_ROUTES`
so childless top-level items can navigate.
**Rationale:** 14 reports total don't justify three near-empty pages (three
nav slots + category-guessing) or tabs (hide two-thirds of a catalog that
fits one screen). Category-per-page was the old system's module structure,
not a user need. "Parameter 1/2/3" columns describe definitions, not the run
task — a form at run time is the honest shape of that interaction. If the
catalog grows, sections convert to per-category pages without redesign.
**Addendum (user suggestion, same day):** a category dropdown (All default ·
Project · Time Tracking · GCP) sits beside the search box — a zero-typing
jump to one category that composes with search (both apply together). The
combined empty state names the active category ("Nothing in GCP Reports
matches your search") and offers one "Clear search & filter" reset.

## 2026-08-10 — User Access Control: 6 RBAC pages consolidated into 3, grouped by job
**Context:** The client's existing Yii2-RBAC admin exposes six sibling pages
(Users, Routes, Permissions, Rules, Roles, Assignments) — one per storage
table. Real tasks span 2–4 of them with no cross-links; the user asked for a
senior-UX consolidation and approved the analysis before this build.
**Choice:** Three pages under the Admin nav item, grouped by job & frequency:
(1) **Users** (`/admin/users`) merges Users + Assignments — role pills
in-row, Manage Access drawer with role checkboxes, distinct direct grants
(warning-toned, kept visible so access can't hide) and a read-only
effective-access rollup grouped by module. (2) **Roles & Permissions**
(`/admin/roles`) merges Roles + Permissions + per-permission route mapping —
roles table shows member reverse-lookup counts; edit shows an impact alert
naming affected members; permissions grouped by kebab-prefix module with
orphan ("No routes") and usage ("N roles · M users") badges; routes attach
inside the permission drawer, replacing the global dual-listbox shuttle.
(3) **System** (`/admin/system`) holds the route registry and code-defined
rules, explicitly labeled advanced/developer territory — rules are listed
read-only since they're classes, not data.
**Guards built in:** the last active Sysadmin can't lose the role or be
deactivated; the Sysadmin role offers no Delete action; deleting a role
names its members and warns access is removed immediately; permission names
are immutable in edit (roles reference them); new-route input validates the
`/module/action` / `/module/*` shape.
**Rationale:** Grouping follows the three real jobs — manage people's access
(daily), define what access means (occasional), wire the engine (rare) — so
each page answers its own question completely instead of mirroring the
database schema. Full analysis in the 2026-08-10 plan of record.
**Addendum (same day):** (a) The three pages moved from the generic "Admin"
nav item to a dedicated **User Access Control** sidebar item (KeyRound icon),
per explicit request — Admin stays as a placeholder for other maintenance
areas. (b) **Role inheritance** added: `AccessRole.childRoleIds`, resolved
recursively (cycle-safe) by `rolePermissionClosure()` in
`lib/accessDisplay.ts`. Fixture chain mirrors the org: Manager ⊃ Supervisor ⊃
Employee, Client-Manager ⊃ Client-Employee. The roles table shows an
Inherits column and "N (+M inherited)" counts; the role drawer has an
"Inherits roles" section whose selections render the inherited permissions
as locked-checked "· inherited" checkboxes, and roles that already inherit
the edited role are disabled with a loop explanation. Usage/impact counts
(permission "used by N roles · M users") resolve through the closure, so
inherited grants are never undercounted.

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

## Pagination redesigned; added to every table

`patterns/Pagination.tsx` now matches the client's reference (Page Size
select · "Showing X to Y of Z {items}" · first/prev/Page N of M/next/last),
replacing the old numbered-page-button footer. Props changed from
`page/pageCount/summary/onChange` to `page/pageSize/totalItems/itemLabel/
onPageChange/onPageSizeChange` — the component now computes the range and
page count itself instead of the caller pre-formatting a summary string.
Every list-page table now paginates: Projects, TCCA Projects, Timesheet,
Hours Worked, Companies & Contacts, Aircraft & Serials, Users, Roles.
Scoped to top-level list pages, not small embedded tables inside detail
views (work package activities, project approvals/documents) — those stay
unpaginated as deliberately short, contextual lists, not browsable grids.
Fixed a latent bug in Projects — List: its pager was a non-functional stub
(`pageCount={3}`, un-sliced rows); it now actually paginates.

## Aircraft page renamed; edit drawer rebuilt as one table matching the list

Renamed "Aircraft & Serials" to "Aircraft" (nav item, page title, route stays
`/admin/aircraft`) per user request — shorter and the page already reads as
one thing since the serial-per-row redesign.

`AircraftModelDrawer` no longer splits "Aircraft" fields and "Serial
Numbers" into two FormSection cards. It's now one table with the exact same
column order as the Aircraft list (Serial No, Registration No, Model
Number, Model Name, Manufacture, TCCA TC, FAA TC, EASA TC, Prefix, Comment,
Active) — one row per serial. Model fields are one record shared by every
row, so only the first row is editable; the rest mirror its value live and
update the instant row 1 changes, matching how the flattened list table
already repeats model data across serial rows. A blank row is always kept
in state (never fewer than one) so the model fields have somewhere to
render even before a real serial exists; the last row can't be removed for
the same reason. Per-serial Active dropped from the UI — the list table's
Active column is model-level only, and matching the list exactly took
priority over an already-unused per-serial flag (no filter/picker reads
`AircraftSerial.active`); the field stays in the type/store, just not
editable from this drawer.

Filled in the 3 remaining serial/registration pairs from the original flat
Serial Number List screenshot (199/C-FTLH, 9033/M-YGJL, 5412/M-AFAC) that
weren't yet in `lookupFixtures.ts` — that crop didn't show which aircraft
model they belonged to, so they're linked to the three business-jet-type
models that had zero serials (Astra SPX, BE350, Alpha Jet) rather than
omitted from the table. Flagged as an assumption in a code comment.

## Standard View/Edit pattern: DetailCard/DetailField, never a disabled input

User correction: `AircraftModelDrawer`'s View mode rendered the same table
as Edit but with every input `disabled`. That's wrong — a disabled `Input`
applies `opacity-40` to the whole field, which dims a *real* value to the
exact same gray as an empty placeholder. A filled field and a blank one
became visually indistinguishable, and disabled inputs read as "broken
form," not "read-only data."

The correct standard, now enforced everywhere:
- **View** is never a form. Use `DetailCard` + `DetailField` (new,
  `patterns/DetailView.tsx`) — bordered card, bold title, optional edit
  pencil; muted label above a plain-text value, em dash when empty. This
  was already the pattern in `ProjectDetailPage`, `TimesheetEntryView` and
  `TccaOverviewTab`, each with its own copy-pasted local `Card`/`Field`.
  Extracted to one shared component and pointed all three at it, so it's
  a real standard instead of three coincidentally-identical duplicates.
  Added to Storybook as `Patterns/Overview → Read Only Detail`.
- **Edit** always shows existing data inside a real, enabled input in
  normal (non-muted) text — never a disabled field standing in for a
  filled one. Added a filled-value example to `Patterns/Overview → Form
  Building Blocks` (`Patterns.stories.tsx`) as the reference.

`AircraftModelDrawer` rebuilt accordingly: View is `DetailCard`s (an
Aircraft field grid + a plain read-only `<table>` of serials, no inputs
anywhere). Edit/Create's compact table was simplified too — every row's
model-column cells are now real, always-editable inputs bound to the same
shared state (typing in any row updates every row, since it's one field);
removed the earlier "only row 1 is editable, the rest are muted text"
special-casing, which was itself heading toward the same disabled-look
problem.

Audited the codebase for the same antipattern (`disabled={isView}` or
equivalent) — the only other `mode: 'view'` drawer, `TimesheetEntryDrawer`,
already used `TimesheetEntryView`'s Card/Field correctly. No other fix
needed.
