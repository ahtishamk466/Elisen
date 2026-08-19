import type { Activity, ActivityTask, Task } from '@/types/catalog'

/**
 * Obviously-fake demo catalog. **Ids are load-bearing** — `WorkPackageActivity`
 * and `TimesheetEntry` both store `activityId`, so these must not be renumbered.
 */
export const ACTIVITIES: Activity[] = [
  { id: 'airworthiness', name: 'Airworthiness', description: 'Compliance planning and continuing airworthiness work.', taskRequired: true, isDefault: true, nonProject: false, active: true },
  { id: 'delegate', name: 'Delegate', description: 'Independent check and sign-off by a design approval delegate.', taskRequired: true, isDefault: true, nonProject: false, active: true },
  { id: 'mech-design', name: 'Mechanical Design', description: 'Layout, installation and detail design of mechanical parts.', taskRequired: true, isDefault: true, nonProject: false, active: true },
  { id: 'elec-design', name: 'Electrical Design', description: 'Wiring, bonding and electrical installation design.', taskRequired: true, isDefault: true, nonProject: false, active: true },
  { id: 'struct-validation', name: 'Structural Validation', description: 'Static strength and stress substantiation.', taskRequired: true, isDefault: true, nonProject: false, active: true },
  { id: 'elec-validation', name: 'Electrical Validation', description: 'Load analysis and electrical qualification testing.', taskRequired: true, isDefault: true, nonProject: false, active: true },
  { id: 'project-mgmt', name: 'Project Management', description: 'Scheduling, progress tracking and customer reporting.', taskRequired: false, isDefault: true, nonProject: false, active: true },
  { id: 'manuals', name: 'Manuals & Publications', description: 'Flight and maintenance manual supplements.', taskRequired: true, isDefault: false, nonProject: false, active: true },
  { id: 'general-cert', name: 'General Certification', description: 'Certification plans and design compliance reporting.', taskRequired: true, isDefault: true, nonProject: false, active: true },
  { id: 'rfq-response', name: 'RFQ Response', description: 'Estimating and quoting work not yet won.', taskRequired: false, isDefault: false, nonProject: false, active: true },
  { id: 'customer-support', name: 'Customer Support', description: 'Technical queries and on-site support after delivery.', taskRequired: false, isDefault: false, nonProject: false, active: true },
  // Non-project time. Never budgeted, never assigned to a work package.
  { id: 'gen-holiday', name: 'GEN - Holiday', description: 'Statutory and company holidays.', taskRequired: false, isDefault: false, nonProject: true, active: true },
  { id: 'gen-paid-absence', name: 'GEN - Paid Absence', description: 'Approved paid absence.', taskRequired: false, isDefault: false, nonProject: true, active: true },
  { id: 'gen-sick', name: 'GEN - Sick Leave', description: 'Sick days.', taskRequired: false, isDefault: false, nonProject: true, active: true },
  { id: 'gen-training', name: 'GEN - Training', description: 'Recurrent and role training.', taskRequired: false, isDefault: false, nonProject: true, active: true },
  { id: 'gen-internal', name: 'GEN - Internal Meetings', description: 'Internal meetings and administration.', taskRequired: false, isDefault: false, nonProject: true, active: true },
  // Retired, kept to prove that deactivating hides an activity from the pickers
  // without disturbing records that already reference it.
  { id: 'legacy-drafting', name: 'Board Drafting', description: 'Superseded by Mechanical Design.', taskRequired: false, isDefault: false, nonProject: false, active: false },
]

const TASK_NAMES = [
  // Shared across the two design activities, as in the client's own list.
  'Conceptual Design', 'Design Checking', '3D Modeling', 'Detail Design',
  'Installation Design', 'Assembly Design',
  'Compliance plan drafting', 'Continuing airworthiness (ICA)',
  'Document check & sign-off', 'Witness testing',
  'Static strength analysis', 'Stress analysis report',
  'Electrical load analysis', 'Burn test procedure',
  'Flight manual supplement', 'Maintenance manual update',
  'Certification plan', 'Design compliance report',
  'Prepare estimate sheet', 'Quote review',
  'Layout & installation drawings', 'Bracket and fitting design',
  'Wiring diagram', 'Load and bonding schedule',
  'Schedule & progress tracking', 'Customer status reporting',
  'Technical query response', 'On-site support visit',
  'Coordination with Authorities',
]

/** `3D Modeling` → `task-3d-modeling`. Stable, and readable in a URL. */
export const taskId = (name: string) =>
  `task-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`

export const TASKS: Task[] = [
  ...TASK_NAMES.map((name) => ({ id: taskId(name), name, active: true })),
  // Unlinked on purpose: a task can exist before anyone associates it, which is
  // the state the Tasks tab has to render without looking broken.
  { id: taskId('Vibration Survey'), name: 'Vibration Survey', active: true },
]

/** activity id → task names. The many-to-many source. */
const ASSOCIATIONS: Record<string, string[]> = {
  'mech-design': ['Conceptual Design', 'Design Checking', '3D Modeling', 'Detail Design', 'Installation Design', 'Assembly Design', 'Layout & installation drawings', 'Bracket and fitting design'],
  'elec-design': ['Conceptual Design', 'Design Checking', '3D Modeling', 'Installation Design', 'Wiring diagram', 'Load and bonding schedule'],
  airworthiness: ['Compliance plan drafting', 'Continuing airworthiness (ICA)', 'Coordination with Authorities'],
  delegate: ['Document check & sign-off', 'Witness testing'],
  'struct-validation': ['Static strength analysis', 'Stress analysis report'],
  'elec-validation': ['Electrical load analysis', 'Burn test procedure'],
  manuals: ['Flight manual supplement', 'Maintenance manual update'],
  'general-cert': ['Certification plan', 'Design compliance report', 'Coordination with Authorities'],
  'rfq-response': ['Prepare estimate sheet', 'Quote review'],
  'project-mgmt': ['Schedule & progress tracking', 'Customer status reporting'],
  'customer-support': ['Technical query response', 'On-site support visit'],
}

export const ACTIVITY_TASK_LINKS: ActivityTask[] = Object.entries(ASSOCIATIONS)
  .flatMap(([activityId, names]) => names.map((name) => ({
    id: `at-${activityId}-${taskId(name)}`,
    activityId,
    taskId: taskId(name),
    active: true,
  })))
