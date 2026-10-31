import { useState } from 'react'
import { ArrowLeft, BookMarked, Eye, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { ActionsMenu } from '@/components/patterns/ActionsMenu'
import { EmptyState } from '@/components/patterns/EmptyState'
import { AutoLoadFooter } from '@/components/patterns/AutoLoadFooter'
import { SortableTh } from '@/components/patterns/SortableTh'
import { Truncate } from '@/components/patterns/Truncate'
import { useInfiniteReveal } from '@/components/patterns/useInfiniteReveal'
import { useTableSort } from '@/components/patterns/useTableSort'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { amendmentLabel, codeName, subpartParts, subsectionParts, titleCaseName } from '@/lib/gcpDisplay'
import { regulationsForTopic } from '@/lib/regulationStructure'
import { useGcpStore } from '@/stores/gcpStore'
import { useToastStore } from '@/stores/toastStore'
import type { Regulation, Subpart, Subsection } from '@/types/gcp'
import { RegulationDrawer } from './RegulationDrawer'
import { RegulationDetailDrawer } from './RegulationDetailDrawer'
import { RegulationDeleteDialog } from './RegulationDeleteDialog'

export function RegulationTopicPanel({ subpart, subsection, onBack }: {
  subpart: Subpart; subsection: Subsection; onBack: () => void
}) {
  const regulations = useGcpStore((s) => s.regulations)
  const subparts = useGcpStore((s) => s.subparts)
  const subsections = useGcpStore((s) => s.subsections)
  const addRegulation = useGcpStore((s) => s.addRegulation)
  const updateRegulation = useGcpStore((s) => s.updateRegulation)
  const toast = useToastStore((s) => s.show)
  const [query, setQuery] = useState('')
  const [drawer, setDrawer] = useState<{ mode: 'create' | 'edit'; initial?: Regulation } | null>(null)
  const [viewingId, setViewingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<Regulation | null>(null)
  const viewing = regulations.find((r) => r.id === viewingId)
  const rows = regulationsForTopic(subpart.code, subsection.code, regulations)
  const q = query.trim().toLowerCase()
  const filtered = rows.filter((r) => !q || `${r.section} ${r.amdt} ${r.title}`.toLowerCase().includes(q))
  const { visibleCount, loadingMore, loadMore, reset } = useInfiniteReveal(filtered.length)
  const { sorted, sort, setSort } = useTableSort(filtered, {
    section: (r) => r.sort || r.section, amdt: (r) => r.amdt,
    title: (r) => r.title, active: (r) => r.active,
  }, { onSortChange: reset })
  const columns = [
    { label: 'Section', key: 'section' as const }, { label: 'Amendment', key: 'amdt' as const },
    { label: 'Title', key: 'title' as const }, { label: 'Status', key: 'active' as const },
    { label: 'Actions' },
  ]
  return (
    <>
      <div className="flex shrink-0 flex-wrap items-start gap-base p-lg">
          <div className="flex min-w-0 flex-1 items-start gap-sm">
            <Button variant="tertiary" size="sm" className="shrink-0" leadingIcon={<ArrowLeft size={16} />}
              aria-label="Back to subsections" title="Back to subsections" onClick={onBack} />
            <div className="grid min-w-0 gap-xs">
            <h2 className="break-words text-lg font-semibold text-text-primary">{/^[-\s]*$/.test(subsection.title) ? 'No topic title' : titleCaseName(subsection.title)}</h2>
            <p className="text-sm text-text-secondary">Subsection {subsection.code} · {rows.length} regulation{rows.length === 1 ? '' : 's'}</p>
            </div>
          </div>
          <div className="flex w-full min-w-0 flex-wrap items-start gap-sm laptop:w-auto">
            <div className="min-w-0 flex-1" style={{ width: 320, maxWidth: '100%' }}>
              <label className="sr-only" htmlFor="topic-reg-search">Search this topic by section, amendment or title</label>
              <Input id="topic-reg-search" size="sm" leadingIcon={<Search size={16} />} placeholder="Search regulations..."
                value={query} onChange={(e) => { setQuery(e.target.value); reset() }} />
            </div>
            <Button leadingIcon={<Plus size={16} />} onClick={() => setDrawer({ mode: 'create' })}>Add Regulation</Button>
          </div>
      </div>
      {filtered.length === 0 ? (
        <EmptyState icon={<BookMarked size={48} strokeWidth={1.5} />}
          title={q ? 'No regulations match your search' : 'No regulations in this topic yet'}
          description={q ? 'Try another section, title or amendment.' : `Add a regulation under ${titleCaseName(subsection.title)}.`}
          action={q ? <Button variant="secondary" onClick={() => { setQuery(''); reset() }}>Clear search</Button>
            : <Button leadingIcon={<Plus size={16} />} onClick={() => setDrawer({ mode: 'create' })}>Add Regulation</Button>} />
      ) : (
        <div className="min-h-0 flex-1 overflow-auto border-t border-border-default">
          <table className="w-full table-fixed border-collapse text-left text-sm" style={{ minWidth: 820 }}>
            <caption className="sr-only">Regulations in {subsection.code} under subpart {subpart.code}</caption>
            <colgroup><col style={{ width: 240 }} /><col style={{ width: 160 }} /><col /><col style={{ width: 100 }} /><col style={{ width: 80 }} /></colgroup>
            <thead className="sticky top-0 z-sticky bg-neutral-50"><tr className="border-b border-border-default">
              {columns.map((c) => <SortableTh key={c.label} sortKey={c.key} sort={sort} onSortChange={setSort}
                className="px-lg py-base font-semibold text-text-secondary">{c.label}</SortableTh>)}
            </tr></thead>
            <tbody>{sorted.slice(0, visibleCount).map((r) => <tr key={r.id} className="border-b border-border-default last:border-b-0">
              <td className="px-lg py-base">
                <Button variant="tertiary" size="sm" className="w-full min-w-0 max-w-full justify-start px-0 text-left font-normal text-accent"
                  style={{ height: 'auto', whiteSpace: 'normal', textDecorationLine: 'none' }}
                  onClick={() => setViewingId(r.id)} aria-label={`View ${r.section} at ${amendmentLabel(r.amdt)}`}>
                  <span className="min-w-0 whitespace-normal break-words">{r.section}</span>
                </Button>
              </td>
              <td className="px-lg py-base text-text-primary">{amendmentLabel(r.amdt)}</td>
              <td className="px-lg py-base text-text-primary"><Truncate lines={2}>{r.title}</Truncate></td>
              <td className="px-lg py-base"><Badge tone={r.active ? 'success' : 'neutral'}>{r.active ? 'Active' : 'Inactive'}</Badge></td>
              <td className="px-lg py-base">
                <ActionsMenu ariaLabel={`Actions for ${r.section} at ${amendmentLabel(r.amdt)}`} items={[
                  { label: 'View', icon: <Eye size={16} />, onSelect: () => setViewingId(r.id) },
                  { label: 'Edit', icon: <Pencil size={16} />, onSelect: () => setDrawer({ mode: 'edit', initial: r }) },
                  { label: 'Delete', icon: <Trash2 size={16} />, onSelect: () => setDeleting(r), tone: 'danger' },
                ]} />
              </td>
            </tr>)}</tbody>
          </table>
          <AutoLoadFooter total={filtered.length} visibleCount={visibleCount} loading={loadingMore} onLoadMore={loadMore} itemLabel="regulations" />
        </div>
      )}
      {drawer && <RegulationDrawer mode={drawer.mode} initial={drawer.initial}
        context={{ subpartCode: subpart.code, subsectionCode: subsection.code }} onClose={() => setDrawer(null)}
        onSubmit={(r) => {
          if (drawer.mode === 'edit') updateRegulation(r.id, r)
          else addRegulation(r)
          toast(`Regulation ${r.section} ${drawer.mode === 'edit' ? 'updated' : 'created'}.`)
          setViewingId(r.id)
        }} />}
      {viewing && !drawer && <RegulationDetailDrawer regulation={viewing}
        subpart={codeName(subpartParts(viewing.subpartCode, subparts))}
        subsection={codeName(subsectionParts(viewing.subsectionCode, subsections))}
        onClose={() => setViewingId(null)} onEdit={() => { setDrawer({ mode: 'edit', initial: viewing }); setViewingId(null) }} />}
      <RegulationDeleteDialog regulation={deleting} onClose={() => setDeleting(null)}
        onDeleted={(id) => { if (viewingId === id) setViewingId(null) }} />
    </>
  )
}
