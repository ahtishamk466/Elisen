import { create } from 'zustand'
import { WORK_PACKAGES, WP_ACTIVITIES } from '@/lib/workPackageFixtures'
import type { WorkPackage, WorkPackageActivity } from '@/types/workPackage'

interface WorkPackagesState {
  workPackages: WorkPackage[]
  activities: WorkPackageActivity[]
  addWp: (wp: WorkPackage) => void
  updateWp: (id: string, patch: Partial<WorkPackage>) => void
  /** Also removes the package's activity assignments. */
  removeWp: (id: string) => void
  addActivity: (a: WorkPackageActivity) => void
  updateActivity: (id: string, patch: Partial<WorkPackageActivity>) => void
  removeActivity: (id: string) => void
}

export const useWorkPackagesStore = create<WorkPackagesState>((set) => ({
  workPackages: WORK_PACKAGES,
  activities: WP_ACTIVITIES,

  addWp: (wp) => set((s) => ({ workPackages: [wp, ...s.workPackages] })),
  updateWp: (id, patch) =>
    set((s) => ({ workPackages: s.workPackages.map((w) => (w.id === id ? { ...w, ...patch } : w)) })),
  removeWp: (id) =>
    set((s) => ({
      workPackages: s.workPackages.filter((w) => w.id !== id),
      activities: s.activities.filter((a) => a.workPackageId !== id),
    })),

  addActivity: (a) => set((s) => ({ activities: [...s.activities, a] })),
  updateActivity: (id, patch) =>
    set((s) => ({ activities: s.activities.map((a) => (a.id === id ? { ...a, ...patch } : a)) })),
  removeActivity: (id) => set((s) => ({ activities: s.activities.filter((a) => a.id !== id) })),
}))
