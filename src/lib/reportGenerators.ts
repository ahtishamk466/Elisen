import { downloadBlob } from './exportRows'
import { enrichTimesheetRows, type EnrichedTimesheetRow } from './timesheetLookup'
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

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** Same document style as the Project Completion Checklist (lib/pccReport.ts). */
function downloadReport(title: string, filename: string, meta: string, body: string) {
  const html = `<meta charset="utf-8"><title>${esc(title)}</title>
<style>
  body{font-family:system-ui,sans-serif;color:#020617;margin:40px;max-width:1000px}
  h1{font-size:24px}h2{font-size:16px;margin-top:32px}
  table{border-collapse:collapse;width:100%;font-size:14px}
  td,th{border:1px solid #E2E8F0;padding:6px 10px;text-align:left;vertical-align:top}
  tr.group td{background:#F1F5F9;font-weight:600}
  p.meta{color:#334155;font-size:14px}
</style>
<h1>${esc(title)}</h1>
<p class="meta">${esc(meta)}</p>
${body}`
  downloadBlob(html, filename, 'text/html;charset=utf-8')
}

const table = (headers: string[], rows: string[]) =>
  rows.length
    ? `<table><tr>${headers.map((h) => `<th>${esc(h)}</th>`).join('')}</tr>${rows.join('')}</table>`
    : '<p class="meta">No matching records.</p>'

// ---- Project Management ----------------------------------------------------

export function runProjectStatus(projects: ProjectListRow[]) {
  const rows = projects.map((p) =>
    `<tr><td>${p.number}-${p.subNumber}</td><td>${esc(p.title)}</td><td>${esc(p.companyName)}</td><td>${TYPE_LABEL[p.type]}</td><td>${PRIORITY_LABEL[p.priority]}</td><td>${STATUS_LABEL[p.status]}</td><td>${p.actualHours} / ${p.budgetHours}</td><td>${p.dueDate || '—'}</td><td>${esc(p.nextAction || '—')}</td></tr>`)
  downloadReport('Project Status', 'project-status.html', `${projects.length} projects`,
    table(['No.', 'Project', 'Company', 'Type', 'Priority', 'Status', 'Hours (Act/Bud)', 'Due', 'Next Action'], rows))
}

export function runApprovals(approvals: Approval[], projects: ProjectListRow[]) {
  const rows = approvals.map((a) => {
    const linked = a.projectIds.map((id) => projects.find((p) => p.id === id)).filter(Boolean)
      .map((p) => `${p!.number}-${p!.subNumber}`).join(', ')
    return `<tr><td>${esc(a.number)}</td><td>${esc(a.description)}</td><td>${a.primary ? 'Yes' : 'No'}</td><td>${esc(a.designApprovalHolder)}</td><td>${a.aircraftIds.length}</td><td>${a.serialIds.length}</td><td>${linked || '—'}</td></tr>`
  })
  downloadReport('Approvals', 'approvals.html', `${approvals.length} issued certificates`,
    table(['Number', 'Description', 'Primary', 'Design Approval Holder', 'Aircraft', 'Serials', 'Projects'], rows))
}

export function runTccaProjects(tccas: TccaProject[], projects: ProjectListRow[]) {
  const rows = tccas.map((t) => {
    const linked = t.projectIds.map((id) => projects.find((p) => p.id === id)).filter(Boolean)
      .map((p) => `${p!.number}-${p!.subNumber}`).join(', ')
    return `<tr><td>${esc(t.number)}</td><td>${esc(t.description)}</td><td>${TCCA_STATUS_LABEL[t.status]}</td><td>${t.openedDate}</td><td>${t.closedDate || '—'}</td><td>${linked || '—'}</td><td>${esc(t.nextAction || '—')}</td></tr>`
  })
  downloadReport('TCCA Projects', 'tcca-projects.html', `${tccas.length} TCCA projects`,
    table(['Number', 'Description', 'Status', 'Opened', 'Closed', 'Elisen Projects', 'Next Action'], rows))
}

/** Open TCCA projects, most urgent first: highest linked-project priority,
    then oldest opened date. */
export function runTccaPriority(tccas: TccaProject[], projects: ProjectListRow[]) {
  const rank = (t: TccaProject) =>
    Math.min(4, ...t.projectIds.map((id) => Number(projects.find((p) => p.id === id)?.priority.charAt(0) ?? 4)))
  const open = tccas.filter((t) => t.status !== 'closed').sort((a, b) => rank(a) - rank(b) || a.openedDate.localeCompare(b.openedDate))
  const rows = open.map((t) =>
    `<tr><td>${rank(t) === 4 && t.projectIds.length === 0 ? '—' : PRIORITY_LABEL[`${rank(t)}-${['', 'fire', 'high', 'med', 'low'][rank(t)]}` as ProjectListRow['priority']] ?? rank(t)}</td><td>${esc(t.number)}</td><td>${esc(t.description)}</td><td>${TCCA_STATUS_LABEL[t.status]}</td><td>${t.openedDate}</td><td>${esc(t.nextAction || '—')}</td></tr>`)
  downloadReport('TCCA Priority', 'tcca-priority.html', `${open.length} open TCCA projects, most urgent first`,
    table(['Priority', 'Number', 'Description', 'Status', 'Opened', 'Next Action'], rows))
}

