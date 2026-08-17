import type { BadgeTone } from '@/components/ui/Badge'
import type { DocumentKind, RevisionStatus } from '@/types/documents'

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

/** Next unused revision number for an approval — these are sequential
    (1, 2, 3), unlike document revisions which are lettered. */
export function nextRevisionNumber(existing: number[]): number {
  return existing.reduce((m, n) => Math.max(m, n), 0) + 1
}

/** Next unused revision letter for a document (A, B, C...). */
export function nextRevLetter(existing: string[]): string {
  const max = existing.reduce((m, r) => Math.max(m, r.charCodeAt(0)), 'A'.charCodeAt(0) - 1)
  return String.fromCharCode(max + 1)
}
