export type WorkPackageStatus = 'not-started' | 'in-progress' | 'complete'

/**
 * Free-text scope of work inside a project (e.g. "Add missing USB plug",
 * "Seat installation", "Certification Plan"). Never templated — packages
 * differ on every aircraft, so there are deliberately no defaults.
 */
export interface WorkPackage {
  id: string
  projectId: string
  title: string
  description: string
  status: WorkPackageStatus
}

/**
 * An activity assigned to a work package: WHO does the work (a standard
 * catalog entry), with budgeted hours. Actual hours arrive read-only from
 * Time Entry — this record never captures time directly.
 *
 * Budget lives per activity with a work-package roll-up; whether the client
 * ultimately wants it at activity or package level is still unresolved
 * (see docs/DECISIONS.md) — this shape supports either answer.
 */
export interface WorkPackageActivity {
  id: string
  workPackageId: string
  /** id into ACTIVITY_CATALOG */
  activityId: string
  responsible: string
  budgetHours: number
  actualHours: number
}
