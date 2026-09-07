import { enrichTimesheetRows, type EnrichedTimesheetRow } from './timesheetLookup'
import { formatDate } from './formatDate'
import type { Activity } from '@/types/catalog'
import { PRIORITY_LABEL, STATUS_LABEL, TYPE_LABEL } from './projectDisplay'
import { TCCA_STATUS_LABEL } from './tccaDisplay'
import { REVISION_STATUS_LABEL } from './documentDisplay'
import type { ProjectListRow } from '@/types/project'
import type { TccaProject } from '@/types/tcca'
import type { Approval, DocRevision, ProjectDocument } from '@/types/documents'
import type { TimesheetEntry } from '@/types/timesheet'
import type { WorkPackage } from '@/types/workPackage'
import type { DeliverableRevision } from '@/types/tcca'

/**
 * A generated report as data, not as a file: the preview pane renders it and
 * `lib/reportExport.ts` serializes the same object into whichever format the
 * user picks — so what you previewed is exactly what you download. Generators
 * used to build HTML strings and trigger the download themselves, which made
 * a preview impossible and welded every report to one format.
 */
export interface ReportResult {
  title: string
  /** Extension is added per format by reportExport. */
  filenameBase: string
  /** The dates covered, already formatted for reading ("Aug 21, 2026 – Aug
      28, 2026"). Absent on reports that aren't date-scoped. Held apart from
      `meta` so the screen and the file state the range identically, and so
      the preview can give it its own line rather than burying it in a
      sentence. */
  range?: string
  /** Row count and totals — what the range does not already say. */
  meta: string
  columns: string[]
  /** Plain display strings; serializers escape per format. */
  rows: string[][]
}

// ---- Project Management ----------------------------------------------------

export function buildProjectStatus(projects: ProjectListRow[]): ReportResult {
  return {
    title: 'Project Status', filenameBase: 'project-status',
    meta: `${projects.length} projects`,
    columns: ['No.', 'Project', 'Company', 'Type', 'Priority', 'Status', 'Hours (Act/Bud)', 'Due', 'Next Action'],
    rows: projects.map((p) => [
      `${p.number}-${p.subNumber}`, p.title, p.companyName, TYPE_LABEL[p.type], PRIORITY_LABEL[p.priority],
      STATUS_LABEL[p.status], `${p.actualHours} / ${p.budgetHours}`, p.dueDate || '—', p.nextAction || '—',
    ]),
  }
}

export function buildApprovals(approvals: Approval[], projects: ProjectListRow[]): ReportResult {
  return {
    title: 'Approvals', filenameBase: 'approvals',
    meta: `${approvals.length} issued certificates`,
    columns: ['Number', 'Description', 'Primary', 'Design Approval Holder', 'Aircraft', 'Serials', 'Projects'],
    rows: approvals.map((a) => {
      const linked = a.projectIds.map((id) => projects.find((p) => p.id === id)).filter(Boolean)
        .map((p) => `${p!.number}-${p!.subNumber}`).join(', ')
      return [a.number, a.description, a.primary ? 'Yes' : 'No', a.designApprovalHolder,
        String(a.aircraftIds.length), String(a.serialIds.length), linked || '—']
    }),
  }
}

export function buildTccaProjects(tccas: TccaProject[], projects: ProjectListRow[]): ReportResult {
  return {
    title: 'TCCA Projects', filenameBase: 'tcca-projects',
    meta: `${tccas.length} TCCA projects`,
    columns: ['Number', 'Description', 'Status', 'Opened', 'Closed', 'Elisen Projects', 'Next Action'],
    rows: tccas.map((t) => {
      const linked = t.projectIds.map((id) => projects.find((p) => p.id === id)).filter(Boolean)
        .map((p) => `${p!.number}-${p!.subNumber}`).join(', ')
      return [t.number, t.description, TCCA_STATUS_LABEL[t.status], t.openedDate, t.closedDate || '—', linked || '—', t.nextAction || '—']
    }),
  }
}

/** Open TCCA projects, most urgent first: highest linked-project priority,
    then oldest opened date. */
export function buildTccaPriority(tccas: TccaProject[], projects: ProjectListRow[]): ReportResult {
  const rank = (t: TccaProject) =>
    Math.min(4, ...t.projectIds.map((id) => Number(projects.find((p) => p.id === id)?.priority.charAt(0) ?? 4)))
  const open = tccas.filter((t) => t.status !== 'closed').sort((a, b) => rank(a) - rank(b) || a.openedDate.localeCompare(b.openedDate))
  return {
    title: 'TCCA Priority', filenameBase: 'tcca-priority',
    meta: `${open.length} open TCCA projects, most urgent first`,
    columns: ['Priority', 'Number', 'Description', 'Status', 'Opened', 'Next Action'],
    rows: open.map((t) => [
      rank(t) === 4 && t.projectIds.length === 0
        ? '—'
        : String(PRIORITY_LABEL[`${rank(t)}-${['', 'fire', 'high', 'med', 'low'][rank(t)]}` as ProjectListRow['priority']] ?? rank(t)),
      t.number, t.description, TCCA_STATUS_LABEL[t.status], t.openedDate, t.nextAction || '—',
    ]),
  }
}

