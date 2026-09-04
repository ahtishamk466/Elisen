import { create } from 'zustand'
import { ACTIVITIES, ACTIVITY_TASK_LINKS, TASKS } from '@/lib/catalogFixtures'
import type { Activity, ActivityTask, Task } from '@/types/catalog'

interface CatalogState {
  activities: Activity[]
  tasks: Task[]
  links: ActivityTask[]

  /** Upsert an activity and replace its task links in one save — the drawer
      edits both together, exactly as the client's Activity Tasks screen does. */
  saveActivity: (activity: Activity, taskIds: string[]) => void
  /** Refuses if anything still references it — callers check `activityUsage`
      first and offer deactivation instead. Also drops its links. */
  removeActivity: (id: string) => void

  /** Upsert a task and replace the activities it is linked to. The same links,
      edited from the other side. */
  saveTask: (task: Task, activityIds: string[]) => void
  removeTask: (id: string) => void

  /** Retire a pairing without deleting either side. */
  setLinkActive: (id: string, active: boolean) => void
  /** The offered alternative when a delete is refused: keep the record, take it
      out of the pickers. Links are untouched. */
  setActivityActive: (id: string, active: boolean) => void
  setTaskActive: (id: string, active: boolean) => void
}

const upsert = <T extends { id: string }>(list: T[], item: T) =>
  list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? item : x)) : [...list, item]

/**
 * Rebuilds one side of the many-to-many. Existing rows are kept rather than
 * recreated so a link's `active` flag survives an unrelated edit to the record
 * it hangs off.
 */
function relink(
  links: ActivityTask[],
  { activityId, taskId }: { activityId?: string; taskId?: string },
  otherIds: string[],
): ActivityTask[] {
  const mine = (l: ActivityTask) =>
    activityId ? l.activityId === activityId : l.taskId === taskId
  const kept = links.filter((l) => !mine(l))
  const existing = links.filter(mine)
  const wanted = [...new Set(otherIds)].filter(Boolean)
  return [
    ...kept,
    ...wanted.map((other) => {
      const a = activityId ?? other
      const t = taskId ?? other
      return existing.find((l) => (activityId ? l.taskId : l.activityId) === other)
        ?? { id: `at-${a}-${t}`, activityId: a, taskId: t, active: true }
    }),
  ]
}

export const useCatalogStore = create<CatalogState>((set) => ({
  activities: ACTIVITIES,
  tasks: TASKS,
  links: ACTIVITY_TASK_LINKS,

  saveActivity: (activity, taskIds) => set((s) => ({
    activities: upsert(s.activities, activity),
    links: relink(s.links, { activityId: activity.id }, taskIds),
  })),
  removeActivity: (id) => set((s) => ({
    activities: s.activities.filter((a) => a.id !== id),
    links: s.links.filter((l) => l.activityId !== id),
  })),

  saveTask: (task, activityIds) => set((s) => ({
    tasks: upsert(s.tasks, task),
    links: relink(s.links, { taskId: task.id }, activityIds),
  })),
  removeTask: (id) => set((s) => ({
    tasks: s.tasks.filter((t) => t.id !== id),
    links: s.links.filter((l) => l.taskId !== id),
  })),

  setLinkActive: (id, active) => set((s) => ({
    links: s.links.map((l) => (l.id === id ? { ...l, active } : l)),
  })),
  setActivityActive: (id, active) => set((s) => ({
    activities: s.activities.map((a) => (a.id === id ? { ...a, active } : a)),
  })),
  setTaskActive: (id, active) => set((s) => ({
    tasks: s.tasks.map((t) => (t.id === id ? { ...t, active } : t)),
  })),
}))
