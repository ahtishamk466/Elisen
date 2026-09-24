import { create } from 'zustand'
import { coreData } from '@/lib/dataset'
import type { ProjectListRow } from '@/types/project'

interface ProjectsState {
  rows: ProjectListRow[]
  addRow: (row: ProjectListRow) => void
  updateRow: (id: string, patch: Partial<ProjectListRow>) => void
  removeRow: (id: string) => void
  /** Inserted directly after the original, not prepended to the top —
      same shape as `duplicateTcca` (client instruction, 2026-09-24). Every
      field is copied as-is, including `number`/`subNumber`/`title` — only
      `id` is new and `isCopy` is set, which is what the row's own "Copy"
      badge reads. `actualHours`/`status` still reset (0 / "quoted"): unlike
      the number or title, those describe *progress already made*, which a
      fresh copy genuinely hasn't — not a naming/identity concern the badge
      is meant to replace. */
  duplicateRow: (id: string) => void
}

/**
 * Shared across ProjectsListPage and ProjectDetailPage so edits, duplicates
 * and deletes made from either screen stay in sync — there's no backend yet,
 * so this in-memory store stands in for it (per tech stack: zustand for
 * shared client state).
 */
export const useProjectsStore = create<ProjectsState>((set) => ({
  rows: coreData().projects,
  addRow: (row) => set((s) => ({ rows: [row, ...s.rows] })),
  updateRow: (id, patch) => set((s) => ({ rows: s.rows.map((r) => (r.id === id ? { ...r, ...patch } : r)) })),
  removeRow: (id) => set((s) => ({ rows: s.rows.filter((r) => r.id !== id) })),
  duplicateRow: (id) =>
    set((s) => {
      const idx = s.rows.findIndex((r) => r.id === id)
      if (idx === -1) return s
      const copy: ProjectListRow = { ...s.rows[idx], id: crypto.randomUUID(), actualHours: 0, status: 'quoted', isCopy: true }
      const rows = [...s.rows]
      rows.splice(idx + 1, 0, copy)
      return { rows }
    }),
}))
