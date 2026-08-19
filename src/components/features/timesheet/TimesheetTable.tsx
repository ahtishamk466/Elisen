import type { ReactNode } from 'react'
import { Eye, Pencil, Copy, Trash2, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { PersonCell } from '@/components/patterns/PersonCell'
import { Skeleton } from '@/components/ui/Skeleton'
import { ActionsMenu, type ActionsMenuItem } from '@/components/patterns/ActionsMenu'
import type { EnrichedTimesheetRow } from '@/lib/timesheetLookup'

/**
 * Number over description, activity over task: each pair is one thing read two
 * ways, so they share a cell. Work Package keeps its own column — it is the
 * scope of work, not a qualifier of the activity.
 *
 * Headings drop the "#", "Title" and "Description" suffixes: a column of
 * project numbers needs no label saying these are numbers.
 */
const BASE_COLUMNS: { label: string; width: string }[] = [
  { label: 'Project', width: '13%' },
  { label: 'Work Package', width: '10%' },
  { label: 'Activity / Task', width: '10%' },
  { label: 'Deliverable', width: '8%' },
  { label: 'Date', width: '8%' },
  { label: 'Hrs RG', width: '6%' },
  { label: 'Hrs OT', width: '6%' },
  { label: 'Bk Hrs', width: '6%' },
  { label: 'Comment', width: '7%' },
  /* "Valid." rather than "Validated": the heading, not the Yes/No under it,
     was setting this column's width. */
  { label: 'Valid.', width: '5%' },
  { label: 'Active', width: '6%' },
  { label: 'Actions', width: '6%' },
]
const EMPLOYEE_COLUMN = { label: 'Employee', width: '9%' }

export interface TimesheetTableProps {
  rows: EnrichedTimesheetRow[]
  loading?: boolean
  /** Hours Worked (admin) shows who logged each row; Timesheet (self) doesn't need to. */
  showEmployee?: boolean
  /** Hours Worked (admin) can validate/edit/delete regardless of lock state;
      Timesheet (self) loses Edit/Delete once an entry is validated. */
  canValidate?: boolean
  onView?: (row: EnrichedTimesheetRow) => void
  onEdit?: (row: EnrichedTimesheetRow) => void
  onDuplicate?: (row: EnrichedTimesheetRow) => void
  onDelete?: (row: EnrichedTimesheetRow) => void
  onToggleValidated?: (row: EnrichedTimesheetRow) => void
  /** Drop the table's own card border — it is already inside one, e.g. under
      the Hours Worked tab strip. */
  bare?: boolean
  /** Rendered as the table's own footer bar — inside the same card, not a
      second box below it. Typically an <AutoLoadFooter>. */
  pagination?: ReactNode
}

export function TimesheetTable({
  rows, loading = false, showEmployee = false, canValidate = false, bare = false,
  onView, onEdit, onDuplicate, onDelete, onToggleValidated, pagination,
}: TimesheetTableProps) {
  const columns = showEmployee ? [EMPLOYEE_COLUMN, ...BASE_COLUMNS] : BASE_COLUMNS

  const actionsFor = (row: EnrichedTimesheetRow): ActionsMenuItem[] => {
    const view: ActionsMenuItem = { label: 'View', icon: <Eye size={16} />, onSelect: () => onView?.(row) }
    const edit: ActionsMenuItem = { label: 'Edit', icon: <Pencil size={16} />, onSelect: () => onEdit?.(row) }
    const duplicate: ActionsMenuItem = { label: 'Duplicate', icon: <Copy size={16} />, onSelect: () => onDuplicate?.(row) }
    const del: ActionsMenuItem = { label: 'Delete', icon: <Trash2 size={16} />, onSelect: () => onDelete?.(row), tone: 'danger' }
    const toggleValidated: ActionsMenuItem = {
      label: row.validated ? 'Unmark validated' : 'Mark as validated',
      icon: <CheckCircle2 size={16} />,
      onSelect: () => onToggleValidated?.(row),
    }

    if (canValidate) return [view, edit, toggleValidated, duplicate, del]
    if (row.validated) return [view, duplicate]
    return [view, edit, duplicate, del]
  }

  return (
    <div className={bare ? '' : 'overflow-hidden rounded-sm border border-border-default bg-neutral-25'}>
      <div className="overflow-x-auto">
      <table className="w-full table-fixed border-collapse text-left" style={{ minWidth: 1180 }}>
        <caption className="sr-only">Timesheet entries</caption>
        <thead>
          <tr className="border-b border-border-default bg-neutral-50">
            {columns.map((c) => (
              <th key={c.label} scope="col" style={{ width: c.width }}
                className="whitespace-nowrap px-sm py-base text-sm font-semibold text-text-secondary">{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: 6 }, (_, i) => (
                <tr key={i} className="border-b border-border-default last:border-b-0">
                  {columns.map((c) => (
                    <td key={c.label} className="px-sm py-base"><Skeleton className="h-4 w-full" /></td>
                  ))}
                </tr>
              ))
            : rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => onView?.(row)}
                  className="cursor-pointer border-b border-border-default transition-colors duration-fast last:border-b-0 hover:bg-accent-subtle"
                >
                  {showEmployee && <td className="px-sm py-base align-middle"><PersonCell name={row.employeeName} /></td>}
                  <td className="px-sm py-base align-middle">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onView?.(row) }}
                      className="block w-full min-w-0 text-left underline-offset-2 hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
                    >
                      <span className="block truncate text-sm font-semibold text-text-primary">{row.projectLabel}</span>
                      <span className="block truncate text-xs text-text-secondary">{row.projectDescription}</span>
                    </button>
                  </td>
                  <td className="px-sm py-base align-middle text-sm text-text-primary">
                    <span className="block truncate">{row.workPackageTitle}</span>
                  </td>
                  <td className="px-sm py-base align-middle">
                    <span className="block truncate text-sm text-text-primary">{row.activityTitle}</span>
                    <span className="block truncate text-xs text-text-secondary">{row.task || '—'}</span>
                  </td>
                  <td className="px-sm py-base align-middle text-sm text-text-primary">
                    <span className="block truncate">{row.deliverableNumber || '—'}</span>
                  </td>
                  <td className="px-sm py-base align-middle text-sm text-text-primary">{row.workingDate}</td>
                  <td className="px-sm py-base align-middle text-sm text-text-primary">{row.hoursRegular.toFixed(2)}</td>
                  <td className="px-sm py-base align-middle text-sm text-text-primary">{row.hoursOvertime.toFixed(2)}</td>
                  <td className="px-sm py-base align-middle text-sm text-text-primary">{row.bankHoursRegular.toFixed(2)}</td>
                  <td className="px-sm py-base align-middle text-sm text-text-primary"><span className="block truncate">{row.comment || '—'}</span></td>
                  <td className="px-sm py-base align-middle">
                    <Badge tone={row.validated ? 'success' : 'neutral'}>{row.validated ? 'Yes' : 'No'}</Badge>
                  </td>
                  <td className="px-sm py-base align-middle">
                    <Badge tone={row.active ? 'success' : 'danger'}>{row.active ? 'Active' : 'Inactive'}</Badge>
                  </td>
                  <td className="px-sm py-base align-middle" onClick={(e) => e.stopPropagation()}>
                    <ActionsMenu ariaLabel={`Actions for timesheet entry on ${row.workingDate}`} items={actionsFor(row)} />
                  </td>
                </tr>
              ))}
        </tbody>
      </table>
      </div>
      {pagination}
    </div>
  )
}
