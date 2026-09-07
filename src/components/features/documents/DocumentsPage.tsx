import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ExternalLink, Eye, FilePlus2, FileText, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { AppShell } from '@/components/patterns/AppShell'
import { EmptyState } from '@/components/patterns/EmptyState'
import { ActionsMenu } from '@/components/patterns/ActionsMenu'
import { AutoLoadFooter } from '@/components/patterns/AutoLoadFooter'
import { SortableTh } from '@/components/patterns/SortableTh'
import { useTableSort } from '@/components/patterns/useTableSort'
import { useInfiniteReveal } from '@/components/patterns/useInfiniteReveal'
import { ConfirmDialog } from '@/components/patterns/ConfirmDialog'
import { TableTabs } from '@/components/patterns/TableTabs'
import { Badge } from '@/components/ui/Badge'
import { PersonCell } from '@/components/patterns/PersonCell'
import { ChipOverflow } from '@/components/patterns/ChipOverflow'
import { isOpenableUrl } from '@/components/patterns/UrlField'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { Skeleton } from '@/components/ui/Skeleton'
import { DocumentDrawer } from '@/components/features/projects/DocumentDrawer'
import { RevisionDrawer } from '@/components/features/projects/RevisionDrawer'
import { RevisionViewDrawer } from './RevisionViewDrawer'
import { useDocumentsStore } from '@/stores/documentsStore'
import { useProjectsStore } from '@/stores/projectsStore'
import { KIND_LABEL, REVISION_STATUS_LABEL, REVISION_STATUS_TONE } from '@/lib/documentDisplay'
import type { DocRevision, DocumentKind, ProjectDocument } from '@/types/documents'
import { DateText } from '@/components/patterns/DateText'

export type PageState = 'ready' | 'loading' | 'error'

type Row = { doc: ProjectDocument; rev: DocRevision }

