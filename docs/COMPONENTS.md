# Component Inventory

One line per component: name, variants, location, purpose.

Updated as components are added or changed.

## /components/ui — design system primitives

| Component | Variants | Location | Purpose |
|-----------|----------|----------|---------|
| Button | primary / secondary / tertiary / danger × sm, md, lg, xl × default, hover, focus, active, loading, disabled | `ui/Button.tsx` | All actions; icon slots either side |
| Input | default, focused, typed, error, disabled; optional leading/trailing icons × `sm` (36px) / `md` (44px, default) | `ui/Input.tsx` | Single-line text, number and date entry. `size="sm"` for any field sitting in a **toolbar row** beside a button; `md` for stacked form fields — see "Control heights" below |
| Textarea | default, error, disabled | `ui/Textarea.tsx` | Multi-line text (descriptions, comments) |
| Select | default, error, disabled, placeholder × `sm` / `md`; controlled or `defaultValue` | `ui/Select.tsx` | Single-choice from a known list. **A thin adapter over `SearchableSelect`** — it keeps the old `<Select><option/></Select>` API so all ~60 existing call sites get the standardized dropdown (radio markers, portal rendering, keyboard support, search once the list is long) without being rewritten. `onChange` stays event-shaped (`e.target.value`). For new code prefer `SearchableSelect` (options array) or `MultiSelect` |
| PhoneInput | default, filled, error, disabled; code segment closed / open / searching | `ui/PhoneInput.tsx` | One merged field: flag + dial code \| number, our own Input/Select tokens (h-11, rounded-sm, shadow-textfield). The code segment is a `SearchableSelect variant="bare"` — same open panel as every other dropdown, with the country name as a searchable hint — so there is no native `<select>` left anywhere in the app. Fills its container so it lines up with every other field |
| Checkbox | checked / unchecked × enabled / disabled, optional required marker | `ui/Checkbox.tsx` | Multi-select and applicability ticks |
| RadioCard | selected / unselected / disabled | `ui/RadioCard.tsx` | Mutually exclusive choice with explanatory copy |
| Badge | danger / warning / info / success / neutral × subtle / outline × sm / md | `ui/Badge.tsx` | **THE tag** — Status, Active, health, priority, count chips; never hand-roll one. **4px radius (`radius-xs`) always**, not the 8px other surfaces use (docs/DESIGN.md → "Tags"). Both sizes are 12px so two tags side by side can't differ in text size: `sm` (default, font-medium, table/row) and `md` (font-semibold, roomier padding, card heading) |
| Alert | danger / info | `ui/Alert.tsx` | Form-level errors and inline guidance |
| Skeleton | — | `ui/Skeleton.tsx` | Loading placeholder blocks |
| Spinner | sizes via prop | `ui/Spinner.tsx` | Indeterminate loading indicator |
| PersonSelect | closed / open / searching / empty | `ui/PersonSelect.tsx` | **THE** control for every person field: person responsible, contact, owner, next action, employee, activity responsible. A thin `SearchableSelect` with `searchThreshold={0}`, so a name field is **always searchable however short the list**. Use this instead of a `Select` over `PEOPLE` so a new person field cannot ship without search |
| SearchableSelect | closed / open / searching / no matches / empty catalog / option disabled × `sm` / `md` | `ui/SearchableSelect.tsx` | **THE** picker for every "attach an existing record" flow (Aircraft, Approvals, Deliverables, Design Data). Type to filter on label + hint; already-attached options are `disabled` with a `disabledReason` rather than hidden. Portal-rendered so drawers and `overflow` containers can't clip it. Full keyboard support (↑/↓ skip disabled rows, Enter picks, Esc closes). `searchThreshold` (default 8) hides the search box on short lists — a search field over four options is noise. `indicator="radio"` for a form field choosing one of a few alternatives, default `"check"` for catalog lookups. `variant="bare"` drops the border/shadow so it can be a segment inside an already-bordered control (the dial code in `PhoneInput`); `menuMinWidth` floors the panel width when the trigger is too narrow to read the options in |
| MultiSelect | none / n selected (count + chips) / searching / option disabled / empty catalog × `sm` / `md` | `ui/MultiSelect.tsx` | The multi-choice half of the selection standard. Checkboxes in the list, `"n selected"` on the trigger, and chips underneath naming each pick with an × plus `Clear all`. The chips are required, not decoration: a count answers "how many" but never "which", which is the question a user has once the menu closes. Menu stays open while picking. Storybook: `Patterns/Overview` → SelectionStandard |

### Aircraft and Serial Numbers are two records, one workspace

`Reference Data → Aircraft` has two tabs, `?tab=serials` deep-linkable:

- **Aircraft** is a *type*: model number/name, manufacturer, the three type
  certificates, and the drawing prefix. A type has no owner.
- **Serial Numbers** is an *airframe*: which type it is, its serial and
  registration, and the owner/operator to contact — name, company, full address,
  telephone, email. Eleven of its fields are owner data, which is why it is a
  record and not a column.

**Never merge them into one grid.** One row per airframe repeats every model
field on every row, makes a 3-airframe type appear 3 times, and leaves "Edit"
ambiguous about which record it acts on. Tabs keep one sidebar entry (you move
between them constantly, exactly like Deliverables and Design Data) without
pretending they are one thing.

**Serials are unique per model, never globally.** The same number legitimately
appears under two manufacturers, so uniqueness is checked against
`aircraftId + serial`. Registration is *not* a key: an airframe is re-registered
over its life while the serial stays put.

Deleting a type takes its airframes with it, since `aircraftId` is required —
the confirm names the count. Prefer Inactive on both tabs: inactive records stay
attached to the projects and approvals that already reference them.

### Two global rules for lists and filters

**1. Stats describe what is on screen.** Every stat tile on a filterable list is
computed from the *filtered* set, not the whole table, and reads 0 when nothing
matches. The first tile is labelled "… shown", not "Total …", so the number never
promises more than it counts. Tiles that disagreed with the rows beneath them
were the bug; a "Total" that ignores the filters answers a question nobody asked.

**2. Dropdowns over 5 options get a search box.** `searchThreshold` defaults to
**5** on `SearchableSelect` and `MultiSelect`, so it applies to every dropdown in
the app including the `Select` adapter. It is data-driven: a list grows past five
and gains a search field on its own, with no per-screen decision.

**Name fields are the exception: always searchable, however short.** Use
`PersonSelect` for every person field, and `searchThreshold={0}` for other name
lists such as Design Approval Holder. The threshold is right for *enums* — a
status, a priority, yes/no — where you choose from a set you can see. A name is
different: you already know who you want, so typing beats scanning, and five demo
employees are dozens in a real deployment. Making it a component rather than a
prop convention is the point: a new person field inherits search instead of
relying on someone remembering.

