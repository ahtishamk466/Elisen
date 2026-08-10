/**
 * One logged block of hours against a project's work → activity → task,
 * optionally tied to a deliverable revision. Mirrors the client's own
 * Timesheet Entry fields; Timesheet (self) and Hours Worked (admin, all
 * employees) are two views over the same records — see docs/DECISIONS.md.
 */
export interface TimesheetEntry {
  id: string
  employeeName: string
  projectId: string
  workPackageId: string
  /** id into ACTIVITY_CATALOG */
  activityId: string
  /** Free-text task name from ACTIVITY_TASKS[activityId]; '' if the activity has none. */
  task: string
  /** id into a documentsStore revision (kind 'deliverable'); '' if not tied to one. */
  deliverableRevisionId: string
  workingDate: string
  hoursRegular: number
  hoursOvertime: number
  bankHoursRegular: number
  comment: string
  /** Locked once true — only an admin (Hours Worked) can edit/unmark past this point. */
  validated: boolean
  active: boolean
}