type SortKey = 'number' | 'revision' | 'title' | 'aircraft' | 'ata' | 'owner'
  | 'opened' | 'due' | 'nextAction' | 'status' | 'projects'

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
  const [viewing, setViewing] = useState<Row | null>(null)
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

  /* Title / Type sorts on the title, the line the cell leads with. Projects
     sorts on how many the revision is attached to — the count is the whole
     point of that column. Both date columns sort on the stored ISO value, so
     they order chronologically rather than by the "Aug 20, 2026" text. */
  const { sorted, sort, setSort } = useTableSort(rows, {
    number: (r) => r.doc.number,
    revision: (r) => r.rev.rev,
    title: (r) => r.doc.title,
    aircraft: (r) => r.doc.aircraft,
    ata: (r) => r.doc.ataChapter,
    owner: (r) => r.doc.owner,
    opened: (r) => r.rev.openedDate,
    due: (r) => r.rev.dueDate,
    nextAction: (r) => r.rev.nextAction,
    status: (r) => r.rev.status,
    projects: (r) => projectsFor(r.rev.id).length,
  }, { onSortChange: resetVisible })

  /* Number and Revision are separate columns — a number is how a document is
     asked for and a revision is which one of it you mean; merged, neither
     sorts or scans. Title and Type share one, because the type only
     qualifies the title.

     **Pixels, not percentages, and every figure measured off the rendered
     table.** Percentages split the width by ten arbitrary shares, which is
     how "Opened" and "Due" ended up at 81px against the 115px a one-line
     date needs (so every date broke over two lines) while Status sat at
     115px holding an 82px badge. Each width below is its column's own
     content floor — heading or widest value, whichever is wider — plus the
     16px its two `px-sm` pads supply. Under `table-fixed` any width beyond
     the sum is shared out **proportionally**, so a wider screen loosens
     every column a little rather than pouring it all into one. */
  const columns: { label: string; width: number; sort?: SortKey }[] = isDrawing
    ? [
        { label: 'Number', width: 90, sort: 'number' }, { label: 'Revision', width: 72, sort: 'revision' },
        { label: 'Title / Type', width: 96, sort: 'title' }, { label: 'Aircraft', width: 92, sort: 'aircraft' },
        { label: 'ATA', width: 58, sort: 'ata' }, { label: 'Opened', width: 118, sort: 'opened' },
        { label: 'Due', width: 118, sort: 'due' }, { label: 'Next Action', width: 96, sort: 'nextAction' },
        { label: 'Status', width: 82, sort: 'status' }, { label: 'Projects', width: 68, sort: 'projects' },
        { label: 'Actions', width: 60 },
      ]
    : [
        { label: 'Number', width: 96, sort: 'number' }, { label: 'Revision', width: 72, sort: 'revision' },
        { label: 'Title / Type', width: 116, sort: 'title' }, { label: 'Owner', width: 104, sort: 'owner' },
        { label: 'Opened', width: 118, sort: 'opened' }, { label: 'Due', width: 118, sort: 'due' },
        { label: 'Next Action', width: 104, sort: 'nextAction' }, { label: 'Status', width: 86, sort: 'status' },
        { label: 'Projects', width: 72, sort: 'projects' }, { label: 'Actions', width: 64 },
      ]

  /* Derived, so the table's declared minimum can never drift from the widths
     above the way a hand-kept `minWidth: 950` did. */
  const minTableWidth = columns.reduce((n, c) => n + c.width, 0)

  if (state === 'error') {
    return (
      <AppShell title="Documents" activeItem="Documents">
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
    { label: 'View', icon: <Eye size={16} />, onSelect: () => setViewing({ doc, rev }) },
    ...(isOpenableUrl(rev.url)
      ? [{ label: 'Go To', icon: <ExternalLink size={16} />, onSelect: () => window.open(rev.url.trim(), '_blank', 'noopener,noreferrer') }]
      : []),
    { label: `Edit ${label.singular}`, icon: <Pencil size={16} />, onSelect: () => setDocDrawer({ mode: 'edit', doc }) },
    { label: 'Edit revision', icon: <Pencil size={16} />, onSelect: () => setRevDrawer({ doc, rev }) },
    { label: 'Add new revision', icon: <FilePlus2 size={16} />, onSelect: () => setRevDrawer({ doc }) },
    { label: 'Delete revision', icon: <Trash2 size={16} />, onSelect: () => setDeletingRev({ doc, rev }), tone: 'danger' as const },
    { label: `Delete ${label.singular}`, icon: <Trash2 size={16} />, onSelect: () => setDeletingDoc(doc), tone: 'danger' as const },
  ]

  return (
    <AppShell
      title="Documents"
      activeItem="Documents"
      description={isDrawing
        ? 'Manage drawings and design data with revisions.'
        : 'Manage deliverable documents with revisions.'}
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
              <table className="w-full table-fixed border-collapse text-left" style={{ minWidth: minTableWidth }}>
                <caption className="sr-only">{label.plural}, with the projects each revision is attached to</caption>
                <thead>
                  <tr className="border-b border-border-default bg-neutral-50">
                    {columns.map((c) => (
                      <SortableTh key={c.label} sortKey={c.sort} sort={sort} onSortChange={setSort}
                        style={{ width: c.width }}
                        className="whitespace-nowrap px-sm py-base align-middle text-xs font-semibold text-text-secondary">
                        {c.label}
                      </SortableTh>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading
                    ? Array.from({ length: 6 }, (_, i) => (
                        <tr key={i} className="border-b border-border-default last:border-b-0">
                          {columns.map((c) => <td key={c.label} className="px-sm py-base"><Skeleton className="h-4 w-full" /></td>)}
                        </tr>
                      ))
                    : sorted.slice(0, visibleCount).map((row) => {
                        const { doc, rev } = row
                        const labels = projectsFor(rev.id)
                        return (
                          <tr
                            key={rev.id}
                            onClick={() => setViewing({ doc, rev })}
                            className="cursor-pointer border-b border-border-default transition-colors duration-fast last:border-b-0 hover:bg-accent-subtle"
                          >
                            <td className="px-sm py-base align-middle text-sm font-semibold text-text-primary">
                              <span className="block truncate" title={doc.number}>{doc.number}</span>
                            </td>
                            <td className="whitespace-nowrap px-sm py-base align-middle text-sm font-semibold text-text-primary">
                              {rev.rev}
                            </td>
                            {/* Title leads, type qualifies it underneath. */}
                            <td className="px-sm py-base align-middle text-sm text-text-primary">
                              <span className="block truncate" title={doc.title}>{doc.title}</span>
                              <span className="block truncate text-xs text-text-muted">{doc.type}</span>
                            </td>
                            <td className="px-sm py-base align-middle text-sm text-text-primary">
                              {isDrawing
                                ? <span className="block truncate">{doc.aircraft || '—'}</span>
                                : <PersonCell name={doc.owner} />}
                            </td>
                            {isDrawing && (
                              <td className="whitespace-nowrap px-sm py-base align-middle text-sm tabular-nums text-text-primary">
                                {doc.ataChapter || '—'}
                              </td>
                            )}
                            {/* One line: these two columns are now sized to the
                                widest date they hold, so there is no reason to
                                let `DateText` fall back to its stacked form. */}
                            <td className="whitespace-nowrap px-sm py-base align-middle text-sm tabular-nums text-text-primary">
                              <DateText value={rev.openedDate} />
                            </td>
                            <td className="whitespace-nowrap px-sm py-base align-middle text-sm tabular-nums text-text-primary">
                              <DateText value={rev.dueDate} />
                            </td>
                            <td className="px-sm py-base align-middle">
                              {rev.nextAction ? <PersonCell name={rev.nextAction} /> : <span className="text-sm text-text-muted">—</span>}
                            </td>
                            <td className="whitespace-nowrap px-sm py-base align-middle">
                              <Badge tone={REVISION_STATUS_TONE[rev.status]}>{REVISION_STATUS_LABEL[rev.status]}</Badge>
                            </td>
                            {/* The count is the point: it's what makes deleting
                                a reused revision obviously dangerous. */}
                            <td className="px-sm py-base align-middle">
                              {labels.length === 0
                                ? <span className="text-sm text-text-muted">—</span>
                                : <ChipOverflow items={labels} max={1} label="projects" onShowAll={() => setViewing({ doc, rev })} />}
                            </td>
                            <td className="px-sm py-base align-middle" onClick={(e) => e.stopPropagation()}>
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
      {viewing && (
        <RevisionViewDrawer
          key={viewing.rev.id}
          document={viewing.doc}
          revision={viewing.rev}
          projectLabels={projectsFor(viewing.rev.id)}
          onClose={() => setViewing(null)}
          onEdit={() => setRevDrawer({ doc: viewing.doc, rev: viewing.rev })}
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
