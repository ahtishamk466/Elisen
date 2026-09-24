import { create } from 'zustand'
import { coreData } from '@/lib/dataset'
import type { TccaDocLink, TccaProject } from '@/types/tcca'

// The document revision pool itself lives in documentsStore (single source
// of truth shared with the Deliverables tab); this store only keeps the
// TCCA-side linking records.
interface TccaState {
  tccaProjects: TccaProject[]
  docLinks: TccaDocLink[]
  addTcca: (t: TccaProject) => void
  updateTcca: (id: string, patch: Partial<TccaProject>) => void
  removeTcca: (id: string) => void
  /** Inserted directly after the original, not prepended to the top —
      client instruction, 2026-09-24, so the copy reads as "this one, again"
      rather than turning up as an unrelated new row at the top of the
      list. Every field is copied as-is, including `number`; only `id` is
      new and `isCopy` is set, which is what the row's own "Copy" badge
      reads. */
  duplicateTcca: (id: string) => void
  /** Linkable from either side: a project's TCCA tab and the TCCA project's
      own Projects tab call these same two verbs. */
  linkProject: (tccaProjectId: string, projectId: string) => void
  unlinkProject: (tccaProjectId: string, projectId: string) => void
  /** date: undefined = mark Not Applicable; '' = applicable, not complete; 'YYYY-MM-DD' = complete. */
  setChecklistItem: (tccaId: string, itemId: string, date: string | undefined) => void
  linkRevision: (tccaProjectId: string, revisionId: string) => void
  updateDocLink: (id: string, patch: Partial<TccaDocLink>) => void
  unlinkDoc: (id: string) => void
}

export const useTccaStore = create<TccaState>((set) => ({
  tccaProjects: coreData().tccaProjects,
  docLinks: coreData().tccaDocLinks,

  addTcca: (t) => set((s) => ({ tccaProjects: [t, ...s.tccaProjects] })),
  updateTcca: (id, patch) =>
    set((s) => ({ tccaProjects: s.tccaProjects.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),
  removeTcca: (id) =>
    set((s) => ({
      tccaProjects: s.tccaProjects.filter((t) => t.id !== id),
      docLinks: s.docLinks.filter((l) => l.tccaProjectId !== id),
    })),
  duplicateTcca: (id) =>
    set((s) => {
      const idx = s.tccaProjects.findIndex((t) => t.id === id)
      if (idx === -1) return s
      const copy: TccaProject = { ...s.tccaProjects[idx], id: crypto.randomUUID(), isCopy: true }
      const tccaProjects = [...s.tccaProjects]
      tccaProjects.splice(idx + 1, 0, copy)
      return { tccaProjects }
    }),

  setChecklistItem: (tccaId, itemId, date) =>
    set((s) => ({
      tccaProjects: s.tccaProjects.map((t) => {
        if (t.id !== tccaId) return t
        const checklist = { ...t.checklist }
        if (date === undefined) delete checklist[itemId]
        else checklist[itemId] = date
        return { ...t, checklist }
      }),
    })),

  linkProject: (tccaProjectId, projectId) =>
    set((s) => ({
      tccaProjects: s.tccaProjects.map((t) =>
        t.id === tccaProjectId && !t.projectIds.includes(projectId)
          ? { ...t, projectIds: [...t.projectIds, projectId] }
          : t),
    })),
  unlinkProject: (tccaProjectId, projectId) =>
    set((s) => ({
      tccaProjects: s.tccaProjects.map((t) =>
        t.id === tccaProjectId ? { ...t, projectIds: t.projectIds.filter((p) => p !== projectId) } : t),
    })),
  linkRevision: (tccaProjectId, revisionId) =>
    set((s) => ({
      docLinks: [
        { id: crypto.randomUUID(), tccaProjectId, revisionId, involvement: 'review' as const, sentDate: '', state: 'not-sent' as const },
        ...s.docLinks,
      ],
    })),
  updateDocLink: (id, patch) =>
    set((s) => ({ docLinks: s.docLinks.map((l) => (l.id === id ? { ...l, ...patch } : l)) })),
  unlinkDoc: (id) => set((s) => ({ docLinks: s.docLinks.filter((l) => l.id !== id) })),
}))
