import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Filter as FilterIcon } from 'lucide-react'
import { useDropdown } from '@/components/patterns/useDropdown'
import type { FilterChip } from '@/components/patterns/FilterChips'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'

export interface ApprovalFilters {
  /** '' = any, 'yes' = primary certificates, 'no' = change approvals. */
  primary: '' | 'yes' | 'no'
  status: '' | 'active' | 'inactive'
  holder: string
  /** A Reference Data aircraft id. */
  aircraftId: string
  /** Certificates with, or without, any project attached. */
  linked: '' | 'yes' | 'no'
  /** Revised = more than one revision, i.e. changed since it was granted. */
  revised: '' | 'yes' | 'no'
}

export const EMPTY_APPROVAL_FILTERS: ApprovalFilters = {
  primary: '', status: '', holder: '', aircraftId: '', linked: '', revised: '',
}

/** Applied filters as removable chips — these labels are the single source of
    truth for how each filter reads once applied. */
export function approvalFilterChips(
  filters: ApprovalFilters,
  aircraftLabel: (id: string) => string,
  onChange: (filters: ApprovalFilters) => void,
): FilterChip[] {
  const clear = (key: keyof ApprovalFilters) => () => onChange({ ...filters, [key]: '' })
  const yesNo = (v: string, yes: string, no: string) => (v === 'yes' ? yes : v === 'no' ? no : '')
  const defs: { key: keyof ApprovalFilters; label: string; value: string }[] = [
    { key: 'primary', label: 'Type', value: yesNo(filters.primary, 'Primary', 'Change approval') },
    { key: 'status', label: 'Status', value: filters.status === 'active' ? 'Active' : filters.status === 'inactive' ? 'Inactive' : '' },
    { key: 'holder', label: 'Approval holder', value: filters.holder },
    { key: 'aircraftId', label: 'Aircraft', value: filters.aircraftId ? aircraftLabel(filters.aircraftId) : '' },
    { key: 'linked', label: 'Projects', value: yesNo(filters.linked, 'Linked to a project', 'Not linked') },
    { key: 'revised', label: 'Revisions', value: yesNo(filters.revised, 'Revised since granted', 'Original revision only') },
  ]
  return defs
    .filter((d) => d.value)
    .map((d) => ({ key: d.key, label: d.label, value: d.value, onRemove: clear(d.key) }))
}

export interface ApprovalFilterMenuProps {
  holders: string[]
  aircraft: { id: string; label: string }[]
  filters: ApprovalFilters
  onApply: (filters: ApprovalFilters) => void
}

const MENU_WIDTH = 300

/**
 * Filters for the Approvals list. Same shape as every other filter menu in the
 * app: a draft held while the panel is open, applied on Apply, with the active
 * count on the trigger and chips underneath.
 *
 * The two that earn their place beyond the obvious ones: **Projects** surfaces
 * certificates attached to nothing, and **Revisions** separates the ones that
 * have been changed since they were granted from those still on revision 1.
 */
export function ApprovalFilterMenu({ holders, aircraft, filters, onApply }: ApprovalFilterMenuProps) {
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
            aria-label="Filter approvals"
            className="fixed z-dropdown overflow-y-auto grid gap-base rounded-sm border border-border-default bg-neutral-25 p-lg shadow-lg"
            style={{ ...position, width: MENU_WIDTH }}
          >
            <div className="grid gap-xs">
              <label htmlFor="af-primary" className="text-xs font-semibold text-text-secondary">Type</label>
              <Select id="af-primary" value={draft.primary} onChange={(e) => setDraft((d) => ({ ...d, primary: e.target.value as ApprovalFilters['primary'] }))}>
                <option value="">Any type</option>
                <option value="yes">Primary</option>
                <option value="no">Change approval</option>
              </Select>
            </div>
            <div className="grid gap-xs">
              <label htmlFor="af-status" className="text-xs font-semibold text-text-secondary">Status</label>
              <Select id="af-status" value={draft.status} onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value as ApprovalFilters['status'] }))}>
                <option value="">Any status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
            </div>
            <div className="grid gap-xs">
              <label htmlFor="af-holder" className="text-xs font-semibold text-text-secondary">Approval Holder</label>
              <Select id="af-holder" value={draft.holder} placeholder="Any holder" onChange={(e) => setDraft((d) => ({ ...d, holder: e.target.value }))}>
                {holders.map((h) => <option key={h} value={h}>{h}</option>)}
              </Select>
            </div>
            <div className="grid gap-xs">
              <label htmlFor="af-aircraft" className="text-xs font-semibold text-text-secondary">Aircraft</label>
              <Select id="af-aircraft" value={draft.aircraftId} placeholder="Any aircraft" onChange={(e) => setDraft((d) => ({ ...d, aircraftId: e.target.value }))}>
                {aircraft.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
              </Select>
            </div>
            <div className="grid gap-xs">
              <label htmlFor="af-linked" className="text-xs font-semibold text-text-secondary">Projects</label>
              <Select id="af-linked" value={draft.linked} onChange={(e) => setDraft((d) => ({ ...d, linked: e.target.value as ApprovalFilters['linked'] }))}>
                <option value="">Any</option>
                <option value="yes">Linked to a project</option>
                <option value="no">Not linked</option>
              </Select>
            </div>
            <div className="grid gap-xs">
              <label htmlFor="af-revised" className="text-xs font-semibold text-text-secondary">Revisions</label>
              <Select id="af-revised" value={draft.revised} onChange={(e) => setDraft((d) => ({ ...d, revised: e.target.value as ApprovalFilters['revised'] }))}>
                <option value="">Any</option>
                <option value="yes">Revised since granted</option>
                <option value="no">Original revision only</option>
              </Select>
            </div>

            <div className="mt-xs flex justify-between gap-sm border-t border-border-default pt-base">
              <Button variant="tertiary" onClick={() => setDraft(EMPTY_APPROVAL_FILTERS)}>Reset</Button>
              <Button onClick={() => { onApply(draft); setOpen(false) }}>Apply</Button>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
