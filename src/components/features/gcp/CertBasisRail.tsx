import { useEffect, useRef } from 'react'
import { Search, TriangleAlert } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import type { CertBasis } from '@/types/gcp'

export interface CertBasisRailProps {
  bases: CertBasis[]
  selectedId?: string
  /** Ids of bases carrying a rule at more than one amendment. */
  needsFixing: Set<string>
  query: string
  onQueryChange: (q: string) => void
  onSelect: (b: CertBasis) => void
}

/**
 * The Certification Basis page's left list — one row per basis, the same rail shape as
 * Regulation Groups and ATA Chapters (320px, selected row marked by an accent
 * edge and `aria-current`). Search sits at the top of the list it narrows.
 */
export function CertBasisRail({ bases, selectedId, needsFixing, query, onQueryChange, onSelect }: CertBasisRailProps) {
  const listRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    listRef.current?.querySelector('[aria-current="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [selectedId])

  return (
    <nav aria-label="Certification bases" className="flex min-h-0 flex-col overflow-hidden rounded-sm border border-border-default bg-neutral-25">
      <div className="shrink-0 border-b border-border-default p-base">
        <label htmlFor="cert-bases-search" className="sr-only">Search certification bases and their regulations</label>
        <Input id="cert-bases-search" size="sm" leadingIcon={<Search size={16} />} placeholder="Search by aircraft, TCDS or regulation..."
          value={query} onChange={(e) => onQueryChange(e.target.value)} />
      </div>
      <div className="flex shrink-0 items-center gap-sm border-b border-border-default bg-neutral-50 px-base py-base">
        <span className="min-w-0 flex-1 text-xs font-semibold text-text-secondary">Certification Basis</span>
        <span className="shrink-0 text-xs font-semibold text-text-secondary">Rules</span>
      </div>
      <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto">
        {bases.length === 0 ? (
          <p className="px-base py-lg text-sm text-text-muted">No certification basis matches your search.</p>
        ) : (
          <ul>
            {bases.map((b) => {
              const isSel = b.id === selectedId
              const flagged = needsFixing.has(b.id)
              const count = b.regulationIds.length
              return (
                <li key={b.id} className="border-b border-border-default last:border-b-0">
                  <button type="button" onClick={() => onSelect(b)} aria-current={isSel ? 'true' : undefined}
                    className={`flex w-full items-center gap-sm border-l-2 px-base py-base text-left transition-colors duration-fast focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-text-primary
                      ${isSel ? 'border-accent bg-neutral-100' : 'border-transparent hover:bg-neutral-50'}`}>
                    <span className="grid min-w-0 flex-1 gap-xxss">
                      <span className={`block truncate text-sm text-text-primary ${isSel ? 'font-semibold' : ''}`}>{b.aircraftModel}</span>
                      <span className="block truncate text-xs text-text-muted">{b.description || (b.tcdsNumber ? `TCDS ${b.tcdsNumber}` : 'Project-specific')}</span>
                    </span>
                    {flagged && <TriangleAlert size={16} className="shrink-0 text-warning" aria-hidden />}
                    <span aria-hidden className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full border border-border-default px-xs text-xs font-semibold tabular-nums text-text-secondary">
                      {count}
                    </span>
                    <span className="sr-only">, {count} rule{count === 1 ? '' : 's'}{flagged ? ', has duplicate rules' : ''}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </nav>
  )
}
