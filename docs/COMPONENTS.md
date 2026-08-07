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
