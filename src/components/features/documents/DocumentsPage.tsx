import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ExternalLink, FilePlus2, FileText, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { AppShell } from '@/components/patterns/AppShell'
import { EmptyState } from '@/components/patterns/EmptyState'
import { ActionsMenu } from '@/components/patterns/ActionsMenu'
import { AutoLoadFooter } from '@/components/patterns/AutoLoadFooter'
import { useInfiniteReveal } from '@/components/patterns/useInfiniteReveal'
import { ConfirmDialog } from '@/components/patterns/ConfirmDialog'
import { TableTabs } from '@/components/patterns/TableTabs'
import { Truncate } from '@/components/patterns/Truncate'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { Skeleton } from '@/components/ui/Skeleton'
import { DocumentDrawer } from '@/components/features/projects/DocumentDrawer'
import { RevisionDrawer } from '@/components/features/projects/RevisionDrawer'
import { useDocumentsStore } from '@/stores/documentsStore'
import { useProjectsStore } from '@/stores/projectsStore'
import { KIND_LABEL, REVISION_STATUS_LABEL, REVISION_STATUS_TONE } from '@/lib/documentDisplay'
import type { DocRevision, DocumentKind, ProjectDocument } from '@/types/documents'

export type PageState = 'ready' | 'loading' | 'error'

type Row = { doc: ProjectDocument; rev: DocRevision }

/**
 * The Documents workspace. Deliverables and Design Data are one entity in the
 * data model — `ProjectDocument.kind` — sharing one revision system, so they
 * are two tabs of one workspace rather than two nav items pretending to be
 * separate modules.
 *
 * Documents are created and fully managed here, and projects only *attach*
 * their revisions — the client's rule for all three global record types
 * ("Deliverables, Approvals and Design Data should be kept the same way, that
 * they are added separately and only attached here"). A drawing outlives the
 * project it was drawn for and is reused across others, so no project can own
 * one.
 */
