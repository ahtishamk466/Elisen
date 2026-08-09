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
| Drawer | with/without footer | `patterns/Drawer.tsx` | Right side panel; Esc to close, focus trapped |
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
| ProjectDetailPage | Overview + Work Packages + TCCA built; other tabs pending | `features/projects/ProjectDetailPage.tsx` | Full project detail screen at `/projects/:id` |
| ProjectWorkPackagesTab | empty / populated; delete guards for logged hours | `features/projects/ProjectWorkPackagesTab.tsx` | WP list with roll-ups inside a project |
| WorkPackageCard | collapsed / expanded, over-budget indicator | `features/projects/WorkPackageCard.tsx` | One package: status, hours roll-up, activities table |
| WorkPackageDrawer | create / edit | `features/projects/WorkPackageDrawer.tsx` | Free-text package title + description + status |
| ActivityDrawer | create (catalog picker + task preview) / edit | `features/projects/ActivityDrawer.tsx` | Assign who does the work + budget hours |
| ExportMenu | HTML/CSV/Text live; PDF/Excel pending a library | `features/projects/ExportMenu.tsx` | Export the current filtered rows |

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
