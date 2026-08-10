export type TccaStatus = 'in-progress' | 'approved' | 'closed'

/**
 * Tracks Elisen's interactions with Transport Canada toward ONE certificate.
 * Linked to Elisen projects by reference only — no data is copied between
 * the two (deliberate client design, see docs/DECISIONS.md).
 */
export interface TccaProject {
  id: string
  /** Year-based unique number, e.g. A-26-0192. */
  number: string
  description: string
  status: TccaStatus
  openedDate: string
  closedDate: string
  nextAction: string
  comments: string
  /** Linked Elisen project ids. Usually one; can be several (informational).
      Empty = baseline/DAO cost-centre exception. */
  projectIds: string[]
  /** itemId → completion date ('' = applicable but not complete).
      Items absent from the map are Not Applicable. */
  checklist: Record<string, string>
}

/** A document revision from the Elisen side. Documents only — drawings are
    never tracked across TCCA. */
export interface DeliverableRevision {
  id: string
  number: string
  rev: string
  title: string
  projectId: string
  releasedDate: string
}

/** How much Transport Canada wants to be involved with a document. */
export type TccaInvolvement = 'none' | 'review' | 'approve'
export type TccaDocState = 'not-sent' | 'sent' | 'accepted' | 'comments'

/** Linking record between a TCCA project and a deliverable revision, carrying
    the government-interaction tracking fields. */
export interface TccaDocLink {
  id: string
  tccaProjectId: string
  revisionId: string
  involvement: TccaInvolvement
  sentDate: string
  state: TccaDocState
}