### Status tags carry no dot

`Badge` has **no `dot` prop**. Every badge already states its meaning in words,
so the coloured circle was pure decoration, and removing the prop rather than
just the call sites means it cannot creep back. Colour still never carries
meaning alone: the label does.

Circles that remain are avatars, which are meant to be round.

### Progress meters: one style, everywhere

Non-negotiable, and it lives in `ProgressMeter` so every surface inherits it:

- **Track is always `neutral-300`.** On a white card `neutral-100` read as empty
  space, so the unfilled part, the bit that answers "how much is left", was
  invisible.
- **Fill runs 0-100% of budget**, capped. Only its colour changes with state:
  green on track, amber near budget, red over.
- **No rescaling and no budget notch.** Over 100% the bar is simply full and red.
  The old over-budget mode was a second visual language that hid the track and
  made an over-budget bar render *shorter* than an on-track one.

**Figures stay black** (`text-text-primary`), including "120% used" and the
Project Detail stat tiles. Colour does exactly one job: the bar. State is still
never colour-only, because the percentage itself passes 100 and a status badge
sits alongside. The one kept exception is a **negative Remaining** value in a
table, which stays red behind its minus sign.

**Summary row order — `BudgetInline`, one component, used by every card
header:** `4.4h / 5h` → bar → `88% used`, with **the percentage against the
right edge**. The percentage is what a reader scans down a stack of rows, so it
owns the edge; the 40px bar is a glanceable pip beside it. The hours stay in the
short `x / y` form — the full breakdown is already in the row's Budget / Actual
/ Remaining columns and the stat tiles above. Both figures share **one size and
weight** (`text-sm font-semibold`): they are two halves of one sentence, and
making either louder implied a hierarchy that isn't there. With no budget set
the tail reads `No budget`, never `— used`.

### The data is the client's own, fetched not bundled

Every record on screen comes from the client's TPMS export, served as static
JSON from `public/data/` and loaded by `lib/dataset.ts` — core before the app
module is imported, the 31k timesheet rows on their own. Stores seed from
`coreData()`; nothing imports a hand-written row any more. `PEOPLE`,
`EMPLOYEES`, the activity/task catalog, settings and RBAC stay as generated TS
because they are small and read at module scope.

**People in the data are stand-ins, and must stay that way.** The prototype is
served publicly with no backend, so every imported byte is public. Credential
and pay columns are never imported; names, emails and phone numbers are
replaced deterministically, including inside free-text comments. Re-import
with `tools/` and re-run its checks before shipping new data.

**Column widths are measured against real content, and the real content is now
long.** Client project titles, deliverable numbers and TCCA descriptions are
far longer than the invented ones were — a width tuned against a fixture is
not a width tuned against this data.

### Every table heading sorts, and they all look the same doing it

Every table in the app — list pages, tabs, cards, drawer sub-tables — renders
its headings through `SortableTh`, and only the **Actions** column is plain.
There is one icon vocabulary and it never varies: a neutral ⇅ at rest, a
single accent ↑/↓ on the active column, nothing else. The heading's weight and
colour do not change when it becomes active; the arrow already says which
column is sorted, and darkening the label read as a second, heavier font
beside its grey neighbours.

Sorting is `useTableSort` everywhere — never a hand-rolled comparator, so a
blank cell can't sink on one screen and lead on another. Two rules it fixes
centrally: blanks park last in **both** directions, and numeric-looking codes
compare as numbers (`3200-00` before `3300-01`). A column whose cell stacks two
fields keeps a `SortMenu` inside its `SortableTh` rather than picking one of
them.

### Table columns are left-aligned — all of them

Headings **and** values, figures included: Budget, Actual, Remaining, Entries,
counts. Right-aligned numbers pulled the eye away from the heading naming them,
and in a table as wide as Projects List the reader loses track of which column
they are in. Decimal alignment is the usual argument for right-aligning, and
these are one-decimal hours, so there is nothing to win against that cost.

Applies to every table in the app. See the `TableFiguresExample` story in
Storybook → Patterns for the reference rendering.

### Card headers are white

Cards sit on a `neutral-50` page. A `neutral-50` card header therefore had no
edge at all — a collapsed row disappeared into the background. Headers are white
like the card body, with a `border-t` on the expanded region to separate the
two.

`budgetSummary(health)` remains the shared long phrasing for the meter's own
`showLabel` mode: "4.4h spent of 5h, 0.6h left".

**Always "used", never "done".** The percentage is hours spent against hours
budgeted, not work completed — nobody is 130% *done*, but you can certainly
spend 130% of a budget. This is the same distinction behind renaming the
Projects List column to "Budget used"; calling it "done" reintroduces exactly
the 106% confusion the client flagged.

### Counting things so nothing feels hidden

Three levels of count on Project Detail, each answering a different question:

1. **Tab-bar pills** — `Work Packages 3`, `Deliverables 4`, `TCCA 0`. The
   project's shape before anything is clicked. Overview gets no pill: it is a
   summary, not a collection. A genuinely empty tab still shows **0** rather
   than dropping the pill, because a missing count reads as "not counted"
   instead of "empty". Same pill styling as `TableTabs`, so a count looks the
   same wherever it appears.
2. **The structure strip** on the Work Packages tab — Work packages ·
   Activities · Not started · In progress · Complete, as a `<dl>` in one short
   bordered row. Deliberately *not* another band of `StatCard`s: the four budget
   tiles above already own that visual weight, and this answers a smaller
   question. Keep it one row.
3. **A per-package activity chip** beside the status badge — the same neutral
   chip the activity tasks use, so "count of things" reads one way everywhere.
   Zero is shown, not hidden: an empty package is the one most worth noticing.

All three derive from the same store selectors, so they move together —
verified by adding an activity (chip 0 → 1, strip 5 → 6, package count
unchanged) and a package (tab 3 → 4, Not started 1 → 2).

### Approvals — a certificate, its revisions, and what it covers

An Approval is a certificate. Its fields mirror the legacy `approval` table:
**Number, Description, Primary Approval, Design Approval Holder, Comment,
Active** — and deliberately *no date*, because a certificate has no single
date. It is granted by its first **Issue** and re-issued whenever it changes.

**Revisions** are an approval's changes. The legacy table is `approvalissue`
and the call went both ways on the wording — "use the revision terminology as an
issue, or keep it as Revision… Now its name is Revision, right?" — settling on
**Revision**, which the UI says throughout. A revision records what changed,
when, and the document carrying it (`Approval Revision`, `Change Description`,
`Revision Date`, `Document`), and it is what authorises extending a certificate
to further aircraft. Numbers are sequential *per approval*, the next unused one
is suggested, blank means "use the suggestion", and duplicates are refused.

