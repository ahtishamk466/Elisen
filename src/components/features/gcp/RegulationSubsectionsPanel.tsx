import { FrozenTable } from '@/components/patterns/FrozenTable'
import { Eye, ListTree, Pencil, Plus, Trash2 } from 'lucide-react'
import { ActionsMenu } from '@/components/patterns/ActionsMenu'
import { EmptyState } from '@/components/patterns/EmptyState'
import { SortableTh } from '@/components/patterns/SortableTh'
import { Truncate } from '@/components/patterns/Truncate'
import { useTableSort } from '@/components/patterns/useTableSort'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { titleCaseName } from '@/lib/gcpDisplay'
import { regulationsForTopic } from '@/lib/regulationStructure'
import type { Regulation, Subpart, Subsection } from '@/types/gcp'

export function RegulationSubsectionsPanel({ subpart, subsections, regulations, onOpen, onAdd, onEdit, onDelete }: {
  subpart: Subpart
  subsections: Subsection[]
  regulations: Regulation[]
  onOpen: (s: Subsection) => void
  onAdd: () => void
  onEdit: (s: Subsection) => void
  onDelete: (s: Subsection) => void
}) {
  const count = (s: Subsection) => regulationsForTopic(subpart.code, s.code, regulations).length
  const { sorted, sort, setSort } = useTableSort(subsections, {
    title: (s) => titleCaseName(s.title), code: (s) => s.code,
    part23: (s) => s.part23, part25: (s) => s.part25,
    part27: (s) => s.part27, part29: (s) => s.part29,
    rules: count, active: (s) => s.active,
  })
  const columns = [
    { label: 'Subsection / topic', key: 'title' as const },
    { label: 'Part 23', key: 'part23' as const },
    { label: 'Part 25', key: 'part25' as const },
    { label: 'Part 27', key: 'part27' as const },
    { label: 'Part 29', key: 'part29' as const },
    { label: 'Regulations', key: 'rules' as const },
    { label: 'Status', key: 'active' as const },
    { label: 'Actions' },
  ]
  return (
    <>
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-base p-lg">
        <div className="grid gap-xs">
          <h2 className="text-base font-semibold text-text-primary">Subsections</h2>
          <p className="text-sm text-text-secondary">Choose a topic to view or add its regulations.</p>
        </div>
        <Button size="sm" leadingIcon={<Plus size={14} />} onClick={onAdd}>Add Subsection</Button>
      </div>
      {sorted.length === 0 ? (
        <EmptyState icon={<ListTree size={48} strokeWidth={1.5} />} title="No subsections yet"
          description={`Add the first topic under ${titleCaseName(subpart.description)}.`}
          action={<Button leadingIcon={<Plus size={16} />} onClick={onAdd}>Add Subsection</Button>} />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col border-t border-border-default">
          <FrozenTable fill columns={[230, 120, 120, 120, 120, 130, 90, 70]} minWidth={1000} columnLabels={columns.map((c) => c.label)}
            caption={<>Subsections under subpart {subpart.code}</>} tableClassName="w-full table-fixed border-collapse text-left text-sm" header={<thead className="bg-neutral-50">
              <tr className="border-b border-border-default">
                {columns.map((c) => <SortableTh key={c.label} sortKey={c.key} sort={sort} onSortChange={setSort}
                  className="px-base py-base font-semibold text-text-secondary">{c.label}</SortableTh>)}
              </tr>
            </thead>}>

            <tbody>
              {sorted.map((s) => (
                <tr key={s.id} className="border-b border-border-default last:border-b-0">
                  <td className="px-base py-base">
                    <Button id={`reg-topic-${s.code}`} variant="tertiary" size="sm" onClick={() => onOpen(s)}
                      aria-label={`Open subsection ${s.code}: ${titleCaseName(s.title)}`}
                      className="h-auto w-full min-w-0 justify-start px-0 text-left font-normal text-accent"
                      style={{ textDecorationLine: 'none' }}>
                      <span className="shrink-0 whitespace-nowrap">{s.code} —</span>
                      <Truncate lines={1}>{/^[-\s]*$/.test(s.title) ? 'No topic title' : titleCaseName(s.title)}</Truncate>
                    </Button>
                  </td>
                  {[s.part23, s.part25, s.part27, s.part29].map((range, index) => (
                    <td key={index} className="whitespace-nowrap px-base py-base text-text-primary">{range || '—'}</td>
                  ))}
                  <td className="px-base py-base tabular-nums text-text-primary">{count(s)}</td>
                  <td className="px-base py-base"><Badge tone={s.active ? 'success' : 'neutral'}>{s.active ? 'Active' : 'Inactive'}</Badge></td>
                  <td className="px-base py-base">
                    <ActionsMenu ariaLabel={`Actions for subsection ${s.code}`} items={[
                      { label: 'View regulations', icon: <Eye size={16} />, onSelect: () => onOpen(s) },
                      { label: 'Edit', icon: <Pencil size={16} />, onSelect: () => onEdit(s) },
                      { label: 'Delete', icon: <Trash2 size={16} />, onSelect: () => onDelete(s), tone: 'danger' },
                    ]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </FrozenTable>
        </div>
      )}
    </>
  )
}
