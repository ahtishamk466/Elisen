import { Eye, Pencil, Copy, Trash2, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { ActionsMenu, type ActionsMenuItem } from '@/components/patterns/ActionsMenu'
import type { EnrichedTimesheetRow } from '@/lib/timesheetLookup'

const BASE_HEADERS = [
  'Project #', 'Project Description', 'Work Package', 'Activity Title', 'Task Title', 'Deliverable #',
  'Working Date', 'Hrs RG', 'Hrs OT', 'Bk Hrs RG', 'Comment', 'Validated', 'Active', 'Actions',
]

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
}

export function TimesheetTable({
  rows, loading = false, showEmployee = false, canValidate = false,
  onView, onEdit, onDuplicate, onDelete, onToggleValidated,
}: TimesheetTableProps) {
  const headers = showEmployee ? ['Employee', ...BASE_HEADERS] : BASE_HEADERS

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
    <div className="overflow-x-auto rounded-sm border border-border-default bg-neutral-25">
      <table className="w-full border-collapse text-left" style={{ minWidth: 1280 }}>
        <caption className="sr-only">Timesheet entries</caption>
        <thead>
          <tr className="border-b border-border-default bg-neutral-50">
            {headers.map((h) => (
              <th key={h} scope="col" className="whitespace-nowrap px-lg py-base text-sm font-semibold text-text-secondary">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: 6 }, (_, i) => (
                <tr key={i} className="border-b border-border-default last:border-b-0">
                  {headers.map((h) => (
                    <td key={h} className="px-lg py-base"><Skeleton className="h-4 w-full" /></td>
                  ))}
                </tr>
              ))
            : rows.map((row) => (
                <tr key={row.id} className="border-b border-border-default transition-colors duration-fast last:border-b-0 hover:bg-neutral-50">
                  {showEmployee && <td className="px-lg py-base align-top text-sm text-text-primary">{row.employeeName}</td>}
                  <td className="px-lg py-base align-top text-sm text-text-primary">{row.projectLabel}</td>
                  <td className="px-lg py-base align-top text-sm text-text-primary">{row.projectDescription}</td>
                  <td className="px-lg py-base align-top text-sm text-text-primary">{row.workPackageTitle}</td>
                  <td className="px-lg py-base align-top text-sm text-text-primary">{row.activityTitle}</td>
                  <td className="px-lg py-base align-top text-sm text-text-primary">{row.task || '—'}</td>
                  <td className="px-lg py-base align-top text-sm text-text-primary">{row.deliverableNumber || '—'}</td>
                  <td className="px-lg py-base align-top text-sm text-text-primary">{row.workingDate}</td>
                  <td className="px-lg py-base align-top text-sm text-text-primary">{row.hoursRegular.toFixed(2)}</td>
                  <td className="px-lg py-base align-top text-sm text-text-primary">{row.hoursOvertime.toFixed(2)}</td>
                  <td className="px-lg py-base align-top text-sm text-text-primary">{row.bankHoursRegular.toFixed(2)}</td>
                  <td className="px-lg py-base align-top text-sm text-text-primary">{row.comment || '—'}</td>
                  <td className="px-lg py-base align-top">
                    <Badge tone={row.validated ? 'success' : 'neutral'} dot>{row.validated ? 'Yes' : 'No'}</Badge>
                  </td>
                  <td className="px-lg py-base align-top">
                    <Badge tone={row.active ? 'success' : 'danger'} dot>{row.active ? 'Active' : 'Inactive'}</Badge>
                  </td>
                  <td className="px-lg py-base align-top">
                    <ActionsMenu ariaLabel={`Actions for timesheet entry on ${row.workingDate}`} items={actionsFor(row)} />
                  </td>
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  )
}