export function DocumentsPage({ kind, state = 'ready' }: { kind: DocumentKind; state?: PageState }) {
  const navigate = useNavigate()
  const documents = useDocumentsStore((s) => s.documents)
  const revisions = useDocumentsStore((s) => s.revisions)
  const links = useDocumentsStore((s) => s.links)
  const removeDocument = useDocumentsStore((s) => s.removeDocument)
  const removeRevision = useDocumentsStore((s) => s.removeRevision)
  const projects = useProjectsStore((s) => s.rows)

  const [query, setQuery] = useState('')
  const [docDrawer, setDocDrawer] = useState<{ mode: 'create' | 'edit'; doc?: ProjectDocument } | null>(null)
  const [revDrawer, setRevDrawer] = useState<{ doc: ProjectDocument; rev?: DocRevision } | null>(null)
  const [deletingRev, setDeletingRev] = useState<Row | null>(null)
  const [deletingDoc, setDeletingDoc] = useState<ProjectDocument | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const isDrawing = kind === 'drawing'
  const label = KIND_LABEL[kind]
  const noun = isDrawing ? 'Drawing' : 'Deliverable'

  /** One row per revision — the revision is what a project actually links to. */
  const rows = useMemo<Row[]>(() => {
    const q = query.toLowerCase().trim()
    return documents
      .filter((d) => d.kind === kind)
      .flatMap((doc) => revisions.filter((r) => r.documentId === doc.id).map((rev) => ({ doc, rev })))
      .filter(({ doc }) => !q || `${doc.number} ${doc.title} ${doc.owner} ${doc.aircraft ?? ''}`.toLowerCase().includes(q))
      .sort((a, b) => a.doc.number.localeCompare(b.doc.number) || a.rev.rev.localeCompare(b.rev.rev))
  }, [documents, revisions, kind, query])

  const { visibleCount, loadingMore, loadMore, reset: resetVisible } = useInfiniteReveal(rows.length, 25)
  const loading = state === 'loading'

  const projectsFor = (revisionId: string) =>
    links
      .filter((l) => l.revisionId === revisionId)
      .map((l) => projects.find((p) => p.id === l.projectId))
      .filter(Boolean)
      .map((p) => `${p!.number}-${p!.subNumber}`)

  const revisionCount = (documentId: string) => revisions.filter((r) => r.documentId === documentId).length

  const headers = isDrawing
    ? ['Number / Rev', 'Title', 'Type', 'Aircraft', 'ATA', 'Status', 'Projects', 'Actions']
    : ['Number / Rev', 'Title', 'Type', 'Owner', 'Due', 'Status', 'Projects', 'Actions']

  if (state === 'error') {
    return (
      <AppShell title={label.plural} activeItem="Documents" activeChild={label.plural}>
        <Alert title={`We couldn't load ${label.plural.toLowerCase()}`}>
          Refresh the page, and if it keeps happening, contact your administrator.
        </Alert>
      </AppShell>
    )
  }

  const tabs = (
    <TableTabs
      ariaLabel="Document kind"
      activeKey={kind}
      onChange={(k) => navigate(k === 'drawing' ? '/documents/design-data' : '/documents/deliverables')}
      tabs={[
        { key: 'deliverable', label: 'Deliverables', count: documents.filter((d) => d.kind === 'deliverable').length },
        { key: 'drawing', label: 'Design Data', count: documents.filter((d) => d.kind === 'drawing').length },
      ]}
    />
  )

  /** Open the file first (that's what a reader wants), then edits, then the
      two destructive rows — the house order for every Actions menu. */
  const actionsFor = ({ doc, rev }: Row) => [
    ...(rev.url
      ? [{ label: 'Open file', icon: <ExternalLink size={16} />, onSelect: () => window.open(rev.url, '_blank', 'noopener,noreferrer') }]
      : []),
    { label: `Edit ${label.singular}`, icon: <Pencil size={16} />, onSelect: () => setDocDrawer({ mode: 'edit', doc }) },
    { label: 'Edit revision', icon: <Pencil size={16} />, onSelect: () => setRevDrawer({ doc, rev }) },
    { label: 'Add new revision', icon: <FilePlus2 size={16} />, onSelect: () => setRevDrawer({ doc }) },
    { label: 'Delete revision', icon: <Trash2 size={16} />, onSelect: () => setDeletingRev({ doc, rev }), tone: 'danger' as const },
    { label: `Delete ${label.singular}`, icon: <Trash2 size={16} />, onSelect: () => setDeletingDoc(doc), tone: 'danger' as const },
  ]

  return (
    <AppShell
      title={label.plural}
      activeItem="Documents"
      activeChild={label.plural}
      headerActions={
        <>
          <div className="min-w-0" style={{ width: 400 }}>
            <label htmlFor="doc-search" className="sr-only">Search documents</label>
            <Input size="sm"
              id="doc-search" value={query} onChange={(e) => { setQuery(e.target.value); resetVisible() }}
              placeholder="Search by number, title, owner or aircraft..." leadingIcon={<Search size={16} />}
            />
          </div>
          <Button leadingIcon={<Plus size={16} />} onClick={() => setDocDrawer({ mode: 'create' })}>
            Add {noun}
          </Button>
        </>
      }
    >
      <div className="grid gap-lg">
        {toast && <Alert tone="info" title={toast} />}

        <p className="text-sm text-text-secondary">
          {isDrawing
            ? 'Drawings and design data are created and managed here, with every revision. Projects link to revisions from their Design Data tab. One drawing can serve several projects.'
            : 'Deliverable documents are created and managed here, with every revision. Projects link to revisions from their Deliverables tab. One document can serve several projects.'}
        </p>

        {!loading && rows.length === 0 ? (
          <div className="overflow-hidden rounded-sm border border-border-default bg-neutral-25">
            {tabs}
            <EmptyState
              icon={<FileText size={48} strokeWidth={1.5} />}
              title={query ? 'No documents match your search' : `No ${label.plural.toLowerCase()} yet`}
              description={query
                ? 'Try a different number, title, owner or aircraft.'
                : `Create the first ${label.singular} here. It needs a revision, which is created for a project you choose.`}
              action={query
                ? <Button variant="secondary" onClick={() => setQuery('')}>Clear search</Button>
                : <Button leadingIcon={<Plus size={16} />} onClick={() => setDocDrawer({ mode: 'create' })}>Add {noun}</Button>}
            />
          </div>
        ) : (
          <div className="overflow-hidden rounded-sm border border-border-default bg-neutral-25">
            {tabs}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left" style={{ minWidth: 1120 }}>
                <caption className="sr-only">{label.plural}, with the projects each revision is attached to</caption>
                <thead>
                  <tr className="border-b border-border-default bg-neutral-50">
                    {headers.map((h) => (
                      <th key={h} scope="col" className="whitespace-nowrap px-lg py-base text-sm font-semibold text-text-secondary">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading
                    ? Array.from({ length: 6 }, (_, i) => (
                        <tr key={i} className="border-b border-border-default last:border-b-0">
                          {headers.map((h) => <td key={h} className="px-lg py-base"><Skeleton className="h-4 w-full" /></td>)}
                        </tr>
                      ))
                    : rows.slice(0, visibleCount).map((row) => {
                        const { doc, rev } = row
                        const labels = projectsFor(rev.id)
                        return (
                          <tr
                            key={rev.id}
                            onClick={() => setRevDrawer({ doc, rev })}
                            className="cursor-pointer border-b border-border-default transition-colors duration-fast last:border-b-0 hover:bg-accent-subtle"
                          >
                            <td className="whitespace-nowrap px-lg py-base align-top text-sm font-semibold text-text-primary">
                              {doc.number} · {rev.rev}
                            </td>
                            <td className="px-lg py-base align-top text-sm text-text-primary" style={{ maxWidth: 260 }}>
                              <Truncate>{doc.title}</Truncate>
                            </td>
                            <td className="whitespace-nowrap px-lg py-base align-top text-sm text-text-primary">{doc.type}</td>
                            <td className="whitespace-nowrap px-lg py-base align-top text-sm text-text-primary">
                              {isDrawing ? doc.aircraft || '—' : doc.owner || '—'}
                            </td>
                            <td className="whitespace-nowrap px-lg py-base align-top text-sm text-text-primary">
                              {isDrawing ? doc.ataChapter || '—' : rev.dueDate || '—'}
                            </td>
                            <td className="whitespace-nowrap px-lg py-base align-top">
                              <Badge tone={REVISION_STATUS_TONE[rev.status]}>{REVISION_STATUS_LABEL[rev.status]}</Badge>
                            </td>
                            {/* The count is the point: it's what makes deleting
                                a reused revision obviously dangerous. */}
                            <td className="px-lg py-base align-top">
                              {labels.length === 0
                                ? <span className="text-sm text-text-muted">Not linked</span>
                                : <div className="flex flex-wrap gap-xs">
                                    {labels.map((l) => <Badge key={l} appearance="outline">{l}</Badge>)}
                                  </div>}
                            </td>
                            <td className="px-lg py-base align-top" onClick={(e) => e.stopPropagation()}>
                              <ActionsMenu
                                ariaLabel={`Actions for ${doc.number} rev ${rev.rev}`}
                                items={actionsFor(row)}
                              />
                            </td>
                          </tr>
                        )
                      })}
                </tbody>
              </table>
            </div>
            {!loading && (
              <AutoLoadFooter total={rows.length} visibleCount={visibleCount} loading={loadingMore} onLoadMore={loadMore} itemLabel="revisions" />
            )}
          </div>
        )}
      </div>

      {docDrawer && (
        <DocumentDrawer
          key={docDrawer.doc?.id ?? 'new'}
          kind={kind}
          initial={docDrawer.doc}
          onClose={() => setDocDrawer(null)}
          onSaved={setToast}
        />
      )}
      {revDrawer && (
        <RevisionDrawer
          key={`${revDrawer.doc.id}-${revDrawer.rev?.id ?? 'new'}`}
          document={revDrawer.doc}
          initial={revDrawer.rev}
          onClose={() => setRevDrawer(null)}
          onSaved={setToast}
        />
      )}

      {/* Two separate confirms because they destroy different amounts: one
          revision, or the document and its whole revision history. */}
      <ConfirmDialog
        open={!!deletingRev}
        title="Delete this revision?"
        description={
          deletingRev
            ? revisionCount(deletingRev.doc.id) === 1
              ? `${deletingRev.doc.number} rev ${deletingRev.rev.rev} is the only revision of this ${label.singular}, and a document can't exist without one, deleting it removes ${deletingRev.doc.number} entirely. This can't be undone.`
              : `${deletingRev.doc.number} rev ${deletingRev.rev.rev} will be permanently removed${projectsFor(deletingRev.rev.id).length > 0
                  ? ` and detached from ${projectsFor(deletingRev.rev.id).length} project${projectsFor(deletingRev.rev.id).length === 1 ? '' : 's'}`
                  : ''}. Other revisions of ${deletingRev.doc.number} are untouched. This can't be undone.`
            : ''
        }
        confirmLabel="Delete revision"
        tone="danger"
        onConfirm={() => {
          if (deletingRev) {
            const last = revisionCount(deletingRev.doc.id) === 1
            removeRevision(deletingRev.rev.id)
            setToast(last
              ? `${deletingRev.doc.number} deleted. Its only revision was removed.`
              : `${deletingRev.doc.number} rev ${deletingRev.rev.rev} deleted.`)
          }
          setDeletingRev(null)
        }}
        onCancel={() => setDeletingRev(null)}
      />

      <ConfirmDialog
        open={!!deletingDoc}
        title={`Delete this ${label.singular}?`}
        description={
          deletingDoc
            ? `${deletingDoc.number} and all ${revisionCount(deletingDoc.id)} of its revisions will be permanently removed, and detached from every project using them. This can't be undone.`
            : ''
        }
        confirmLabel={`Delete ${label.singular}`}
        tone="danger"
        onConfirm={() => {
          if (deletingDoc) { removeDocument(deletingDoc.id); setToast(`${deletingDoc.number} and its revisions deleted.`) }
          setDeletingDoc(null)
        }}
        onCancel={() => setDeletingDoc(null)}
      />
    </AppShell>
  )
}
