import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Filter as FilterIcon } from 'lucide-react'
import { useDropdown } from '@/components/patterns/useDropdown'
import type { FilterChip } from '@/components/patterns/FilterChips'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { PersonSelect } from '@/components/ui/PersonSelect'
import { Input } from '@/components/ui/Input'
import type { ProjectListRow } from '@/types/project'

export interface TimesheetFilters {
  employeeName: string
  projectId: string
  validated: '' | 'yes' | 'no'
  active: '' | 'yes' | 'no'
  dateFrom: string
  dateTo: string
}

export const EMPTY_FILTERS: TimesheetFilters = {
  employeeName: '', projectId: '', validated: '', active: '', dateFrom: '', dateTo: '',
}

/** Applied filters as removable chips. Project resolves to its number so a
    chip never shows a raw id. */
export function timesheetFilterChips(
  filters: TimesheetFilters,
  projects: ProjectListRow[],
  onChange: (filters: TimesheetFilters) => void,
): FilterChip[] {
  const clear = (key: keyof TimesheetFilters) => () => onChange({ ...filters, [key]: '' })
  const project = projects.find((p) => p.id === filters.projectId)
  const defs: { key: keyof TimesheetFilters; label: string; value: string }[] = [
    { key: 'employeeName', label: 'Employee', value: filters.employeeName },
    { key: 'projectId', label: 'Project', value: project ? `${project.number}-${project.subNumber}` : '' },
    { key: 'validated', label: 'Validated', value: filters.validated === 'yes' ? 'Yes' : filters.validated === 'no' ? 'No' : '' },
    { key: 'active', label: 'Active', value: filters.active === 'yes' ? 'Active' : filters.active === 'no' ? 'Inactive' : '' },
    { key: 'dateFrom', label: 'From', value: filters.dateFrom },
    { key: 'dateTo', label: 'To', value: filters.dateTo },
  ]
  return defs
    .filter((d) => d.value)
    .map((d) => ({ key: d.key, label: d.label, value: d.value, onRemove: clear(d.key) }))
}

export interface TimesheetFilterMenuProps {
  projects: ProjectListRow[]
  /** Pass to show the Employee filter — Hours Worked (admin) only. */
  employees?: string[]
  filters: TimesheetFilters
  onApply: (filters: TimesheetFilters) => void
}

const MENU_WIDTH = 300

export function TimesheetFilterMenu({ projects, employees, filters, onApply }: TimesheetFilterMenuProps) {
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
            aria-label="Filter timesheet entries"
            className="fixed z-dropdown overflow-y-auto grid gap-base rounded-sm border border-border-default bg-neutral-25 p-lg shadow-lg"
            style={{ ...position, width: MENU_WIDTH }}
          >
            {employees && (
              <div className="grid gap-xs">
                <label htmlFor="filter-employee" className="text-xs font-semibold text-text-secondary">Employee</label>
                <PersonSelect id="filter-employee" value={draft.employeeName} placeholder="Any employee" size="sm"
                  people={employees} onChange={(v) => setDraft((d) => ({ ...d, employeeName: v }))} />
              </div>
            )}
            <div className="grid gap-xs">
              <label htmlFor="filter-project" className="text-xs font-semibold text-text-secondary">Project</label>
              <Select id="filter-project" value={draft.projectId} placeholder="Any project" onChange={(e) => setDraft((d) => ({ ...d, projectId: e.target.value }))}>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.number}-{p.subNumber} {p.title}</option>)}
              </Select>
            </div>
            <div className="grid gap-xs">
              <label htmlFor="filter-validated" className="text-xs font-semibold text-text-secondary">Validated</label>
              <Select id="filter-validated" value={draft.validated} onChange={(e) => setDraft((d) => ({ ...d, validated: e.target.value as TimesheetFilters['validated'] }))}>
                <option value="">Any</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </Select>
            </div>
            <div className="grid gap-xs">
              <label htmlFor="filter-active" className="text-xs font-semibold text-text-secondary">Active</label>
              <Select id="filter-active" value={draft.active} onChange={(e) => setDraft((d) => ({ ...d, active: e.target.value as TimesheetFilters['active'] }))}>
                <option value="">Any</option>
                <option value="yes">Active</option>
                <option value="no">Inactive</option>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-sm">
              <div className="grid gap-xs">
                <label htmlFor="filter-date-from" className="text-xs font-semibold text-text-secondary">From</label>
                <Input id="filter-date-from" type="date" value={draft.dateFrom} onChange={(e) => setDraft((d) => ({ ...d, dateFrom: e.target.value }))} />
              </div>
              <div className="grid gap-xs">
                <label htmlFor="filter-date-to" className="text-xs font-semibold text-text-secondary">To</label>
                <Input id="filter-date-to" type="date" value={draft.dateTo} onChange={(e) => setDraft((d) => ({ ...d, dateTo: e.target.value }))} />
              </div>
            </div>
            <div className="mt-xs flex justify-between gap-sm">
              <Button
                variant="tertiary"
                onClick={() => {
                  setDraft(EMPTY_FILTERS)
                  onApply(EMPTY_FILTERS)
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
