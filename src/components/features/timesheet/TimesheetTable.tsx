import type { ReactNode } from 'react'
import { Eye, Pencil, Copy, Trash2, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { PersonCell } from '@/components/patterns/PersonCell'
import { Skeleton } from '@/components/ui/Skeleton'
import { ActionsMenu, type ActionsMenuItem } from '@/components/patterns/ActionsMenu'
import { SortMenu } from '@/components/patterns/SortMenu'
import { SortableTh } from '@/components/patterns/SortableTh'
import { useTableSort } from '@/components/patterns/useTableSort'
import type { EnrichedTimesheetRow } from '@/lib/timesheetLookup'
import { DateText } from '@/components/patterns/DateText'
import { formatDate } from '@/lib/formatDate'

/**
 * Number over description, activity over task: each pair is one thing read two
 * ways, so they share a cell. Work Package keeps its own column — it is the
 * scope of work, not a qualifier of the activity.
 *
 * Headings drop the "#", "Title" and "Description" suffixes: a column of
 * project numbers needs no label saying these are numbers.
 */
type SortKey = 'employee' | 'project' | 'workPackage' | 'activity' | 'task'
  | 'deliverable' | 'date' | 'hoursRegular' | 'hoursOvertime' | 'bankHours'
  | 'comment' | 'validated' | 'active'

interface Column {
  label: string
  /** **Pixels, measured, not percentages.** Percentages split the width by
      twelve arbitrary shares, and once every heading gained a sort icon nine
      of the twelve headings were *wider than their own cell* — which is what
      made the header row read as one merged run. Each width below is its
      heading's or its widest value's measured floor plus `GUTTER`, the
      separation between columns stated once. */
  width: number
  sort?: SortKey
  /** Two fields stacked in one cell; the heading offers both. */
  sorts?: { key: SortKey; label: string }[]
}

const GUTTER = 24

/* +8px per column on top of `GUTTER` (client instruction, 2026-09-28): cells
   pad at `px-lg` now, not `px-base` — 32px of padding per cell instead of
   24px — so every column's floor needs the extra 8px to keep its measured
   content from starting to crowd its neighbour. */
const BASE_COLUMNS: Column[] = [
  { label: 'Project', width: 134 + GUTTER, sort: 'project' },
  { label: 'Work Package', width: 122 + GUTTER, sort: 'workPackage' },
  {
    label: 'Activity / Task',
    width: 120 + GUTTER,
    sorts: [{ key: 'activity', label: 'Activity' }, { key: 'task', label: 'Task' }],
  },
  { label: 'Deliverable', width: 102 + GUTTER, sort: 'deliverable' },
  { label: 'Date', width: 100 + GUTTER, sort: 'date' },
  { label: 'Hrs RG', width: 73 + GUTTER, sort: 'hoursRegular' },
  { label: 'Hrs OT', width: 73 + GUTTER, sort: 'hoursOvertime' },
  { label: 'Bk Hrs', width: 71 + GUTTER, sort: 'bankHours' },
  { label: 'Comment', width: 104 + GUTTER, sort: 'comment' },
  /* "Valid." rather than "Validated": the heading, not the Yes/No under it,
     was setting this column's width. */
  { label: 'Valid.', width: 64 + GUTTER, sort: 'validated' },
  { label: 'Active', width: 76 + GUTTER, sort: 'active' },
  { label: 'Actions', width: 67 + GUTTER },
]
/* Same columns, Comment dropped — its 7% redistributed to the columns that
   most benefit (Project, Activity/Task carry the longest text). Used where
   Comment isn't shown in the table at all (Hours Worked → All Entries),
   rather than just hiding a cell, so no column sits at an orphaned width. */
const COLUMNS_NO_COMMENT: Column[] = BASE_COLUMNS.filter((c) => c.label !== 'Comment')
const EMPLOYEE_COLUMN: Column = { label: 'Employee', width: 92 + GUTTER, sort: 'employee' }

export interface TimesheetTableProps {
  rows: EnrichedTimesheetRow[]
  loading?: boolean
  /** Hours Worked (admin) shows who logged each row; Timesheet (self) doesn't need to. */
  showEmployee?: boolean
  /** Hours Worked (admin) can validate/edit/delete regardless of lock state;
      Timesheet (self) loses Edit/Delete once an entry is validated. */
  canValidate?: boolean
  /** Hours Worked → All Entries drops this column (limited width, one more
      table competing for it) — the field still lives in the row's own
      View/Edit drawer, full width there. Defaults on for every other table. */
  showComment?: boolean
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
  rows, loading = false, showEmployee = false, canValidate = false, bare = false, showComment = true,
  onView, onEdit, onDuplicate, onDelete, onToggleValidated, pagination,
}: TimesheetTableProps) {
  const baseColumns = showComment ? BASE_COLUMNS : COLUMNS_NO_COMMENT
  const columns = showEmployee ? [EMPLOYEE_COLUMN, ...baseColumns] : baseColumns

  /* Sorted inside the component rather than by each page: both Timesheet and
     Hours Worked render this same table and would otherwise duplicate the
     accessors. Project sorts by its number (the line the cell leads with),
     and the hours columns sort numerically rather than by their padded
     two-decimal strings. */
  const { sorted, sort, setSort } = useTableSort(rows, {
    employee: (r) => r.employeeName,
    project: (r) => r.projectLabel,
    workPackage: (r) => r.workPackageTitle,
    activity: (r) => r.activityTitle,
    task: (r) => r.task,
    deliverable: (r) => r.deliverableNumber,
    date: (r) => r.workingDate,
    hoursRegular: (r) => r.hoursRegular,
    hoursOvertime: (r) => r.hoursOvertime,
    bankHours: (r) => r.bankHoursRegular,
    comment: (r) => r.comment,
    validated: (r) => r.validated,
    active: (r) => r.active,
  })

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
      {/* Derived, so the declared minimum can never drift from the widths
          above the way a hand-kept number did. */}
      <table className="w-full table-fixed border-collapse text-left"
        style={{ minWidth: columns.reduce((n, c) => n + c.width, 0) }}>
        <caption className="sr-only">Timesheet entries</caption>
        <thead>
          <tr className="border-b border-border-default bg-neutral-50">
            {columns.slice(0, -1).map((c) => (
              <SortableTh key={c.label} sortKey={c.sort} ownsKeys={c.sorts?.map((o) => o.key)} sort={sort} onSortChange={setSort}
                style={{ width: c.width }}
                className="whitespace-nowrap px-lg py-lg text-sm font-semibold text-text-secondary">
                {c.sorts
                  ? <SortMenu label={c.label} options={c.sorts} sort={sort} onChange={setSort} />
                  : c.label}
              </SortableTh>
            ))}
            {/* Pinned to the scroll container's own right edge (client
                instruction, 2026-09-28, the same treatment as Documents/
                Projects Review/Hours by Person). `shadow-sticky` goes on the
                overlay span — a `box-shadow` set directly on a table cell
                never paints under `border-collapse`. */}
            <SortableTh
              style={{ width: columns[columns.length - 1].width }}
              className="sticky right-0 z-sticky whitespace-nowrap border-b border-b-neutral-300 border-l border-l-border-default bg-neutral-50 px-lg py-lg text-sm font-semibold text-text-secondary"
            >
              <span aria-hidden className="pointer-events-none absolute inset-0 shadow-sticky" />
              {columns[columns.length - 1].label}
            </SortableTh>
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: 6 }, (_, i) => (
                <tr key={i} className="border-b border-border-default last:border-b-0">
                  {columns.slice(0, -1).map((c) => (
                    <td key={c.label} className="px-lg py-lg"><Skeleton className="h-4 w-full" /></td>
                  ))}
                  <td className="sticky right-0 z-sticky border-l border-border-default bg-neutral-25 px-lg py-lg">
                    <span aria-hidden className="pointer-events-none absolute inset-0 shadow-sticky" />
                    <Skeleton className="h-4 w-full" />
                  </td>
                </tr>
              ))
            : sorted.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => onView?.(row)}
                  className="group cursor-pointer border-b border-border-default transition-colors duration-fast last:border-b-0 hover:bg-accent-subtle"
                >
                  {showEmployee && <td className="px-lg py-lg align-middle"><PersonCell name={row.employeeName} /></td>}
                  <td className="px-lg py-lg align-middle">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onView?.(row) }}
                      className="block w-full min-w-0 text-left underline-offset-2 hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
                    >
                      <span className="flex min-w-0 items-center gap-xs">
                        <span className="truncate text-sm font-semibold text-text-primary">{row.projectLabel}</span>
                        {row.isCopy && <Badge tone="info">Copy</Badge>}
                      </span>
                      <span className="block truncate text-xs text-text-secondary">{row.projectDescription}</span>
                    </button>
                  </td>
                  <td className="px-lg py-lg align-middle text-sm text-text-primary">
                    <span className="block truncate">{row.workPackageTitle}</span>
                  </td>
                  <td className="px-lg py-lg align-middle">
                    <span className="block truncate text-sm text-text-primary">{row.activityTitle}</span>
                    <span className="block truncate text-xs text-text-secondary">{row.task || '—'}</span>
                  </td>
                  <td className="px-lg py-lg align-middle text-sm text-text-primary">
                    <span className="block truncate">{row.deliverableNumber || '—'}</span>
                  </td>
                  <td className="px-lg py-lg align-middle text-sm text-text-primary"><DateText value={row.workingDate} /></td>
                  <td className="px-lg py-lg align-middle text-sm text-text-primary">{row.hoursRegular.toFixed(2)}</td>
                  <td className="px-lg py-lg align-middle text-sm text-text-primary">{row.hoursOvertime.toFixed(2)}</td>
                  <td className="px-lg py-lg align-middle text-sm text-text-primary">{row.bankHoursRegular.toFixed(2)}</td>
                  {showComment && (
                    <td className="px-lg py-lg align-middle text-sm text-text-primary"><span className="block truncate">{row.comment || '—'}</span></td>
                  )}
                  <td className="px-lg py-lg align-middle">
                    <Badge tone={row.validated ? 'success' : 'neutral'}>{row.validated ? 'Yes' : 'No'}</Badge>
                  </td>
                  <td className="px-lg py-lg align-middle">
                    <Badge tone={row.active ? 'success' : 'danger'}>{row.active ? 'Active' : 'Inactive'}</Badge>
                  </td>
                  <td
                    className="sticky right-0 z-sticky border-l border-border-default bg-neutral-25 px-lg py-lg align-middle transition-colors duration-fast group-hover:bg-accent-subtle"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span aria-hidden className="pointer-events-none absolute inset-0 shadow-sticky" />
                    <ActionsMenu ariaLabel={`Actions for timesheet entry on ${formatDate(row.workingDate)}`} items={actionsFor(row)} />
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
