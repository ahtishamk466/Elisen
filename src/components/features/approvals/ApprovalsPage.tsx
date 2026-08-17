import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Award, Eye, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { AppShell } from '@/components/patterns/AppShell'
import { StatCard } from '@/components/patterns/StatCard'
import { FilterChips } from '@/components/patterns/FilterChips'
import { EmptyState } from '@/components/patterns/EmptyState'
import { ActionsMenu } from '@/components/patterns/ActionsMenu'
import { AutoLoadFooter } from '@/components/patterns/AutoLoadFooter'
import { useInfiniteReveal } from '@/components/patterns/useInfiniteReveal'
import { ConfirmDialog } from '@/components/patterns/ConfirmDialog'
import { Truncate } from '@/components/patterns/Truncate'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { Skeleton } from '@/components/ui/Skeleton'
import { ApprovalDrawer } from './ApprovalDrawer'
import { ApprovalFilterMenu, EMPTY_APPROVAL_FILTERS, approvalFilterChips, type ApprovalFilters } from './ApprovalFilterMenu'
import { useApprovalsStore } from '@/stores/approvalsStore'
import { useProjectsStore } from '@/stores/projectsStore'
import { useLookupStore } from '@/stores/lookupStore'
import type { Approval } from '@/types/documents'

const HEADERS = ['Number', 'Description', 'Primary', 'Approval Holder', 'Aircraft', 'Current Revision', 'Projects', 'Actions']

export type PageState = 'ready' | 'loading' | 'error'

/**
 * The Approvals workspace — certificates live here, not inside a project.
 * One certificate is routinely shared by several projects (a change project
 * references the STC it amends), so a project can only ever *link* to one.
 * Creating, editing and deleting all happen here; projects attach.
 */