/** Every open deliverable revision landing on one person's desk. */
export function runOpenDeliverablesActionOn(
  person: string, documents: ProjectDocument[], revisions: DocRevision[], projects: ProjectListRow[],
) {
  const open = revisions.filter((r) => !r.closedDate && r.nextAction === person)
  const rows = open.map((r) => {
    const doc = documents.find((d) => d.id === r.documentId)
    const project = projects.find((p) => p.id === r.initialProjectId)
    return `<tr><td>${esc(doc?.number ?? '—')} rev ${esc(r.rev)}</td><td>${esc(doc?.title ?? '—')}</td><td>${project ? `${project.number}-${project.subNumber}` : '—'}</td><td>${REVISION_STATUS_LABEL[r.status]}</td><td>${r.dueDate || '—'}</td></tr>`
  })
  downloadReport('Open Deliverables Summary: Action-On', `open-deliverables-${person.toLowerCase().replace(/\s+/g, '-')}.html`,
    `Action on: ${person} · ${open.length} open deliverables`,
    table(['Document', 'Title', 'Project', 'Status', 'Due'], rows))
}

// ---- Time Tracking ---------------------------------------------------------

interface TimeJoins {
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

const range = (from: string, to: string) => `${from} to ${to}`
const sum = (rows: { hoursRegular: number }[]) => rows.reduce((s, r) => s + r.hoursRegular, 0).toFixed(2)

export function runDetailedTime(entries: TimesheetEntry[], joins: TimeJoins, from: string, to: string) {
  const rows = timeRows(entries, joins, from, to)
  const html = rows.map((r) =>
    `<tr><td>${esc(r.employeeName)}</td><td>${r.workingDate}</td><td>${r.projectLabel}</td><td>${esc(r.workPackageTitle)}</td><td>${esc(r.activityTitle)}</td><td>${esc(r.task || '—')}</td><td>${esc(r.deliverableNumber || '—')}</td><td>${r.hoursRegular.toFixed(2)}</td><td>${r.hoursOvertime.toFixed(2)}</td><td>${r.bankHoursRegular.toFixed(2)}</td><td>${esc(r.comment || '—')}</td><td>${r.validated ? 'Yes' : 'No'}</td></tr>`)
  downloadReport('Detailed Time Report', 'detailed-time-report.html', `${range(from, to)} · ${rows.length} entries · ${sum(rows)} regular hours`,
    table(['Employee', 'Date', 'Project', 'Work Package', 'Activity', 'Task', 'Deliverable', 'Hrs RG', 'Hrs OT', 'Bk Hrs', 'Comment', 'Validated'], html))
}

export function runHoursWorked(entries: TimesheetEntry[], joins: TimeJoins, from: string, to: string, employee?: string) {
  const rows = timeRows(entries, joins, from, to).filter((r) => !employee || r.employeeName === employee)
  const html = rows.map((r) =>
    `<tr><td>${esc(r.employeeName)}</td><td>${r.workingDate}</td><td>${r.projectLabel}</td><td>${esc(r.activityTitle)}</td><td>${r.hoursRegular.toFixed(2)}</td><td>${r.hoursOvertime.toFixed(2)}</td></tr>`)
  const title = employee ? `Hours Worked: ${employee}` : 'Hours Worked'
  downloadReport(title, employee ? `hours-worked-${employee.toLowerCase().replace(/\s+/g, '-')}.html` : 'hours-worked.html',
    `${range(from, to)} · ${rows.length} entries · ${sum(rows)} regular hours`,
    table(['Employee', 'Date', 'Project', 'Activity', 'Hrs RG', 'Hrs OT'], html))
}

/** Totals per employee — the old "Summary" report, minus the payroll-group
    concept this app doesn't model yet. */
export function runHoursWorkedSummary(entries: TimesheetEntry[], joins: TimeJoins, from: string, to: string) {
  const rows = timeRows(entries, joins, from, to)
  const byEmployee = new Map<string, { rg: number; ot: number; n: number }>()
  for (const r of rows) {
    const t = byEmployee.get(r.employeeName) ?? { rg: 0, ot: 0, n: 0 }
    byEmployee.set(r.employeeName, { rg: t.rg + r.hoursRegular, ot: t.ot + r.hoursOvertime, n: t.n + 1 })
  }
  const html = [...byEmployee.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([name, t]) =>
    `<tr><td>${esc(name)}</td><td>${t.n}</td><td>${t.rg.toFixed(2)}</td><td>${t.ot.toFixed(2)}</td></tr>`)
  downloadReport('Hours Worked: Summary', 'hours-worked-summary.html', `${range(from, to)} · ${byEmployee.size} employees · ${sum(rows)} regular hours`,
    table(['Employee', 'Entries', 'Regular Hours', 'Overtime Hours'], html))
}
