/**
 * Every report from the client's three old report pages (Project Management,
 * Time Tracking, GCP), on one catalog. Parameters live here as specs and are
 * collected in the Run drawer — not shown as list columns like the old UI.
 * Reports whose data model doesn't exist yet are `pending` with the reason,
 * never dead buttons.
 */
export type ReportCategory = 'project' | 'time' | 'gcp'

export interface ReportParam {
  key: string
  label: string
  /** 'select' currently always offers the people list — the only select
      parameter any ready report needs. */
  kind: 'date' | 'select'
  required?: boolean
}

export interface ReportDef {
  id: string
  name: string
  /** One line, shown under the name in the rail — what the report answers,
      never how it is generated. */
  description: string
  category: ReportCategory
  status: 'ready' | 'pending'
  pendingReason?: string
  params: ReportParam[]
}

export const CATEGORY_LABEL: Record<ReportCategory, string> = {
  project: 'Project Reports',
  time: 'Time Tracking Reports',
  gcp: 'GCP Reports',
}

const start = { key: 'startDate', label: 'Start Date', kind: 'date', required: true } as const
const end = { key: 'endDate', label: 'End Date', kind: 'date', required: true } as const

export const REPORT_CATALOG: ReportDef[] = [
  // Project Management
  { id: 'approvals', name: 'Approvals', description: 'Every issued certificate, with holders, coverage and linked projects.', category: 'project', status: 'ready', params: [] },
  {
    id: 'open-deliverables-action-on', name: 'Open Deliverables Summary: Action-On', category: 'project', status: 'ready',
    description: 'Open deliverable revisions waiting on one person, with status and due dates.',
    params: [{ key: 'personResponsible', label: 'Person Responsible', kind: 'select', required: true }],
  },
  {
    id: 'open-queries', name: 'Open Queries and Quotations', category: 'project', status: 'pending',
    description: 'Projects still at the query or quoted stage.',
    pendingReason: 'Queries & quotations aren’t tracked in this app yet', params: [],
  },
  {
    id: 'open-queries-status', name: 'Open Queries and Quotations: Status', category: 'project', status: 'pending',
    description: 'Query and quotation pipeline grouped by status.',
    pendingReason: 'Queries & quotations aren’t tracked in this app yet', params: [],
  },
  { id: 'project-status', name: 'Project Status', description: 'All projects with priority, status, hours against budget and next actions.', category: 'project', status: 'ready', params: [] },
  { id: 'tcca-priority', name: 'TCCA Priority', description: 'Open TCCA projects ordered by urgency, most critical first.', category: 'project', status: 'ready', params: [] },
  { id: 'tcca-projects', name: 'TCCA Projects', description: 'Every TCCA project with status, dates and linked Elisen projects.', category: 'project', status: 'ready', params: [] },

  // Time Tracking
  { id: 'detailed-time', name: 'Detailed Time Report', description: 'Every time entry in the range, one row per entry with full detail.', category: 'time', status: 'ready', params: [start, end] },
  { id: 'hours-worked', name: 'Hours Worked', description: 'Who worked on what in the range — compact, one row per entry.', category: 'time', status: 'ready', params: [start, end] },
  {
    id: 'hours-worked-individual', name: 'Hours Worked: Individual Employee', category: 'time', status: 'ready',
    description: 'One employee\u2019s entries in the range, for review or payroll queries.',
    params: [start, end, { key: 'employee', label: 'Employee', kind: 'select', required: true }],
  },
  { id: 'hours-worked-summary', name: 'Hours Worked: Summary', description: 'Total regular and overtime hours per employee across the range.', category: 'time', status: 'ready', params: [start, end] },

  // GCP — the whole module is deferred with the client
  { id: 'gcp-cert-plan', name: 'Certification Plan', description: 'The certification plan document for a GCP program.', category: 'gcp', status: 'pending', pendingReason: 'GCP module is deferred', params: [] },
  { id: 'gcp-cert-record', name: 'Certification Record', description: 'The certification record for a completed GCP program.', category: 'gcp', status: 'pending', pendingReason: 'GCP module is deferred', params: [] },
  { id: 'gcp-req-matrix', name: 'Requirement Cross reference: Matrix', description: 'Requirements mapped to the deliverables that satisfy them.', category: 'gcp', status: 'pending', pendingReason: 'GCP module is deferred', params: [] },
]
