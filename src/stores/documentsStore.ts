import { create } from 'zustand'
import { DOCUMENTS, DOC_REVISIONS, PROJECT_REVISION_LINKS } from '@/lib/documentFixtures'
import type { DocRevision, ProjectDocument, ProjectRevisionLink } from '@/types/documents'
import type { DeliverableRevision } from '@/types/tcca'

interface DocumentsState {
  documents: ProjectDocument[]
  revisions: DocRevision[]
  links: ProjectRevisionLink[]
  /** Creates the document AND its forced first revision + project link. */
  addDocument: (doc: ProjectDocument, firstRevision: DocRevision) => void
  /** Document-level fields only — revisions are edited through `updateRevision`. */
  updateDocument: (id: string, patch: Partial<ProjectDocument>) => void
  /** Cascades: the document, all of its revisions, and every project link. */
  removeDocument: (id: string) => void
  /** Adds a revision to an existing document + links it to its initial project. */
  addRevision: (rev: DocRevision) => void
  updateRevision: (id: string, patch: Partial<DocRevision>) => void
  /** Removes one revision and its links. A document cannot exist without a
      revision, so removing the last one removes the document too. */
  removeRevision: (id: string) => void
  /** Reuse an existing revision on another project. */
  linkRevisionToProject: (projectId: string, revisionId: string) => void
  unlinkRevisionFromProject: (projectId: string, revisionId: string) => void
}

export const useDocumentsStore = create<DocumentsState>((set) => ({
  documents: DOCUMENTS,
  revisions: DOC_REVISIONS,
  links: PROJECT_REVISION_LINKS,

  addDocument: (doc, firstRevision) =>
    set((s) => ({
      documents: [doc, ...s.documents],
      revisions: [firstRevision, ...s.revisions],
      links: [{ id: crypto.randomUUID(), projectId: firstRevision.initialProjectId, revisionId: firstRevision.id }, ...s.links],
    })),
  updateDocument: (id, patch) =>
    set((s) => ({ documents: s.documents.map((d) => (d.id === id ? { ...d, ...patch } : d)) })),
  removeDocument: (id) =>
    set((s) => {
      const revisionIds = new Set(s.revisions.filter((r) => r.documentId === id).map((r) => r.id))
      return {
        documents: s.documents.filter((d) => d.id !== id),
        revisions: s.revisions.filter((r) => r.documentId !== id),
        links: s.links.filter((l) => !revisionIds.has(l.revisionId)),
      }
    }),
  addRevision: (rev) =>
    set((s) => ({
      revisions: [rev, ...s.revisions],
      links: [{ id: crypto.randomUUID(), projectId: rev.initialProjectId, revisionId: rev.id }, ...s.links],
    })),
  updateRevision: (id, patch) =>
    set((s) => ({ revisions: s.revisions.map((r) => (r.id === id ? { ...r, ...patch } : r)) })),
  removeRevision: (id) =>
    set((s) => {
      const target = s.revisions.find((r) => r.id === id)
      if (!target) return s
      const isLast = s.revisions.filter((r) => r.documentId === target.documentId).length === 1
      const revisions = s.revisions.filter((r) => r.id !== id)
      const links = s.links.filter((l) => l.revisionId !== id)
      // "A document cannot be defined without its revision" — so the document
      // goes with the last one rather than being left as an unreachable stub.
      return isLast
        ? { revisions, links, documents: s.documents.filter((d) => d.id !== target.documentId) }
        : { revisions, links }
    }),
  linkRevisionToProject: (projectId, revisionId) =>
    set((s) =>
      s.links.some((l) => l.projectId === projectId && l.revisionId === revisionId)
        ? s
        : { links: [{ id: crypto.randomUUID(), projectId, revisionId }, ...s.links] },
    ),
  unlinkRevisionFromProject: (projectId, revisionId) =>
    set((s) => ({ links: s.links.filter((l) => !(l.projectId === projectId && l.revisionId === revisionId)) })),
}))

/**
 * Flat summaries of DELIVERABLE revisions for the TCCA side. Drawings are
 * excluded on purpose — they're never tracked with Transport Canada.
 */
export function deliverableSummaries(documents: ProjectDocument[], revisions: DocRevision[]): DeliverableRevision[] {
  return revisions.flatMap((r) => {
    const doc = documents.find((d) => d.id === r.documentId)
    if (!doc || doc.kind !== 'deliverable') return []
    return [{ id: r.id, number: doc.number, rev: r.rev, title: doc.title, projectId: r.initialProjectId, releasedDate: r.releasedDate }]
  })
}
