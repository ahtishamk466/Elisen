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

/**
 * An issued certificate. Fields mirror the legacy `approval` table exactly —
 * the previous shape (authority / type / issued date) was invented, and the
 * client's verdict on it was blunt: "This form is also wrong."
 *
 * Note what is NOT here: no issue date. An approval has no single date; its
 * revisions carry them, because that is how the certificate actually evolves —
 * "The first two aircraft got approved. Then another two or three aircraft
 * were added inside it through an issue file."
 */
export interface Approval {
  id: string
  number: string
  /** `description` — what the certificate covers. */
  description: string
  /** `primary_approval` — an original certificate in its own right, as opposed
      to one that only exists as a change against another. */
  primary: boolean
  /** `design_approval_holder` — the organisation that holds the design approval. */
  designApprovalHolder: string
  comment: string
  active: boolean
  /** `project_approval` — many-to-many, and linkable from either side: "Or a
      project, we can link a project from there as well. We can link from here
      too." */
  projectIds: string[]
  /** `approval_aircraft` — the aircraft models this certificate covers. */
  aircraftIds: string[]
  /** `approval_serialnumber` — the specific airframes it covers. A flat list on
      the approval, not nested under each aircraft, exactly as the legacy join
      table has it: an approval can name a type without naming a tail. */
  serialIds: string[]
}

/**
 * A revision of an approval — the paperwork that changes a certificate, and
 * what authorises adding further aircraft to it: "another two or three aircraft
 * were added inside it through an issue file."
 *
 * The legacy app names these "Issues" (`approvalissue`), and the call went back
 * and forth on it — "We should also use the revision terminology as an issue, or
 * keep it as Revision… Now its name is Revision, right?" — before settling on
 * **Revision**, which is what the UI says throughout. The DB column names are
 * left alone in the comments below so the mapping stays findable.
 */
export interface ApprovalRevision {
  id: string
  approvalId: string
  /** `approval_issue` — sequential revision number: 1, 2, 3… */
  revision: number
  /** `change_description` — what this revision changed. */
  changeDescription: string
  /** `issue_date` */
  revisionDate: string
  /** `approval_document` — the revision file, a PDF in practice. */
  document: string
}
