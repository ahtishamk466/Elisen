import { useState } from 'react'
import { ArrowUpRight, BookMarked, Copy, Eye, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { AppShell } from '@/components/patterns/AppShell'
import { EmptyState } from '@/components/patterns/EmptyState'
import { SortableTh } from '@/components/patterns/SortableTh'
import { useTableSort } from '@/components/patterns/useTableSort'
import { useInfiniteReveal } from '@/components/patterns/useInfiniteReveal'
import { AutoLoadFooter } from '@/components/patterns/AutoLoadFooter'
import { ActionsMenu } from '@/components/patterns/ActionsMenu'
import { ConfirmDialog } from '@/components/patterns/ConfirmDialog'
import { FilterChips } from '@/components/patterns/FilterChips'
import { Truncate } from '@/components/patterns/Truncate'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { useGcpStore } from '@/stores/gcpStore'
import { codeName, sourceLabel, subpartLabel, subpartParts, subsectionLabel, subsectionParts } from '@/lib/gcpDisplay'
import type { Regulation } from '@/types/gcp'
import { GcpRegulationsTabs } from './GcpRegulationsTabs'
import { RegulationDrawer } from './RegulationDrawer'
import { RegulationDetailDrawer } from './RegulationDetailDrawer'
import { CodeWithName } from './CodeWithName'
import { GcpChip } from './GcpChip'
import {
  EMPTY_REGULATION_FILTERS, RegulationFilterMenu, regulationFilterChips, type RegulationFilters,
} from './RegulationFilterMenu'

export type PageState = 'ready' | 'loading' | 'error'

type SortKey = 'section' | 'amdt' | 'title' | 'subpart' | 'subsection' | 'root' | 'source' | 'active'

/* Measured widths, not percentages: a heading has to hold its own label plus
   the sort icon — "Section Root ⇅" needs 120px whatever its data looks like,
   and a narrower column pushes the icon out and the table into a scrollbar.
   Section is ~10 characters and wraps below that; the total clears a 1280px
   viewport, so the nine columns are read without scrolling sideways. */
const COLUMNS: { label: string; sort?: SortKey; width: number }[] = [
  { label: 'Section', sort: 'section', width: 112 },
  { label: 'Amdt', sort: 'amdt', width: 76 },
  { label: 'Title', sort: 'title', width: 158 },
  { label: 'Subpart', sort: 'subpart', width: 124 },
  { label: 'Subsection', sort: 'subsection', width: 124 },
  { label: 'Section Root', sort: 'root', width: 120 },
  { label: 'Source', sort: 'source', width: 100 },
  { label: 'Active', sort: 'active', width: 84 },
  { label: 'Action', width: 58 },
]

const TABLE_WIDTH = COLUMNS.reduce((n, c) => n + c.width, 0)

/** Unique values a column holds, for its filter dropdown. */
const optionsOf = (rows: Regulation[], pick: (r: Regulation) => string) =>
  Array.from(new Set(rows.map(pick).filter(Boolean))).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))

/**
 * GCP → Regulations → Regulation: the pool every certification basis draws
 * from, one row per rule at one amendment.
 *
 * Subpart and Subsection print code **and** name, because a bare `A01` says
 * nothing to anyone who hasn't memorised the taxonomy. The code is a chip and
 * the name follows it (`CodeWithName`), so a column of them stays scannable
 * instead of reading as prose. Amdt and Section Root are chips for the same
 * reason: they are identifiers, not sentences.
 *
 * The legacy screen filtered through a box under each heading. Those became one
 * Filters menu with chips, the app's standard — the same columns are filterable,
 * they just no longer cost a second header row on a table this wide.
 */
