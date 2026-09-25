# Component Inventory

One line per component: name, variants, location, purpose.

Updated as components are added or changed.

## /components/ui — design system primitives

| Component | Variants | Location | Purpose |
|-----------|----------|----------|---------|
| Button | primary / secondary / tertiary / danger × sm, md, lg, xl × default, hover, focus, active, loading, disabled | `ui/Button.tsx` | All actions; icon slots either side |
| Input | default, focused, typed, error, disabled; optional leading/trailing icons × `sm` (36px) / `md` (44px, default) | `ui/Input.tsx` | Single-line text, number and date entry. `size="sm"` for any field sitting in a **toolbar row** beside a button; `md` for stacked form fields — see "Control heights" below |
| Textarea | default, error, disabled | `ui/Textarea.tsx` | Multi-line text (descriptions, comments) |
| RichTextEditor | `toolbar="full"` / `"compact"` × default, focused, error, disabled | `ui/RichTextEditor.tsx` | Formatted HTML text — DDS Text and Regulation Requirement Text in `FlowStepPlan`, the two legacy fields stored as rich HTML rather than plain text. Built on Tiptap (`@tiptap/react` + `starter-kit`, `underline`, `subscript`, `superscript`, `link`, `image`, `extension-table`, `placeholder`). `full` covers every mark plus lists/indent/table/image (legacy DDS Text toolbar); `compact` is marks + link + image only (legacy Requirement Text toolbar, a lighter editor for a mostly-pasted citation). Deliberately omits the legacy editor's cut/copy/paste, fullscreen and Source-view icons — the browser's own clipboard and zoom already do that job, and a decorative button that doesn't do anything is worse than no button. Rendered HTML uses the `.rte-content` styles in `styles/globals.css` (no Tailwind typography plugin in this project) |
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

**A revision's document has a name and a link, kept separate** (client
instruction, 2026-09-25). `ApprovalRevision.document` (the filename,
`FileDropzone`) and `ApprovalRevision.documentUrl` (optional — most of the
legacy export never linked its files) are two different facts about one file,
same split as `DocRevision.url` on the Documents side. Both `ApprovalRevisionsPage`
(the global Revisions list) and `ApprovalDetailPage`'s own Revisions tab render
the Document cell as a clickable button — `isOpenableUrl(documentUrl)` — with
the filename as its label, and add an **Open PDF** item to the row's
`ActionsMenu` when there's a link to open; with no `documentUrl`, the cell falls
back to plain text exactly as before. `ApprovalRevisionDrawer`'s Document
section keeps three actions distinct rather than folding them into one: a
"Current document: *name*" line with its own **Open PDF** button, a
**Document URL** `UrlField` for setting or fixing that link, and
`FileDropzone`'s **Replace document** below it for swapping the file entirely
— naming what's there, opening it, and changing it are three different jobs.

