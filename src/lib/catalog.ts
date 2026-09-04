import type { Activity, ActivityTask, Task } from '@/types/catalog'

/**
 * Pure reads over the Activity / Task catalog.
 *
 * They take the lists explicitly rather than importing the fixtures, so the
 * store stays the single source of truth: edit an activity in Reference Data
 * and every screen that names it follows, with no second copy to drift.
 */

export interface Catalog {
  activities: Activity[]
  tasks: Task[]
  links: ActivityTask[]
}

/** Falls back to the raw id: a record pointing at a deleted activity should
    show *something* traceable, never a blank cell. */
export const activityName = (activities: Activity[], id: string) =>
  activities.find((a) => a.id === id)?.name ?? id

export const taskName = (tasks: Task[], id: string) =>
  tasks.find((t) => t.id === id)?.name ?? id

export const isNonProjectActivity = (activities: Activity[], id: string) =>
  activities.find((a) => a.id === id)?.nonProject ?? false

/** Tasks linked to an activity. `activeOnly` for pickers; the full set for the
    catalog screen, which has to show a retired pairing in order to restore it. */
export function tasksForActivity(catalog: Catalog, activityId: string, activeOnly = false): Task[] {
  const ids = new Set(
    catalog.links
      .filter((l) => l.activityId === activityId && (!activeOnly || l.active))
      .map((l) => l.taskId),
  )
  return catalog.tasks
    .filter((t) => ids.has(t.id) && (!activeOnly || t.active))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export function activitiesForTask(catalog: Catalog, taskId: string, activeOnly = false): Activity[] {
  const ids = new Set(
    catalog.links
      .filter((l) => l.taskId === taskId && (!activeOnly || l.active))
      .map((l) => l.activityId),
  )
  return catalog.activities
    .filter((a) => ids.has(a.id) && (!activeOnly || a.active))
    .sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * The activity picker's list: project activities only, active only, defaults
 * first. Non-project activities are excluded because they cannot be budgeted or
 * assigned — they are logged against directly in Time Entry.
 */
export function assignableActivities(activities: Activity[]): Activity[] {
  return activities
    .filter((a) => a.active && !a.nonProject)
    .sort((a, b) => Number(b.isDefault) - Number(a.isDefault) || a.name.localeCompare(b.name))
}

/** An activity that demands a task but has none linked can never be filled in
    correctly at Time Entry. Surfaced on the catalog screen as a warning. */
export const isMisconfigured = (catalog: Catalog, activity: Activity) =>
  activity.active && activity.taskRequired && tasksForActivity(catalog, activity.id, true).length === 0
