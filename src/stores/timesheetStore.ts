import { create } from 'zustand'
import { loadTimesheet } from '@/lib/dataset'
import type { TimesheetEntry } from '@/types/timesheet'

interface TimesheetState {
  rows: TimesheetEntry[]
  /** False until the entries have arrived — the four screens that read them
      show their own loading state rather than an empty table. */
  loaded: boolean
  ensureLoaded: () => void
  addRow: (row: TimesheetEntry) => void
  updateRow: (id: string, patch: Partial<TimesheetEntry>) => void
  removeRow: (id: string) => void
}

/**
 * 31k entries, so they are fetched on their own rather than blocking the first
 * render (see `lib/dataset.ts`). `ensureLoaded` is safe to call from every
 * screen that needs them: the underlying request is shared and fires once.
 */
export const useTimesheetStore = create<TimesheetState>((set, get) => ({
  rows: [],
  loaded: false,
  ensureLoaded: () => {
    if (get().loaded) return
    void loadTimesheet().then((rows) => set({ rows, loaded: true }))
  },
  addRow: (row) => set((s) => ({ rows: [row, ...s.rows] })),
  updateRow: (id, patch) => set((s) => ({ rows: s.rows.map((r) => (r.id === id ? { ...r, ...patch } : r)) })),
  removeRow: (id) => set((s) => ({ rows: s.rows.filter((r) => r.id !== id) })),
}))
