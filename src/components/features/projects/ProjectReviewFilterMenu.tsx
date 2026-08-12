import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Filter as FilterIcon } from 'lucide-react'
import { useDropdown } from '@/components/patterns/useDropdown'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { PRIORITY_LABEL, STATUS_LABEL, TYPE_LABEL } from '@/lib/projectDisplay'
import type { ProjectPriority, ProjectStatus, ProjectType } from '@/types/project'

export interface ReviewFilters {
  company: string
  personResponsible: string
  priority: '' | ProjectPriority
  status: '' | ProjectStatus
  type: '' | ProjectType
  active: '' | 'yes' | 'no'
}

export const EMPTY_REVIEW_FILTERS: ReviewFilters = {
  company: '', personResponsible: '', priority: '', status: '', type: '', active: '',
}

export interface ProjectReviewFilterMenuProps {
  companies: string[]
  people: string[]
  filters: ReviewFilters
  onApply: (filters: ReviewFilters) => void
}

const MENU_WIDTH = 300

const PRIORITIES = Object.keys(PRIORITY_LABEL) as ProjectPriority[]
const STATUSES = Object.keys(STATUS_LABEL) as ProjectStatus[]
const TYPES = Object.keys(TYPE_LABEL) as ProjectType[]

/** Narrows further within whichever preset chip is selected — the two
    combine, which the legacy tabs could never do. */
export function ProjectReviewFilterMenu({ companies, people, filters, onApply }: ProjectReviewFilterMenuProps) {
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
        size="lg"
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
            aria-label="Filter projects review"
            className="fixed z-dropdown grid gap-base rounded-sm border border-border-default bg-neutral-25 p-lg shadow-lg"
            style={{ top: position.top, left: position.left, width: MENU_WIDTH }}
          >
            <div className="grid gap-xs">
              <label htmlFor="rv-filter-company" className="text-xs font-semibold text-text-secondary">Company</label>
              <Select id="rv-filter-company" value={draft.company} placeholder="Any company" onChange={(e) => setDraft((d) => ({ ...d, company: e.target.value }))}>
                {companies.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </div>
            <div className="grid gap-xs">
              <label htmlFor="rv-filter-person" className="text-xs font-semibold text-text-secondary">Person Responsible</label>
              <Select id="rv-filter-person" value={draft.personResponsible} placeholder="Anyone" onChange={(e) => setDraft((d) => ({ ...d, personResponsible: e.target.value }))}>
                {people.map((p) => <option key={p} value={p}>{p}</option>)}
              </Select>
            </div>
            <div className="grid gap-xs">
              <label htmlFor="rv-filter-priority" className="text-xs font-semibold text-text-secondary">Priority</label>
              <Select id="rv-filter-priority" value={draft.priority} onChange={(e) => setDraft((d) => ({ ...d, priority: e.target.value as ReviewFilters['priority'] }))}>
                <option value="">Any priority</option>
                {PRIORITIES.map((p) => <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>)}
              </Select>
            </div>
            <div className="grid gap-xs">
              <label htmlFor="rv-filter-status" className="text-xs font-semibold text-text-secondary">Status</label>
              <Select id="rv-filter-status" value={draft.status} onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value as ReviewFilters['status'] }))}>
                <option value="">Any status</option>
                {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
              </Select>
            </div>
            <div className="grid gap-xs">
              <label htmlFor="rv-filter-type" className="text-xs font-semibold text-text-secondary">Type</label>
              <Select id="rv-filter-type" value={draft.type} onChange={(e) => setDraft((d) => ({ ...d, type: e.target.value as ReviewFilters['type'] }))}>
                <option value="">Any type</option>
                {TYPES.map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
              </Select>
            </div>
            <div className="grid gap-xs">
              <label htmlFor="rv-filter-active" className="text-xs font-semibold text-text-secondary">Active</label>
              <Select id="rv-filter-active" value={draft.active} onChange={(e) => setDraft((d) => ({ ...d, active: e.target.value as ReviewFilters['active'] }))}>
                <option value="">Any</option>
                <option value="yes">Active</option>
                <option value="no">Inactive</option>
              </Select>
            </div>
            <div className="mt-xs flex justify-between gap-sm">
              <Button
                variant="tertiary"
                onClick={() => {
                  setDraft(EMPTY_REVIEW_FILTERS)
                  onApply(EMPTY_REVIEW_FILTERS)
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