**"Raise Revision" reads "Add Revision"** everywhere it appears (both list
pages, the empty state, and the drawer's own title/submit button) — client
instruction, 2026-09-25, "for clearer UX." Behavior was already correct and
needed no change: adding a revision has always created a new record
(`addRevision`, a fresh id) alongside the existing ones rather than overwriting,
and `Edit revision` has always scoped to the one revision it's opened from.

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

**"Created For" is not "Used In."** A `DocRevision` already carried
`initialProjectId` — the one project it was made for — separately from
`ProjectRevisionLink`, the many-to-many table of every project it's since been
linked to. The client's own example: a drawing revision created for 3207-00
ended up used only on 3241-00 and 3277-00, never on the project that spawned
it. `DocumentsPage` (Deliverables/Design Data workspace) surfaces both as
their own table columns and their own `RevisionViewDrawer` fields —
**Created For** (one project, `createdForLabel`, plain text, `—` if that
project record no longer exists) beside the Revision's dates, and **Used In**
(a `DetailCard` of badges, `usedInLabels`) as its own card below, never
merged into one "Projects" field (client instruction, 2026-09-25). Only this
workspace's table/drawer show "Created For" as a column — `ProjectDocumentsTab`
already marks reuse a different way, an `ExternalLink` icon beside the number
when `rev.initialProjectId !== projectId`, since inside a project's own tab
the interesting fact is just "did this originate elsewhere," not which one.

Reference implementations: `ProjectApprovalsTab`, `ProjectDocumentsTab` and
`ProjectTccaTab` — deliberately the same shape. Copy one when a sixth record type
appears.

### A scrollbar never runs alongside a table's header or a tab strip

Standing rule (client instruction, 2026-09-24) for **every** internally-
scrolling table in the app — a table with a `max-h-[…]` or `flex-1` bounded
frame and its own `overflow-auto`, not a page-level list that scrolls with
`<main>`. A `sticky top-0` thead inside one shared `overflow-auto` box still
sits inside that box's own scroll track, so the scrollbar visually runs
right alongside the header (and any `TableTabs` strip above it), and the
header has to share the box's own reduced width. Two tables instead of one
scrolling box fixes both: a frozen, non-scrolling header table on top
(full width, no scrollbar gutter to share), and the body in its own
`overflow-auto` box below it, which owns the scrollbar alone — so the bar
only ever runs alongside the rows it actually scrolls.

Both tables need `table-fixed` with a shared `<colgroup>` (same widths, same
order, including an explicit width for a plain "Actions" column) so their
columns stay pixel-aligned. (An earlier pass gave the header table its own
`paddingRight: 4` to try to match the body's scrollbar gutter — that's
undefined/inconsistent behavior on a `border-collapse` table in real
browsers, and was the actual cause of a scrollbar-inconsistency bug reported
after this pattern first shipped. Removed everywhere; don't reintroduce it.)

**The header also needs to stay in horizontal sync with the body**, not
just visually split from it — `overflow-hidden` on the header's own wrapper
only clips it at whatever position it first rendered at, so a table wide
enough to need horizontal scroll leaves the header stranded while the body
scrolls underneath it. This went unnoticed for months because none of these
tables were wide enough to actually trigger horizontal scroll until
`FlowStepProject` grew enough columns to need it (client instruction,
2026-09-24). Fixed with `useSyncedScroll()` (`patterns/useSyncedScroll.ts`):
wrap the header table in a `<div ref={headerRef} className="shrink-0
overflow-x-hidden">`, and add `onScroll={onBodyScroll}` to the body's own
`overflow-auto` wrapper — every table below now does this.

**Both tables need to render at exactly the same width, every time** — not
just the same `<colgroup>`. Both used to be `className="w-full table-fixed
…"` with `style={{ minWidth: TABLE_WIDTH }}`: `w-full` stretches the table to
its container's full width whenever that's wider than `TABLE_WIDTH`, and
`table-layout: fixed` still redistributes that extra width across every
column even when each one already has an explicit `<col>` width (CSS2.1
§17.5.2.1 — an explicit column width is a floor, not a ceiling, once the
table itself is wider). The header's container never has a vertical
scrollbar; the body's `overflow-auto` one does whenever there are enough
rows, so it has a few px less real width to redistribute — meaning the two
tables' same-named columns could each end up a different actual width,
independent of anything in the `<colgroup>` itself, and the sticky Actions
column visibly landing at two different widths was the most obvious symptom
(client instruction, 2026-09-24; a narrower Actions column, shrunk the same
turn, made the leftover width to redistribute bigger and the mismatch more
visible than it likely was before). Fixed by dropping `w-full` and setting
`width: TABLE_WIDTH` (not `minWidth`) instead — the table now renders at
*exactly* `TABLE_WIDTH` always, on both sides, so there is never leftover
width for either table to redistribute differently.

That fix's own trade-off — a table narrower than its container just sat at
its own width, unstretched, leaving a blank strip down the card's right side
on a wide screen — was itself flagged as a bug (client instruction,
2026-09-24: reported on `GcpDelegationTab`, checked and fixed on all 8).
Fixed without reverting the width-mismatch fix above: every table's
`<colgroup>` gets one trailing spacer `<col />` (no width, so `table-fixed`
gives it 100% of whatever's left) plus a matching empty `<th aria-hidden />`
/ `<td aria-hidden />` in each row, and the table goes back to `w-full` +
`style={{ minWidth: TABLE_WIDTH }}`. Every real column keeps its own
explicit width regardless (`table-fixed` never touches a column that has
one) — only the new empty column stretches, so the header/body pixel-match
above is untouched. `FlowStepProject` puts the spacer *before* its sticky
`Action` column, not after — `Action` is `position: sticky; right: 0`,
pinned to the scrollport's own edge regardless of source order, so a
trailing spacer after it would sit uselessly behind the pinned cell instead
of absorbing anything. `AtaChaptersPage`'s sub-chapter table needed no new
column at all: its `Definition` column already has no explicit width, so it
already absorbs 100% of the stretch on its own once the table can stretch —
strictly better than a blank spacer, since that room goes to actual
long-form text instead of empty space.

A sticky Actions column's own elevation is the `shadow-sticky` token
(`--shadow-sticky: -4px 0 14px 0 rgba(71, 85, 105, 0.12)`, `tokens.css`) —
client-supplied spec, read directly off their design tool, in place of the
generic `shadow-sm` two tables (`FlowStepPlan`, `FlowStepProject`) started
with; a left-cast shadow reads as "floating over" the content scrolling
underneath it in a way a bottom-only shadow doesn't.

**Interactive header controls (sort buttons, a select-all checkbox) stay in
the one visible frozen table** — never duplicate them into a hidden second
copy for the scrolling table below; that would either hide a real control
from assistive tech or create a confusing duplicate. The trade-off, noted
deliberately rather than silently: splitting one logical table into two DOM
tables means the scrolling table's cells lose native header association
(no `scope`/`headers` link back to the frozen `<th>`s two tables away) — the
standard cost of this pattern industry-wide. Every row's own interactive
control already carries a full `aria-label` in this app's tables regardless
of header association, which keeps the practical accessibility loss small.

Reference implementations, all applied: `FlowStepInitialize` (Scope Rules),
`GcpDelegationTab`, `RegulationStructurePage` (Subsections),
`RegulationGroupsPage` (Regulation List), `AtaChaptersPage` (Sub chapters),
`FlowStepProject` (the TCCA project picker), and `ReportDetailPanel` (the
generic report preview — dynamic column count, a shared 120px-per-column
`<colgroup>`). A rail nav list (Subpart, ATA chapter, Regulation group) is
**not** this issue — its header row already sits outside the scrolling
list as a separate `shrink-0` sibling, which is the correct shape already.
Live Storybook copy of this rule: `Patterns/Overview` →
`FrozenTableHeaderExample`.

**`table-fixed` needs every column to have an explicit width once you split
it this way** — a column left flexible (no width, meant to soak up
whatever's left) can collapse to a few px if its siblings' widths already
sum past the table's own `minWidth`. Shipped once, on `FlowStepProject`
("Project Description" rendered at 4px), before being caught and fixed by
giving it an explicit width and deriving the table's total width from the
real column sum instead of a hand-typed number.

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

### Tabbed page layout — tabs and table are separate cards

Standing rule (client instruction, applies to every tabs-over-a-table screen
in the app, not just the one it was given on): the tab strip and the active
tab's table are two separate bordered containers stacked vertically, never
one shared card wrapping both. Nothing else sits between them — no separate
"Total N / search" card floating above the table.

- The page's one "Add" action lives in the page header, top-right
  (`AppShell`'s `headerActions`), not inside the tab panel — and its label
  always names the active tab ("Add FOC", "Add Discipline"), never a bare
  "Add". A tab with no working create flow yet (still an unbuilt placeholder)
  shows no Add button at all — a button that opens nothing is a
  half-finished implementation.
- The search box for the active tab's table sits in the header too, beside
  Add — not inside the tab panel — with its placeholder naming what that tab
  searches by. Search state is owned by the page and passed down as a
  `query` prop; each tab panel filters with it but doesn't render its own
  search input.
- Each tab's label carries its row count as a pill (`TableTabs`'s `count`
  prop) — "FOC 63", "Delegation 720" — so the reader knows how large each
  list is without opening it.

Reference: the app's own Roles & Permissions screen (tabs/table separation,
header Add) and its Aircraft / Serial Numbers reference-data screen (header
search, tab count pills). First applied to `GcpPeoplePage` (all three tabs),
2026-09-23 and 2026-09-24 — see docs/DECISIONS.md.

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
| TableTabs | active / inactive, with/without counts, overflowing | `patterns/TableTabs.tsx` | THE standard for slicing one table several ways. The mirror of Pagination: no border/bg of its own, renders as the **first** child inside the same card as its table so it reads as the table's header. Active tab = accent underline sitting on the card's dividing line (`-mb-px`), count in a pill beside the label. Real ARIA tabs (arrow keys, roving tabindex, active tab scrolled into view); the table is the `tabpanel`. A strip too long for its card (GCP's subpart tabs) scrolls, with a **full-height arrow cell** pinned at whichever edge still has more to show — the strip's own height, `bg-neutral-25`, one `border-b` carrying the tablist's bottom line across it, and a single stroke on the inner side (`border-r` left / `border-l` right) dividing it from the tabs (client instruction, 2026-09-24, replacing a small rounded button floating on a fade-to-white gradient — the stroke marks where the tabs stop, so the gradient went with it). Clicking pages the strip by 80% of its visible width; both cells show at once mid-strip. Tab padding is `py-lg`, not `py-base` — client instruction, same day, the row read as cramped against the card's edges. Never render these as standalone pills/chips floating above the table |
| SectionTabs | active / inactive, with/without counts, overflowing | `patterns/SectionTabs.tsx` | The other tab strip: it swaps whole **sections of one record** (Project Detail's Overview / Work Packages / Team, GCP's Cert Basis / Cert Plan / Reports) rather than slicing one table. Unlike `TableTabs` it sits above the content it swaps and carries its own bordered bar. Extracted from the copy hand-rolled in `ProjectDetailPage` and `TccaProjectDetailPage`; those two still hold their own copies and should migrate to it when next touched. Storybook: `Patterns/Overview` → SectionTabsExample |
| DetailCard / DetailField | with/without edit icon; empty field; `nowrap` | `patterns/DetailView.tsx` | THE standard read-only View: bordered card + muted-label/plain-value field grid. Never use a disabled form input to show read-only data — it dims real values to the same gray as an empty placeholder. Pass `nowrap` on short codes (Serial No, Reg. No, Model No, IDs) |
| BarChart | populated / all-zero (`emptyLabel`) | `patterns/BarChart.tsx` | THE standard single-series bar chart — no chart library in the app, and one series doesn't warrant one. Built from tokens, HTML not SVG (labels stay real type size at any width). Axis is a round *step* (0/2,000/4,000/6,000), never a round max, so gridlines are numbers a reader can hold in their head. `tone="danger"` only for series that *are* a fault count. Carries an `sr-only` data table — values never depend on reading a bar height. One series per chart, always: a second measure means a second scale, so it gets its own chart, never a second y-axis |
| ProgressMeter | on-track / near / over / complete / no-budget; sm & md | `patterns/ProgressMeter.tsx` | THE **budget-used** bar (hours consumed ÷ hours budgeted — not "progress", which would imply work completed and could never exceed 100%). Fill colour comes from the health state and is always paired with the percentage in text — state is never colour-alone. Over budget the track rescales to the overrun with a notch marking where the budget ran out, so the bar never contradicts the figure beside it. `role="progressbar"` with aria-valuetext |
| PersonCell | named / empty; primary & secondary label | `patterns/PersonCell.tsx` | THE way a person appears anywhere: `accent-subtle` disc of `accent` initials, then the name. Use for every person — responsible, contact, owner, employee, next action. `secondary` shrinks only the label. `min-w-0` + `truncate` keeps the avatar inside the cell. See the `PersonExample` story |
| Avatar | sm (20px) / md (36px) / lg (44px) | `patterns/Avatar.tsx` | Initials only, **one fill and one text colour, no tone prop** — colour-coding people by role rendered the same person differently on different screens. `lg` heads a detail page (PersonDetailPage) |
| ChipOverflow | ≤max / overflowed / expanded / empty | `patterns/ChipOverflow.tsx` | THE chip list for table cells: at most 2 chips then **+N more**. Exists to enforce the two-line row rule structurally — a bare `.map()` grows with its data. Expands in place by default; pass `onShowAll` in a table row so the count opens a view instead of growing the cell. See `ChipOverflowExample` story |
| DetailCard / DetailField | read-only record; empty field | `patterns/DetailView.tsx` | THE View layout, used by every View action app-wide: bordered card, label/value grid, em dash when empty. **Never** a disabled form — a greyed input renders a real value in the same grey as an empty one. See `ViewLayoutExample` |
| SortableTh | idle / active-asc / active-desc / not-sortable | `patterns/SortableTh.tsx` | **THE sortable column heading** — every table in the app uses it, never a hand-rolled `<th>` + button. Owns the `<th>`, `scope="col"`, `aria-sort` and the icon button; the calling table keeps its own padding/width classes. A resting neutral ⇅ marks a heading as clickable; only the active column shows a single accent ↑/↓, and the label keeps the header row's own weight and colour either way. Omit `sortKey` for a plain heading (Actions). For a cell whose control is a `SortMenu`, pass `ownsKeys` so the cell still reports `aria-sort`. Storybook: `Patterns/Overview` → SortableHeaderExample |
| useTableSort | — (hook) | `patterns/useTableSort.ts` | Sort state + sorted rows for one table: `useTableSort(rows, accessors, { initial, onSortChange })` → `{ sorted, sort, setSort }`. One accessor per column saying what it sorts on (rarely the string in the cell — a badge sorts by its underlying status, a two-line cell by whichever line the heading names). Numbers compare numerically, strings through an `Intl.Collator` with `numeric: true` (so `3200-00` sorts before `3300-01`) and `sensitivity: 'base'`, booleans false-then-true. **Blanks sink in both directions** — an em dash is the absence of a value, not a value below every other one. Sort runs on the whole filtered set, before `slice(0, visibleCount)`; pass `useInfiniteReveal`'s `reset` as `onSortChange` |
| useSyncedScroll | — (hook) | `patterns/useSyncedScroll.ts` | Pairs with the frozen-header table pattern (see "A scrollbar never runs alongside a table's header or a tab strip" above): `const { headerRef, onBodyScroll } = useSyncedScroll()` — `headerRef` goes on the header table's `overflow-x-hidden` wrapper, `onBodyScroll` on the body's `overflow-auto` wrapper's `onScroll`. Mirrors the body's `scrollLeft` onto the header so a table wide enough to need horizontal scroll doesn't leave the header stranded (client instruction, 2026-09-24, after `FlowStepProject` grew enough columns to expose this everywhere else too) |
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
| Truncate | 1 line / 2 lines | `patterns/Truncate.tsx` | THE standard for long free text in a table cell: `line-clamp`, full text on hover via native `title`. **Hard rule, every table in the app: no cell's text ever wraps past 2 lines.** Any column holding free text (a title, a description, an exemption note) wraps it in `Truncate` — `lines={2}` by default, `lines={1}` for a cell that sits beside short codes — and the column needs a measured width to clamp against, either `table-fixed` with a `width` on its `<th>` (see `RegulationListPage`, `FlowStepInitialize`) or a `maxWidth` style on the `<td>`. Without one of those two, the browser just grows the column instead of wrapping. Never use on short codes — see the `whitespace-nowrap` rule below |
| AccordionSection | open / closed, optional meta | `patterns/AccordionSection.tsx` | Collapsible grouped content (checklist phases) |
| Avatar | tone: accent / success | `patterns/Avatar.tsx` | Initials circle from a full name — Project Detail's People section |
| proportionalWidths | — | `lib/tableWidths.ts` | Turns a table's per-column pixel weights into `%` shares of the table's own width, so a screen wider than the table's real content grows **every** column in proportion instead of leaving the extra as dead space. Fixes a different failure mode than the earlier trailing-spacer fix (still correct where a table already has one column that legitimately absorbs real content, e.g. `AtaChaptersPage`'s Definition): a table with only a *few* narrow, fixed-width reference columns (a code, a badge, a boolean) had every row bunched against the card's left edge with a blank void before Actions — an invisible spacer at the end doesn't help there, it just moves the void one column later (client-reported, 2026-09-25, twice: GCP Reference Lists → DDS Type/DDS Text, and People & Authority → Delegation, whose Section Root/FOC Code/Limitation/Active/Actions left ~770px of nothing on a 1728px screen). Pass the same pixel numbers a table already keeps for its `minWidth` floor — they double as each column's relative weight. Applied to `GcpDelegationTab`, `GcpCertBasesPage` (replacing their old trailing `<col />` spacer — colSpans in `GcpCertBasesPage`'s group-header rows dropped by one to match the now-shorter colgroup), and `GcpDdsTab`/`GcpMocTab` (which had no colgroup at all; DDS Text and MOC Description used to be the one unconstrained column soaking all the slack — for DDS that's every row on every one of the legacy dataset's 10 real rows, so it rendered as a huge, entirely empty column). Left `RegulationListPage`, `FlowStepProject`, `FlowStepInitialize` and `RegulationListPage`'s sibling many-column tables unchanged — verified live at 1728px, they already fill the card on their own since most of their several columns are unconstrained real-content columns, not one lone survivor among narrow ones. `RegulationGroupsPage`/`RegulationStructurePage` are narrow by design (a master–detail rail), not this bug |
| FileLink | link / plain (no stored URL) / empty | `patterns/FileLink.tsx` | **THE way a stored file is shown** — one line, clipped, clickable. A file reference here is usually a SharePoint URL with no filename in it (120+ characters of unbreakable token): printed as a plain value it either overflowed its card or, once `Stat` learned `break-words`, wrapped to five lines and shoved the rest of the drawer down (client instruction, 2026-09-25). Takes `url` and an optional `label` (a filename where the record has one; defaults to the URL). **Blue and underlined always, not on hover** — client instruction relayed 2026-09-25, "blue or underline jis se pata lage ke ye clickable hai": a filename in a table cell reads as data, not as a control, so a hover-only underline means nobody finds it without sweeping the column, and colour alone would signal by colour alone (CLAUDE.md rule 6). A record that names a file but stored no link renders as plain text with a muted `FileText` icon — never a dead link. `flex` + `min-w-0` because `truncate` needs a definite width to clip against; the caller supplies a shrinkable cell, which `Stat`/`DetailField` already do. Replaced four hand-rolled copies of the same anchor (`RevisionViewDrawer` File, `RegulationDetailDrawer` Source, and the three approvals document cells). Actions menus keep their own **Open PDF** item alongside it. Storybook: `Patterns/Overview` → **File Link Example** |
| AppShell | active nav item / child; optional headerLeft / **description** / headerActions / **fill** | `patterns/AppShell.tsx` | Sidebar + header frame; heading left, page controls right. Owns the viewport: `h-screen`, never scrolls itself — `main` scrolls. `fill` hands the height to the page instead (master–detail), which ends its panes at the fold with `min-h-0 flex-1`. `description` is the one-clause line under the heading — never a `<p>` in the page body. The sidebar `<aside>` shows from `tablet:` (768px) up, not `laptop:` (1280px) — client instruction, 2026-09-24: it was disappearing on an ordinary laptop/smaller-desktop window that never actually reached 1280px CSS pixels wide, even though the window looked plenty wide in a screenshot (display scaling/zoom can make a window's own device pixels read much wider than its CSS viewport). There's no mobile nav fallback (no hamburger menu) below `tablet:`, so the sidebar being hidden below that width is a real, pre-existing gap, not something this change touches. **Collapsible** (client instruction, 2026-09-25): a `PanelLeftClose`/`PanelLeftOpen` toggle sits beside the logo and swaps the aside between `w-64` and `w-16`, transitioning on width alone. Collapsed, each nav row centres its icon and moves its label onto `title` + `aria-label` so it keeps an accessible name, child lists are hidden, the logo drops (one lockup, no separate mark) and `SidebarProfile` takes a `collapsed` prop that shows the avatar alone. Clicking a parent section from the collapsed rail expands the sidebar *and* opens that section, rather than being a dead click with nowhere to show children. State lives in `useUiStore`, **not** `useState` here: every page mounts its own `AppShell`, so component state would reset the rail to full width on every navigation. No page needed changing for the content to reflow — `<main>` was already `flex-1 min-w-0`, so it absorbs the 192px on its own; verified across all 27 routes × both states × 768/1280/1440. `main` is now `overflow-x-hidden` as well as `overflow-y-auto`: a wide table's own `overflow-x-auto` still leaks its content width into `main`'s `scrollWidth`, which let the whole page (heading included) be dragged sideways off its gutter onto dead space — `main` scrolls vertically only, every wide table scrolls inside its own container. Storybook: `Patterns/Overview` → **Sidebar Expanded** / **Sidebar Collapsed** |
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
| ProjectsTable | default, loading, financials hidden | `features/projects/ProjectsTable.tsx` | Project rows with status/priority badges; `pagination` prop renders inside the same card as its table's footer. Duplicate (client instruction, 2026-09-24, same pattern as `duplicateTcca`/GCP Projects): `projectsStore.duplicateRow(id)` splices the clone directly after the original rather than prepending to the top, copies `number`/`subNumber`/`title` as-is (no more regenerated number or `" (Copy)"` title suffix), resets `actualHours`/`status` (0 / "quoted" — those describe progress already made, which a fresh copy hasn't, unlike a name/number), and sets `isCopy`. An `info`-tone "Copy" `Badge` shows **inline next to the number** when set, never on its own line (client instruction, 2026-09-24 — a row is two lines, number-plus-badge then title, never three) — the Project column's own `min` moved 88 → 145 (and `FLEX_FLOOR` 296 → 353 with it) so it always has room, verified at the table's own documented 1280px no-horizontal-scroll floor, the tightest real case |
| AddProjectDrawer | create: 2-step (no TCCA) / 3-step (TCCA required); edit: single screen | `features/projects/AddProjectDrawer.tsx` | Create uses the Stepper (Cancel/Back/Continue/Create Project); edit shows every section at once with no stepper (Cancel + Save Changes only) — the standard Edit footer used everywhere else |
| StepBasicInfo | with/without financial section | `features/projects/StepBasicInfo.tsx` | Step 1 — identification, company, scope, TCCA question |
| StepAdditionalDetails | — | `features/projects/StepAdditionalDetails.tsx` | Step 2 — dates, aircraft, proposal, notes |
| StepTccaSetup | — | `features/projects/StepTccaSetup.tsx` | Step 3 — TCCA project + checklist applicability |
| useAddProjectForm | — | `features/projects/useAddProjectForm.ts` | Form state, per-step validation, dynamic steps |
| ProjectDetailPage | all six tabs built | `features/projects/ProjectDetailPage.tsx` | Full project detail screen at `/projects/:id`. Duplicate calls the same `projectsStore.duplicateRow(id)` `ProjectsTable` uses, then navigates to `/projects` (the copy is now sitting right below the original there); the header's own number heading shows the same "Copy" `Badge` `ProjectsTable` does when `row.isCopy` |
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
| TimesheetTable | self (locked once validated) / admin (`canValidate`, full control), `showComment` (default on, off on Hours Worked → All Entries) | `features/timesheet/TimesheetTable.tsx` | Shared table; Validated/Active as Badge, 3-dot row actions; `pagination` prop renders inside the same card as its table's footer. With `showComment={false}` the Comment column is dropped (not hidden) — the field lives in the row's own View/Edit drawer, full width via `FormField`'s `fullWidth`. **Widths are measured pixels + a shared `GUTTER`, never percentages:** once every heading gained a sort icon, nine of twelve headings were wider than their own cell and the header row read as one merged run. `minWidth` is derived from the widths so it cannot drift. Duplicate (client instruction, 2026-09-24): `timesheetStore.duplicateEntry(id)` splices the clone after the original (not prepended), copies every field as-is except `validated` (reset to `false` — an already-reviewed original's clone hasn't itself been reviewed, a real business rule kept from the handler this replaced), sets `isCopy`; an `info`-tone "Copy" `Badge` shows next to `row.projectLabel` in the Project cell when set |
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

## /components/features/gcp — feature-specific

The legacy GCP menu carried 23 screens across one flat list. They collapse into
five sidebar entries: the project workspace where the daily work happens, and
four library sections it reads from. Nothing was dropped — each legacy screen is
a tab, a detail view inside its parent row, or an action. Screens whose purpose
the client has not yet confirmed (the standalone GCP record list, Cert Plan
Copy, Regulation Checklist) are marked as such in the panel copy and may move.

| Component | Variants | Location | Purpose |
|-----------|----------|----------|---------|
| GcpFlowPage | 5 steps, each gated on the one before | `features/gcp/flow/GcpFlowPage.tsx` | The client's requested alternative to the tab menu: one route at `/gcp/flow` that runs Project → Certification Basis → Scope Rules → Compliance Plan → Reports, `?step=` and `?project=` in the URL. Nav label and page heading are **GCP Projects** (renamed from "Certification Flow", client instruction, 2026-09-24 — "choose a project to build its compliance plan" is the step-1 description now) — this replaced the old `/gcp/projects` list + `/gcp/projects/:id` tab workspace entirely, so `GcpProjectsPage.tsx`, `GcpProjectWorkspace.tsx`, `GcpTabPanel.tsx` and `GcpReportsTab.tsx` are deleted (they had no other callers) and `/gcp/projects` now redirects to `/gcp/flow`. Step 1 is a plain landing table — **no `Stepper`**, since nothing's been picked yet — with the page's one heading (a count pill for how many TCCA projects match the search, via `headerLeft`) and, in `headerActions`, the project search box and its own header CTA, **Create GCP** (opens a drawer with the legacy reference screen's full field set — client instruction, 2026-09-24: TCCA Project, Regulation Section, Regulation Amdt, DAO Specialty Code, MOC Code, FOC Code, Deliverable Number, all `SearchableSelect` except the free-text Deliverable Number — Section/Amdt are two separate dropdowns, never merged into one combined value the way the legacy screen shows them, and Amdt's own options cascade off whichever Section is picked, clearing if it's no longer valid; only TCCA Project/Section/Amdt are required. "Create" writes the picked regulation into the project's `CertBasis`, marks its `PlanEntry` affected, adds a `GcpItem` if any of DAO/MOC/FOC/Deliverable were filled, and lands on step 4 with that rule selected — the same destination Scope Rules already routes to when a rule is picked there); the `Stepper` only renders from step 2 on, once the wizard is actually running. Step 1 used to show two headings stacked (this page's title, then `FlowStepProject`'s own "All Projects") with the search sitting in a second row below them — collapsed to the one heading + one header row so more table rows fit above the fold; the search query is state on this page (`projectQuery`), passed down to `FlowStepProject` as a controlled prop. From step 2 on, a "Back to all projects" link replaces the page title, and a project summary card sits under the stepper — a `FolderKanban` icon, number + its GCP progress `Badge` inline on the same line, description underneath, then a tinted band. On every step but 4 that band is the usual `Stat`s (Elisen Project, Applicable rules, Affected rules, Compliance, Opened); on step 4 it swaps to the *current rule's* identity instead (Subpart Code/Description, Subsection Code/Title, Regulation Section/Amdt/Title, Regulation Url — project number/description aren't repeated here, the header above already shows them) via shared `ReadOnlyField`s, 3 per row. On step 4 the header's right side also carries the rule-picker nav — "Regulation N of M" plus a joined Prev/dropdown/Next control (`SearchableSelect variant="bare"` as the middle segment, same shape as `PhoneInput`) — since the progress badge moved up next to the title, freeing that slot. The `planIndex` driving which rule is current lives here, not in `FlowStepPlan`, so this nav and that step's own fields always agree. Every step uses `AppShell`'s `fill` (not just step 1) — the stepper and summary card are `shrink-0`, and each step sits in a `min-h-0 flex-1` slot below them, so the browser window itself never scrolls: step 1 and 3's own tables fill that slot and scroll their rows internally (sticky `thead`), steps 2/4/5 wrap in a plain `overflow-y-auto` pane since they're forms rather than tables |
| FlowStepProject | populated / no-results / loading / error | `features/gcp/flow/FlowStepProject.tsx` | Step 1 — a full-width sortable table of TCCA projects: TCCA Project (number on top, description underneath, one merged column — client instruction, 2026-09-24, was two separate columns), Elisen Project #, Regulation, Amdt, Reg Title, Discipline, MOC, FOC, Deliverable #, Applicable, Affected, Opened, Status, Action — that exact sequence (client instruction, 2026-09-24), every column's width tightened to its own content. Regulation/Amdt/Reg Title and Discipline/MOC/FOC/Deliverable # are per-*regulation*/per-*GCP-item* fields on a table that stays one row per *project* (confirmed with the client rather than exploding into one row per rule) — each shows its project's **first** applicable rule / first GCP data item, a plain `—` when there is none, and a native `title` tooltip naming how many more when there's more than one (`primaryRule`/`primaryItem` in the `rows` memo); `Applicable`/`Affected` already carry the actual count. These cells (and Elisen Project #) are `truncate`, not `whitespace-nowrap` — client instruction, 2026-09-24: a real Deliverable # (`A4ALL-2-08-1-1623-CR`) is long enough to overflow its column and visually run into the next one under `table-fixed`, since `whitespace-nowrap` alone doesn't clip; `truncate` (Tailwind's `overflow-hidden` + `text-overflow: ellipsis` + `white-space: nowrap` in one class) does, and the cell's own `title` attribute (the full value, or full value + "+N more" where `primaryRule`/`primaryItem` already had one) still surfaces it on hover. No heading of its own — `GcpFlowPage` was showing two stacked ("Certification Flow" then this step's own "All Projects") for step 1 only; collapsed them to the page's one heading with the project count pill and search moved into the page header, so this component takes `query`/`onQueryChange` as props instead of owning search state. The whole row is clickable (`onClick` on `<tr>`, `cursor-pointer`, hover tint) since every column leads to the same place. Action is `sticky right-0` (own `bg` — `group-hover:bg-neutral-50`, or `bg-accent-subtle` for `isCurrent`, via `group` on the `<tr>` — `z-sticky`, `shadow-sticky`, `border-l border-border-default`) — same pattern `FlowStepPlan`'s GCP Data table already uses, safe to add here since `useSyncedScroll` fixed the header/body horizontal-scroll-sync bug this table used to have. Its column is 64px (matching `ACTIONS_WIDTH` on `GcpCertBasesPage`/`GcpDelegationTab`) — client instruction, 2026-09-24: was 150px, sized for the text button it used to hold before becoming icon-only. The header cell's own bottom border is `border-b-neutral-300` (not the row's own `border-border-default`/neutral-200) — a cell-level border wins over its row's under `border-collapse`, per the client's exact reference CSS (`border-bottom: 1px solid var(--Primitive-Neutral-300, #CBD5E1)`) for making the sticky column's header read as prominent against its neighbors; its `bg-neutral-50` already matched their `#F9FAFC` closely enough (this app's own `--color-neutral-50` is `#F8FAFC`) that it didn't need a change. Action's own single "go to the flow" `Button` is now an `ActionsMenu` (client instruction, 2026-09-24) — a `⋮` trigger (`onClick` stops the row's own click from also firing) with 5 items: the status label itself ("Start GCP"/"Continue GCP"/"View GCP", `ArrowRight` icon, same handler the old button had), then **View** (navigates to `/tcca-projects/:id`, matching `TccaProjectsListPage`'s own View), **Duplicate** (`useTccaStore`'s `duplicateTcca(id)` — client instruction, 2026-09-24: the copy is spliced in directly after the original, not prepended to the top of the list, every field including `number` copied as-is, only `id` is new — differentiated purely by an `isCopy` flag, rendered as an `info`-tone "Copy" `Badge` next to the number in the TCCA Project cell; no `Duplicate` precedent existed yet anywhere in the app, so this is the first), **Edit** (opens `TccaProjectDrawer` in edit mode, reused directly from `features/tcca` — a cross-feature import; `ProjectDetailPage`/`DocumentsPage` already do the same sideways reuse elsewhere in the app) and **Delete** (`ConfirmDialog`, same wording `TccaProjectsListPage` uses), both wired to the same `useTccaStore` actions that page uses. Status is a `Badge` (Not Started / In Progress / Complete) sized to hug its content — its wrapper is `flex flex-col items-start`, not `grid`, because a `grid` parent stretches an `inline-flex` child (like `Badge`) to the full column width instead of letting it hug. Opened is pinned to one line (`whitespace-nowrap` + a wider column) rather than `DateText`'s usual break-when-starved default, since this table has the room. `GcpFlowPage` passes `fill` on this step only, so the table fills to the fold and scrolls its own rows (`min-h-0 flex-1` down to the table, `h-full overflow-auto` inside it) instead of a fixed pixel height. A `shrink-0` row of four `StatCard`s sits above the table — client instruction, 2026-09-24, the same lead-with-stats shape Projects List uses: Projects shown, Not Started, In Progress, Complete, each counted off the same search-`filtered` rows the table itself renders (a `statusOf` helper mirrors the exact Not Started/In Progress/Complete logic each row's own Status `Badge` already uses), so the stats and the count pill in the heading always agree |
| FlowStepBasis | matched / no-match | `features/gcp/flow/FlowStepBasis.tsx` | Step 2 — no separate Master Cert Basis identity; two `MultiSelect` dropdowns, Regulation Section and Regulation Amdt, scope the basis directly from the rule pool (matching the legacy Cert Basis list's own filters). A regulation qualifies once it matches whichever of the two is picked; picking neither shows no matches. The matched/pending table is just those two fields, Regulation Section and Regulation Amdt, `whitespace-nowrap` so every row stays one line — a Regulation Title column briefly lived here (added, then reverted, both client instruction, 2026-09-24) and made rows wrap to two lines for a long title; back to the original two-field table, deliberately kept minimal. "Attach N regulations & continue" saves the basis (implicitly project-specific, aircraftModel defaulted to the project number) and moves to Initialize. Heading and description sit unboxed above the fields' own card — the standing shape for every step's header now, not just Step 1 and Step 3 |
| FlowStepInitialize | subpart tabs, affected count, search, no-results | `features/gcp/flow/FlowStepInitialize.tsx` | Step 3, "Scope Rules" on the stepper — every applicable rule for the aircraft (the whole rule pool: Subpart, Subsection, Section, Amdt, Title, Source, Assigned; no Section Root column). A `TableTabs` strip — All, then every active subpart this rule pool actually uses (never the full, mostly-inactive Subpart catalog), each with its own row count, plus a shared "Other" tab for anything with no named/active subpart — sits as the table's own first child, so picking a category narrows the pool before scanning it. A leading checkbox column (with a header select-all/indeterminate `Checkbox`) is how the reader marks a rule Assigned; the trailing Assigned cell is a read-only Yes/No tag (green/red) reflecting that state. `table-fixed` on measured widths, Title `Truncate`d at 2 lines. Heading and description sit in the same row as the "N in this view · N affected" count (client instruction, 2026-09-24 — was "applicable"; the number counts rules the reader has *marked*, which is what the heading, the description and the Create button all call affected) (scoped to the active subpart tab + search, per the "stats describe what's on screen" rule) and the search box. The table body scrolls in its own `min-h-0 flex-1` pane with a sticky header, so a pool in the hundreds never pushes the page itself long; switching subpart tabs never touches which rules are checked. Source uses the same link treatment as `RegulationListPage`. Confirming writes the plan from whichever rules are Assigned, across every subpart, not just the one currently in view |
| FlowStepPlan | empty, populated | `features/gcp/flow/FlowStepPlan.tsx` | Step 4, "Compliance Plan" on the stepper. The rule's identity (subpart/subsection, regulation, source link) and the Prev/Select/Next nav both live in `GcpFlowPage`'s persistent summary card, not here — this screen is one card: the "Compliance plan" heading (16px semibold) + description, then Regulation Requirement Text (`RichTextEditor toolbar="compact"`, always shown, edits the shared `Regulation.requirementText` via `useGcpStore`'s `updateRegulation`), DDS Id (the 4 real legacy options), DDS Text (`RichTextEditor toolbar="full"`), Complete, MOC Text ("Copy Regulation Default MOC Text"), Comment, and the GCP Data table (DAO Specialty Code / MOC Code / FOC Code / Deliverable # / Active, `ActionsMenu` Edit/Remove per row via `GcpItemDrawer`). `rows`/`index` are props from `GcpFlowPage`, not local state — the summary card needs the same current rule. The table's own row cells are `whitespace-nowrap` and its Actions column is `sticky right-0` (own `bg`, `shadow-sticky`, `z-sticky`) inside the `overflow-x-auto` wrapper — client instruction, 2026-09-24: the row's other columns scroll underneath, Actions never does |
| ReadOnlyField | — | `features/gcp/flow/ReadOnlyField.tsx` | A label/value pair shaped like `Stat` but at `font-medium` — reference values read off a rule or project, not the emphasized figures `Stat`'s spec is fixed for. Shared by `GcpFlowPage`'s step-4 summary band and anywhere else a readonly identity field is needed |
| GcpItemDrawer | create / edit | `features/gcp/flow/GcpItemDrawer.tsx` | One GCP Data row: DAO Specialty Code, MOC Code, FOC Code, Deliverable #, Active (`ActiveSelect`). Free-text until the client's Discipline/MOC/FOC/Delegation lists arrive |
| FlowStepReports | — | `features/gcp/flow/FlowStepReports.tsx` | Step 5, "Reports" on the stepper (was "Dashboard" — `FlowStepDashboard.tsx` is gone; `FlowStepPlan`, step 4, is where the full legacy Cert Plan Dashboard fields ended up). Three cards, one per GCP report (icon, "Report" label, name, "Enter Parameters →"), each opening the same parameter drawer `GcpReportsPage` uses — with this flow's own project pre-selected via `defaultTccaProjectId`, since the reader already picked it in step 1. Drawer footer is Cancel / Download (`leadingIcon={<Download/>}`), not Cancel / Run |
| GcpRegulationsPage | sections: Regulations / Structure / Groups / Checklist | `features/gcp/GcpRegulationsPage.tsx` | One route for the rule library at `/gcp/regulations`; `?tab=` picks the section and, inside Structure, `?view=` picks Subparts or Subsections |
| GcpRegulationsTabs / GcpStructureTabs | active / inactive, with counts | `features/gcp/GcpRegulationsTabs.tsx` | The library's two tab levels: `SectionTabs` above the card for the four sections (Regulations, Structure, Groups, Checklist), `TableTabs` has no role in Structure any more — it is a master–detail like Groups, not a second tab level. Subpart and Subsection are not sections of their own — they describe how a regulation is filed, so they live under Structure |
| SubpartDrawer | create / edit | `features/gcp/SubpartDrawer.tsx` | Code, Description, Sort (next free slot suggested), Active |
| SubsectionDrawer | create / edit | `features/gcp/SubsectionDrawer.tsx` | Code, Title, then the four Part ranges, Active |
| RegulationStructurePage | populated / empty / no-results, subpart with no subsections | `features/gcp/RegulationStructurePage.tsx` | Structure as one **master–detail**: every subpart on a 320px rail (parent level) with its subsection count, the selected subpart's Subsections table nested at the right (child level) — Subpart → Subsection is not stored, it is derived (a subsection's code minus its trailing digits equals its subpart's code, verified against every row). A subsection's code prints with its inherited subpart prefix dimmed. Selection lives in `?subpart=`; "Add New Subpart" sits in the page header, "Add Subsection" beside the Subsections heading and pre-fills the code with the parent's prefix |
| RegulationGroupsPage | populated / empty / no-results, group with no regulations | `features/gcp/RegulationGroupsPage.tsx` | Groups as a **master–detail**, the same shape as ATA Chapters: every group on a 320px rail with its regulation count, the selected group's Regulation List at the right. Selection lives in `?group=`; search spans group text and the section roots under it. "Add New Group" sits in the page header, "Add Regulation" beside the Regulation List heading |
| RegulationGroupDrawer | create / edit | `features/gcp/RegulationGroupDrawer.tsx` | Title, Description, Active |
| RegulationGroupSectionDrawer | — | `features/gcp/RegulationGroupSectionDrawer.tsx` | Picks a group, then its rules by section root through `MultiSelect` — the app's answer to the legacy two-facing-list-boxes transfer widget. Saves the whole set for that group at once |
| RegulationChecklistPage | nothing picked / pair picked | `features/gcp/RegulationChecklistPage.tsx` | Checklist: the TCCA Project Number + Deliverable Number pair the legacy dialog asks for, with the listing below left explicitly unbuilt until the client confirms what it holds |
| GcpRegulationsTabs | active / inactive, count on Regulation | `features/gcp/GcpRegulationsTabs.tsx` | The library's tab strip, first child of whichever listing's card is drawn |
| RegulationListPage | ready / loading / error, empty + no-results | `features/gcp/RegulationListPage.tsx` | The Regulation listing — Section, Amdt, Title, Subpart, Subsection, Section Root, Source, Active, Action. `table-fixed` on measured widths totalling 956px, so all nine columns read without sideways scrolling at 1280px. Section wraps at ~10 characters (a rule number is the row's identity, so none of it may be hidden); Title truncates at two lines. Amdt and Section Root are chips; Subpart and Subsection use `CodeWithName`; Source is the rule's link — accent, underlined, arrow-up-right — labelled FAA Source / Source / No source. No weight above regular in a body cell |
| CodeWithName | with name / code only | `features/gcp/CodeWithName.tsx` | A taxonomy code and its name on one line (`A — GENERAL`), the name capped at ten words before the cell truncates. Placeholder names the legacy data stores (`--`, or the code repeated) are dropped, so the code stands alone |
| GcpChip | chip / bare dash | `features/gcp/GcpChip.tsx` | An identifier as a chip — Amdt, Section Root. A dash placeholder prints as a bare dash instead: a chip announces a value, and a column of empty boxes reads as data that isn't there |
| titleCaseName | — (helper, `lib/gcpDisplay.ts`) | — | Subpart and subsection names read as Title Case (`ELECTRICAL WIRING INTERCONNECTION SYSTEMS (EWIS)` → `Electrical Wiring Interconnection Systems (EWIS)`). Only ALL-CAPS words are recased, so sentence-case text the client typed is left alone; an acronym list keeps AWM, FAR, ICAO, JAA, APU, EWIS, SFAR and friends in capitals. Display only — forms and storage keep the client's own value |
| RegulationFilterMenu | 6 filters, applied count on trigger | `features/gcp/RegulationFilterMenu.tsx` | Replaces the legacy per-column filter row — Amdt, Subpart Code, Subsection Code, Section Root, Url, Active |
| RegulationDrawer | create / edit / copy | `features/gcp/RegulationDrawer.tsx` | Every field of the legacy Regulation create screen in its order: Section, Amdt, Title, Subpart Code, Subsection Code, Url, Sort, Requirement Text, Default Moc Text, Section Root, plus Active. Subpart and Subsection are `SearchableSelect`s listing `CODE -- NAME`. Section Root and Sort are suggested from the section and amendment, and a blank submit takes the suggestion. `copy` opens another rule's values as a new record |
| RegulationDetailDrawer | — | `features/gcp/RegulationDetailDrawer.tsx` | Read-only view of one regulation, every stored field, Edit in the footer |
| GcpCertBasesPage | populated / no-results / empty, one flat table | `features/gcp/GcpCertBasesPage.tsx` | **Cert Basis** (not "Cert Bases" — client instruction, 2026-09-24) at `/gcp/cert-bases`: **one genuinely flat table**, one row per basis↔regulation link — client instruction, 2026-09-25, pointed at the legacy `cert-basis/index` screen's own flat, ungrouped ~14k-row list. Supersedes the 2026-09-24 version of this page, which grouped rows under a per-aircraft banner `<tr>` — that shape read as "boxy" once there was real multi-basis data on screen, and the client asked for one table with managed column spacing instead. Columns: **Cert Basis** (aircraft model, TCDS/"Project-specific" underneath — every row still carries which basis it belongs to, so nothing about the grouping is actually lost, just no longer a banner), Regulation Section, Regulation Amdt, Regulation Title, Status, Actions. A basis with zero regulations still gets one placeholder row (`regulation: null` in the `Row` union) rather than vanishing — the group-header banner used to be that basis's only visible trace, so this replaces it. Sorting is genuinely flat now: every row sorts against every other row (`useTableSort` over the whole `Row[]`), not within its own basis the way the grouped version had to fake it. Basis-level actions (**Edit Cert Basis** / **Delete Cert Basis**) ride in every row's own `ActionsMenu` alongside that row's regulation actions (View/**Edit regulation**/**Remove from basis**) — the same "parent actions in the child row's menu" shape `DocumentsPage` already uses (`Edit {kind}` + `Edit revision` together). Column widths use `lib/tableWidths.ts`'s `proportionalWidths()` (see that entry) instead of a trailing spacer, so the five columns share a wide screen instead of leaving a void past Actions. Header actions (search, **Import**, **Add Cert Basis**) unchanged from the grouped version |
| CertBasisDrawer | create / edit | `features/gcp/CertBasisDrawer.tsx` | A basis's own identity — Aircraft Model (required), TCDS Number (optional — blank for a project-specific basis) — plus, now, its own Regulation Section / Regulation Amdt (client instruction, 2026-09-24: this drawer had no way to attach a regulation before, only Import or GCP Projects' own Certification Basis step). Same cascading `MultiSelect` pair, "both fields pick a real regulation" rule, and searchable/multi-pick behavior as that step; editing seeds `sections`/`amdts` from the basis's existing `regulationIds`. A help line under Regulation Amdt states the live count ("Attaches N regulations.") once both fields have a match |
| CertBasisImportDrawer | — | `features/gcp/CertBasisImportDrawer.tsx` | The legacy Cert Basis Import tool: a required **TCCA Project** `SearchableSelect` above a `FileDropzone` (`.xlsx`/`.xls`/`.csv`) — client instruction, 2026-09-24, this drawer had no way to say which project an import was for. Each field validates and errors independently (picking a project doesn't clear a missing-file error and vice versa). No file parsing in this prototype (no backend) — picking a file and importing hands back a toast confirmation naming the file and the picked project's number, the same shape `GcpReportsPage`'s download already uses |
| GcpPeoplePage | tabs: FOC / Delegation / Discipline | `features/gcp/GcpPeoplePage.tsx` | Who may find or recommend compliance, at `/gcp/people`. All three tabs are live (`GcpFocTab`, `GcpDelegationTab`, `GcpDisciplineTab`). Follows "Tabbed page layout" below: tab strip and table are separate cards, one header Add button (`AppShell`'s `headerActions`) whose label names the active tab ("Add FOC", "Add Delegation", "Add Discipline") |
| GcpFocTab | populated, no-results, empty | `features/gcp/GcpFocTab.tsx` | The legacy FOC list (63 rows), sortable/searchable table — Code, Authority Specialist, Specialty, Default (`Badge`), `ActionsMenu` View/Edit/Remove via `FocDetailDrawer`/`FocDrawer`. Its own create drawer is controlled by the page header's Add button (`createOpen`/`onCreateOpenChange` props); View/Edit/Remove stay local state. Every real person's name from the legacy list was replaced with a placeholder (see `gcpFixtures.ts`'s `FOC_LIST` and docs/DECISIONS.md) — the codes, specialties and Default flags are the client's real data, the names are not |
| FocDrawer | create / edit | `features/gcp/FocDrawer.tsx` | One FOC record: Code, Authority Specialist, Specialty (all `Input`), Default (`Checkbox` — not `ActiveSelect`, since Default isn't this record's active/inactive state) |
| FocDetailDrawer | — | `features/gcp/FocDetailDrawer.tsx` | Read-only view of one FOC code (`DetailCard`/`DetailField`), Edit in the footer — the same View/Edit split as `RegulationDetailDrawer` |
| GcpDelegationTab | populated, no-results, empty | `features/gcp/GcpDelegationTab.tsx` | The legacy Delegation list (720 rows), sortable/searchable table — Section Root, FOC Code, Limitation (`Badge`, green Yes / red No — not the legacy grid's tick/cross icons), Active (`Badge`), `ActionsMenu` View/Edit/Remove via `DelegationDetailDrawer`/`DelegationDrawer`. Scrolls inside its own `max-h-[600px]` frame with a sticky header (the `RegulationListPage`/Scope Rules convention for a pool this size) rather than stretching the page 720 rows tall. No personal data on this list (Section Root and FOC Code are references, not names), so every field is the client's real data as-is |
| DelegationDrawer | create / edit | `features/gcp/DelegationDrawer.tsx` | One Delegation record: Section Root and FOC Code as `SearchableSelect` pickers (sourced from `Regulation.sectionRoot` and the FOC list, matching the legacy screen's own dropdowns, not free text), Limitation and Active as Yes/No `Select`s per the client's instruction — not checkboxes |
| DelegationDetailDrawer | — | `features/gcp/DelegationDetailDrawer.tsx` | Read-only view of one delegation, Edit in the footer |
| GcpDisciplineTab | populated, no-results, empty | `features/gcp/GcpDisciplineTab.tsx` | The legacy Discipline list (23 rows, all active), sortable/searchable table — Dao Specialty Code, Elisen discipline, TCCA discipline, Active (`Badge`), `ActionsMenu` View/Edit/Remove via `DisciplineDetailDrawer`/`DisciplineDrawer`. Same `createOpen`/`onCreateOpenChange` pattern as `GcpFocTab`. No personal data on this list, unlike FOC, so every field is the client's real data as-is |
| DisciplineDrawer | create / edit | `features/gcp/DisciplineDrawer.tsx` | One Discipline record: DAO Specialty Code, Elisen discipline, TCCA discipline (`Input`s), Active (`ActiveSelect`, help "Inactive stays on old records, out of pickers." — matches every other GCP `ActiveSelect` field; missing here before, client instruction 2026-09-24) |
| DisciplineDetailDrawer | — | `features/gcp/DisciplineDetailDrawer.tsx` | Read-only view of one discipline, Edit in the footer |
| GcpReferencePage | tabs: MOC / DDS, both live | `features/gcp/GcpReferencePage.tsx` | The short lists a compliance item is built from, at `/gcp/reference`. Full "Tabbed page layout": header search + Add button (label names the active tab) for both tabs, each tab pill shows its own row count |
| GcpMocTab | populated, no-results, empty | `features/gcp/GcpMocTab.tsx` | The legacy MOC list (16 rows), sortable/searchable table — Code, Title, Description (`Truncate`d at 2 lines), `ActionsMenu` View/Edit/Remove via `MocDetailDrawer`/`MocDrawer`. Same `createOpen`/`onCreateOpenChange` header-Add pattern as `GcpFocTab`/`GcpDisciplineTab`. No personal data and no Active flag on this list — the legacy screen doesn't carry one, so none was invented |
| MocDrawer | create / edit | `features/gcp/MocDrawer.tsx` | One MOC record: Code, Title (`Input`s), Description (`Textarea`) |
| MocDetailDrawer | — | `features/gcp/MocDetailDrawer.tsx` | Read-only view of one MOC code, Edit in the footer |
| GcpDdsTab | populated, no-results, empty | `features/gcp/GcpDdsTab.tsx` | The legacy DDS Type list — 10 of 11 rows; the portal's page 2 is now behind a login the app never performs, so the 11th is flagged rather than invented (`gcpFixtures.ts`'s `DDS_TYPES` comment). Sortable/searchable table — DDS Type, DDS Text (rich HTML reduced to plain text for the table and the View drawer via a safe `DOMParser`-based `htmlToText`, never `dangerouslySetInnerHTML` — docs/SECURITY.md rule 3), `ActionsMenu` View/Edit/Remove via `DdsTypeDetailDrawer`/`DdsTypeDrawer`. Same `createOpen`/`onCreateOpenChange` header-Add pattern as the other reference tabs |
| DdsTypeDrawer | create / edit | `features/gcp/DdsTypeDrawer.tsx` | One DDS type, two fields only, per the client's instruction: Type (`Input`) and DDS Text (`RichTextEditor toolbar="full"`, the same field `FlowStepPlan`'s Compliance Plan step uses) — no Active flag |
| DdsTypeDetailDrawer | — | `features/gcp/DdsTypeDetailDrawer.tsx` | Read-only view of one DDS type, DDS Text shown as plain text (`htmlToText`), Edit in the footer |
| GcpReportsPage | — | `features/gcp/GcpReportsPage.tsx` | The three legacy GCP reports (Certification Plan, Certification Record, Requirement Cross Reference Matrix) at `/gcp/reports`, as one card each — the same treatment as `FlowStepReports` (client instruction, 2026-09-24; a two-column table spent a header on "Action" and left half of every row empty). Cards are `flex-col` with the name block flexing, not step 5's plain grid, because this page shows each report's full name and the Matrix one wraps to two lines at tablet width — the buttons stay bottom-aligned across the row. Each "Enter Parameters" opens that report's own parameter `Drawer` rather than a live-preview params bar — a report here is generated once from a deliberate set of inputs, not filtered live the way the global Reports page is. Downloading just shows a toast; there's no export pipeline yet. Also reused, unchanged, by `FlowStepReports` (GCP Projects step 5) with a project pre-selected |
| CertPlanReportDrawer | — | `features/gcp/CertPlanReportDrawer.tsx` | Certification Plan's parameters, field-for-field off the legacy screen: TCCA Project Number\* (`SearchableSelect`, `defaultTccaProjectId` pre-selects it), Starting Page Number\*, Report Number, Addendum Number, Report Issue, Report Date\*, Delegation Section, Deliverables Section. Footer: Cancel / Download |
| CertRecordReportDrawer | — | `features/gcp/CertRecordReportDrawer.tsx` | Certification Record's parameters — the same first six as Certification Plan, then Foc/Moc Codes Section, Compliance Reports Section, Mdl Number And Rev, and the DAO's own identity fields (Application Name, Design Approval Doc, Aircraft Make/Model, Type) pre-filled with this DAO's real values, editable like the legacy screen. Footer: Cancel / Download |
| RequirementMatrixReportDrawer | — | `features/gcp/RequirementMatrixReportDrawer.tsx` | The shortest of the three: TCCA Project Number\* and Report Date\* only. Footer: Cancel / Download |
