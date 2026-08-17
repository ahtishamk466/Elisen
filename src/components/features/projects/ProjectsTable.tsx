import type { ReactNode } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, Eye, Pencil, Copy, Trash2, Package } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Checkbox } from '@/components/ui/Checkbox'
import { Skeleton } from '@/components/ui/Skeleton'
import { ActionsMenu } from '@/components/patterns/ActionsMenu'
import { ProgressMeter } from '@/components/patterns/ProgressMeter'
import { Truncate } from '@/components/patterns/Truncate'
import { PRIORITY_LABEL, STATUS_LABEL, STATUS_TONE, TYPE_LABEL } from '@/lib/projectDisplay'
import { HEALTH_LABEL, HEALTH_TONE, formatHours, formatPct, type Health } from '@/lib/projectHealth'
import type { ProjectListRow } from '@/types/project'

/** A row plus the budget roll-up computed for it by the page. */
export interface ProjectRowWithHealth {
  row: ProjectListRow
  health: Health
}

export type SortKey = 'number' | 'company' | 'budget' | 'actual' | 'remaining' | 'progress' | 'priority'
export interface Sort {
  key: SortKey
  dir: 'asc' | 'desc'
}

interface Column {
  label: string
  /** Omitted = not sortable (free text and action columns). */
  sort?: SortKey
  /** Financial columns come out entirely below manager. */
  financial?: boolean
  numeric?: boolean
}

const COLUMNS: Column[] = [
  { label: 'No. / Type', sort: 'number' },
  { label: 'Project' },
  { label: 'Company Name', sort: 'company' },
  { label: 'Contact Name' },
  { label: 'Person Res.' },
  { label: 'Budget', sort: 'budget', financial: true, numeric: true },
  { label: 'Actual', sort: 'actual', financial: true, numeric: true },
  { label: 'Remaining', sort: 'remaining', financial: true, numeric: true },
  { label: 'Budget used', sort: 'progress', financial: true },
  { label: 'Priority', sort: 'priority' },
  { label: 'Status' },
  { label: 'Actions' },
]

export interface ProjectsTableProps {
  rows: ProjectRowWithHealth[]
  loading?: boolean
  /** Hours are budget data — hidden below manager per docs/SECURITY.md rule 8. */
  canSeeFinancials?: boolean
  sort?: Sort
  onSortChange?: (sort: Sort) => void
  /** Ids of selected rows; omit both to render without the select column. */
  selectedIds?: string[]
  onSelectionChange?: (ids: string[]) => void
  onView?: (row: ProjectListRow) => void
  /** Straight to the project's Work Packages tab — the part of a project people
      come back to most, so it shouldn't need a detour through Overview. */
  onOpenWorkPackages?: (row: ProjectListRow) => void
  onEdit?: (row: ProjectListRow) => void
  onDuplicate?: (row: ProjectListRow) => void
  onDelete?: (row: ProjectListRow) => void
  /** Rendered as the table's own footer bar — inside the same card, not a
      second box below it. Typically an <AutoLoadFooter>. */
  pagination?: ReactNode
}

