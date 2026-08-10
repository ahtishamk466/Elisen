/**
 * Two-level document model, exactly as the client works: a Document holds
 * only number / title / type / owner; everything else lives on Revisions —
 * "a document cannot be defined without its revision", and by law every
 * revision must be tracked.
 *
 * Deliverables (reports, plans, manuals) and Design Data (drawings) share
 * the pattern; drawings additionally carry aircraft type + ATA chapter so
 * they can be found and reused later ("what drawings did we do for an iPad
 * holder on a 737?").
 */
export type DocumentKind = 'deliverable' | 'drawing'

export type RevisionStatus = 'wip' | 'in-review' | 'signature' | 'accepted' | 'superseded'

export interface ProjectDocument {
  id: string
  kind: DocumentKind
  number: string
  title: string
  /** Deliverables: Plan / Report / Analysis / Manual / Procedure.
      Drawings: Detail / Installation / Assembly. */
  type: string
  owner: string
  /** Drawings only — for reuse lookup. */
  aircraft?: string
  ataChapter?: string
}

export interface DocRevision {
  id: string
  documentId: string
  rev: string
  /** The Elisen project this revision was created for. */
  initialProjectId: string
  openedDate: string
  dueDate: string
  releasedDate: string
  receivedDate: string
  closedDate: string
  /** A person — whoever it lands on sees it on their to-do list. */
  nextAction: string
  url: string
  status: RevisionStatus
}

/** A revision made applicable to a project — created automatically for the
    initial project, and manually when reusing an old revision elsewhere. */
export interface ProjectRevisionLink {
  id: string
  projectId: string
  revisionId: string
}

export type ApprovalAuthority = 'tcca' | 'faa' | 'easa'
export type ApprovalType = 'stc' | 'stc-amendment' | 'minor'

/** An issued certificate (e.g. an STC). Projects tie to approvals — a
    change project references the original certificate it modifies. */
export interface Approval {
  id: string
  number: string
  title: string
  authority: ApprovalAuthority
  type: ApprovalType
  aircraft: string
  issuedDate: string
  projectIds: string[]
  /** The TCCA project that produced it, when tracked in this system. */
  tccaProjectId?: string
}
