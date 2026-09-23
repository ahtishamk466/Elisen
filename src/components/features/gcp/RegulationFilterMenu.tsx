import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Filter as FilterIcon } from 'lucide-react'
import { useDropdown } from '@/components/patterns/useDropdown'
import type { FilterChip } from '@/components/patterns/FilterChips'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { subpartLabel, subsectionLabel } from '@/lib/gcpDisplay'
import type { Subpart, Subsection } from '@/types/gcp'

export interface RegulationFilters {
  amdt: string
  subpartCode: string
  subsectionCode: string
  sectionRoot: string
  /** '' = any, 'yes' = has a stored link, 'no' = none. */
  source: '' | 'yes' | 'no'
  active: '' | 'active' | 'inactive'
}

export const EMPTY_REGULATION_FILTERS: RegulationFilters = {
  amdt: '', subpartCode: '', subsectionCode: '', sectionRoot: '', source: '', active: '',
}

/** Applied filters as removable chips — the labels here are how each filter
    reads once applied. */
export function regulationFilterChips(
  filters: RegulationFilters,
  subparts: Subpart[],
  subsections: Subsection[],
  onChange: (filters: RegulationFilters) => void,
): FilterChip[] {
  const clear = (key: keyof RegulationFilters) => () => onChange({ ...filters, [key]: '' })
  const defs: { key: keyof RegulationFilters; label: string; value: string }[] = [
    { key: 'amdt', label: 'Amdt', value: filters.amdt },
    { key: 'subpartCode', label: 'Subpart', value: filters.subpartCode ? subpartLabel(filters.subpartCode, subparts) : '' },
    { key: 'subsectionCode', label: 'Subsection', value: filters.subsectionCode ? subsectionLabel(filters.subsectionCode, subsections) : '' },
    { key: 'sectionRoot', label: 'Section Root', value: filters.sectionRoot },
    { key: 'source', label: 'Source', value: filters.source === 'yes' ? 'Has a source' : filters.source === 'no' ? 'No source' : '' },
    { key: 'active', label: 'Active', value: filters.active === 'active' ? 'Active' : filters.active === 'inactive' ? 'Inactive' : '' },
  ]
  return defs
    .filter((d) => d.value)
    .map((d) => ({ key: d.key, label: d.label, value: d.value, onRemove: clear(d.key) }))
}

export interface RegulationFilterMenuProps {
  amdts: string[]
  subparts: { value: string; label: string }[]
  subsections: { value: string; label: string }[]
  sectionRoots: string[]
  filters: RegulationFilters
  onApply: (filters: RegulationFilters) => void
}

const MENU_WIDTH = 300

/**
 * Filters for the Regulation list — one per filterable column on the legacy
 * screen, which filtered each column through its own box under the heading.
 * Same shape as every other filter menu here: a draft while the panel is open,
 * applied on Apply, count on the trigger, chips underneath.
 */
export function RegulationFilterMenu({
  amdts, subparts, subsections, sectionRoots, filters, onApply,
}: RegulationFilterMenuProps) {
  const { open, setOpen, position, triggerRef, menuRef } = useDropdown<HTMLButtonElement>(MENU_WIDTH)
  const [draft, setDraft] = useState(filters)

  useEffect(() => {
    if (open) setDraft(filters)
  }, [open, filters])

  const activeCount = Object.values(filters).filter(Boolean).length

  return (
    <>
      <Button
        ref={triggerRef}
        variant="secondary"
        size="md"
        leadingIcon={<FilterIcon size={16} />}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        Filters{activeCount > 0 ? ` (${activeCount})` : ''}
      </Button>
      {open && position &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-label="Filter regulations"
            className="fixed z-dropdown grid gap-base overflow-y-auto rounded-sm border border-border-default bg-neutral-25 p-lg shadow-lg"
            style={{ ...position, width: MENU_WIDTH }}
          >
            <div className="grid gap-xs">
              <label htmlFor="rf-amdt" className="text-xs font-semibold text-text-secondary">Amdt</label>
              <Select id="rf-amdt" value={draft.amdt} placeholder="Any amendment" onChange={(e) => setDraft((d) => ({ ...d, amdt: e.target.value }))}>
                {amdts.map((a) => <option key={a} value={a}>{a}</option>)}
              </Select>
            </div>
            <div className="grid gap-xs">
              <label htmlFor="rf-subpart" className="text-xs font-semibold text-text-secondary">Subpart</label>
              <Select id="rf-subpart" value={draft.subpartCode} placeholder="Any subpart" onChange={(e) => setDraft((d) => ({ ...d, subpartCode: e.target.value }))}>
                {subparts.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </Select>
            </div>
            <div className="grid gap-xs">
              <label htmlFor="rf-subsection" className="text-xs font-semibold text-text-secondary">Subsection</label>
              <Select id="rf-subsection" value={draft.subsectionCode} placeholder="Any subsection" onChange={(e) => setDraft((d) => ({ ...d, subsectionCode: e.target.value }))}>
                {subsections.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </Select>
            </div>
            <div className="grid gap-xs">
              <label htmlFor="rf-root" className="text-xs font-semibold text-text-secondary">Section Root</label>
              <Select id="rf-root" value={draft.sectionRoot} placeholder="Any section root" onChange={(e) => setDraft((d) => ({ ...d, sectionRoot: e.target.value }))}>
                {sectionRoots.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </div>
            <div className="grid gap-xs">
              <label htmlFor="rf-source" className="text-xs font-semibold text-text-secondary">Source</label>
              <Select id="rf-source" value={draft.source} onChange={(e) => setDraft((d) => ({ ...d, source: e.target.value as RegulationFilters['source'] }))}>
                <option value="">Any</option>
                <option value="yes">Has a source</option>
                <option value="no">No source</option>
              </Select>
            </div>
            <div className="grid gap-xs">
              <label htmlFor="rf-active" className="text-xs font-semibold text-text-secondary">Active</label>
              <Select id="rf-active" value={draft.active} onChange={(e) => setDraft((d) => ({ ...d, active: e.target.value as RegulationFilters['active'] }))}>
                <option value="">Any status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
            </div>

            <div className="mt-xs flex justify-between gap-sm border-t border-border-default pt-base">
              <Button variant="tertiary" onClick={() => setDraft(EMPTY_REGULATION_FILTERS)}>Reset</Button>
              <Button onClick={() => { onApply(draft); setOpen(false) }}>Apply</Button>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
