# Component Inventory

One line per component: name, variants, location, purpose.

Updated as components are added or changed.

## /components/ui — design system primitives

| Component | Variants | Location | Purpose |
|-----------|----------|----------|---------|
| Button | primary / secondary / tertiary / danger × sm, md, lg, xl × default, hover, focus, active, loading, disabled | `ui/Button.tsx` | All actions; icon slots either side |
| Input | default, focused, typed, error, disabled; optional leading/trailing icons | `ui/Input.tsx` | Single-line text, number and date entry |
| Textarea | default, error, disabled | `ui/Textarea.tsx` | Multi-line text (descriptions, comments) |
| Select | default, error, disabled, placeholder | `ui/Select.tsx` | Single-choice from a known list |
| PhoneInput | default, filled, error, disabled | `ui/PhoneInput.tsx` | One merged field: flag + dial code (native select) \| number, our own Input/Select tokens (h-11, rounded-sm, shadow-textfield). Fills its container so it lines up with every other field. Use for every phone number field |
| Checkbox | checked / unchecked × enabled / disabled, optional required marker | `ui/Checkbox.tsx` | Multi-select and applicability ticks |
| RadioCard | selected / unselected / disabled | `ui/RadioCard.tsx` | Mutually exclusive choice with explanatory copy |
| Badge | danger / warning / info / success / neutral × subtle / outline, optional dot | `ui/Badge.tsx` | Status and priority labels |
| Alert | danger / info | `ui/Alert.tsx` | Form-level errors and inline guidance |
| Skeleton | — | `ui/Skeleton.tsx` | Loading placeholder blocks |
| Spinner | sizes via prop | `ui/Spinner.tsx` | Indeterminate loading indicator |

## /components/patterns — compositions of ui primitives

| Component | Variants | Location | Purpose |
|-----------|----------|----------|---------|
| FormField | required, description, help, error, counter | `patterns/FormField.tsx` | Label + control + help/error, responsive 1→3 col |
| FormSection | with/without subtitle | `patterns/FormSection.tsx` | Titled card grouping related fields |
| Drawer | with/without footer | `patterns/Drawer.tsx` | Right side panel; Esc to close, focus trapped, footer actions grouped right |
| ConfirmDialog | primary / danger | `patterns/ConfirmDialog.tsx` | Confirm destructive or state-changing actions |
| Stepper | n steps, done / active / upcoming | `patterns/Stepper.tsx` | Multi-step form progress |
| StatCard | default, loading | `patterns/StatCard.tsx` | Single headline metric |
| EmptyState | with/without action, custom icon | `patterns/EmptyState.tsx` | Zero-data and no-results states |
| Pagination | first / middle / last page, empty | `patterns/Pagination.tsx` | Page-size select + "Showing X to Y of Z" + first/prev/page/next/last controls. No border/rounded/bg of its own — renders as the last child inside the same card as its table, separated by one top border, never a second box below it |
| DetailCard / DetailField | with/without edit icon; empty field; `nowrap` | `patterns/DetailView.tsx` | THE standard read-only View: bordered card + muted-label/plain-value field grid. Never use a disabled form input to show read-only data — it dims real values to the same gray as an empty placeholder. Pass `nowrap` on short codes (Serial No, Reg. No, Model No, IDs) |
| Truncate | 1 line / 2 lines | `patterns/Truncate.tsx` | THE standard for long free text in a table cell: `line-clamp`, full text on hover via native `title`. Pair with a `maxWidth` style on the `<td>` — without a width constraint the browser just grows the column instead of wrapping. Never use on short codes — see the `whitespace-nowrap` rule below |
| AccordionSection | open / closed, optional meta | `patterns/AccordionSection.tsx` | Collapsible grouped content (checklist phases) |
| AppShell | active nav item / child; optional headerLeft / headerActions | `patterns/AppShell.tsx` | Sidebar + header frame; heading left, page controls right |
| SidebarProfile | menu closed / open; profile drawer; logout confirm | `patterns/SidebarProfile.tsx` | Signed-in identity at the foot of the sidebar, with Profile and Logout |
| ActionsMenu | n items, default / danger tone | `patterns/ActionsMenu.tsx` | Row-level "⋮" menu, portaled to avoid table clipping |
| useDropdown | — (hook) | `patterns/useDropdown.ts` | Shared open/position/outside-click logic for portaled menus; flips above the trigger when it would overflow the viewport |