export function RegulationListPage({ state = 'ready' }: { state?: PageState }) {
  const regulations = useGcpStore((s) => s.regulations)
  const subparts = useGcpStore((s) => s.subparts)
  const subsections = useGcpStore((s) => s.subsections)
  const addRegulation = useGcpStore((s) => s.addRegulation)
  const updateRegulation = useGcpStore((s) => s.updateRegulation)
  const removeRegulation = useGcpStore((s) => s.removeRegulation)

  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<RegulationFilters>(EMPTY_REGULATION_FILTERS)
  const [drawer, setDrawer] = useState<{ mode: 'create' | 'edit' | 'copy'; regulation?: Regulation } | null>(null)
  const [viewing, setViewing] = useState<Regulation | null>(null)
  const [deleting, setDeleting] = useState<Regulation | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const loading = state === 'loading'
  const hasFilters = Object.values(filters).some(Boolean)

  const subpartOf = (r: Regulation) => subpartLabel(r.subpartCode, subparts)
  const subsectionOf = (r: Regulation) => subsectionLabel(r.subsectionCode, subsections)

  const q = query.trim().toLowerCase()
  const filtered = regulations.filter((r) => {
    if (q && !`${r.section} ${r.amdt} ${r.title} ${subpartOf(r)} ${subsectionOf(r)} ${r.sort} ${r.sectionRoot}`.toLowerCase().includes(q)) return false
    if (filters.amdt && r.amdt !== filters.amdt) return false
    if (filters.subpartCode && r.subpartCode !== filters.subpartCode) return false
    if (filters.subsectionCode && r.subsectionCode !== filters.subsectionCode) return false
    if (filters.sectionRoot && r.sectionRoot !== filters.sectionRoot) return false
    if (filters.source === 'yes' && !r.url) return false
    if (filters.source === 'no' && r.url) return false
    if (filters.active === 'active' && !r.active) return false
    if (filters.active === 'inactive' && r.active) return false
    return true
  })

  const { visibleCount, loadingMore, loadMore, reset: resetVisible } = useInfiniteReveal(filtered.length, 25)

  /* Section sorts on the stored sort key, which is what puts 23.2 before 23.21
     and keeps a rule's amendments together — the order the legacy list opens in. */
  const { sorted, sort, setSort } = useTableSort(filtered, {
    section: (r) => r.sort,
    amdt: (r) => r.amdt,
    title: (r) => r.title,
    subpart: (r) => subpartOf(r),
    subsection: (r) => subsectionOf(r),
    root: (r) => r.sectionRoot,
    source: (r) => r.url,
    active: (r) => r.active,
  }, { onSortChange: resetVisible })

  const clearAll = () => { setQuery(''); setFilters(EMPTY_REGULATION_FILTERS); resetVisible() }

  const confirmDelete = () => {
    if (!deleting) return
    removeRegulation(deleting.id)
    setToast(`Regulation ${deleting.section} at ${deleting.amdt} deleted.`)
    setDeleting(null)
  }

  if (state === 'error') {
    return (
      <AppShell activeItem="GCP" activeChild="Regulations" title="Regulations">
        <Alert title="We couldn't load regulations">Refresh the page, and if it keeps happening, contact your administrator.</Alert>
      </AppShell>
    )
  }

  return (
    <AppShell
      activeItem="GCP"
      activeChild="Regulations"
      title="Regulations"
      description="The rule library shared by every certification basis."
      headerActions={
        <>
          <div className="min-w-0" style={{ width: 280 }}>
            <label htmlFor="reg-search" className="sr-only">Search by section, title, subpart or subsection</label>
            <Input
              id="reg-search"
              size="sm"
              leadingIcon={<Search size={16} />}
              placeholder="Search..."
              value={query}
              onChange={(e) => { setQuery(e.target.value); resetVisible() }}
            />
          </div>
          <RegulationFilterMenu
            amdts={optionsOf(regulations, (r) => r.amdt)}
            subparts={optionsOf(regulations, (r) => r.subpartCode).map((c) => ({ value: c, label: subpartLabel(c, subparts) }))}
            subsections={optionsOf(regulations, (r) => r.subsectionCode).map((c) => ({ value: c, label: subsectionLabel(c, subsections) }))}
            sectionRoots={optionsOf(regulations, (r) => r.sectionRoot)}
            filters={filters}
            onApply={(f) => { setFilters(f); resetVisible() }}
          />
          <Button size="md" leadingIcon={<Plus size={16} />} onClick={() => setDrawer({ mode: 'create' })}>Add</Button>
        </>
      }
    >
      <div className="grid gap-lg">
        {toast && <Alert tone="info" title={toast} />}
        <FilterChips
          chips={regulationFilterChips(filters, subparts, subsections, (f) => { setFilters(f); resetVisible() })}
          onClearAll={() => { setFilters(EMPTY_REGULATION_FILTERS); resetVisible() }}
        />

        <GcpRegulationsTabs active="Regulations" counts={{ Regulations: filtered.length }} />

        <div className="overflow-hidden rounded-sm border border-border-default bg-neutral-25">
          {!loading && filtered.length === 0 ? (
            <EmptyState
              icon={<BookMarked size={48} strokeWidth={1.5} />}
              title={query || hasFilters ? 'No regulations match your search' : 'No regulations yet'}
              description={query || hasFilters
                ? 'Try another section number, title or amendment.'
                : 'Add a rule, or import a set from an FAA export on Cert Bases.'}
              action={query || hasFilters
                ? <Button variant="secondary" onClick={clearAll}>Clear search &amp; filters</Button>
                : <Button leadingIcon={<Plus size={16} />} onClick={() => setDrawer({ mode: 'create' })}>Add</Button>}
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full table-fixed border-collapse text-left" style={{ minWidth: TABLE_WIDTH }}>
                  <caption className="sr-only">Regulations</caption>
                  <thead>
                    <tr className="border-b border-border-default bg-neutral-50">
                      {COLUMNS.map((c) => (
                        <SortableTh key={c.label} sortKey={c.sort} sort={sort} onSortChange={setSort}
                          style={{ width: c.width }}
                          className="px-base py-base text-sm font-semibold text-text-secondary">{c.label}</SortableTh>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading
                      ? Array.from({ length: 6 }, (_, i) => (
                          <tr key={i} className="border-b border-border-default last:border-b-0">
                            {COLUMNS.map((c) => <td key={c.label} className="px-base py-base"><Skeleton className="h-4 w-full" /></td>)}
                          </tr>
                        ))
                      : sorted.slice(0, visibleCount).map((r) => (
                          <tr key={r.id} className="border-b border-border-default last:border-b-0">
                            {/* Wraps rather than truncates: a section number is
                                the row's identity, so none of it may be hidden. */}
                            <td className="break-words px-base py-base text-sm text-text-primary">{r.section}</td>
                            <td className="whitespace-nowrap px-base py-base">
                              <GcpChip value={r.amdt} label="amendments" />
                            </td>
                            <td className="px-base py-base text-sm text-text-primary">
                              <Truncate lines={2}>{r.title}</Truncate>
                            </td>
                            <td className="px-base py-base">
                              <CodeWithName {...subpartParts(r.subpartCode, subparts)} />
                            </td>
                            <td className="px-base py-base">
                              <CodeWithName {...subsectionParts(r.subsectionCode, subsections)} />
                            </td>
                            <td className="px-base py-base">
                              <GcpChip value={r.sectionRoot} label="section roots" />
                            </td>
                            <td className="whitespace-nowrap px-base py-base text-sm">
                              {r.url ? (
                                /* Underlined and in the accent, with the arrow
                                   that means "leaves this page" — a link has to
                                   look like one before it is hovered. */
                                <a href={r.url} target="_blank" rel="noopener noreferrer"
                                  className="inline-flex items-center gap-xxss rounded-sm text-sm text-accent underline underline-offset-2 transition-colors duration-fast hover:text-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary">
                                  {sourceLabel(r.url)}
                                  <ArrowUpRight size={14} aria-hidden className="shrink-0" />
                                  <span className="sr-only"> for {r.section} at {r.amdt}, opens in a new tab</span>
                                </a>
                              ) : (
                                <span className="text-text-muted">No source</span>
                              )}
                            </td>
                            <td className="whitespace-nowrap px-base py-base">
                              <Badge tone={r.active ? 'success' : 'neutral'}>{r.active ? 'Active' : 'Inactive'}</Badge>
                            </td>
                            <td className="px-base py-base">
                              <ActionsMenu
                                ariaLabel={`Actions for ${r.section} at ${r.amdt}`}
                                items={[
                                  { label: 'View', icon: <Eye size={16} />, onSelect: () => setViewing(r) },
                                  { label: 'Copy', icon: <Copy size={16} />, onSelect: () => setDrawer({ mode: 'copy', regulation: r }) },
                                  { label: 'Edit', icon: <Pencil size={16} />, onSelect: () => setDrawer({ mode: 'edit', regulation: r }) },
                                  { label: 'Delete', icon: <Trash2 size={16} />, onSelect: () => setDeleting(r), tone: 'danger' },
                                ]}
                              />
                            </td>
                          </tr>
                        ))}
                  </tbody>
                </table>
              </div>
              {!loading && (
                <AutoLoadFooter total={filtered.length} visibleCount={visibleCount} loading={loadingMore} onLoadMore={loadMore} itemLabel="regulations" />
              )}
            </>
          )}
        </div>
      </div>

      {drawer && (
        <RegulationDrawer
          key={`${drawer.mode}-${drawer.regulation?.id ?? 'new'}`}
          mode={drawer.mode}
          initial={drawer.regulation}
          onClose={() => setDrawer(null)}
          onSubmit={(r) => {
            if (drawer.mode === 'edit') updateRegulation(r.id, r)
            else addRegulation(r)
            setToast(`Regulation ${r.section} at ${r.amdt} saved.`)
          }}
        />
      )}
      {viewing && (
        <RegulationDetailDrawer
          regulation={viewing}
          subpart={codeName(subpartParts(viewing.subpartCode, subparts))}
          subsection={codeName(subsectionParts(viewing.subsectionCode, subsections))}
          onClose={() => setViewing(null)}
          onEdit={() => { setDrawer({ mode: 'edit', regulation: viewing }); setViewing(null) }}
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        title={`Delete ${deleting?.section} at ${deleting?.amdt}?`}
        description={deleting
          ? `"${deleting.title}" will be permanently removed from the rule pool. Certification bases built on it keep their own rows. This cannot be undone.`
          : ''}
        confirmLabel="Delete regulation"
        tone="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </AppShell>
  )
}
