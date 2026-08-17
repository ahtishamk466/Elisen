import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Filter as FilterIcon } from 'lucide-react'
import { useDropdown } from '@/components/patterns/useDropdown'
import type { FilterChip } from '@/components/patterns/FilterChips'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { PersonSelect } from '@/components/ui/PersonSelect'
import { PRIORITY_LABEL, STATUS_LABEL, TYPE_LABEL } from '@/lib/projectDisplay'
import { HEALTH_LABEL, type HealthState } from '@/lib/projectHealth'
import type { ProjectPriority, ProjectStatus, ProjectType } from '@/types/project'

export interface ProjectFilters {
  company: string
  personResponsible: string
  priority: '' | ProjectPriority
  status: '' | ProjectStatus
  type: '' | ProjectType
  active: '' | 'yes' | 'no'
  /** Budget health — the "show me what needs attention" filter. */
  health: '' | HealthState
}

export const EMPTY_PROJECT_FILTERS: ProjectFilters = {
  company: '', personResponsible: '', priority: '', status: '', type: '', active: '', health: '',
}

/** Applied filters as removable chips — the labels here are the single
    source of truth for how each filter reads once applied. */
export function projectFilterChips(
  filters: ProjectFilters,
  onChange: (filters: ProjectFilters) => void,
): FilterChip[] {
  const clear = (key: keyof ProjectFilters) => () => onChange({ ...filters, [key]: '' })
  const defs: { key: keyof ProjectFilters; label: string; value: string }[] = [
    { key: 'company', label: 'Company', value: filters.company },
    { key: 'personResponsible', label: 'Person responsible', value: filters.personResponsible },
    { key: 'priority', label: 'Priority', value: filters.priority ? PRIORITY_LABEL[filters.priority] : '' },
    { key: 'status', label: 'Status', value: filters.status ? STATUS_LABEL[filters.status] : '' },
    { key: 'type', label: 'Type', value: filters.type ? TYPE_LABEL[filters.type] : '' },
    { key: 'health', label: 'Budget health', value: filters.health ? HEALTH_LABEL[filters.health] : '' },
    { key: 'active', label: 'Active', value: filters.active === 'yes' ? 'Active' : filters.active === 'no' ? 'Inactive' : '' },
  ]
  return defs
    .filter((d) => d.value)
    .map((d) => ({ key: d.key, label: d.label, value: d.value, onRemove: clear(d.key) }))
}

export interface ProjectFilterMenuProps {
  companies: string[]
  people: string[]
  filters: ProjectFilters
  onApply: (filters: ProjectFilters) => void
  /** Labels the menu for screen readers — differs per page (List vs Review). */
  ariaLabel?: string
}

const MENU_WIDTH = 300

const PRIORITIES = Object.keys(PRIORITY_LABEL) as ProjectPriority[]
const STATUSES = Object.keys(STATUS_LABEL) as ProjectStatus[]
const TYPES = Object.keys(TYPE_LABEL) as ProjectType[]
/** Ordered by urgency, not alphabetically — over budget first. */
const HEALTH_STATES: HealthState[] = ['over-budget', 'at-risk', 'on-track', 'complete', 'no-budget']

/** Shared by Projects List and Projects Review — same row shape, same six
    filters, combinable with search (and with the Review page's preset
    chips, which the legacy tabs could never be combined with). */
export function ProjectFilterMenu({ companies, people, filters, onApply, ariaLabel = 'Filter projects' }: ProjectFilterMenuProps) {
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
            aria-label={ariaLabel}
            className="fixed z-dropdown overflow-y-auto grid gap-base rounded-sm border border-border-default bg-neutral-25 p-lg shadow-lg"
            style={{ ...position, width: MENU_WIDTH }}
          >
            <div className="grid gap-xs">
              <label htmlFor="pf-filter-company" className="text-xs font-semibold text-text-secondary">Company</label>
              <Select id="pf-filter-company" value={draft.company} placeholder="Any company" onChange={(e) => setDraft((d) => ({ ...d, company: e.target.value }))}>
                {companies.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </div>
            <div className="grid gap-xs">
              <label htmlFor="pf-filter-person" className="text-xs font-semibold text-text-secondary">Person Responsible</label>
              <PersonSelect id="pf-filter-person" value={draft.personResponsible} placeholder="Anyone" size="sm"
                people={people} onChange={(v) => setDraft((d) => ({ ...d, personResponsible: v }))} />
            </div>
            <div className="grid gap-xs">
              <label htmlFor="pf-filter-health" className="text-xs font-semibold text-text-secondary">Budget health</label>
              <Select id="pf-filter-health" value={draft.health} onChange={(e) => setDraft((d) => ({ ...d, health: e.target.value as ProjectFilters['health'] }))}>
                <option value="">Any health</option>
                {HEALTH_STATES.map((h) => <option key={h} value={h}>{HEALTH_LABEL[h]}</option>)}
              </Select>
            </div>
            <div className="grid gap-xs">
              <label htmlFor="pf-filter-priority" className="text-xs font-semibold text-text-secondary">Priority</label>
              <Select id="pf-filter-priority" value={draft.priority} onChange={(e) => setDraft((d) => ({ ...d, priority: e.target.value as ProjectFilters['priority'] }))}>
                <option value="">Any priority</option>
                {PRIORITIES.map((p) => <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>)}
              </Select>
            </div>
            <div className="grid gap-xs">
              <label htmlFor="pf-filter-status" className="text-xs font-semibold text-text-secondary">Status</label>
              <Select id="pf-filter-status" value={draft.status} onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value as ProjectFilters['status'] }))}>
                <option value="">Any status</option>
                {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
              </Select>
            </div>
            <div className="grid gap-xs">
              <label htmlFor="pf-filter-type" className="text-xs font-semibold text-text-secondary">Type</label>
              <Select id="pf-filter-type" value={draft.type} onChange={(e) => setDraft((d) => ({ ...d, type: e.target.value as ProjectFilters['type'] }))}>
                <option value="">Any type</option>
                {TYPES.map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
              </Select>
            </div>
            <div className="grid gap-xs">
              <label htmlFor="pf-filter-active" className="text-xs font-semibold text-text-secondary">Active</label>
              <Select id="pf-filter-active" value={draft.active} onChange={(e) => setDraft((d) => ({ ...d, active: e.target.value as ProjectFilters['active'] }))}>
                <option value="">Any</option>
                <option value="yes">Active</option>
                <option value="no">Inactive</option>
              </Select>
            </div>
            <div className="mt-xs flex justify-between gap-sm">
              <Button
                variant="tertiary"
                onClick={() => {
                  setDraft(EMPTY_PROJECT_FILTERS)
                  onApply(EMPTY_PROJECT_FILTERS)
                  setOpen(false)
                }}
              >
                Clear
              </Button>
              <Button
                onClick={() => {
                  onApply(draft)
                  setOpen(false)
                }}
              >
                Apply
              </Button>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
