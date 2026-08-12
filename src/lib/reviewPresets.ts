import type { ProjectListRow, ProjectStatus, ProjectType } from '@/types/project'

/**
 * The legacy Projects Review's 7 tabs, re-expressed as filter presets over
 * one list. Each preset is exactly the WHERE clause its tab used to run
 * (see docs/DECISIONS.md) — no tab had any other logic in it.
 */
export interface ReviewPreset {
  key: string
  label: string
  /** Empty = any status. */
  statuses: ProjectStatus[]
  /** Empty = any type. */
  types: ProjectType[]
  /** Priorities was only ever "In Progress, sorted by priority". */
  sortByPriority?: boolean
}

const IN_FLIGHT: ProjectStatus[] = ['active', 'tentative']

export const REVIEW_PRESETS: ReviewPreset[] = [
  { key: 'all', label: 'All', statuses: [], types: [] },
  { key: 'priorities', label: 'Priorities', statuses: ['active'], types: [], sortByPriority: true },
  { key: 'outstanding-rfqs', label: 'Outstanding RFQs', statuses: ['query'], types: [] },
  { key: 'completed-rfqs', label: 'Completed RFQs', statuses: ['quoted'], types: [] },
  { key: 'internal', label: 'Internal', statuses: IN_FLIGHT, types: ['internal'] },
  { key: 'external', label: 'External', statuses: IN_FLIGHT, types: ['external'] },
  { key: 'top-aces', label: 'Top Aces', statuses: IN_FLIGHT, types: ['preferred-topaces'] },
  { key: 'duncan', label: 'Duncan', statuses: IN_FLIGHT, types: ['preferred-duncan'] },
]

export function matchesPreset(row: ProjectListRow, preset: ReviewPreset) {
  if (preset.statuses.length && !preset.statuses.includes(row.status)) return false
  if (preset.types.length && !preset.types.includes(row.type)) return false
  return true
}

const PRIORITY_ORDER: Record<ProjectListRow['priority'], number> = {
  '1-fire': 1, '2-high': 2, '3-med': 3, '4-low': 4, '5-lowest': 5,
}

/** Legacy sort: priority, then number, then sub number. */
export function byPriority(a: ProjectListRow, b: ProjectListRow) {
  const p = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
  if (p !== 0) return p
  const n = a.number.localeCompare(b.number)
  return n !== 0 ? n : a.subNumber.localeCompare(b.subNumber)
}

/**
 * Days since the project was opened — what the legacy Aging column showed.
 * Only meaningful pre-award, so callers show it for RFQ rows only.
 */
export function agingDays(openedDate: string, today = new Date()): number | null {
  if (!openedDate) return null
  const opened = new Date(`${openedDate}T00:00:00`)
  if (Number.isNaN(opened.getTime())) return null
  // Floor, not round — `today` carries a time-of-day, so rounding would
  // tick the count over half a day early.
  return Math.max(0, Math.floor((today.getTime() - opened.getTime()) / 86_400_000))
}
