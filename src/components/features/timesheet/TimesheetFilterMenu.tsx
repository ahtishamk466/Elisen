import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Filter as FilterIcon } from 'lucide-react'
import { useDropdown } from '@/components/patterns/useDropdown'
import type { FilterChip } from '@/components/patterns/FilterChips'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { PersonSelect } from '@/components/ui/PersonSelect'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import type { ProjectListRow } from '@/types/project'
import { HOURS_PERIODS, hoursPeriodLabel, type HoursPeriod } from '@/lib/hoursPeriod'

export interface TimesheetFilters {
  employeeName: string
  projectId: string
  validated: '' | 'yes' | 'no'
  active: '' | 'yes' | 'no'
  /** 'all' reads as no filter — same convention `hoursPeriod.ts` uses so this
      and the Person Detail period picker never drift into two vocabularies. */
  period: HoursPeriod
  /** Employee's payroll group, as in the client's Hours Worked screen. */
  payrollGroup: string
  /**
   * General/absence time. `only` isolates holiday and sick leave; `exclude`
   * gives a clean view of chargeable project work, which is what a budget
   * question usually means.
   */
  nonProject: '' | 'only' | 'exclude'
  /**
   * Former employees are **shown by default** and labelled, because their hours
   * are payroll record — dropping them by default would quietly change every
   * total. This hides them for a "who is on the team now" read.
   */
  formerStaff: '' | 'hide'
}

export const EMPTY_FILTERS: TimesheetFilters = {
  employeeName: '', projectId: '', validated: '', active: '', period: 'all',
  payrollGroup: '', nonProject: '', formerStaff: '',
}

/** Applied filters as removable chips. Project resolves to its number so a
    chip never shows a raw id. */
export function timesheetFilterChips(
  filters: TimesheetFilters,
  projects: ProjectListRow[],
  onChange: (filters: TimesheetFilters) => void,
): FilterChip[] {
  const clear = (key: keyof TimesheetFilters) => () => onChange({ ...filters, [key]: key === 'period' ? 'all' : '' })
  const project = projects.find((p) => p.id === filters.projectId)
  const defs: { key: keyof TimesheetFilters; label: string; value: string }[] = [
    { key: 'employeeName', label: 'Employee', value: filters.employeeName },
    { key: 'projectId', label: 'Project', value: project ? `${project.number}-${project.subNumber}` : '' },
    { key: 'validated', label: 'Validated', value: filters.validated === 'yes' ? 'Yes' : filters.validated === 'no' ? 'No' : '' },
    { key: 'active', label: 'Active', value: filters.active === 'yes' ? 'Active' : filters.active === 'no' ? 'Inactive' : '' },
    { key: 'period', label: 'Period', value: filters.period === 'all' ? '' : hoursPeriodLabel(filters.period) },
    { key: 'payrollGroup', label: 'Payroll group', value: filters.payrollGroup },
    { key: 'nonProject', label: 'Non-project time', value: filters.nonProject === 'only' ? 'Only' : filters.nonProject === 'exclude' ? 'Excluded' : '' },
    { key: 'formerStaff', label: 'Former employees', value: filters.formerStaff === 'hide' ? 'Hidden' : '' },
  ]
  return defs
    .filter((d) => d.value)
    .map((d) => ({ key: d.key, label: d.label, value: d.value, onRemove: clear(d.key) }))
}

export interface TimesheetFilterMenuProps {
  projects: ProjectListRow[]
  /** Pass to show the Employee filter — Hours Worked (admin) only. */
  employees?: string[]
  /** Pass to show the payroll group and former-employee filters (admin only). */
  payrollGroups?: string[]
  filters: TimesheetFilters
  onApply: (filters: TimesheetFilters) => void
  /** What the in-panel "Clear" button resets to. Defaults to no filters at
      all; Hours Worked passes its own default (Last Week) so Clear doesn't
      land the page somewhere it never opens to on its own. */
  clearFilters?: TimesheetFilters
}

const MENU_WIDTH = 300

export function TimesheetFilterMenu({ projects, employees, payrollGroups, filters, onApply, clearFilters = EMPTY_FILTERS }: TimesheetFilterMenuProps) {
  const { open, setOpen, position, triggerRef, menuRef } = useDropdown<HTMLButtonElement>(MENU_WIDTH)
  const [draft, setDraft] = useState(filters)

  useEffect(() => {
    if (open) setDraft(filters)
  }, [open, filters])

  const activeCount = Object.entries(filters).filter(([k, v]) => (k === 'period' ? v !== 'all' : Boolean(v))).length

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
            {payrollGroups && payrollGroups.length > 0 && (
              <div className="grid gap-xs">
                <label htmlFor="filter-payroll" className="text-xs font-semibold text-text-secondary">Payroll Group</label>
                <Select id="filter-payroll" value={draft.payrollGroup} placeholder="Any group" onChange={(e) => setDraft((d) => ({ ...d, payrollGroup: e.target.value }))}>
                  {payrollGroups.map((g) => <option key={g} value={g}>{g}</option>)}
                </Select>
              </div>
            )}
            <div className="grid gap-xs">
              <label htmlFor="filter-nonproject" className="text-xs font-semibold text-text-secondary">Non-project Time</label>
              <Select id="filter-nonproject" value={draft.nonProject} onChange={(e) => setDraft((d) => ({ ...d, nonProject: e.target.value as TimesheetFilters['nonProject'] }))}>
                <option value="">Include</option>
                <option value="exclude">Exclude, project work only</option>
                <option value="only">Only holiday, absence & training</option>
              </Select>
            </div>
            {employees && (
              <div className="grid gap-xs">
                <label htmlFor="filter-former" className="text-xs font-semibold text-text-secondary">Former Employees</label>
                <Select id="filter-former" value={draft.formerStaff} onChange={(e) => setDraft((d) => ({ ...d, formerStaff: e.target.value as TimesheetFilters['formerStaff'] }))}>
                  <option value="">Include their history</option>
                  <option value="hide">Hide, current staff only</option>
                </Select>
              </div>
            )}
            <div className="grid gap-xs">
              <label htmlFor="filter-period" className="text-xs font-semibold text-text-secondary">Period</label>
              <SearchableSelect
                id="filter-period"
                indicator="radio"
                size="sm"
                value={draft.period}
                options={HOURS_PERIODS.map((p) => ({ value: p.key, label: p.label }))}
                onChange={(v) => setDraft((d) => ({ ...d, period: v as HoursPeriod }))}
              />
            </div>
            <div className="mt-xs flex justify-between gap-sm">
              <Button
                variant="tertiary"
                onClick={() => {
                  setDraft(clearFilters)
                  onApply(clearFilters)
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
