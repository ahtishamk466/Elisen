import type { BadgeTone } from '@/components/ui/Badge'
import type { WorkPackage, WorkPackageActivity } from '@/types/workPackage'

/**
 * Budget health, computed the same way at every level — activity, work
 * package, project — so a number never means two different things depending
 * on which screen you read it from.
 *
 * `no-budget` is a real state, not a rounding case: several live projects
 * sit at 0/0h because budget hasn't been entered yet. Showing those as
 * "0% used, on track" would be a lie, so they get their own label and are
 * excluded from the on-track/near/over rollups.
 */
export type HealthState = 'no-budget' | 'on-track' | 'at-risk' | 'over-budget' | 'complete'

export interface Health {
  budget: number
  actual: number
  /** Negative once actual passes budget — callers show it as "over by". */
  remaining: number
  /** Percent of budget consumed. null when there's no budget to divide by. */
  progressPct: number | null
  state: HealthState
}

/** Consumed ≥ this much of budget (but not over) = worth a warning. */
const AT_RISK_THRESHOLD = 90

export function healthOf(budget: number, actual: number, complete = false): Health {
  const remaining = budget - actual
  if (budget <= 0) {
    return { budget, actual, remaining, progressPct: null, state: 'no-budget' }
  }
  const progressPct = (actual / budget) * 100
  const state: HealthState =
    actual > budget ? 'over-budget'
      : complete ? 'complete'
        : progressPct >= AT_RISK_THRESHOLD ? 'at-risk'
          : 'on-track'
  return { budget, actual, remaining, progressPct, state }
}

/* Title Case throughout — matches WP_STATUS_LABEL and ProjectStatus's own
   STATUS_LABEL ("In Progress", "On Hold"), which this set was the one
   holdout against (sentence case) despite reading the same badge shape
   everywhere it's used. */
export const HEALTH_LABEL: Record<HealthState, string> = {
  'no-budget': 'No Budget Set',
  'on-track': 'On Track',
  'at-risk': 'Near Budget',
  'over-budget': 'Over Budget',
  complete: 'Complete',
}

export const HEALTH_TONE: Record<HealthState, BadgeTone> = {
  'no-budget': 'neutral',
  'on-track': 'success',
  'at-risk': 'warning',
  'over-budget': 'danger',
  complete: 'info',
}

/** Sums a set of activities — the roll-up for one work package. */
export function rollUpActivities(activities: WorkPackageActivity[], complete = false): Health {
  return healthOf(
    activities.reduce((s, a) => s + a.budgetHours, 0),
    activities.reduce((s, a) => s + a.actualHours, 0),
    complete,
  )
}

/**
 * A project's health rolls up from its work packages' activities — the level
 * hours are actually entered at. Falls back to the project row's own
 * budget/actual fields when no packages exist yet, so list rows without
 * breakdown data still report something honest.
 */
export function rollUpProject(
  projectId: string,
  workPackages: WorkPackage[],
  activities: WorkPackageActivity[],
  fallback?: { budgetHours: number; actualHours: number; complete?: boolean },
): Health {
  const packages = workPackages.filter((w) => w.projectId === projectId)
  if (packages.length === 0 && fallback) {
    return healthOf(fallback.budgetHours, fallback.actualHours, fallback.complete)
  }
  const packageIds = new Set(packages.map((w) => w.id))
  const own = activities.filter((a) => packageIds.has(a.workPackageId))
  const allComplete = packages.length > 0 && packages.every((w) => w.status === 'complete')
  return rollUpActivities(own, allComplete)
}

/** "44 / 80h" keeps the unit once; fractional hours keep one decimal. */
export const formatHours = (n: number) => `${Number.isInteger(n) ? n : n.toFixed(1)}h`

/** Whole percent; callers render "—" when progressPct is null. */
export const formatPct = (pct: number | null) => (pct === null ? '—' : `${Math.round(pct)}%`)
