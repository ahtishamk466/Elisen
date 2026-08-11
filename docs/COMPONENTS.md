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
| Pagination | first / middle / last page | `patterns/Pagination.tsx` | Paged table navigation |
| AccordionSection | open / closed, optional meta | `patterns/AccordionSection.tsx` | Collapsible grouped content (checklist phases) |
| AppShell | active nav item / child | `patterns/AppShell.tsx` | Sidebar + header page frame |
| ActionsMenu | n items, default / danger tone | `patterns/ActionsMenu.tsx` | Row-level "⋮" menu, portaled to avoid table clipping |
| useDropdown | — (hook) | `patterns/useDropdown.ts` | Shared open/position/outside-click logic for portaled menus |

## /components/features/projects — feature-specific

| Component | Variants | Location | Purpose |
|-----------|----------|----------|---------|
| ProjectsListPage | ready / loading / empty / error × with/without financials | `features/projects/ProjectsListPage.tsx` | Projects list screen |
| ProjectsTable | default, loading, financials hidden | `features/projects/ProjectsTable.tsx` | Project rows with status/priority badges |
| AddProjectDrawer | 2-step (no TCCA) / 3-step (TCCA required) | `features/projects/AddProjectDrawer.tsx` | Create-project flow orchestrator |
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
| TimesheetTable | self (locked once validated) / admin (`canValidate`, full control) | `features/timesheet/TimesheetTable.tsx` | Shared table; Validated/Active as Badge, 3-dot row actions |
| TimesheetEntryDrawer | create / edit / view; employee fixed / selectable | `features/timesheet/TimesheetEntryDrawer.tsx` | Orchestrator — form vs. read-only view, cascade state, submit |
| TimesheetEntryFormFields | — | `features/timesheet/TimesheetEntryFormFields.tsx` | Add/Edit form body: Project → Work Package → Activity → Task → Deliverable cascade |
| TimesheetEntryView | — | `features/timesheet/TimesheetEntryView.tsx` | Read-only label/value detail layout for View mode (no form controls) |
| useTimesheetEntryForm | — | `features/timesheet/useTimesheetEntryForm.ts` | Form state + validation for the entry drawer |
| TimesheetFilterMenu | with/without Employee filter | `features/timesheet/TimesheetFilterMenu.tsx` | Portaled filter popover: project, validated, active, date range |

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
| TccaOverviewTab | — | `features/tcca/TccaOverviewTab.tsx` | Details, notes, linked Elisen projects (add/remove) |
| TccaDocumentsTab | empty / populated | `features/tcca/TccaDocumentsTab.tsx` | Merged doc list + TCCA tracking (involvement/sent/state) |
| LinkRevisionDrawer | — | `features/tcca/LinkRevisionDrawer.tsx` | Pick a deliverable revision from the pool to link |
| DocTrackingDrawer | — | `features/tcca/DocTrackingDrawer.tsx` | Edit involvement / sent date / status for one link |
| TccaChecklistTab | N/A / in-progress / complete per item | `features/tcca/TccaChecklistTab.tsx` | Applicability + completion dates, per-phase counts |
| TccaReportsTab | PCC live; others pending definitions | `features/tcca/TccaReportsTab.tsx` | Generates the Project Completion Checklist |
| ProjectTccaTab | empty / populated | `features/tcca/ProjectTccaTab.tsx` | TCCA list + add entry point inside a project |