export function ApprovalsPage({ state = 'ready' }: { state?: PageState }) {
  const navigate = useNavigate()
  const approvals = useApprovalsStore((s) => s.approvals)
  const revisions = useApprovalsStore((s) => s.revisions)
  const { addApproval, updateApproval, removeApproval } = useApprovalsStore()
  const projects = useProjectsStore((s) => s.rows)
  const catalog = useLookupStore((s) => s.aircraft)

  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<ApprovalFilters>(EMPTY_APPROVAL_FILTERS)
  const [drawer, setDrawer] = useState<{ mode: 'create' | 'edit'; approval?: Approval } | null>(null)
  const [deleting, setDeleting] = useState<Approval | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    return approvals.filter((a) => {
      if (filters.primary && (filters.primary === 'yes') !== a.primary) return false
      if (filters.status && (filters.status === 'active') !== a.active) return false
      if (filters.holder && a.designApprovalHolder !== filters.holder) return false
      if (filters.aircraftId && !a.aircraftIds.includes(filters.aircraftId)) return false
      if (filters.linked && (filters.linked === 'yes') !== (a.projectIds.length > 0)) return false
      if (filters.revised) {
        const count = revisions.filter((r) => r.approvalId === a.id).length
        if ((filters.revised === 'yes') !== (count > 1)) return false
      }
      if (!q) return true
      const models = a.aircraftIds.map((id) => catalog.find((m) => m.id === id)?.modelNumber ?? '').join(' ')
      return `${a.number} ${a.description} ${a.designApprovalHolder} ${models}`.toLowerCase().includes(q)
    })
  }, [approvals, query, catalog, filters, revisions])

  /** Counts describe what is on screen, so they follow search and filters and
      read 0 when nothing matches. */
  const revisionCount = (id: string) => revisions.filter((r) => r.approvalId === id).length
  const stats = [
    { value: filtered.length, label: 'Approvals shown' },
    { value: filtered.filter((a) => a.primary).length, label: 'Primary certificates' },
    { value: filtered.filter((a) => revisionCount(a.id) > 1).length, label: 'Revised since granted' },
    { value: filtered.filter((a) => a.projectIds.length === 0).length, label: 'Not linked to a project' },
  ]

  const holders = useMemo(
    () => Array.from(new Set(approvals.map((a) => a.designApprovalHolder).filter(Boolean))).sort((x, y) => x.localeCompare(y)),
    [approvals],
  )
  /** Only aircraft that some certificate actually covers — a filter offering
      every catalogue model would mostly return nothing. */
  const filterAircraft = useMemo(() => {
    const ids = new Set(approvals.flatMap((a) => a.aircraftIds))
    return catalog
      .filter((m) => ids.has(m.id))
      .map((m) => ({ id: m.id, label: m.modelName ? `${m.modelNumber}: ${m.modelName}` : m.modelNumber }))
      .sort((x, y) => x.label.localeCompare(y.label))
  }, [approvals, catalog])
  const aircraftLabel = (id: string) => filterAircraft.find((a) => a.id === id)?.label ?? id

  /** The certificate's current standing is its highest revision — an approval has
      no date of its own. */
  const currentRevision = (approvalId: string) =>
    revisions.filter((r) => r.approvalId === approvalId).sort((a, b) => b.revision - a.revision)[0]

  const aircraftLabels = (a: Approval) =>
    a.aircraftIds.map((id) => catalog.find((m) => m.id === id)?.modelNumber).filter(Boolean) as string[]

  const hasFilters = Object.values(filters).some(Boolean)
  const { visibleCount, loadingMore, loadMore, reset: resetVisible } = useInfiniteReveal(filtered.length, 25)
  const loading = state === 'loading'
  const projectLabels = (a: Approval) =>
    a.projectIds
      .map((id) => projects.find((p) => p.id === id))
      .filter(Boolean)
      .map((p) => `${p!.number}-${p!.subNumber}`)

  if (state === 'error') {
    return (
      <AppShell title="Approvals" activeItem="Approvals" activeChild="Approvals List">
        <Alert title="We couldn't load approvals">
          Refresh the page, and if it keeps happening, contact your administrator.
        </Alert>
      </AppShell>
    )
  }

  return (
    <AppShell
      title="Approvals"
      activeItem="Approvals"
      activeChild="Approvals List"
      headerActions={
        <>
          <div className="min-w-0" style={{ width: 400 }}>
            <label htmlFor="approval-search" className="sr-only">Search approvals</label>
            <Input size="sm"
              id="approval-search" value={query} onChange={(e) => { setQuery(e.target.value); resetVisible() }}
              placeholder="Search by number, description, holder or aircraft..." leadingIcon={<Search size={16} />}
            />
          </div>
          <ApprovalFilterMenu
            holders={holders}
            aircraft={filterAircraft}
            filters={filters}
            onApply={(f) => { setFilters(f); resetVisible() }}
          />
          <Button size="md" leadingIcon={<Plus size={16} />} onClick={() => setDrawer({ mode: 'create' })}>
            Add Approval
          </Button>
        </>
      }
    >
      <div className="grid gap-lg">
        {toast && <Alert tone="info" title={toast} />}

        <FilterChips
          chips={approvalFilterChips(filters, aircraftLabel, (f) => { setFilters(f); resetVisible() })}
          onClearAll={() => { setFilters(EMPTY_APPROVAL_FILTERS); resetVisible() }}
        />

        <div className="grid gap-lg mobile:grid-cols-2 laptop:grid-cols-4">
          {stats.map((s) => (
            <StatCard key={s.label} value={s.value} label={s.label} loading={loading} />
          ))}
        </div>

        <p className="text-sm text-text-secondary">
          Certificates are created and managed here. Open one for its revision history, the aircraft and
          airframes it covers, and the projects it is linked to. One certificate can serve several.
        </p>

        {!loading && filtered.length === 0 ? (
          <div className="rounded-sm border border-border-default bg-neutral-25">
            <EmptyState
              icon={<Award size={48} strokeWidth={1.5} />}
              title={query || hasFilters ? 'No approvals match your search' : 'No approvals yet'}
              description={query || hasFilters
                ? 'Try a different number, description, holder or aircraft, or clear the filters.'
                : 'Record a certificate once it has been issued, projects then link to it.'}
              action={query || hasFilters
                ? <Button variant="secondary" onClick={() => { setQuery(''); setFilters(EMPTY_APPROVAL_FILTERS); resetVisible() }}>Clear search &amp; filters</Button>
                : <Button leadingIcon={<Plus size={16} />} onClick={() => setDrawer({ mode: 'create' })}>Add Approval</Button>}
            />
          </div>
        ) : (
          <div className="overflow-hidden rounded-sm border border-border-default bg-neutral-25">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left" style={{ minWidth: 1180 }}>
                <caption className="sr-only">Approvals, with the projects each is attached to</caption>
                <thead>
                  <tr className="border-b border-border-default bg-neutral-50">
                    {HEADERS.map((h) => (
                      <th key={h} scope="col" className="whitespace-nowrap px-lg py-base text-sm font-semibold text-text-secondary">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading
                    ? Array.from({ length: 6 }, (_, i) => (
                        <tr key={i} className="border-b border-border-default last:border-b-0">
                          {HEADERS.map((h) => <td key={h} className="px-lg py-base"><Skeleton className="h-4 w-full" /></td>)}
                        </tr>
                      ))
                    : filtered.slice(0, visibleCount).map((a) => {
                        const labels = projectLabels(a)
                        return (
                          <tr
                            key={a.id}
                            onClick={() => navigate(`/approvals/${a.id}`)}
                            className="cursor-pointer border-b border-border-default transition-colors duration-fast last:border-b-0 hover:bg-accent-subtle"
                          >
                            <td className="whitespace-nowrap px-lg py-base align-top">
                              <Link
                                to={`/approvals/${a.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="text-sm font-semibold text-text-primary underline-offset-2 hover:text-accent hover:underline"
                              >
                                {a.number}
                              </Link>
                              {!a.active && <span className="ml-xs text-xs text-text-muted">Inactive</span>}
                            </td>
                            <td className="px-lg py-base align-top text-sm text-text-primary" style={{ maxWidth: 260 }}>
                              <Truncate>{a.description}</Truncate>
                            </td>
                            <td className="whitespace-nowrap px-lg py-base align-top">
                              <Badge tone={a.primary ? 'info' : 'neutral'}>{a.primary ? 'Primary' : 'Change'}</Badge>
                            </td>
                            <td className="px-lg py-base align-top text-sm text-text-primary" style={{ maxWidth: 180 }}>
                              <Truncate>{a.designApprovalHolder || '—'}</Truncate>
                            </td>
                            <td className="px-lg py-base align-top">
                              {aircraftLabels(a).length === 0
                                ? <span className="text-sm text-text-muted">—</span>
                                : <div className="flex flex-wrap gap-xs">
                                    {aircraftLabels(a).map((m) => <Badge key={m} appearance="outline">{m}</Badge>)}
                                  </div>}
                            </td>
                            <td className="whitespace-nowrap px-lg py-base align-top text-sm text-text-primary">
                              {(() => {
                                const cr = currentRevision(a.id)
                                return cr ? `Rev ${cr.revision} · ${cr.revisionDate}` : <span className="text-text-muted">Not issued yet</span>
                              })()}
                            </td>
                            {/* The count is the point: it's what makes deleting
                                a shared certificate obviously dangerous. */}
                            <td className="px-lg py-base align-top">
                              {labels.length === 0
                                ? <span className="text-sm text-text-muted">Not linked</span>
                                : <div className="flex flex-wrap gap-xs">
                                    {labels.map((l) => <Badge key={l} appearance="outline">{l}</Badge>)}
                                  </div>}
                            </td>
                            <td className="px-lg py-base align-top" onClick={(e) => e.stopPropagation()}>
                              <ActionsMenu
                                ariaLabel={`Actions for approval ${a.number}`}
                                items={[
                                  { label: 'View', icon: <Eye size={16} />, onSelect: () => navigate(`/approvals/${a.id}`) },
                                  { label: 'Edit', icon: <Pencil size={16} />, onSelect: () => setDrawer({ mode: 'edit', approval: a }) },
                                  { label: 'Delete', icon: <Trash2 size={16} />, onSelect: () => setDeleting(a), tone: 'danger' },
                                ]}
                              />
                            </td>
                          </tr>
                        )
                      })}
                </tbody>
              </table>
            </div>
            {!loading && (
              <AutoLoadFooter total={filtered.length} visibleCount={visibleCount} loading={loadingMore} onLoadMore={loadMore} itemLabel="approvals" />
            )}
          </div>
        )}
      </div>

      {drawer && (
        <ApprovalDrawer
          key={drawer.approval?.id ?? 'new'}
          initial={drawer.approval}
          onClose={() => setDrawer(null)}
          onSave={(a) => {
            if (drawer.mode === 'edit') updateApproval(a.id, a)
            else addApproval(a)
            setToast(`Approval "${a.number}" saved.`)
          }}
        />
      )}

      {/* Deleting a shared certificate would silently break every project
          attached to it, so the count is named in the prompt. */}
      <ConfirmDialog
        open={!!deleting}
        title="Delete this approval?"
        description={
          deleting
            ? `"${deleting.number}", its revision history and its coverage will be permanently removed${deleting.projectIds.length > 0
                ? `, and unlinked from ${deleting.projectIds.length} project${deleting.projectIds.length === 1 ? '' : 's'}`
                : ''}. This can't be undone.`
            : ''
        }
        confirmLabel="Delete approval"
        tone="danger"
        onConfirm={() => { if (deleting) { removeApproval(deleting.id); setToast(`Approval "${deleting.number}" deleted.`) } setDeleting(null) }}
        onCancel={() => setDeleting(null)}
      />
    </AppShell>
  )
}