export function ProjectsTable({
  rows, loading = false, canSeeFinancials = true, sort, onSortChange,
  selectedIds, onSelectionChange, onView, onOpenWorkPackages, onEdit, onDuplicate, onDelete, pagination,
}: ProjectsTableProps) {
  const columns = canSeeFinancials ? COLUMNS : COLUMNS.filter((c) => !c.financial)
  const selectable = !!selectedIds && !!onSelectionChange
  const pageIds = rows.map((r) => r.row.id)
  const allSelected = selectable && pageIds.length > 0 && pageIds.every((id) => selectedIds!.includes(id))

  const toggleAll = () => {
    if (!onSelectionChange) return
    onSelectionChange(allSelected ? selectedIds!.filter((id) => !pageIds.includes(id)) : [...new Set([...selectedIds!, ...pageIds])])
  }
  const toggleOne = (id: string) => {
    if (!onSelectionChange) return
    onSelectionChange(selectedIds!.includes(id) ? selectedIds!.filter((x) => x !== id) : [...selectedIds!, id])
  }

  const headerButton = (c: Column, key: SortKey) => {
    const active = sort?.key === key
    const Icon = !active || !sort ? ArrowUpDown : sort.dir === 'asc' ? ArrowUp : ArrowDown
    return (
      <button
        type="button"
        onClick={() => onSortChange?.({ key, dir: active && sort?.dir === 'asc' ? 'desc' : 'asc' })}
        className={`flex items-center gap-xs rounded-sm transition-colors duration-fast hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary
          ${c.numeric ? 'ml-auto' : ''} ${active ? 'text-text-primary' : ''}`}
      >
        {c.label}
        <Icon size={14} aria-hidden className={active ? 'text-accent' : 'text-text-muted'} />
      </button>
    )
  }

  return (
    <div className="overflow-hidden rounded-sm border border-border-default bg-neutral-25">
      <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left" style={{ minWidth: 1320 }}>
        <caption className="sr-only">Projects, with budget health per project</caption>
        <thead>
          <tr className="border-b border-border-default bg-neutral-50">
            {selectable && (
              <th scope="col" className="w-px px-lg py-base">
                <Checkbox checked={allSelected} onChange={toggleAll} aria-label="Select all projects on this page" />
              </th>
            )}
            {columns.map((c) => (
              <th
                key={c.label}
                scope="col"
                aria-sort={sort && c.sort && sort.key === c.sort ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}
                className={`whitespace-nowrap px-lg py-base text-sm font-semibold text-text-secondary ${c.numeric ? 'text-right' : ''}`}
              >
                {c.sort && onSortChange ? headerButton(c, c.sort) : c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: 6 }, (_, i) => (
                <tr key={i} className="border-b border-border-default last:border-b-0">
                  {Array.from({ length: columns.length + (selectable ? 1 : 0) }, (_, j) => (
                    <td key={j} className="px-lg py-base"><Skeleton className="h-4 w-full" /></td>
                  ))}
                </tr>
              ))
            : rows.map(({ row, health }) => {
                const over = health.remaining < 0
                const selected = selectable && selectedIds!.includes(row.id)
                return (
                  <tr
                    key={row.id}
                    onClick={() => onView?.(row)}
                    className={`cursor-pointer border-b border-border-default transition-colors duration-fast last:border-b-0 hover:bg-accent-subtle ${selected ? 'bg-accent-subtle' : ''}`}
                  >
                    {selectable && (
                      <td className="px-lg py-base align-top" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selected}
                          onChange={() => toggleOne(row.id)}
                          aria-label={`Select project ${row.number}-${row.subNumber}`}
                        />
                      </td>
                    )}
                    <td className="whitespace-nowrap px-lg py-base align-top">
                      <span className="block text-sm text-text-primary">{row.number}-{row.subNumber}</span>
                      <span className="block text-xs text-text-muted">{TYPE_LABEL[row.type]}</span>
                    </td>
                    <td className="px-lg py-base align-top" style={{ maxWidth: 240 }}>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onView?.(row) }}
                        className="block w-full text-left text-sm text-text-primary underline-offset-2 hover:text-accent hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
                      >
                        <Truncate>{row.title}</Truncate>
                      </button>
                    </td>
                    <td className="px-lg py-base align-top" style={{ maxWidth: 170 }}>
                      <span className="block text-sm text-text-primary"><Truncate lines={1}>{row.companyName}</Truncate></span>
                      <span className="block text-xs text-text-muted">{row.companyNumber}</span>
                    </td>
                    <td className="px-lg py-base align-top text-sm text-text-primary">{row.contactName}</td>
                    <td className="px-lg py-base align-top text-sm text-text-primary">{row.personResponsible}</td>
                    {canSeeFinancials && (
                      <>
                        <td className="whitespace-nowrap px-lg py-base text-right align-top text-sm text-text-primary">
                          {health.budget > 0 ? formatHours(health.budget) : '—'}
                        </td>
                        <td className="whitespace-nowrap px-lg py-base text-right align-top text-sm text-text-primary">
                          {formatHours(health.actual)}
                        </td>
                        {/* Over-budget shows as a negative in danger — the sign
                            carries the meaning, not the colour alone. */}
                        <td className={`whitespace-nowrap px-lg py-base text-right align-top text-sm ${over ? 'font-semibold text-danger' : 'text-text-primary'}`}>
                          {health.budget > 0 ? `${over ? '−' : ''}${formatHours(Math.abs(health.remaining))}` : '—'}
                        </td>
                        <td className="px-lg py-base align-top" style={{ minWidth: 150 }}>
                          <div className="flex items-center gap-sm">
                            <div className="min-w-0 flex-1">
                              <ProgressMeter
                                health={health}
                                size="sm"
                                ariaLabel={`Project ${row.number}-${row.subNumber} budget`}
                              />
                            </div>
                            <span className="w-10 shrink-0 text-right text-xs font-semibold text-text-primary">
                              {formatPct(health.progressPct)}
                            </span>
                          </div>
                        </td>
                      </>
                    )}
                    <td className="whitespace-nowrap px-lg py-base align-top text-sm text-text-primary">
                      {PRIORITY_LABEL[row.priority]}
                    </td>
                    <td className="whitespace-nowrap px-lg py-base align-top">
                      <div className="grid gap-xs">
                        <Badge tone={STATUS_TONE[row.status]}>{STATUS_LABEL[row.status]}</Badge>
                        {canSeeFinancials && health.state !== 'no-budget' && (
                          <Badge tone={HEALTH_TONE[health.state]}>{HEALTH_LABEL[health.state]}</Badge>
                        )}
                      </div>
                    </td>
                    {/* Row opens View; the menu must not trigger it too. */}
                    <td className="px-lg py-base align-top" onClick={(e) => e.stopPropagation()}>
                      <ActionsMenu
                        ariaLabel={`Actions for project ${row.number}-${row.subNumber}`}
                        items={[
                          { label: 'View', icon: <Eye size={16} />, onSelect: () => onView?.(row) },
                          { label: 'Work Packages', icon: <Package size={16} />, onSelect: () => onOpenWorkPackages?.(row) },
                          { label: 'Edit', icon: <Pencil size={16} />, onSelect: () => onEdit?.(row) },
                          { label: 'Duplicate', icon: <Copy size={16} />, onSelect: () => onDuplicate?.(row) },
                          { label: 'Delete', icon: <Trash2 size={16} />, onSelect: () => onDelete?.(row), tone: 'danger' },
                        ]}
                      />
                    </td>
                  </tr>
                )
              })}
        </tbody>
      </table>
      </div>
      {pagination}
    </div>
  )
}