## /components/features/projects — feature-specific

| Component | Variants | Location | Purpose |
|-----------|----------|----------|---------|
| ProjectsListPage | ready / loading / empty / error × with/without financials | `features/projects/ProjectsListPage.tsx` | Projects list screen |
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
| WorkPackageCard | collapsed / expanded, over-budget indicator | `features/projects/WorkPackageCard.tsx` | One package: status, hours roll-up, activities table |
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
| TimesheetTable | self (locked once validated) / admin (`canValidate`, full control) | `features/timesheet/TimesheetTable.tsx` | Shared table; Validated/Active as Badge, 3-dot row actions; `pagination` prop renders inside the same card as its table's footer |
| TimesheetEntryDrawer | create / edit / view; employee fixed / selectable | `features/timesheet/TimesheetEntryDrawer.tsx` | Orchestrator — form vs. read-only view, cascade state, submit |
| TimesheetEntryFormFields | — | `features/timesheet/TimesheetEntryFormFields.tsx` | Add/Edit form body: Project → Work Package → Activity → Task → Deliverable cascade |
| TimesheetEntryView | — | `features/timesheet/TimesheetEntryView.tsx` | Read-only label/value detail layout for View mode (no form controls) |
| useTimesheetEntryForm | — | `features/timesheet/useTimesheetEntryForm.ts` | Form state + validation for the entry drawer |
| TimesheetFilterMenu | with/without Employee filter | `features/timesheet/TimesheetFilterMenu.tsx` | Portaled filter popover: project, validated, active, date range |

## /components/features/lookups — feature-specific (Lookup Tables)

| Component | Variants | Location | Purpose |
|-----------|----------|----------|---------|
| CompaniesPage | ready / loading / error; empty w/ clear | `features/lookups/CompaniesPage.tsx` | `/admin/companies` — old Companies + Contacts merged; search matches contact names |
| CompanyDrawer | create / edit / view | `features/lookups/CompanyDrawer.tsx` | Address fields (incl. PhoneInput) + contacts as collapsible entries with stacked FormFields, matching AircraftEditDrawer. View: one DetailCard for company + contacts, divider-separated, not a second card |
| AircraftPage | ready / loading / error; empty w/ clear | `features/lookups/AircraftPage.tsx` | `/admin/aircraft` — old Aircraft + Serial Numbers merged; search matches serial/registration |
| AircraftModelDrawer | create / edit / view | `features/lookups/AircraftModelDrawer.tsx` | Edit/create: one editable table, same columns/order as the Aircraft list, one row per serial, model fields shared live across rows. View: one DetailCard, same field order as the list (Serial No, Reg. No, Model No, ...), repeated per serial with a divider between entries — not a separate Serial Numbers card |
| AtaChaptersPage | ready / loading / error; search auto-expands | `features/lookups/AtaChaptersPage.tsx` | `/admin/ata-chapters` — chapters as expandable cards with sections inside (WP→Activity pattern) |
| AtaChapterDrawer | create / edit (code locked on edit) | `features/lookups/AtaChapterDrawer.tsx` | Chapter code, title, definition, active |
| AtaSubChapterDrawer | create / edit; parent named in title | `features/lookups/AtaSubChapterDrawer.tsx` | Section within a chapter |

## /components/features/reports — feature-specific

| Component | Variants | Location | Purpose |
|-----------|----------|----------|---------|
| ReportsPage | ready / loading / error; empty w/ clear action | `features/reports/ReportsPage.tsx` | `/reports` — all 14 reports in three sections; global search + category dropdown (All default); pending cards carry reasons |
| RunReportDrawer | date / select params; range validation | `features/reports/RunReportDrawer.tsx` | Collects a report's parameters, then Generate Report |

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
