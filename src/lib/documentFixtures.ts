import type { Approval, DocRevision, ProjectDocument, ProjectRevisionLink } from '@/types/documents'

/** Obviously-fake demo data. Revision ids rev-1..rev-7 are stable — the TCCA
    document links in tccaFixtures reference them. */

export const DOCUMENTS: ProjectDocument[] = [
  { id: 'doc-1', kind: 'deliverable', number: 'COM-3200', title: 'Certification Plan — Cabin Interior Mod', type: 'Plan', owner: 'Kelly Osei' },
  { id: 'doc-2', kind: 'deliverable', number: 'ELA-3200', title: 'Electrical Load Analysis', type: 'Analysis', owner: 'Remi Rocheleau' },
  { id: 'doc-3', kind: 'deliverable', number: 'DCR-3200', title: 'Design Compliance Report', type: 'Report', owner: 'Kelly Osei' },
  { id: 'doc-4', kind: 'deliverable', number: 'MDL-3200', title: 'Master Data List', type: 'Report', owner: 'Sofia Reyes' },
  { id: 'doc-5', kind: 'deliverable', number: 'COM-3201', title: 'Certification Plan — Map Light Addition', type: 'Plan', owner: 'Harris Bell' },
  { id: 'doc-6', kind: 'deliverable', number: 'FTP-3201', title: 'Flight Test Plan', type: 'Plan', owner: 'Lloyd Pedvis' },
  { id: 'doc-7', kind: 'deliverable', number: 'WBR-3203', title: 'Weight & Balance Report', type: 'Report', owner: 'Remi Rocheleau' },
  { id: 'doc-8', kind: 'drawing', number: 'DRW-3200-101', title: 'Seat Installation — LH Club', type: 'Installation', owner: 'Sofia Reyes', aircraft: 'King Air 350', ataChapter: '25-20' },
  { id: 'doc-9', kind: 'drawing', number: 'DRW-3200-102', title: 'Folding Table Assembly', type: 'Assembly', owner: 'Sofia Reyes', aircraft: 'King Air 350', ataChapter: '25-20' },
  { id: 'doc-10', kind: 'drawing', number: 'DRW-2018-044', title: 'iPad Holder Bracket', type: 'Detail', owner: 'Lloyd Pedvis', aircraft: 'B737-800', ataChapter: '25-10' },
]

export const DOC_REVISIONS: DocRevision[] = [
  { id: 'rev-1', documentId: 'doc-1', rev: 'A', initialProjectId: '1', openedDate: '2026-04-10', dueDate: '2026-05-01', releasedDate: '2026-05-04', receivedDate: '2026-05-20', closedDate: '', nextAction: 'Kelly Osei', url: '', status: 'accepted' },
  { id: 'rev-2', documentId: 'doc-2', rev: 'B', initialProjectId: '1', openedDate: '2026-06-01', dueDate: '2026-06-20', releasedDate: '2026-06-11', receivedDate: '', closedDate: '', nextAction: 'Remi Rocheleau', url: '', status: 'in-review' },
  { id: 'rev-2a', documentId: 'doc-2', rev: 'A', initialProjectId: '2', openedDate: '2025-12-01', dueDate: '2026-01-15', releasedDate: '2026-01-10', receivedDate: '2026-01-20', closedDate: '2026-02-01', nextAction: '—', url: '', status: 'superseded' },
  { id: 'rev-3', documentId: 'doc-3', rev: 'A', initialProjectId: '1', openedDate: '2026-06-25', dueDate: '2026-08-15', releasedDate: '', receivedDate: '', closedDate: '', nextAction: 'Kelly Osei', url: '', status: 'wip' },
  { id: 'rev-4', documentId: 'doc-4', rev: 'A', initialProjectId: '1', openedDate: '2026-06-20', dueDate: '2026-07-10', releasedDate: '2026-06-28', receivedDate: '', closedDate: '', nextAction: 'Sofia Reyes', url: '', status: 'signature' },
  { id: 'rev-5', documentId: 'doc-5', rev: 'A', initialProjectId: '2', openedDate: '2025-12-05', dueDate: '2026-01-10', releasedDate: '2026-03-19', receivedDate: '2026-03-27', closedDate: '2026-03-27', nextAction: '—', url: '', status: 'accepted' },
  { id: 'rev-6', documentId: 'doc-6', rev: 'C', initialProjectId: '2', openedDate: '2026-02-01', dueDate: '2026-03-01', releasedDate: '', receivedDate: '', closedDate: '', nextAction: 'Lloyd Pedvis', url: '', status: 'wip' },
  { id: 'rev-7', documentId: 'doc-7', rev: 'A', initialProjectId: '4', openedDate: '2026-07-01', dueDate: '2026-08-30', releasedDate: '', receivedDate: '', closedDate: '', nextAction: 'Remi Rocheleau', url: '', status: 'wip' },
  { id: 'rev-8', documentId: 'doc-8', rev: 'A', initialProjectId: '1', openedDate: '2026-05-12', dueDate: '2026-07-01', releasedDate: '', receivedDate: '', closedDate: '', nextAction: 'Sofia Reyes', url: '', status: 'in-review' },
  { id: 'rev-9', documentId: 'doc-9', rev: 'B', initialProjectId: '1', openedDate: '2026-04-02', dueDate: '2026-05-15', releasedDate: '2026-05-10', receivedDate: '', closedDate: '', nextAction: '—', url: '', status: 'accepted' },
  { id: 'rev-10', documentId: 'doc-10', rev: 'A', initialProjectId: '5', openedDate: '2024-03-04', dueDate: '2024-04-01', releasedDate: '2024-04-11', receivedDate: '', closedDate: '2024-05-01', nextAction: '—', url: '', status: 'accepted' },
]

export const PROJECT_REVISION_LINKS: ProjectRevisionLink[] = DOC_REVISIONS.map((r) => ({
  id: `prl-${r.id}`,
  projectId: r.initialProjectId,
  revisionId: r.id,
}))

export const APPROVALS: Approval[] = [
  {
    id: 'ap-1', number: 'STC SA24-018', title: 'Workstation console installation',
    authority: 'tcca', type: 'stc', aircraft: 'King Air 350', issuedDate: '2024-08-15',
    projectIds: ['2'],
  },
  {
    id: 'ap-2', number: 'STC SA26-102', title: 'Console map light addition',
    authority: 'tcca', type: 'stc-amendment', aircraft: 'King Air 350', issuedDate: '2026-03-27',
    projectIds: ['2'], tccaProjectId: 'tcca-2',
  },
  {
    id: 'ap-3', number: 'STC ST02981NY', title: 'iPad holder installation (FAA validation)',
    authority: 'faa', type: 'stc', aircraft: 'B737-800', issuedDate: '2024-09-30',
    projectIds: ['5'],
  },
]
