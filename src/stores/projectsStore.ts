import { create } from 'zustand'
import { PROJECT_ROWS } from '@/lib/projectFixtures'
import type { ProjectListRow } from '@/types/project'

interface ProjectsState {
  rows: ProjectListRow[]
  addRow: (row: ProjectListRow) => void
  updateRow: (id: string, patch: Partial<ProjectListRow>) => void
  removeRow: (id: string) => void
}

/**
 * Shared across ProjectsListPage and ProjectDetailPage so edits, duplicates
 * and deletes made from either screen stay in sync — there's no backend yet,
 * so this in-memory store stands in for it (per tech stack: zustand for
 * shared client state).
 */
export const useProjectsStore = create<ProjectsState>((set) => ({
  rows: PROJECT_ROWS,
  addRow: (row) => set((s) => ({ rows: [row, ...s.rows] })),
  updateRow: (id, patch) => set((s) => ({ rows: s.rows.map((r) => (r.id === id ? { ...r, ...patch } : r)) })),
  removeRow: (id) => set((s) => ({ rows: s.rows.filter((r) => r.id !== id) })),
}))
