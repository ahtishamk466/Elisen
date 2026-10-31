import { ListTree, Pencil, Plus, Trash2 } from 'lucide-react'
import { ActionsMenu } from '@/components/patterns/ActionsMenu'
import { EmptyState } from '@/components/patterns/EmptyState'
import { SortableTh } from '@/components/patterns/SortableTh'
import { useTableSort } from '@/components/patterns/useTableSort'
import { useSyncedScroll } from '@/components/patterns/useSyncedScroll'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { proportionalWidths } from '@/lib/tableWidths'
import type { RegulationGroup, RegulationGroupSection } from '@/types/gcp'
import { GcpChip } from './GcpChip'

const COLUMNS: { label: string; sort?: 'root' | 'active'; width: number }[] = [
  { label: 'Regulation Section Root', sort: 'root', width: 280 },
  { label: 'Active', sort: 'active', width: 120 },
  { label: 'Actions', width: 80 },
]
const TABLE_MIN_WIDTH = COLUMNS.reduce((sum, column) => sum + column.width, 0)
const COL_WIDTHS = proportionalWidths(COLUMNS.map((column) => column.width))

interface Props {
  group: RegulationGroup
  rules: RegulationGroupSection[]
  onEditRules: () => void
  onRemove: (rule: RegulationGroupSection) => void
}

/** Group identity and its actions stay in the rail; this pane starts at work. */
export function RegulationGroupRegulationsPanel({ group, rules, onEditRules, onRemove }: Props) {
  const { sorted, sort, setSort } = useTableSort(rules, {
    root: (rule) => rule.sectionRoot,
    active: (rule) => rule.active,
  })
  const { headerRef, onBodyScroll } = useSyncedScroll()

  return (
    <section aria-label={group.title} className="flex min-h-0 flex-col overflow-hidden rounded-sm border border-border-default bg-neutral-25">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-sm px-lg py-lg">
        <div className="grid gap-xxss">
          <h2 className="text-sm font-semibold text-text-primary">Regulation List</h2>
          <p className="text-xs text-text-muted">The regulations this kind of modification typically affects.</p>
        </div>
        <Button size="sm" leadingIcon={<Plus size={14} />} onClick={onEditRules}>Add Regulation</Button>
      </div>
      {rules.length === 0 ? (
        <div className="border-t border-border-default">
          <EmptyState icon={<ListTree size={48} strokeWidth={1.5} />} title="No results found."
            description="No regulations are attached to this group yet." />
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col border-t border-border-default">
          <div ref={headerRef} className="shrink-0 overflow-x-hidden overflow-y-scroll scrollbar-none">
            <table className="w-full table-fixed border-collapse text-left" style={{ minWidth: TABLE_MIN_WIDTH }}>
              <colgroup>{COLUMNS.map((column, index) => <col key={column.label} style={{ width: COL_WIDTHS[index] }} />)}</colgroup>
              <thead>
                <tr className="border-b border-border-default bg-neutral-50">
                  {COLUMNS.map((column) => (
                    <SortableTh key={column.label} sortKey={column.sort} sort={sort} onSortChange={setSort}
                      className="px-lg py-base text-sm font-semibold text-text-secondary">{column.label}</SortableTh>
                  ))}
                </tr>
              </thead>
            </table>
          </div>
          <div className="min-h-0 flex-1 overflow-x-auto overflow-y-scroll scrollbar-none" onScroll={onBodyScroll}>
            <table className="w-full table-fixed border-collapse text-left" style={{ minWidth: TABLE_MIN_WIDTH }}>
              <caption className="sr-only">Regulations in {group.title}</caption>
              <colgroup>{COLUMNS.map((column, index) => <col key={column.label} style={{ width: COL_WIDTHS[index] }} />)}</colgroup>
              <tbody>
                {sorted.map((rule) => (
                  <tr key={rule.id} className="border-b border-border-default last:border-b-0">
                    <td className="px-lg py-base"><GcpChip value={rule.sectionRoot} label="section roots" /></td>
                    <td className="px-lg py-base"><Badge tone={rule.active ? 'success' : 'neutral'}>{rule.active ? 'Active' : 'Inactive'}</Badge></td>
                    <td className="px-lg py-base">
                      <ActionsMenu ariaLabel={`Actions for ${rule.sectionRoot}`} items={[
                        { label: 'Edit', icon: <Pencil size={16} />, onSelect: onEditRules },
                        { label: 'Delete', icon: <Trash2 size={16} />, onSelect: () => onRemove(rule), tone: 'danger' },
                      ]} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  )
}
