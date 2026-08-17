import type { TccaDocLink, TccaProject } from '@/types/tcca'

/** Obviously-fake demo data, matching the project fixtures' ids. */

export const TCCA_PROJECTS: TccaProject[] = [
  {
    id: 'tcca-1',
    number: 'A-26-0192',
    description: 'STC: Cabin interior modification, certification program',
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
    description: 'Console map light addition, change to approved console STC',
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

  // Only projects whose scope includes certification get a TCCA
  // project — a design-only job never goes to Transport Canada.
  {
    id: 'tcca-g0', number: 'A-24-1000',
    description: 'iPad Holder Installation: Cockpit',
    status: 'in-progress', openedDate: '2024-03-19', closedDate: '',
    nextAction: 'Prepare Statement of Compliance for TCCA review.',
    comments: 'Certification tracked against project 3204-00.',
    projectIds: ['5'],
    checklist: { 'major-minor': '2024-03-24', 'tcca-loi': '2024-04-18' },
  },
  {
    id: 'tcca-g1', number: 'A-26-1007',
    description: 'F2000EX C-GENW - Moving Map and Monitor',
    status: 'in-progress', openedDate: '2026-03-16', closedDate: '',
    nextAction: 'Prepare Statement of Compliance for TCCA review.',
    comments: 'Certification tracked against project 3277-00.',
    projectIds: ['rv-748'],
    checklist: { 'major-minor': '2026-03-21', 'tcca-loi': '2026-04-15' },
  },
  {
    id: 'tcca-g2', number: 'A-26-1014',
    description: 'C-GENL Interior upgrade',
    status: 'in-progress', openedDate: '2026-04-02', closedDate: '',
    nextAction: 'Awaiting TCCA response to the submitted compliance package.',
    comments: 'Certification tracked against project 3282-00.',
    projectIds: ['rv-770'],
    checklist: { 'major-minor': '2026-04-07', 'tcca-loi': '2026-05-02', 'test-agree': '2026-05-27', 'soc': '2026-06-21', 'mdl-signed': '2026-07-06' },
  },
  {
    id: 'tcca-g3', number: 'A-25-1021',
    description: 'TCCA sSTC - Q400 Forward Cabin Reconfiguration',
    status: 'approved', openedDate: '2025-07-27', closedDate: '2025-12-14',
    nextAction: '—',
    comments: 'Certification tracked against project 3107-00.',
    projectIds: ['rv-469'],
    checklist: { 'major-minor': '2025-08-01', 'tcca-loi': '2025-08-26', 'test-agree': '2025-09-20', 'soc': '2025-10-15', 'mdl-signed': '2025-10-30', 'doc': '2025-11-29', 'final-tcca-stc': '2025-12-14', 'upload-docs': '2025-12-19' },
  },
  {
    id: 'tcca-g4', number: 'A-25-1028',
    description: 'eArcher - DDP activities',
    status: 'in-progress', openedDate: '2025-08-30', closedDate: '',
    nextAction: 'Prepare Statement of Compliance for TCCA review.',
    comments: 'Certification tracked against project 3116-03.',
    projectIds: ['rv-645'],
    checklist: { 'major-minor': '2025-09-04', 'tcca-loi': '2025-09-29' },
  },
  {
    id: 'tcca-g5', number: 'A-25-1035',
    description: '3292 testing description',
    status: 'in-progress', openedDate: '2025-09-16', closedDate: '',
    nextAction: 'Prepare Statement of Compliance for TCCA review.',
    comments: 'Certification tracked against project 3292-00.',
    projectIds: ['rv-779'],
    checklist: { 'major-minor': '2025-09-21', 'tcca-loi': '2025-10-16' },
  },
  {
    id: 'tcca-g6', number: 'A-25-1042',
    description: 'Test project',
    status: 'in-progress', openedDate: '2025-10-03', closedDate: '',
    nextAction: 'Prepare Statement of Compliance for TCCA review.',
    comments: 'Certification tracked against project 3293-00.',
    projectIds: ['rv-780'],
    checklist: { 'major-minor': '2025-10-08', 'tcca-loi': '2025-11-02' },
  },
  {
    id: 'tcca-g7', number: 'A-25-1049',
    description: 'Aqeel Test Project',
    status: 'in-progress', openedDate: '2025-10-20', closedDate: '',
    nextAction: 'Awaiting TCCA response to the submitted compliance package.',
    comments: 'Certification tracked against project 3294-00.',
    projectIds: ['rv-781'],
    checklist: { 'major-minor': '2025-10-25', 'tcca-loi': '2025-11-19', 'test-agree': '2025-12-14', 'soc': '2026-01-08', 'mdl-signed': '2026-01-23' },
  },
  {
    id: 'tcca-g8', number: 'A-25-1056',
    description: 'Fireswift design upgrades',
    status: 'approved', openedDate: '2025-12-10', closedDate: '2026-04-29',
    nextAction: '—',
    comments: 'Certification tracked against project 3262-00.',
    projectIds: ['rv-732'],
    checklist: { 'major-minor': '2025-12-15', 'tcca-loi': '2026-01-09', 'test-agree': '2026-02-03', 'soc': '2026-02-28', 'mdl-signed': '2026-03-15', 'doc': '2026-04-14', 'final-tcca-stc': '2026-04-29', 'upload-docs': '2026-05-04' },
  },
  {
    id: 'tcca-g9', number: 'A-25-1063',
    description: 'Fireswift Tank design improvement study',
    status: 'in-progress', openedDate: '2026-01-13', closedDate: '',
    nextAction: 'Prepare Statement of Compliance for TCCA review.',
    comments: 'Certification tracked against project 3262-03.',
    projectIds: ['rv-768'],
    checklist: { 'major-minor': '2026-01-18', 'tcca-loi': '2026-02-12' },
  },
  {
    id: 'tcca-g10', number: 'A-26-1070',
    description: 'Galileo One Web HDX/FDX installation A330',
    status: 'in-progress', openedDate: '2026-01-30', closedDate: '',
    nextAction: 'Prepare Statement of Compliance for TCCA review.',
    comments: 'Certification tracked against project 3275-00.',
    projectIds: ['rv-746'],
    checklist: { 'major-minor': '2026-02-04', 'tcca-loi': '2026-03-01' },
  },
  {
    id: 'tcca-g11', number: 'A-26-1077',
    description: 'BBJ737-700',
    status: 'in-progress', openedDate: '2026-02-16', closedDate: '',
    nextAction: 'Prepare Statement of Compliance for TCCA review.',
    comments: 'Certification tracked against project 3276-00.',
    projectIds: ['rv-747'],
    checklist: { 'major-minor': '2026-02-21', 'tcca-loi': '2026-03-18' },
  },
  {
    id: 'tcca-g12', number: 'A-26-1084',
    description: 'ATR 72 Aerial Fire Fighter conversionss',
    status: 'in-progress', openedDate: '2026-03-05', closedDate: '',
    nextAction: 'Awaiting TCCA response to the submitted compliance package.',
    comments: 'Certification tracked against project 3289-00.',
    projectIds: ['rv-775'],
    checklist: { 'major-minor': '2026-03-10', 'tcca-loi': '2026-04-04', 'test-agree': '2026-04-29', 'soc': '2026-05-24', 'mdl-signed': '2026-06-08' },
  },
  {
    id: 'tcca-g13', number: 'A-25-1091',
    description: 'Elisen - Quality System',
    status: 'approved', openedDate: '2025-06-29', closedDate: '2025-11-16',
    nextAction: '—',
    comments: 'Certification tracked against project 0000-02.',
    projectIds: ['rv-561'],
    checklist: { 'major-minor': '2025-07-04', 'tcca-loi': '2025-07-29', 'test-agree': '2025-08-23', 'soc': '2025-09-17', 'mdl-signed': '2025-10-02', 'doc': '2025-11-01', 'final-tcca-stc': '2025-11-16', 'upload-docs': '2025-11-21' },
  },
  {
    id: 'tcca-g14', number: 'A-25-1098',
    description: 'Elisen - IT',
    status: 'in-progress', openedDate: '2025-08-02', closedDate: '',
    nextAction: 'Prepare Statement of Compliance for TCCA review.',
    comments: 'Certification tracked against project 0000-04.',
    projectIds: ['rv-569'],
    checklist: { 'major-minor': '2025-08-07', 'tcca-loi': '2025-09-01' },
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
