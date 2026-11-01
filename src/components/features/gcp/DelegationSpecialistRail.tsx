import { useEffect, useRef } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import type { DelegationWorkspaceGroup } from '@/lib/delegationWorkspace'

interface Props {
  specialists: DelegationWorkspaceGroup[]
  selectedCode?: string
  filtered: boolean
  onSelect: (code: string) => void
}

export function DelegationSpecialistRail({ specialists, selectedCode, filtered, onSelect }: Props) {
  const railRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    railRef.current?.querySelector('[aria-current="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [selectedCode])

  return (
    <nav aria-label="Coverage specialists"
      className="flex max-h-56 min-h-0 shrink-0 flex-col overflow-hidden rounded-sm border border-border-default bg-neutral-25 laptop:max-h-none laptop:w-80">
      <div className="flex shrink-0 items-center justify-between gap-sm border-b border-border-default bg-neutral-50 px-lg py-base">
        <span className="text-xs font-semibold text-text-secondary">Specialist</span>
        <span className="text-xs font-semibold text-text-secondary">{filtered ? 'Matching rules' : 'Rules'}</span>
      </div>
      <div ref={railRef} className="min-h-0 flex-1 overflow-y-auto">
        <ul>
          {[...specialists].sort((a, b) => Number(b.recordCount > 0) - Number(a.recordCount > 0)).map((person) => {
            const selected = person.focCode === selectedCode
            const count = filtered ? person.matchingRootCount : person.rootCount
            return (
              <li key={person.focCode} className="border-b border-border-default last:border-b-0">
                <Button type="button" variant="tertiary" size="sm" onClick={() => onSelect(person.focCode)}
                  aria-current={selected ? 'true' : undefined} aria-controls="delegation-rules-panel"
                  className={`w-full justify-start gap-sm rounded-none border-l-2 px-base py-base text-left font-normal ${selected ? 'border-l-accent bg-neutral-100' : 'border-l-transparent hover:bg-neutral-50'}`}
                  style={{ height: 'auto', whiteSpace: 'normal', textDecorationLine: 'none' }}>
                  <span className="grid min-w-0 flex-1 gap-xxss">
                    <span className="flex min-w-0 items-baseline gap-xs text-sm text-text-primary">
                      <span className="shrink-0 whitespace-nowrap font-semibold">{person.focCode || 'Blank saved FOC code'}</span>
                      <span aria-hidden className="shrink-0 text-text-muted">—</span>
                      <span className="min-w-0 truncate" title={person.authoritySpecialist}>{person.authoritySpecialist || 'No specialist name recorded'}</span>
                    </span>
                    {person.specialty && <span className="text-xs text-text-muted">{person.specialty}</span>}
                  </span>
                  <span className="shrink-0" aria-hidden><Badge tone="neutral">{count}</Badge></span>
                  <span className="sr-only">{count} {filtered ? 'matching ' : ''}rule{count === 1 ? '' : 's'}, {person.recordCount} saved coverage record{person.recordCount === 1 ? '' : 's'}</span>
                </Button>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}
