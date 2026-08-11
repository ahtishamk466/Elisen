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
  { id: 'approvals', name: 'Approvals', category: 'project', status: 'ready', params: [] },
  {
    id: 'open-deliverables-action-on', name: 'Open Deliverables Summary — Action-On', category: 'project', status: 'ready',
    params: [{ key: 'personResponsible', label: 'Person Responsible', kind: 'select', required: true }],
  },
  {
    id: 'open-queries', name: 'Open Queries and Quotations', category: 'project', status: 'pending',
    pendingReason: 'Queries & quotations aren’t tracked in this app yet', params: [],
  },
  {
    id: 'open-queries-status', name: 'Open Queries and Quotations — Status', category: 'project', status: 'pending',
    pendingReason: 'Queries & quotations aren’t tracked in this app yet', params: [],
  },
  { id: 'project-status', name: 'Project Status', category: 'project', status: 'ready', params: [] },
  { id: 'tcca-priority', name: 'TCCA Priority', category: 'project', status: 'ready', params: [] },
  { id: 'tcca-projects', name: 'TCCA Projects', category: 'project', status: 'ready', params: [] },

  // Time Tracking
  { id: 'detailed-time', name: 'Detailed Time Report', category: 'time', status: 'ready', params: [start, end] },
  { id: 'hours-worked', name: 'Hours Worked', category: 'time', status: 'ready', params: [start, end] },
  {
    id: 'hours-worked-individual', name: 'Hours Worked — Individual Employee', category: 'time', status: 'ready',
    params: [start, end, { key: 'employee', label: 'Employee', kind: 'select', required: true }],
  },
  { id: 'hours-worked-summary', name: 'Hours Worked — Summary', category: 'time', status: 'ready', params: [start, end] },

  // GCP — the whole module is deferred with the client
  { id: 'gcp-cert-plan', name: 'Certification Plan', category: 'gcp', status: 'pending', pendingReason: 'GCP module is deferred', params: [] },
  { id: 'gcp-cert-record', name: 'Certification Record', category: 'gcp', status: 'pending', pendingReason: 'GCP module is deferred', params: [] },
  { id: 'gcp-req-matrix', name: 'Requirement Cross reference — Matrix', category: 'gcp', status: 'pending', pendingReason: 'GCP module is deferred', params: [] },
]