**Coverage** is two separate assign lists, as the legacy join tables have them:
`Approval ↔ Aircraft` (models) and `Approval ↔ Serial Numbers` (specific
airframes). Serials are only offered for models the certificate covers, and
removing a model removes its serials with it — otherwise the approval keeps
tails for a model it no longer names.

**Two listings in the sidebar**, because the legacy app has a create screen for
each: **Approvals List** (`/approvals`) and **Approval Revisions**
(`/approvals/revisions`). A revision is raised against a certificate you *pick*,
so it needs a home outside any one approval — its create form leads with an
Approval Number select, exactly as the legacy screen does.

The Approvals list opens with **four count tiles over the whole registry**
(Total · Primary certificates · Revised since granted · Not linked to a project),
matching the Project List header. They are deliberately *not* recomputed against
the filters: a "Total" that moved with the filter answers a different question
than the one being asked. Filtering uses the standard menu + chips pattern, with
**Projects** (attached to nothing) and **Revisions** (changed since granted) as
the two filters worth having beyond the obvious ones. Aircraft and serial
numbers get no sidebar tab: they are coverage of one certificate, not something
anyone browses across all of them, and the requirement document's own target UX
is "one workspace over many peer screens".

`ApprovalDetailPage` (`/approvals/:id`) is the workspace the client asked for
— "Approval itself should have a proper workspace, the way the project does".
Five tabs: **Overview · Issues · Aircraft · Serial Numbers · Projects**, over
four compact count tiles, matching `ProjectDetailPage`'s shell exactly.

Controls follow the legacy screens field for field: Description and Comment are
textareas, **Primary Approval is a checkbox** (the "booleans are Selects" rule
covers Active/Status, which reads as a state — not a one-off attribute), and the
labels are verbatim: *Aircraft Model Number*, *Serial Number*, *Approval Revision*.
The table header shortens *Design Approval Holder* to **Approval Holder**; the
full legal name stays on the form, where the space exists.
The revision's **Document is a `FileDropzone`**, never a filename text box — the
legacy screen has a real file picker and the requirement document asks for a PDF
view.

**Project links are bidirectional.** The approval's Projects tab and the
project's Approvals tab call the same two store verbs (`linkToProject` /
`unlinkFromProject`), so the two directions can never disagree — verified live
in both.

### Global records — create in the workspace, link in a project

Aircraft, Approvals, Deliverables, Design Data and **TCCA Projects** are
**global** records. Each
outlives any one project and is routinely shared across several, so no project
can own one. The requirement document splits it explicitly — §1.2 *Project
Associations* gives a project **"List, assign"**, while §1.3–1.5 give the
modules **"List, CRUD"**:

- **The workspace creates, edits and deletes.** `ApprovalsPage`,
  `DocumentsPage`, Reference Data → Aircraft.
- **A project only links.** An inline link row — a 36px `SearchableSelect`
  listing the whole pool with already-linked entries `disabled` +
  `disabledReason`, and a **Link to project** button. No create path, no editing
  of the record's own identity. Plus a `Manage in …` button to the workspace,
  and **Unlink from project** in row actions.
