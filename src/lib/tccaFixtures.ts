import type { DeliverableRevision, TccaDocLink, TccaProject } from '@/types/tcca'

/** Obviously-fake demo data, matching the project fixtures' ids. */

export const REVISION_POOL: DeliverableRevision[] = [
  { id: 'rev-1', number: 'COM-3200', rev: 'A', title: 'Certification Plan — Cabin Interior Mod', projectId: '1', releasedDate: '2026-05-04' },
  { id: 'rev-2', number: 'ELA-3200', rev: 'B', title: 'Electrical Load Analysis', projectId: '1', releasedDate: '2026-06-11' },
  { id: 'rev-3', number: 'DCR-3200', rev: 'A', title: 'Design Compliance Report', projectId: '1', releasedDate: '' },
  { id: 'rev-4', number: 'MDL-3200', rev: 'A', title: 'Master Data List', projectId: '1', releasedDate: '2026-06-28' },
  { id: 'rev-5', number: 'COM-3201', rev: 'A', title: 'Certification Plan — Map Light Addition', projectId: '2', releasedDate: '2026-03-19' },
  { id: 'rev-6', number: 'FTP-3201', rev: 'C', title: 'Flight Test Plan', projectId: '2', releasedDate: '' },
  { id: 'rev-7', number: 'WBR-3203', rev: 'A', title: 'Weight & Balance Report', projectId: '4', releasedDate: '' },
]

export const TCCA_PROJECTS: TccaProject[] = [
  {
    id: 'tcca-1',
    number: 'A-26-0192',
    description: 'STC — Cabin interior modification, certification program',
    status: 'in-progress',
    openedDate: '2026-04-02',
    closedDate: '',
    nextAction: 'Send Design Compliance Report rev A to TCCA for review.',
    comments: 'Cert plan accepted 2026-05-20. TCCA retained compliance findings on 25.853 flammability paragraphs.',
    projectIds: ['1'],
    checklist: {
      'major-minor': '2026-04-06',
      'tcca-loi': '2026-05-20',
      'test-agree': '',
      soc: '',
      'mdl-signed': '',
      doc: '',
      'upload-docs': '',
    },
  },
  {
    id: 'tcca-2',
    number: 'A-25-0147',
    description: 'Console map light addition — change to approved console STC',
    status: 'approved',
    openedDate: '2025-11-12',
    closedDate: '2026-03-27',
    nextAction: '—',
    comments: 'Approval issued 2026-03-27. Linked to the original console project for reference.',
    projectIds: ['2', '1'],
    checklist: {
      'major-minor': '2025-11-14',
      'tcca-loi': '2025-12-02',
      soc: '2026-02-10',
      'mdl-signed': '2026-02-18',
      'fms-signed': '2026-03-01',
      doc: '2026-03-20',
      'final-tcca-stc': '2026-03-27',
      'upload-docs': '2026-04-02',
      'pcc-closed': '2026-04-02',
    },
  },
]

export const TCCA_DOC_LINKS: TccaDocLink[] = [
  { id: 'link-1', tccaProjectId: 'tcca-1', revisionId: 'rev-1', involvement: 'approve', sentDate: '2026-05-06', state: 'accepted' },
  { id: 'link-2', tccaProjectId: 'tcca-1', revisionId: 'rev-2', involvement: 'review', sentDate: '2026-06-12', state: 'comments' },
  { id: 'link-3', tccaProjectId: 'tcca-1', revisionId: 'rev-3', involvement: 'approve', sentDate: '', state: 'not-sent' },
  { id: 'link-4', tccaProjectId: 'tcca-2', revisionId: 'rev-5', involvement: 'approve', sentDate: '2026-01-08', state: 'accepted' },
]

/** Next unused year-based TCCA number, e.g. A-26-0193. */
export function getNextTccaNumber(existing: TccaProject[]): string {
  const year = 26
  const max = existing
    .filter((t) => t.number.startsWith(`A-${year}-`))
    .reduce((m, t) => Math.max(m, Number(t.number.slice(-4)) || 0), 191)
  return `A-${year}-${String(max + 1).padStart(4, '0')}`
}
