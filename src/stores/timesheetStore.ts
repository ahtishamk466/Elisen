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
  /** Inserted directly after the original, not prepended to the top — same
      shape as `duplicateTcca`/`duplicateRow` (client instruction,
      2026-09-24). Every field is copied as-is except `validated`, reset to
      `false` since that describes review the *original* already went
      through, not something a fresh, unreviewed copy has — the same reason
      the old handler reset it before this pattern existed. `isCopy` is what
      the row's own "Copy" badge reads. */
  duplicateEntry: (id: string) => void
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
  duplicateEntry: (id) =>
    set((s) => {
      const idx = s.rows.findIndex((r) => r.id === id)
      if (idx === -1) return s
      const copy: TimesheetEntry = { ...s.rows[idx], id: crypto.randomUUID(), validated: false, isCopy: true }
      const rows = [...s.rows]
      rows.splice(idx + 1, 0, copy)
      return { rows }
    }),
}))