- **Exception, and the only one:** a project may edit *project-scoped tracking*
  on something it links to — `Edit revision tracking` on a document revision,
  because the next-action person drives someone's to-do list and that is the
  project's own work. It may never edit the record's identity (a certificate's
  number/authority, a document's number/title/owner). Approvals have no
  project-scoped fields, so their project tab is link/unlink only.

**Vocabulary — use "link", not "attach".** One verb across all four tabs:
*Select a … to link* → **Link to project** → **Unlink from project** →
"N … linked to this project". It is the requirement document's own word, its
inverse is unambiguous, and "attach" is actively risky here: these records hold
file URLs and the app has a file-upload pattern, so "attach a deliverable" can
be misread as "upload a file".

Say where creation happens, in the UI, not just in code: every link row carries
a one-line hint ("Deliverables are created and managed in the Deliverables
workspace. Here you choose which existing revisions apply to this project.")
because the old screen let people create here and that was the wrong mental
model.

**Linking is two-way where both sides are workspaces.** A project's TCCA tab and
a TCCA project's Projects tab call the same `linkProject` / `unlinkProject` store
verbs, so a link made on either side shows immediately on the other. Approvals
work the same way.

Reference implementations: `ProjectApprovalsTab`, `ProjectDocumentsTab` and
`ProjectTccaTab` — deliberately the same shape. Copy one when a sixth record type
appears.

### Every popup places itself inside the viewport

Two hooks own this, and no screen should ever position a panel itself:

- **`usePanelPosition`** (`ui/`) for the select panels: `SearchableSelect`,
  `MultiSelect`, and therefore `Select`.
- **`useDropdown`** (`patterns/`) for the menus: `ActionsMenu`, `ExportMenu`,
  `SidebarProfile` and every filter menu.

Both return `{ left, width?, maxHeight, top | bottom }` and both:

1. **Open upward** when there isn't room below, anchoring by `bottom` so the
   panel's height never has to be measured first and can't flicker into place.
2. **Cap `maxHeight` to the space that exists**, so a long list scrolls *inside*
   the panel. Select panels are a flex column with the list on
   `min-h-0 flex-1 overflow-y-auto`; menus carry `overflow-y-auto`.
3. **Clamp horizontally**, so a wide panel never runs off the right edge.

Why this is not optional: a panel pinned to `trigger.bottom` is
`position: fixed` and re-anchors on scroll, so once it opens below the fold
**scrolling can never bring it back** — the options are unreachable. That broke
the link rows at the bottom of the project Deliverables, Design Data and
Approvals tabs. Separately, a 606px filter menu on a 620px viewport was flipped
to `top: -49`, putting its first field above the fold.

### Nested dropdowns — `data-dropdown-panel`

Every portalled select panel carries **`data-dropdown-panel`**, and
`useDropdown`'s outside-click handler ignores any target inside one.

This is not cosmetic. A `Select` inside a filter menu renders its panel through a
portal on `<body>`, so by DOM containment its options are *outside* the menu —
and `mousedown` on an option closed the whole filter menu before the user could
reach Apply. Every filter menu in the app was broken by it.

Two rules follow:
- Any new portalled panel that can appear **inside** another dropdown must carry
  `data-dropdown-panel`.
- **Test menus with a real pointer sequence.** `element.click()` fires only
  `click`; menus close on `mousedown`, so a `.click()`-based test passes against
  a menu that is broken for every actual user. Dispatch
  `mousedown → mouseup → click`.

### Layering — a dropdown paints above whatever opened it

Every menu and dropdown is portal-rendered to `document.body` so drawers and
`overflow` containers can't clip it. That only works if the layers are ordered
by **what can spawn what**, not by importance:

| Token | Value | Used by |
|---|---|---|
| `--z-sticky` | 1000 | sticky headers |
| `--z-modal` | 1100 | `Drawer` and its scrim |
| `--z-dropdown` | 1200 | `SearchableSelect`, `MultiSelect`, `ActionsMenu`, `ExportMenu`, the filter menus, `SidebarProfile` |
| `--z-dialog` | 1300 | `ConfirmDialog` |
| `--z-toast` | 1400 | toasts |
| `--z-tooltip` | 1500 | tooltips |

Most dropdowns in this app are opened from **inside** a drawer, so the dropdown
layer must sit above the modal layer. Get it backwards and the panel renders
behind the drawer: no open state, no error, the control simply looks dead.
A `ConfirmDialog` opened from a row menu must in turn cover that menu.

Regression guard: `Patterns/Overview` → **DropdownLayering** opens a
`SearchableSelect`, a `MultiSelect` and a `PhoneInput` inside a `Drawer`. If any
panel is invisible there, the scale has regressed.

### Control heights — 36px in a row, 44px stacked

Two heights, and which one you use is decided by the *layout*, not the control:

- **36px (`size="sm"` on fields, default `md` on Button)** — anything in a
  horizontal row with a button: page-header search, the Filters trigger, the
  Export menu, the primary CTA, and inline "pick a record → Attach" rows.
  Buttons are 36px at their default size, so a 44px field beside one sits 4px
  proud top and bottom, which reads as a rendering bug rather than a choice.
- **44px (`size="md"`, the default)** — stacked form fields inside a form,
  drawer or filter panel. Nothing sits beside them to disagree with, and the
  extra height is the comfortable target for typing.

Storybook: `Patterns/Overview` → **ToolbarRowStandard**, plus `UI/Input` →
Sizes and `UI/Select` → Sizes.

## /components/patterns — compositions of ui primitives

| Component | Variants | Location | Purpose |
|-----------|----------|----------|---------|
| FormField | required, description, help, error, counter, fullWidth | `patterns/FormField.tsx` | Label + control + help/error, responsive 1→3 col. `fullWidth` stacks label above a control spanning the whole section instead of the 1/3-2/3 split — for the rare field (e.g. a comment box) that needs more room than a shared control column gives it |
| FormSection | with/without subtitle | `patterns/FormSection.tsx` | Titled card grouping related fields |
| Drawer | with/without footer | `patterns/Drawer.tsx` | Right side panel; Esc to close, focus trapped, footer actions grouped right |
| ConfirmDialog | primary / danger | `patterns/ConfirmDialog.tsx` | Confirm destructive or state-changing actions |
| Stepper | n steps, done / active / upcoming | `patterns/Stepper.tsx` | Multi-step form progress |
| Stat | plain / `dl` × with-hint × empty × nowrap | `patterns/Stat.tsx` | **THE label/value pair, everywhere a figure sits under its name.** One fixed spec: label 12px regular Neutral 500, value 14px semibold Neutral 950, 2px between. Empty renders an em dash. Layout (grid, dividers, padding) belongs to the caller. Was hand-rolled five different ways before this existed — `DetailField` is now a thin alias over it |
| StatCard | default, loading | `patterns/StatCard.tsx` | Single headline metric |
| EmptyState | with/without action, custom icon | `patterns/EmptyState.tsx` | Zero-data and no-results states |
| AutoLoadFooter | loading / more to load / all loaded / empty | `patterns/AutoLoadFooter.tsx` | THE table footer — replaced `Pagination` everywhere (client wanted auto-loading, not page numbers). No border/rounded/bg of its own; renders as the last child inside the same card as its table, separated by one top border, never a second box below it. Scrolling it into view loads the next batch via IntersectionObserver (200px rootMargin, so the batch is ready before you reach it) |
| useInfiniteReveal | — (hook) | `patterns/useInfiniteReveal.ts` | State behind `AutoLoadFooter`: `visibleCount` / `loadingMore` / `loadMore` / `reset`. Call `reset()` wherever the old code called `setPage(1)` — on every search, filter or sort change |
| FileDropzone | empty / dragging / file selected / error | `patterns/FileDropzone.tsx` | **THE** file picker for the whole app — every upload uses this, never a bare `<input type="file">`. Self-contained: renders its own `label`/`required`, the stacked-files illustration (`/public/illustrations/upload-files.svg`, the client's own asset — static, not recolored, since it carries its own drop-shadow filters and layered opacities), "Drag & drop a file here, or browse" + `hint`, a primary "Upload File" button, the selected-file row with Remove, and the `error` message. Do **not** wrap it in `FormField` or `FormSection` — it needs no container. The inner button is the real keyboard-reachable control; dropping a file or clicking the zone are conveniences on top of it. Storybook: `Patterns/Overview` → FileDropzoneExample |
| FilterChips | none applied (renders nothing) / n applied | `patterns/FilterChips.tsx` | THE applied-filters row, required on every screen with a Filters menu. Sits between the page header and the table. Each chip reads "Field: Value" with an × that removes only itself; `Clear filters (n)` removes all. Renders nothing when nothing is applied. Chips come from a `…FilterChips()` helper co-located with each filter menu's own type, so labels can't drift from the fields they describe. Storybook: `Patterns/Overview` → FilterChipsExample |
| TableTabs | active / inactive, with/without counts, overflowing | `patterns/TableTabs.tsx` | THE standard for slicing one table several ways. The mirror of Pagination: no border/bg of its own, renders as the **first** child inside the same card as its table so it reads as the table's header. Active tab = accent underline sitting on the card's dividing line (`-mb-px`), count in a pill beside the label. Real ARIA tabs (arrow keys, roving tabindex, active tab scrolled into view); the table is the `tabpanel`. Never render these as standalone pills/chips floating above the table |
| DetailCard / DetailField | with/without edit icon; empty field; `nowrap` | `patterns/DetailView.tsx` | THE standard read-only View: bordered card + muted-label/plain-value field grid. Never use a disabled form input to show read-only data — it dims real values to the same gray as an empty placeholder. Pass `nowrap` on short codes (Serial No, Reg. No, Model No, IDs) |
| BarChart | populated / all-zero (`emptyLabel`) | `patterns/BarChart.tsx` | THE standard single-series bar chart — no chart library in the app, and one series doesn't warrant one. Built from tokens, HTML not SVG (labels stay real type size at any width). Axis is a round *step* (0/2,000/4,000/6,000), never a round max, so gridlines are numbers a reader can hold in their head. `tone="danger"` only for series that *are* a fault count. Carries an `sr-only` data table — values never depend on reading a bar height. One series per chart, always: a second measure means a second scale, so it gets its own chart, never a second y-axis |
| ProgressMeter | on-track / near / over / complete / no-budget; sm & md | `patterns/ProgressMeter.tsx` | THE **budget-used** bar (hours consumed ÷ hours budgeted — not "progress", which would imply work completed and could never exceed 100%). Fill colour comes from the health state and is always paired with the percentage in text — state is never colour-alone. Over budget the track rescales to the overrun with a notch marking where the budget ran out, so the bar never contradicts the figure beside it. `role="progressbar"` with aria-valuetext |
| PersonCell | named / empty; primary & secondary label | `patterns/PersonCell.tsx` | THE way a person appears anywhere: `accent-subtle` disc of `accent` initials, then the name. Use for every person — responsible, contact, owner, employee, next action. `secondary` shrinks only the label. `min-w-0` + `truncate` keeps the avatar inside the cell. See the `PersonExample` story |
| Avatar | sm (20px) / md (36px) / lg (44px) | `patterns/Avatar.tsx` | Initials only, **one fill and one text colour, no tone prop** — colour-coding people by role rendered the same person differently on different screens. `lg` heads a detail page (PersonDetailPage) |
| ChipOverflow | ≤max / overflowed / expanded / empty | `patterns/ChipOverflow.tsx` | THE chip list for table cells: at most 2 chips then **+N more**. Exists to enforce the two-line row rule structurally — a bare `.map()` grows with its data. Expands in place by default; pass `onShowAll` in a table row so the count opens a view instead of growing the cell. See `ChipOverflowExample` story |
| DetailCard / DetailField | read-only record; empty field | `patterns/DetailView.tsx` | THE View layout, used by every View action app-wide: bordered card, label/value grid, em dash when empty. **Never** a disabled form — a greyed input renders a real value in the same grey as an empty one. See `ViewLayoutExample` |
| SortableTh | idle / active-asc / active-desc / not-sortable | `patterns/SortableTh.tsx` | **THE sortable column heading** — every table in the app uses it, never a hand-rolled `<th>` + button. Owns the `<th>`, `scope="col"`, `aria-sort` and the icon button; the calling table keeps its own padding/width classes. A resting neutral ⇅ marks a heading as clickable; only the active column shows a single accent ↑/↓, and the label keeps the header row's own weight and colour either way. Omit `sortKey` for a plain heading (Actions). For a cell whose control is a `SortMenu`, pass `ownsKeys` so the cell still reports `aria-sort`. Storybook: `Patterns/Overview` → SortableHeaderExample |
| useTableSort | — (hook) | `patterns/useTableSort.ts` | Sort state + sorted rows for one table: `useTableSort(rows, accessors, { initial, onSortChange })` → `{ sorted, sort, setSort }`. One accessor per column saying what it sorts on (rarely the string in the cell — a badge sorts by its underlying status, a two-line cell by whichever line the heading names). Numbers compare numerically, strings through an `Intl.Collator` with `numeric: true` (so `3200-00` sorts before `3300-01`) and `sensitivity: 'base'`, booleans false-then-true. **Blanks sink in both directions** — an em dash is the absence of a value, not a value below every other one. Sort runs on the whole filtered set, before `slice(0, visibleCount)`; pass `useInfiniteReveal`'s `reset` as `onSortChange` |
| SortMenu | idle / active-asc / active-desc | `patterns/SortMenu.tsx` | A column heading that sorts by any field stacked in its cell, so merging columns to kill horizontal scroll costs no sort. Clicking always opens the field picker, never sorts directly — a merged column has more than one reasonable "up". The arrow alone carries the state; no field name sits beside it (that suffix used to overflow into the next column). Render it *inside* a `SortableTh` with `ownsKeys` |
| AtaChaptersPage | ready / loading / error | `features/lookups/AtaChaptersPage.tsx` | Master–detail over the ATA taxonomy: chapter rail (code badge, sub chapter count, URL-synced selection) → selected chapter's sub chapters table. StatCard tiles follow the search; chapter actions sit in a 3-dot menu; delete of anything drawings are filed under becomes **Retire it instead** |
| ActivityCatalogPage | ready / loading / error; 2 tabs | `features/lookups/ActivityCatalogPage.tsx` | Reference Data → Activities & Tasks. Two tabs over one workspace (as Aircraft / Serial Numbers). Delete is refused for anything in use and the dialog's action becomes **Retire it instead**; a banner counts activities that require a task but have none linked |
| ActivityCatalogDrawer | create / edit / view | `features/lookups/ActivityCatalogDrawer.tsx` | An activity **and its task links in one form**, where the client's system needs two screens. Validates the unfillable combinations: task-required with no tasks, non-project with tasks |
| TaskDrawer | create / edit / view | `features/lookups/TaskDrawer.tsx` | The same links from the other side — create a task and assign it to any activities. Warns, rather than blocks, when renaming a task that logged hours name |
| HoursByPersonTab | ready / loading / empty | `features/timesheet/HoursByPersonTab.tsx` | Everyone's hours aggregated per person, with its **own compact toolbar** above the table — a period Select and a project/work-package search, independent of the page's own search and filter menu. Each row ends in a **View Details** button (a single action, so no 3-dot menu) that opens PersonDetailPage. Name (**designation under it**), status badge, then figures with the meter and percentage last. Overtime / Banked / Non-project are separate columns — no budget covers them, so they are never inside Actual |
| PersonDetailPage | ready / empty-search / empty-period / no-record | `features/timesheet/PersonDetailPage.tsx` | One person's hours in full, at `/hours-worked/person/:name`. **Master–detail, same shape as AtaChaptersPage**: one summary card (identity + all twelve figures, built to a supplied screenshot) on top, projects on the rail, selected project opened out. Header carries a project/work-package search (`?q=`) and a compact period Select (`lib/hoursPeriod.ts`, `?period=`) that both scope the header figures, rail and panel together. An `ActionsMenu` → View time entries hands off to `/hours-worked?employee=NAME`. Non-project time is a final rail entry, set apart, with no budget columns |
| PersonProjectPanel | project / non-project | `features/timesheet/PersonProjectPanel.tsx` | The detail pane. Header follows the reference: title first, then `code · N Work packages · N Activities`, with a time-entries chip and health badge top-right, over a `divide-x` stat strip matching ProjectWorkPackagesTab's. Exports the shared `Chip` / `Figure` / `RemainingText` / `UsedCell` / **`RemainingUsedInline`** (Remaining + meter + % as one figure) / `budgetPair` bits |
| PersonWorkPackageCard | collapsed / expanded | `features/timesheet/PersonWorkPackageCard.tsx` | One work package of a person's work — same chevron card and `BudgetInline` header as `WorkPackageCard`, built locally (import-direction rule). Its activity table is **`table-fixed` with percentage columns and never scrolls horizontally**: 6 columns, `px-base` cells, `overflow-hidden` per cell |
| BudgetInline | any health state; no-budget |  `patterns/ProgressMeter.tsx` | The summary read-out for a card header: hours → 40px meter → `88% used` hard against the right edge, both figures at one size and weight. Exists so that order is defined once — it had drifted between the work-package header and the team row |
| HealthSummary | any health state | `patterns/HealthSummary.tsx` | The budget read-out: Budget hours / Actual hours / Remaining hours / Budget used as **four stat boxes with the exact StatCard metrics (`p-lg`, `text-3xl`)**, so every box is the same 98px height as the Projects List tiles. No meter inside — the percentage, the signed Remaining and the status chip carry the state. Remaining keeps one stable label and goes **signed** (−395.2h, in danger) when over rather than flipping to "Over by". Status chip sits beside the Budget used label; a thin `ProgressMeter` sits under the percentage. The sign + percentage + chip together explain an over-100% figure, so no explanatory sentence is needed inside the card |
| Truncate | 1 line / 2 lines | `patterns/Truncate.tsx` | THE standard for long free text in a table cell: `line-clamp`, full text on hover via native `title`. Pair with a `maxWidth` style on the `<td>` — without a width constraint the browser just grows the column instead of wrapping. Never use on short codes — see the `whitespace-nowrap` rule below |
| AccordionSection | open / closed, optional meta | `patterns/AccordionSection.tsx` | Collapsible grouped content (checklist phases) |
| Avatar | tone: accent / success | `patterns/Avatar.tsx` | Initials circle from a full name — Project Detail's People section |
| AppShell | active nav item / child; optional headerLeft / **description** / headerActions / **fill** | `patterns/AppShell.tsx` | Sidebar + header frame; heading left, page controls right. Owns the viewport: `h-screen`, never scrolls itself — `main` scrolls. `fill` hands the height to the page instead (master–detail), which ends its panes at the fold with `min-h-0 flex-1`. `description` is the one-clause line under the heading — never a `<p>` in the page body |
| UrlField | id, value, onChange, optional placeholder | `patterns/UrlField.tsx` | URL input with **Go To** beside it; the button is disabled until the value is openable. `isOpenableUrl` is exported for the table actions that offer the same jump |
| TableSelectionBar | selectedCount, totalCount, itemLabel, onSelectAll, onClearAll, children (bulk actions) | `patterns/TableSelectionBar.tsx` | Shopify-style selection header: replaces the column-title row while rows are selected — count with Select all / Unselect all menu, checked/indeterminate box that always clears on click, bulk actions from the page. Requires widths on `<colgroup>` |
| DateText | value, optional emptyLabel | `patterns/DateText.tsx` | THE date in a table cell: `Mar 7, 2026`, breaking after the comma only if the column is too narrow. Never put `whitespace-nowrap` on the cell. `formatDate()` stays one line in prose and View screens |
| ActiveSelect | id, value (boolean), onChange, optional inactiveLabel | `patterns/ActiveSelect.tsx` | THE `active` control: a dropdown, never a checkbox. Two named options instead of one implied state |
| useElementWidth | ref | `patterns/useElementWidth.ts` | Live content width of an element (ResizeObserver + window resize). For proportional-of-the-remainder table columns, which CSS cannot express |
| SidebarProfile | menu closed / open; profile drawer; logout confirm | `patterns/SidebarProfile.tsx` | Signed-in identity at the foot of the sidebar, with Profile and Logout |
| ActionsMenu | n items, default / danger tone | `patterns/ActionsMenu.tsx` | Row-level "⋮" menu, portaled to avoid table clipping |
| useDropdown | — (hook) | `patterns/useDropdown.ts` | Shared open/position/outside-click logic for portaled menus; flips above the trigger when it would overflow the viewport |

## /components/features/projects — feature-specific

| Component | Variants | Location | Purpose |
|-----------|----------|----------|---------|
| ProjectsListPage | ready / loading / empty / error × with/without financials | `features/projects/ProjectsListPage.tsx` | Projects list screen |
| ProjectReviewPage | ready / loading / error / empty × 8 presets | `features/projects/ProjectReviewPage.tsx` | Projects Review — the legacy 7 tabs as one filterable list; preset chips + Filters menu combine |
| ProjectReviewTable | default, loading, financials hidden | `features/projects/ProjectReviewTable.tsx` | Superset column set (Aging, Comments, Next Action, Bdg/Actl Hrs, Due Date); irrelevant columns show an em dash rather than disappearing |
| ProjectReviewFilterMenu | 0-6 active filters | `features/projects/ProjectReviewFilterMenu.tsx` | Company / Person / Priority / Status / Type / Active — narrows *within* the selected preset chip |
| ProjectsTable | default, loading, financials hidden | `features/projects/ProjectsTable.tsx` | Project rows with status/priority badges; `pagination` prop renders inside the same card as its table's footer |
| AddProjectDrawer | create: 2-step (no TCCA) / 3-step (TCCA required); edit: single screen | `features/projects/AddProjectDrawer.tsx` | Create uses the Stepper (Cancel/Back/Continue/Create Project); edit shows every section at once with no stepper (Cancel + Save Changes only) — the standard Edit footer used everywhere else |
| StepBasicInfo | with/without financial section | `features/projects/StepBasicInfo.tsx` | Step 1 — identification, company, scope, TCCA question |
| StepAdditionalDetails | — | `features/projects/StepAdditionalDetails.tsx` | Step 2 — dates, aircraft, proposal, notes |
| StepTccaSetup | — | `features/projects/StepTccaSetup.tsx` | Step 3 — TCCA project + checklist applicability |
| useAddProjectForm | — | `features/projects/useAddProjectForm.ts` | Form state, per-step validation, dynamic steps |
| ProjectDetailPage | all six tabs built | `features/projects/ProjectDetailPage.tsx` | Full project detail screen at `/projects/:id` |
| ProjectDocumentsTab | kind: deliverable / drawing; empty + populated | `features/projects/ProjectDocumentsTab.tsx` | Two-level document→revision list for a project |
| DocumentDrawer | deliverable / drawing | `features/projects/DocumentDrawer.tsx` | Create document + forced first revision (+ TCCA link) |
| RevisionDrawer | add-next (shows history) / edit | `features/projects/RevisionDrawer.tsx` | Revision dates, next-action person, status, URL |
| LinkExistingRevisionDrawer | deliverable / drawing (aircraft search) | `features/projects/LinkExistingRevisionDrawer.tsx` | Reuse a pool revision on this project |
| ProjectApprovalsTab | empty / populated + tie-existing row | `features/projects/ProjectApprovalsTab.tsx` | Certificates tied to a project |
| ApprovalDrawer | create / edit | `features/projects/ApprovalDrawer.tsx` | Record an issued certificate |
| ProjectWorkPackagesTab | empty / populated; delete guards for logged hours | `features/projects/ProjectWorkPackagesTab.tsx` | WP list with roll-ups inside a project |
| WorkPackageCard | collapsed / expanded, over-budget indicator | `features/projects/WorkPackageCard.tsx` | One package: status, hours roll-up, **full-width activities table** (edge to edge with the card, `bg-neutral-50` header row, `px-lg py-lg` cells) |
| WorkPackageDrawer | create / edit | `features/projects/WorkPackageDrawer.tsx` | Free-text package title + description + status |
| ActivityDrawer | create (catalog picker + task preview) / edit | `features/projects/ActivityDrawer.tsx` | Assign who does the work + budget hours |
| useProjectLabel | — (hook + `projectLabel()`) | `features/projects/useProjectLabel.ts` | `3200-00 — Title` label so every drawer names its project |
| ProposalEditDrawer | — | `features/projects/ProposalEditDrawer.tsx` | Focused edit for the Proposal card's 4 fields (Cancel / Save Changes) |
| NotesEditDrawer | — | `features/projects/NotesEditDrawer.tsx` | Focused edit for Next Action + Comments |
| AircraftEditDrawer | 1..n aircraft; add/remove | `features/projects/AircraftEditDrawer.tsx` | Manages the project's aircraft list |
| ExportMenu | HTML/CSV/Text live; PDF/Excel pending a library | `features/projects/ExportMenu.tsx` | Export the current filtered rows |

## /components/features/timesheet — feature-specific

| Component | Variants | Location | Purpose |
|-----------|----------|----------|---------|
| TimesheetListPage | ready / loading / empty / error | `features/timesheet/TimesheetListPage.tsx` | Self-service timesheet list at `/timesheet`, scoped to the signed-in employee |
| HoursWorkedPage | ready / loading / empty / error | `features/timesheet/HoursWorkedPage.tsx` | Admin, cross-employee list at `/hours-worked` over the same records |
| TimesheetTable | self (locked once validated) / admin (`canValidate`, full control), `showComment` (default on, off on Hours Worked → All Entries) | `features/timesheet/TimesheetTable.tsx` | Shared table; Validated/Active as Badge, 3-dot row actions; `pagination` prop renders inside the same card as its table's footer. With `showComment={false}` the Comment column is dropped (not hidden) — the field lives in the row's own View/Edit drawer, full width via `FormField`'s `fullWidth`. **Widths are measured pixels + a shared `GUTTER`, never percentages:** once every heading gained a sort icon, nine of twelve headings were wider than their own cell and the header row read as one merged run. `minWidth` is derived from the widths so it cannot drift |
| TimesheetEntryDrawer | create / edit / view; employee fixed / selectable | `features/timesheet/TimesheetEntryDrawer.tsx` | Orchestrator — form vs. read-only view, cascade state, submit |
| TimesheetEntryFormFields | — | `features/timesheet/TimesheetEntryFormFields.tsx` | Add/Edit form body: Project → Work Package → Activity → Task → Deliverable cascade |
| TimesheetEntryView | — | `features/timesheet/TimesheetEntryView.tsx` | Read-only label/value detail layout for View mode (no form controls) |
| useTimesheetEntryForm | — | `features/timesheet/useTimesheetEntryForm.ts` | Form state + validation for the entry drawer |
| TimesheetFilterMenu | with/without Employee filter | `features/timesheet/TimesheetFilterMenu.tsx` | Portaled filter popover: project, validated, active, date range |

## /components/features/lookups — feature-specific (Lookup Tables)

| Component | Variants | Location | Purpose |
|-----------|----------|----------|---------|
| CompaniesPage | ready / loading / error; empty w/ clear | `features/lookups/CompaniesPage.tsx` | `/admin/companies` — old Companies + Contacts merged; search matches contact names |
| CompanyDrawer | create / edit / view | `features/lookups/CompanyDrawer.tsx` | Single free-text Address field (no Address Line 1/2 split), PhoneInput, Status as an Active/Inactive Select (no checkbox) + contacts as collapsible entries with stacked FormFields. View: one DetailCard for company + contacts, divider-separated, not a second card |
| AircraftPage | ready / loading / error; empty w/ clear | `features/lookups/AircraftPage.tsx` | `/admin/aircraft` — old Aircraft + Serial Numbers merged; search matches serial/registration |
| AircraftModelDrawer | create / edit / view | `features/lookups/AircraftModelDrawer.tsx` | One row = one aircraft (model + a single serial), flat form — no nested/collapsible serial section. Field order matches the list table: Serial No, Reg. No, Model Number, Model Name, Manufacture, TCCA/FAA/EASA TC, Drawing Prefix, Comment, Status (Select, not a checkbox). A model with several tail numbers (e.g. Lear 35A) gets one row per serial, each edited independently — editing one never touches its siblings. View: one DetailCard, same field order, no per-entry loop |
| AtaChaptersPage | ready / loading / error; search auto-expands | `features/lookups/AtaChaptersPage.tsx` | `/admin/ata-chapters` — chapters as expandable cards with sections inside (WP→Activity pattern) |
| AtaChapterDrawer | create / edit (code locked on edit) | `features/lookups/AtaChapterDrawer.tsx` | Chapter code, title, definition, active |
| AtaSubChapterDrawer | create / edit; parent named in title | `features/lookups/AtaSubChapterDrawer.tsx` | Section within a chapter |

## /components/features/reports — feature-specific

| Component | Variants | Location | Purpose |
|-----------|----------|----------|---------|
| ReportsPage | ready / loading / error; no-selection / rail-empty | `features/reports/ReportsPage.tsx` | `/reports` — **master–detail, same shape as AtaChaptersPage**: every report on a rail at the left (name + one-line description, grouped by category, Pending badges), the selected one opened out at the right. Search + category dropdown filter the rail but never clear the selection; `?report=` deep-links it. Replaced the card grid + `RunReportDrawer` (deleted) — parameters moved into the detail pane |
| ReportDetailPanel | pending / gate (date vs. non-date copy) / preview / empty results | `features/reports/ReportDetailPanel.tsx` | The selected report's applied parameters, preview and download. Holds the **applied** values (`ReportParamsBar` holds the draft); nothing previews or downloads until Apply, so a half-typed date never regenerates the table. Reports with no parameters apply on open — there is nothing to confirm. An **applied-range strip** under the controls reads `Aug 21, 2026 – Aug 28, 2026 · 8 days · 20 entries`, taken from `result.range` so the screen and the file's own header are the same string. Preview table sorts via `SortableTh`, rows at `px-lg py-lg`. Gate and empty-state copy adapt to whether the report is date-scoped |
| ReportParamsBar | pre-filled / edited (Apply armed) / applied / missing / invalid range | `features/reports/ReportParamsBar.tsx` | A report's parameters with **Apply** and **Clear**. Owns the draft; `onApply` hands it up, `onClear` empties both. Apply is disabled while invalid *or* unchanged; Clear only while something is set. Fields arrive pre-filled with last week so the first Apply is one click, but the default is **shown, not assumed**. One status line under the controls (always present, so no layout shift) says what's missing, that Apply is pending, or that preview and file both cover the applied range |
| DownloadMenu | enabled / disabled (reason on `title`) | `features/reports/DownloadMenu.tsx` | The 5-format menu: Excel, CSV, PDF ("Via the print dialog"), HTML, Text. Local to features/reports — the projects `ExportMenu` is welded to `ProjectListRow` and the import-direction rule forbids reaching sideways for it. Excel is a zero-dependency HTML-workbook `.xls`; PDF prints a paper-styled copy through the browser's own Save-as-PDF (`lib/reportExport.ts`) |

## /components/features/access — feature-specific (User Access Control)

| Component | Variants | Location | Purpose |
|-----------|----------|----------|---------|
| UsersAccessPage | ready / loading / error; empty on no results | `features/access/UsersAccessPage.tsx` | `/admin/users` — old Users + Assignments merged; role pills in-row, direct-grant flags |
| UserAccessDrawer | sysadmin-locked checkbox state | `features/access/UserAccessDrawer.tsx` | Account info, role assignment, distinct direct grants, effective-access rollup |
| RolesPermissionsPage | tabs: Roles / Permissions; ready / loading / error | `features/access/RolesPermissionsPage.tsx` | `/admin/roles` — what access means, in one place |
| RolesTab | Sysadmin undeletable; guarded delete w/ member count | `features/access/RolesTab.tsx` | Role list with permission + member counts |
| RoleDrawer | create / edit (impact alert); inheritance w/ cycle guard | `features/access/RoleDrawer.tsx` | Name/description, inherits-roles picker, module-grouped permissions (inherited = locked) |
| PermissionsTab | module accordions, orphan badge, usage counts | `features/access/PermissionsTab.tsx` | Permission list grouped by module prefix |
| PermissionDrawer | create / edit (name locked, impact banner) | `features/access/PermissionDrawer.tsx` | Description, read-only rule, searchable route attachment |
| SystemAccessPage | ready / loading / error | `features/access/SystemAccessPage.tsx` | `/admin/system` — route registry (+ register) and code-defined rules, demoted as advanced |

## /components/features/system — feature-specific (System)

| Component | Variants | Location | Purpose |
|-----------|----------|----------|---------|
| DatabaseBackupsPage | ready / loading / error; empty | `features/system/DatabaseBackupsPage.tsx` | `/system/database` — backup .sql files; Create Backup / Upload Backup File; Restore DB + Delete file behind one Actions menu, both guarded |
| UploadBackupDrawer | empty / error | `features/system/UploadBackupDrawer.tsx` | Heading + `FileDropzone`, nothing else — no section or field wrapper |
| SoftwareSettingsPage | ready / loading / error; empty (no data vs no matches) | `features/system/SoftwareSettingsPage.tsx` | `/system/settings` — key/value config; `#` column keeps each row's real position under filters; Edit / Activate-Deactivate / Delete in the Actions menu |
| SoftwareSettingsFilterMenu | 0–6 active, count on trigger | `features/system/SoftwareSettingsFilterMenu.tsx` | The legacy in-header filter row as one menu: Type, Section, Key, Value, Status, Description + Clear/Apply |
| SettingDrawer | create / edit; per-type Value control | `features/system/SettingDrawer.tsx` | Value control follows Type — boolean → true/false Select, null → read-only, integer/float → validated number |
| AuditControlPage | ready / loading / error | `features/system/AuditControlPage.tsx` | `/system/audit` — Panel/Clean as page tabs, same pattern as `RolesPermissionsPage` |
| AuditPanelTab | loading | `features/system/AuditPanelTab.tsx` | Entries full-width + 4 dependents (Trails/Mails/Javascripts/Errors) as small multiples, each its own `BarChart`, own scale, 7-day total in the heading, one-line description of what it counts |
| AuditCleanTab | loading | `features/system/AuditCleanTab.tsx` | Retention purge: age Select, per-type stored/purgeable table, guarded delete naming exact per-type counts |

## /components/features/profile — feature-specific

| Component | Variants | Location | Purpose |
|-----------|----------|----------|---------|
| ProfilePage | ready / loading / error | `features/profile/ProfilePage.tsx` | `/profile` — Profile/Change Password as page tabs, same pattern as `RolesPermissionsPage`. Not part of a nav section (`activeItem=""`); reached from `SidebarProfile`'s account menu |
| ProfileDetailsTab | loading | `features/profile/ProfileDetailsTab.tsx` | Read-only Account (`DetailCard`) + Your access (grouped effective permissions) — the same content the old sidebar drawer showed, now on its own linkable page |
| ChangePasswordTab | loading | `features/profile/ChangePasswordTab.tsx` | The legacy screen's exact 3 fields (Old/New/Retype Password), validated: required, 8-char minimum, new ≠ old, retype matches new. Cancel + Change Password footer |

## /components/features/tcca — feature-specific

| Component | Variants | Location | Purpose |
|-----------|----------|----------|---------|
| TccaProjectsListPage | ready / loading / error, empty + no-results | `features/tcca/TccaProjectsListPage.tsx` | Standalone TCCA list at `/tcca-projects` |
| TccaProjectDetailPage | tabs: Overview / Documents / Checklist / Reports / GCP(deferred) | `features/tcca/TccaProjectDetailPage.tsx` | One TCCA project at `/tcca-projects/:id` |
| TccaProjectDrawer | create (with checklist applicability) / edit | `features/tcca/TccaProjectDrawer.tsx` | Add/edit a TCCA project; project link lockable |
| TccaOverviewTab | read-only (edit via header menu) | `features/tcca/TccaOverviewTab.tsx` | Details, notes, linked Elisen projects (add/remove) |
| TccaDocumentsTab | empty / populated | `features/tcca/TccaDocumentsTab.tsx` | Merged doc list + TCCA tracking (involvement/sent/state) |
| LinkRevisionDrawer | — | `features/tcca/LinkRevisionDrawer.tsx` | Pick a deliverable revision from the pool to link |
| DocTrackingDrawer | — | `features/tcca/DocTrackingDrawer.tsx` | Edit involvement / sent date / status for one link |
| TccaChecklistTab | N/A / in-progress / complete per item | `features/tcca/TccaChecklistTab.tsx` | Applicability + completion dates, per-phase counts |
| TccaReportsTab | PCC live; others pending definitions | `features/tcca/TccaReportsTab.tsx` | Generates the Project Completion Checklist |
| ProjectTccaTab | empty / populated | `features/tcca/ProjectTccaTab.tsx` | TCCA list + add entry point inside a project |
