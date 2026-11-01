import { ListTree, Pencil, Trash2 } from 'lucide-react'
import { ActionsMenu } from '@/components/patterns/ActionsMenu'
import { EmptyState } from '@/components/patterns/EmptyState'
import { FrozenTable } from '@/components/patterns/FrozenTable'
import { SortableTh } from '@/components/patterns/SortableTh'
import { Truncate } from '@/components/patterns/Truncate'
import { useTableSort } from '@/components/patterns/useTableSort'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import type { DelegationWorkspaceGroup } from '@/lib/delegationWorkspace'
import { proportionalWidths } from '@/lib/tableWidths'
import type { Delegation } from '@/types/gcp'

const COLUMNS = [
  { label: 'Section Root', sort: 'root', width: 180 },
  { label: 'Regulation title(s)', sort: 'title', width: 400 },
  { label: 'Limitation', sort: 'limitation', width: 110 },
  { label: 'Active', sort: 'active', width: 100 },
] as const
const WIDTHS = [...COLUMNS.map((column) => column.width), 80]
const MIN_WIDTH = WIDTHS.reduce((sum, width) => sum + width, 0)
const COL_WIDTHS = proportionalWidths(WIDTHS)

interface Props {
  specialist: DelegationWorkspaceGroup
  libraryStatus: 'idle' | 'loading' | 'ready' | 'error'
  onRetry: () => void
  onEdit: (delegation: Delegation) => void
  onRemove: (delegation: Delegation) => void
}

export function DelegationRulesPanel({ specialist, libraryStatus, onRetry, onEdit, onRemove }: Props) {
  const { sorted, sort, setSort } = useTableSort(specialist.matchingRules, {
    root: (rule) => rule.delegation.sectionRoot,
    title: (rule) => rule.hint,
    limitation: (rule) => rule.delegation.limitation,
    active: (rule) => rule.delegation.active,
  })
  const code = specialist.focCode || 'Blank saved FOC code'
  const name = specialist.authoritySpecialist || 'No specialist name recorded'

  return (
    <section id="delegation-rules-panel" aria-label={`Coverage for ${code} — ${name}`}
      className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-sm border border-border-default bg-neutral-25">
      {libraryStatus !== 'ready' && (
        <div role="status" className="flex shrink-0 flex-wrap items-center gap-sm border-b border-border-default px-lg py-sm text-xs text-text-secondary">
          {libraryStatus === 'error' ? <>
            <span>Regulation titles could not be loaded. Saved coverage remains available.</span>
            <Button variant="secondary" size="sm" onClick={onRetry}>Try Again</Button>
          </> : <><Spinner size={16} /><span>Loading regulation titles…</span></>}
        </div>
      )}
      {sorted.length === 0 ? (
        <EmptyState icon={<ListTree size={48} strokeWidth={1.5} />} title="No rules for this specialist"
          description={`Use Add to link a Section Root to ${code}.`} />
      ) : (
        <FrozenTable fill columns={COL_WIDTHS} minWidth={MIN_WIDTH}
          caption={`Saved coverage for ${code} — ${name}`} columnLabels={[...COLUMNS.map((column) => column.label), 'Actions']}
          header={<thead><tr className="border-b border-border-default bg-neutral-50">
            {COLUMNS.map((column) => <SortableTh key={column.sort} sortKey={column.sort} sort={sort} onSortChange={setSort}
              className="px-lg py-base text-sm font-semibold text-text-secondary">{column.label}</SortableTh>)}
            <SortableTh className="px-lg py-base text-sm font-semibold text-text-secondary">Actions</SortableTh>
          </tr></thead>}>
          <tbody>
            {sorted.map((rule) => {
              const delegation = rule.delegation
              const title = libraryStatus === 'ready'
                ? rule.hasRegulation ? rule.hint : 'Title unavailable'
                : libraryStatus === 'error' ? 'Title unavailable' : 'Loading title…'
              return (
                <tr key={delegation.id} className="border-b border-border-default last:border-b-0">
                  <td className="break-words px-lg py-base text-sm text-text-primary">
                    <span title={delegation.sectionRoot}>{rule.label}</span>
                    {rule.duplicate && <span className="mt-xs block"><Badge tone="neutral">Duplicate record</Badge></span>}
                  </td>
                  <td className="px-lg py-base text-sm text-text-primary"><Truncate lines={2}>{title}</Truncate></td>
                  <td className="px-lg py-base"><Badge tone={delegation.limitation ? 'success' : 'danger'}>{delegation.limitation ? 'Yes' : 'No'}</Badge></td>
                  <td className="px-lg py-base"><Badge tone={delegation.active ? 'success' : 'neutral'}>{delegation.active ? 'Active' : 'Inactive'}</Badge></td>
                  <td className="px-lg py-base">
                    <ActionsMenu ariaLabel={`Actions for ${delegation.sectionRoot} · ${delegation.focCode}`} items={[
                      { label: 'Edit', icon: <Pencil size={16} />, onSelect: () => onEdit(delegation) },
                      { label: 'Remove', icon: <Trash2 size={16} />, onSelect: () => onRemove(delegation), tone: 'danger' },
                    ]} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </FrozenTable>
      )}
    </section>
  )
}
