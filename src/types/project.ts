/** `preferred` (generic) and `other` exist so every project has a home —
    the legacy Review screen filtered on four of six types, leaving those
    two invisible on that screen entirely. */
export type ProjectType =
  | 'internal' | 'preferred' | 'preferred-duncan' | 'preferred-topaces' | 'external' | 'other'
/** `query` (quote requested, not yet sent) and `quoted` (quote sent,
    awaiting outcome) are the two RFQ stages; `tentative` is won-but-not-
    started. Together they reproduce the legacy Review lifecycle. */
export type ProjectStatus =
  | 'query' | 'quoted' | 'tentative' | 'active' | 'on-hold' | 'complete' | 'cancelled'
export type ProjectPriority = '1-fire' | '2-high' | '3-med' | '4-low' | '5-lowest'

/** Scope of work Elisen was hired for — drives which deliverables apply. */
export type ScopeKey = 'design' | 'validation' | 'certification' | 'parts-kit' | 'aircraft-mod'

/** A project can apply to more than one aircraft type — managed as a list
    via its own dedicated drawer, not the create/edit wizard. */
export interface AircraftEntry {
  id: string
  modelName: string
  modelNumber: string
  manufacturer: string
}

export interface ProjectListRow {
  id: string
  number: string
  subNumber: string
  type: ProjectType
  title: string
  companyName: string
  companyNumber: string
  contactName: string
  contactEmail: string
  personResponsible: string
  actualHours: number
  budgetHours: number
  priority: ProjectPriority
  status: ProjectStatus
  /** Lifecycle flag, as on the legacy Review screen's Active column. */
  active: boolean

  // Detail-only fields — collected on the create/edit form, shown and
  // editable per-section on Project Detail > Overview.
  openedDate: string
  dueDate: string
  aircraftInputDate: string
  closedDate: string
  scope: ScopeKey[]
  contractCurrency: string
  contractValue: string
  proposalSubmitted: 'yes' | 'no'
  proposalSubmittedDate: string
  proposalAccepted: 'yes' | 'no'
  proposalAcceptedDate: string
  nextAction: string
  comments: string
  aircraft: AircraftEntry[]
}

/**
 * Checklist items are applicability-only at project creation; the completion
 * date is captured later, per the TCCA process (see docs/DESIGN.md).
 */
export interface ChecklistItem {
  id: string
  label: string
}

export interface ChecklistPhase {
  id: string
  title: string
  items: ChecklistItem[]
}
