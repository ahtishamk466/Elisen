import { create } from 'zustand'
import { TIMESHEET_ENTRIES } from '@/lib/timesheetFixtures'
import type { TimesheetEntry } from '@/types/timesheet'

interface TimesheetState {
  rows: TimesheetEntry[]
  addRow: (row: TimesheetEntry) => void
  updateRow: (id: string, patch: Partial<TimesheetEntry>) => void
  removeRow: (id: string) => void
}

export const useTimesheetStore = create<TimesheetState>((set) => ({
  rows: TIMESHEET_ENTRIES,
  addRow: (row) => set((s) => ({ rows: [row, ...s.rows] })),
  updateRow: (id, patch) => set((s) => ({ rows: s.rows.map((r) => (r.id === id ? { ...r, ...patch } : r)) })),
  removeRow: (id) => set((s) => ({ rows: s.rows.filter((r) => r.id !== id) })),
}))
