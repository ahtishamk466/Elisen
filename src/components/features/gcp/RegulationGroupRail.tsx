import { useEffect, useRef } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { ActionsMenu } from '@/components/patterns/ActionsMenu'
import type { RegulationGroup } from '@/types/gcp'

interface Props {
  groups: RegulationGroup[]
  selectedId?: string
  count: (id: string) => number
  onSelect: (group: RegulationGroup) => void
  onEdit: (group: RegulationGroup) => void
  onDelete: (group: RegulationGroup) => void
}

export function RegulationGroupRail({ groups, selectedId, count, onSelect, onEdit, onDelete }: Props) {
  const railRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    railRef.current?.querySelector('[aria-current="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [selectedId])

  return (
    <nav aria-label="Regulation groups" className="flex min-h-0 flex-col overflow-hidden rounded-sm border border-border-default bg-neutral-25">
      <div className="flex shrink-0 items-center gap-sm border-b border-border-default bg-neutral-50 px-base py-base">
        <span className="min-w-0 flex-1 text-xs font-semibold text-text-secondary">Group</span>
        <span className="shrink-0 pr-3xl text-xs font-semibold text-text-secondary">Regs</span>
      </div>
      <div ref={railRef} className="min-h-0 flex-1 overflow-y-auto">
        <ul>
          {groups.map((group) => {
            const selected = group.id === selectedId
            const ruleCount = count(group.id)
            return (
              <li key={group.id} className={`flex items-center border-b border-border-default last:border-b-0 ${selected ? 'bg-neutral-100' : ''}`}>
                <button type="button" onClick={() => onSelect(group)} aria-current={selected ? 'true' : undefined}
                  className={`flex min-w-0 flex-1 items-center gap-sm border-l-2 px-base py-base text-left transition-colors duration-fast focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-text-primary
                    ${selected ? 'border-accent bg-neutral-100' : 'border-transparent hover:bg-neutral-50'}`}>
                  <span className="grid min-w-0 flex-1 gap-xxss">
                    <span className={`block truncate text-sm ${selected ? 'font-semibold' : ''} ${group.active ? 'text-text-primary' : 'text-text-muted'}`}>{group.title}</span>
                    <span className="block truncate text-xs text-text-muted">{group.description}</span>
                    {!group.active && <span className="block text-xs text-text-muted">Inactive</span>}
                  </span>
                  <span aria-hidden className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full border border-border-default px-xs text-xs font-semibold tabular-nums text-text-secondary">{ruleCount}</span>
                  <span className="sr-only">{group.title}, {ruleCount} regulation{ruleCount === 1 ? '' : 's'}{group.active ? '' : ', inactive'}</span>
                </button>
                <div className="shrink-0 pr-xs">
                  <ActionsMenu ariaLabel={`Actions for ${group.title}`} items={[
                    { label: 'Edit', icon: <Pencil size={16} />, onSelect: () => onEdit(group) },
                    { label: 'Delete', icon: <Trash2 size={16} />, onSelect: () => onDelete(group), tone: 'danger' },
                  ]} />
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}