/** Every open deliverable revision landing on one person's desk. */
export function buildOpenDeliverablesActionOn(
  person: string, documents: ProjectDocument[], revisions: DocRevision[], projects: ProjectListRow[],
): ReportResult {
  const open = revisions.filter((r) => !r.closedDate && r.nextAction === person)
  return {
    title: 'Open Deliverables Summary: Action-On',
    filenameBase: `open-deliverables-${person.toLowerCase().replace(/\s+/g, '-')}`,
    meta: `Action on: ${person} · ${open.length} open deliverables`,
    columns: ['Document', 'Title', 'Project', 'Status', 'Due'],
    rows: open.map((r) => {
      const doc = documents.find((d) => d.id === r.documentId)
      const project = projects.find((p) => p.id === r.initialProjectId)
      return [`${doc?.number ?? '—'} rev ${r.rev}`, doc?.title ?? '—',
        project ? `${project.number}-${project.subNumber}` : '—', REVISION_STATUS_LABEL[r.status], r.dueDate || '—']
    }),
  }
}

// ---- Time Tracking ---------------------------------------------------------

export interface TimeJoins {
  projects: ProjectListRow[]
  workPackages: WorkPackage[]
  deliverables: DeliverableRevision[]
  /** Catalog activities, so a report names an activity the same way the app does. */
  activities: Activity[]
}

function timeRows(entries: TimesheetEntry[], joins: TimeJoins, from: string, to: string): EnrichedTimesheetRow[] {
  return enrichTimesheetRows(
    entries.filter((e) => e.active && e.workingDate >= from && e.workingDate <= to),
    joins.projects, joins.workPackages, joins.deliverables, joins.activities,
  ).sort((a, b) => a.employeeName.localeCompare(b.employeeName) || a.workingDate.localeCompare(b.workingDate))
}

const rangeLabel = (from: string, to: string) => `${formatDate(from)} – ${formatDate(to)}`
const sum = (rows: { hoursRegular: number }[]) => rows.reduce((s, r) => s + r.hoursRegular, 0).toFixed(2)

export function buildDetailedTime(entries: TimesheetEntry[], joins: TimeJoins, from: string, to: string): ReportResult {
  const rows = timeRows(entries, joins, from, to)
  return {
    title: 'Detailed Time Report', filenameBase: 'detailed-time-report',
    range: rangeLabel(from, to),
    meta: `${rows.length} entries · ${sum(rows)} regular hours`,
    columns: ['Employee', 'Date', 'Project', 'Work Package', 'Activity', 'Task', 'Deliverable', 'Hrs RG', 'Hrs OT', 'Bk Hrs', 'Comment', 'Validated'],
    rows: rows.map((r) => [
      r.employeeName, r.workingDate, r.projectLabel, r.workPackageTitle, r.activityTitle, r.task || '—',
      r.deliverableNumber || '—', r.hoursRegular.toFixed(2), r.hoursOvertime.toFixed(2), r.bankHoursRegular.toFixed(2),
      r.comment || '—', r.validated ? 'Yes' : 'No',
    ]),
  }
}

export function buildHoursWorked(entries: TimesheetEntry[], joins: TimeJoins, from: string, to: string, employee?: string): ReportResult {
  const rows = timeRows(entries, joins, from, to).filter((r) => !employee || r.employeeName === employee)
  return {
    title: employee ? `Hours Worked: ${employee}` : 'Hours Worked',
    filenameBase: employee ? `hours-worked-${employee.toLowerCase().replace(/\s+/g, '-')}` : 'hours-worked',
    range: rangeLabel(from, to),
    meta: `${rows.length} entries · ${sum(rows)} regular hours`,
    columns: ['Employee', 'Date', 'Project', 'Activity', 'Hrs RG', 'Hrs OT'],
    rows: rows.map((r) => [
      r.employeeName, r.workingDate, r.projectLabel, r.activityTitle, r.hoursRegular.toFixed(2), r.hoursOvertime.toFixed(2),
    ]),
  }
}

/** Totals per employee — the old "Summary" report, minus the payroll-group
    concept this app doesn't model yet. */
export function buildHoursWorkedSummary(entries: TimesheetEntry[], joins: TimeJoins, from: string, to: string): ReportResult {
  const rows = timeRows(entries, joins, from, to)
  const byEmployee = new Map<string, { rg: number; ot: number; n: number }>()
  for (const r of rows) {
    const t = byEmployee.get(r.employeeName) ?? { rg: 0, ot: 0, n: 0 }
    byEmployee.set(r.employeeName, { rg: t.rg + r.hoursRegular, ot: t.ot + r.hoursOvertime, n: t.n + 1 })
  }
  return {
    title: 'Hours Worked: Summary', filenameBase: 'hours-worked-summary',
    range: rangeLabel(from, to),
    meta: `${byEmployee.size} employees · ${sum(rows)} regular hours`,
    columns: ['Employee', 'Entries', 'Regular Hours', 'Overtime Hours'],
    rows: [...byEmployee.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([name, t]) =>
      [name, String(t.n), t.rg.toFixed(2), t.ot.toFixed(2)]),
  }
}
