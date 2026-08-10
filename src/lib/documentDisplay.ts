import type { BadgeTone } from '@/components/ui/Badge'
import type { ApprovalAuthority, ApprovalType, DocumentKind, RevisionStatus } from '@/types/documents'

export const REVISION_STATUS_LABEL: Record<RevisionStatus, string> = {
  wip: 'Work in Progress',
  'in-review': 'In Review',
  signature: 'Signature Cycle',
  accepted: 'Accepted',
  superseded: 'Superseded',
}
export const REVISION_STATUS_TONE: Record<RevisionStatus, BadgeTone> = {
  wip: 'warning',
  'in-review': 'info',
  signature: 'info',
  accepted: 'success',
  superseded: 'neutral',
}

export const DOC_TYPES: Record<DocumentKind, string[]> = {
  deliverable: ['Plan', 'Report', 'Analysis', 'Manual', 'Procedure'],
  drawing: ['Detail', 'Installation', 'Assembly'],
}

export const KIND_LABEL: Record<DocumentKind, { singular: string; plural: string }> = {
  deliverable: { singular: 'deliverable', plural: 'Deliverables' },
  drawing: { singular: 'drawing', plural: 'Design Data' },
}

export const AUTHORITY_LABEL: Record<ApprovalAuthority, string> = {
  tcca: 'TCCA',
  faa: 'FAA',
  easa: 'EASA',
}

export const APPROVAL_TYPE_LABEL: Record<ApprovalType, string> = {
  stc: 'STC',
  'stc-amendment': 'STC Amendment',
  minor: 'Minor Approval',
}

/** Next unused revision letter for a document (A, B, C...). */
export function nextRevLetter(existing: string[]): string {
  const max = existing.reduce((m, r) => Math.max(m, r.charCodeAt(0)), 'A'.charCodeAt(0) - 1)
  return String.fromCharCode(max + 1)
}
