export type TccaStatus = 'in-progress' | 'approved' | 'closed'

/** `project_status` — where the work stands, distinct from the TCCA-facing
    `status`. Both exist in the legacy table and on the create screen. */
export type TccaProjectStatus = 'not-started' | 'in-progress' | 'on-hold' | 'complete' | 'cancelled'

/** `project_level` — how much Transport Canada involvement the change needs. */
export type TccaProjectLevel = 'major' | 'minor' | 'not-assigned'

/**
 * Tracks Elisen's interactions with Transport Canada toward ONE certificate.
 * Linked to Elisen projects by reference only — no data is copied between
 * the two (deliberate client design, see docs/DECISIONS.md).
 *
 * Fields mirror the legacy `tccaproject` table and its create screen.
 */
export interface TccaProject {
  id: string
  /** Year-based unique number, e.g. A-26-0192. */
  number: string
  description: string
  /** `priority` — decimal(3,1), 1.0 (highest) to 9.9. */
  priority: string
  /** `certificate` — the certificate number this project is working toward. */
  certificate: string
  /** `issue_number` — which issue of that certificate. */
  issueNumber: string
  /** `issued` — the certificate has been granted. */
  issued: boolean
  status: TccaStatus
  projectStatus: TccaProjectStatus
  projectLevel: TccaProjectLevel
  /** `start_date` on the legacy screen; the list still calls it Opened. */
  openedDate: string
  closedDate: string
  expectedFaiDate: string
  expectedTestingDate: string
  expectedApprovalDate: string
  expectedDeliveryDate: string
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
