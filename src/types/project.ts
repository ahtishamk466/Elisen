export type ProjectType = 'internal' | 'preferred-duncan' | 'preferred-topaces' | 'external'
export type ProjectStatus = 'quoted' | 'active' | 'on-hold' | 'complete' | 'cancelled'
export type ProjectPriority = '1-fire' | '2-high' | '3-med' | '4-low'

export interface ProjectListRow {
  id: string
  number: string
  subNumber: string
  type: ProjectType
  title: string
  companyName: string
  companyNumber: string
  contactName: string
  personResponsible: string
  actualHours: number
  budgetHours: number
  priority: ProjectPriority
  status: ProjectStatus
}

/** Scope of work Elisen was hired for — drives which deliverables apply. */
export type ScopeKey = 'design' | 'validation' | 'certification' | 'parts-kit' | 'aircraft-mod'

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
