import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search, Eye, Pencil, Trash2, ShieldCheck } from 'lucide-react'
import { AppShell } from '@/components/patterns/AppShell'
import { EmptyState } from '@/components/patterns/EmptyState'
import { ActionsMenu } from '@/components/patterns/ActionsMenu'
import { AutoLoadFooter } from '@/components/patterns/AutoLoadFooter'
import { SortableTh } from '@/components/patterns/SortableTh'
import { useTableSort } from '@/components/patterns/useTableSort'
import { useInfiniteReveal } from '@/components/patterns/useInfiniteReveal'
import { Truncate } from '@/components/patterns/Truncate'
import { ConfirmDialog } from '@/components/patterns/ConfirmDialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { Alert } from '@/components/ui/Alert'
import { useProjectsStore } from '@/stores/projectsStore'
import { useTccaStore } from '@/stores/tccaStore'
import { TCCA_STATUS_LABEL, TCCA_STATUS_TONE } from '@/lib/tccaDisplay'
import { TccaProjectDrawer } from './TccaProjectDrawer'
import type { TccaProject } from '@/types/tcca'
import { DateText } from '@/components/patterns/DateText'

type SortKey = 'number' | 'description' | 'project' | 'opened' | 'status'

const COLUMNS: { label: string; sort?: SortKey }[] = [
  { label: 'Number', sort: 'number' },
  { label: 'Description', sort: 'description' },
  { label: 'Linked Project', sort: 'project' },
  { label: 'Opened', sort: 'opened' },
  { label: 'Status', sort: 'status' },
  { label: 'Actions' },
]

export interface TccaProjectsListPageProps {
  state?: 'ready' | 'loading' | 'error'
}

