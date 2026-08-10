import { activityName } from './activityCatalog'
import type { TimesheetEntry } from '@/types/timesheet'
import type { ProjectListRow } from '@/types/project'
import type { WorkPackage } from '@/types/workPackage'
import type { DeliverableRevision } from '@/types/tcca'

export interface EnrichedTimesheetRow extends TimesheetEntry {
  projectLabel: string
  projectDescription: string
  workPackageTitle: string
  activityTitle: string
  deliverableNumber: string
}

/** Joins raw entries against the projects/work-packages/deliverables stores
    for display — the table and search never touch ids directly. */
export function enrichTimesheetRows(
  rows: TimesheetEntry[],
  projects: ProjectListRow[],
  workPackages: WorkPackage[],
  deliverables: DeliverableRevision[],
): EnrichedTimesheetRow[] {
  return rows.map((r) => {
    const project = projects.find((p) => p.id === r.projectId)
    const wp = workPackages.find((w) => w.id === r.workPackageId)
    const deliverable = deliverables.find((d) => d.id === r.deliverableRevisionId)
    return {
      ...r,
      projectLabel: project ? `${project.number}-${project.subNumber}` : '—',
      projectDescription: project?.title ?? '—',
      workPackageTitle: wp?.title ?? '—',
      activityTitle: r.activityId ? activityName(r.activityId) : '—',
      deliverableNumber: deliverable?.number ?? '',
    }
  })
}
