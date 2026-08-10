import { useProjectsStore } from '@/stores/projectsStore'
import type { ProjectListRow } from '@/types/project'

/** `3200-00 — STC — Cabin Interior Modification`. */
export function projectLabel(row: Pick<ProjectListRow, 'number' | 'subNumber' | 'title'>) {
  return `${row.number}-${row.subNumber} — ${row.title}`
}

/**
 * Every add/edit drawer names the project it's acting on, so the user is
 * never left guessing which record they're changing.
 */
export function useProjectLabel(projectId: string) {
  return useProjectsStore((s) => {
    const row = s.rows.find((r) => r.id === projectId)
    return row ? projectLabel(row) : ''
  })
}