export function TccaProjectsListPage({ state = 'ready' }: TccaProjectsListPageProps) {
  const navigate = useNavigate()
  const projects = useProjectsStore((s) => s.rows)
  const tccaProjects = useTccaStore((s) => s.tccaProjects)
  const addTcca = useTccaStore((s) => s.addTcca)
  const updateTcca = useTccaStore((s) => s.updateTcca)
  const removeTcca = useTccaStore((s) => s.removeTcca)

  const [query, setQuery] = useState('')
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<TccaProject | null>(null)
  const [deleting, setDeleting] = useState<TccaProject | null>(null)

  const filtered = useMemo(() => {
    if (!query.trim()) return tccaProjects
    const q = query.toLowerCase()
    return tccaProjects.filter((t) => `${t.number} ${t.description}`.toLowerCase().includes(q))
  }, [tccaProjects, query])

  const { visibleCount, loadingMore, loadMore, reset: resetVisible } = useInfiniteReveal(filtered.length, 25)

  /* Declared above the sort hook, not below it: the sort accessors run inside
     that hook's own render-time useMemo, so a helper defined further down the
     component is still in its temporal dead zone when the first sorted render
     reaches for it. */
  const projectLabel = (t: TccaProject) => {
    const p = projects.find((x) => x.id === t.projectIds[0])
    if (!p) return t.projectIds.length ? '—' : 'Baseline / DAO'
    const extra = t.projectIds.length - 1
    return `${p.number}-${p.subNumber}${extra > 0 ? ` +${extra}` : ''}`
  }

  /* Linked Project sorts on the same label the cell prints, so a row with no
     linked project sinks with the other blanks rather than sorting under
     whatever placeholder text it shows. */
  const { sorted, sort, setSort } = useTableSort(filtered, {
    number: (t) => t.number,
    description: (t) => t.description,
    project: (t) => projectLabel(t),
    opened: (t) => t.openedDate,
    status: (t) => TCCA_STATUS_LABEL[t.status],
  }, { onSortChange: resetVisible })

  const loading = state === 'loading'

  return (
    <AppShell
      activeChild="TCCA Projects"
      title="TCCA Projects"
      description="Transport Canada certification projects."
      headerActions={
        <>
          <div className="min-w-0" style={{ width: 400 }}>
            <label htmlFor="tcca-search" className="sr-only">Search TCCA projects</label>
            <Input size="sm" id="tcca-search" value={query} onChange={(e) => { setQuery(e.target.value); resetVisible() }}
              placeholder="Search by number or description..." leadingIcon={<Search size={16} />} />
          </div>
          <Button size="md" leadingIcon={<Plus size={16} />} onClick={() => setAdding(true)}>Add TCCA project</Button>
        </>
      }
    >
      <div className="grid gap-lg">
        {state === 'error' ? (
          <Alert title="We couldn't load TCCA projects">
            Something went wrong fetching the list. Refresh the page, and if it keeps happening, contact your administrator.
          </Alert>
        ) : !loading && filtered.length === 0 ? (
          <div className="rounded-sm border border-border-default bg-neutral-25">
            <EmptyState
              icon={<ShieldCheck size={48} strokeWidth={1.5} />}
              title={query ? 'No TCCA projects match your search' : 'No TCCA projects yet'}
              description={query ? 'Try a different number or description.' : 'Open a TCCA project when a customer needs Transport Canada approval for their modification.'}
              action={query
                ? <Button variant="secondary" onClick={() => setQuery('')}>Clear search</Button>
                : <Button leadingIcon={<Plus size={16} />} onClick={() => setAdding(true)}>Add TCCA project</Button>}
            />
          </div>
        ) : (
          <div className="overflow-hidden rounded-sm border border-border-default bg-neutral-25">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left" style={{ minWidth: 760 }}>
              <caption className="sr-only">TCCA projects</caption>
              <thead>
                <tr className="border-b border-border-default bg-neutral-50">
                  {COLUMNS.map((c) => (
                    <SortableTh key={c.label} sortKey={c.sort} sort={sort} onSortChange={setSort}
                      className="whitespace-nowrap px-lg py-base text-sm font-semibold text-text-secondary">{c.label}</SortableTh>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 4 }, (_, i) => (
                      <tr key={i} className="border-b border-border-default last:border-b-0">
                        {COLUMNS.map((c) => <td key={c.label} className="px-lg py-base"><Skeleton className="h-4 w-full" /></td>)}
                      </tr>
                    ))
                  : sorted.slice(0, visibleCount).map((t) => (
                      <tr
                        key={t.id}
                        onClick={() => navigate(`/tcca-projects/${t.id}`)}
                        className="cursor-pointer border-b border-border-default transition-colors duration-fast last:border-b-0 hover:bg-accent-subtle"
                      >
                        <td className="whitespace-nowrap px-lg py-base">
                          <Link to={`/tcca-projects/${t.id}`} className="text-sm font-semibold text-text-primary underline-offset-2 hover:text-accent hover:underline">
                            {t.number}
                          </Link>
                        </td>
                        <td className="px-lg py-base text-sm text-text-primary" style={{ maxWidth: 320 }}><Truncate>{t.description}</Truncate></td>
                        <td className="whitespace-nowrap px-lg py-base text-sm text-text-primary">{projectLabel(t)}</td>
                        <td className="px-lg py-base text-sm text-text-primary"><DateText value={t.openedDate} /></td>
                        <td className="px-lg py-base"><Badge tone={TCCA_STATUS_TONE[t.status]}>{TCCA_STATUS_LABEL[t.status]}</Badge></td>
                        <td className="px-lg py-base" onClick={(e) => e.stopPropagation()}>
                          <ActionsMenu
                            ariaLabel={`Actions for ${t.number}`}
                            items={[
                              { label: 'View', icon: <Eye size={16} />, onSelect: () => navigate(`/tcca-projects/${t.id}`) },
                              { label: 'Edit', icon: <Pencil size={16} />, onSelect: () => setEditing(t) },
                              { label: 'Delete', icon: <Trash2 size={16} />, onSelect: () => setDeleting(t), tone: 'danger' },
                            ]}
                          />
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
          {!loading && (
            <AutoLoadFooter total={filtered.length} visibleCount={visibleCount} loading={loadingMore} onLoadMore={loadMore} itemLabel="TCCA projects" />
          )}
          </div>
        )}
      </div>

      {adding && (
        <TccaProjectDrawer open mode="create" onClose={() => setAdding(false)} onSubmit={addTcca} />
      )}
      {editing && (
        <TccaProjectDrawer open mode="edit" initial={editing} onClose={() => setEditing(null)} onSubmit={(t) => updateTcca(editing.id, t)} />
      )}
      <ConfirmDialog
        open={!!deleting}
        title="Delete this TCCA project?"
        description={deleting ? `"${deleting.number}" and its checklist and document tracking will be permanently removed.` : ''}
        confirmLabel="Delete TCCA project"
        tone="danger"
        onConfirm={() => { if (deleting) removeTcca(deleting.id); setDeleting(null) }}
        onCancel={() => setDeleting(null)}
      />
    </AppShell>
  )
}
