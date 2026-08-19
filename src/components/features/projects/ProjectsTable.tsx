import type { ReactNode } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, Eye, Pencil, Copy, Trash2, Package } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Checkbox } from '@/components/ui/Checkbox'
import { Skeleton } from '@/components/ui/Skeleton'
import { ActionsMenu } from '@/components/patterns/ActionsMenu'
import { ProgressMeter } from '@/components/patterns/ProgressMeter'
import { PersonCell } from '@/components/patterns/PersonCell'
import { Truncate } from '@/components/patterns/Truncate'
import { SortMenu } from '@/components/patterns/SortMenu'
import { PRIORITY_LABEL, STATUS_LABEL, STATUS_TONE } from '@/lib/projectDisplay'
import { formatHours, formatPct, type Health } from '@/lib/projectHealth'
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
  /** Two or more fields stacked in this cell; the heading offers all of them. */
  sorts?: { key: SortKey; label: string }[]
  /** Financial columns come out entirely below manager. */
  financial?: boolean
  /** Share of the table's width. Fixed layout, so columns scale with the page
      instead of being pinned by a hard cap that wastes a wide screen. */
  width: string
}

/**
 * Seven columns, and **no horizontal scroll**: the table used to declare a
 * 1501px minimum against roughly 960px of page on a 1280 laptop, so half the
 * record was always off-screen.
 *
 * Related fields are stacked two-to-a-cell instead — line 1 is what you scan
 * for, line 2 is what you confirm once you've found the row. Only fields
 * answering the *same* question are paired, so nothing has to be decoded:
 * a project's identity, its customer, its budget-so-far, its budget-left.
 */
const COLUMNS: Column[] = [
  { label: 'Project', sort: 'number', width: '16%' },
  { label: 'Company', sort: 'company', width: '11%' },
  { label: 'Person Res.', width: '12%' },
  {
    label: 'Actual / Budget',
    financial: true,
    width: '15%',
    sorts: [{ key: 'actual', label: 'Actual' }, { key: 'budget', label: 'Budget' }],
  },
  /* Remaining stands alone beside Actual / Budget so the three budget figures
     read as one group of numbers, with the meter after them as the picture. */
  { label: 'Remaining', sort: 'remaining', financial: true, width: '10%' },
  { label: 'Used', sort: 'progress', financial: true, width: '7%' },
  { label: 'Priority', sort: 'priority', width: '8%' },
  { label: 'Status', width: '10%' },
  { label: 'Actions', width: '7%' },
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
          ${active ? 'text-text-primary' : ''}`}
      >
        {c.label}
        <Icon size={14} aria-hidden className={active ? 'text-accent' : 'text-text-muted'} />
      </button>
    )
  }

  return (
    <div className="overflow-hidden rounded-sm border border-border-default bg-neutral-25">
      <div className="overflow-x-auto">
      <table className="w-full table-fixed border-collapse text-left">
        <caption className="sr-only">Projects, with budget health per project</caption>
        <thead>
          <tr className="border-b border-border-default bg-neutral-50">
            {selectable && (
              <th scope="col" className="px-sm py-base" style={{ width: '4%' }}>
                <Checkbox checked={allSelected} onChange={toggleAll} aria-label="Select all projects on this page" />
              </th>
            )}
            {columns.map((c) => (
              <th
                key={c.label}
                scope="col"
                style={{ width: c.width }}
                aria-sort={sort && (c.sort === sort.key || c.sorts?.some((o) => o.key === sort.key))
                  ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}
                className="px-sm py-base align-bottom text-sm font-semibold text-text-secondary"
              >
                {c.sorts && onSortChange
                  ? <SortMenu label={c.label} options={c.sorts} sort={sort} onChange={onSortChange} />
                  : c.sort && onSortChange ? headerButton(c, c.sort) : c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: 6 }, (_, i) => (
                <tr key={i} className="border-b border-border-default last:border-b-0">
                  {Array.from({ length: columns.length + (selectable ? 1 : 0) }, (_, j) => (
                    <td key={j} className="px-sm py-base"><Skeleton className="h-4 w-full" /></td>
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
                      <td className="px-sm py-base align-middle" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selected}
                          onChange={() => toggleOne(row.id)}
                          aria-label={`Select project ${row.number}-${row.subNumber}`}
                        />
                      </td>
                    )}
                    {/* Number leads — it is how a project is asked for — with
                        the title under it as the line that confirms the row. */}
                    <td className="px-sm py-base align-middle">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onView?.(row) }}
                        className="block w-full text-left underline-offset-2 hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
                      >
                        <span className="block whitespace-nowrap text-sm font-semibold tabular-nums text-text-primary">
                          {row.number}-{row.subNumber}
                        </span>
                        <span className="block text-xs text-text-secondary"><Truncate lines={1}>{row.title}</Truncate></span>
                      </button>
                    </td>
                    {/* Both client-side: who we work for, and who we call. */}
                    <td className="px-sm py-base align-middle">
                      <span className="block truncate text-sm text-text-primary">{row.companyName}</span>
                      {/* Initials mark line 2 as a person, so a company and its
                          contact are never mistaken for one another. */}
                      <PersonCell name={row.contactName} variant="secondary" />
                    </td>
                    <td className="px-sm py-base align-middle">
                      <PersonCell name={row.personResponsible} />
                    </td>
                    {canSeeFinancials && (
                      <>
                        {/* The app's `x / y` short form, spent against budgeted:
                            the two numbers a reader compares, side by side where
                            comparing them is one glance rather than two. */}
                        <td className="whitespace-nowrap px-sm py-base align-middle text-sm text-text-primary">
                          {health.budget > 0
                            ? `${formatHours(health.actual)} / ${formatHours(health.budget)}`
                            : `${formatHours(health.actual)} / no budget`}
                        </td>
                        {/* Remaining over the meter: the figure and the picture
                            of the same fact. Over-budget shows as a negative in
                            danger — the sign carries it, not the colour alone. */}
                        <td className={`whitespace-nowrap px-sm py-base align-middle text-sm ${over ? 'font-semibold text-danger' : 'text-text-primary'}`}>
                          {health.budget > 0 ? `${over ? '−' : ''}${formatHours(Math.abs(health.remaining))}` : '—'}
                        </td>
                        <td className="whitespace-nowrap px-sm py-base align-middle">
                          <span className="block text-sm text-text-primary">{formatPct(health.progressPct)}</span>
                          {/* The meter under its own figure: a glanceable pip,
                              where the number carries the precision. */}
                          <span className="mt-xxss block" style={{ width: 44 }}>
                            <ProgressMeter health={health} size="sm" ariaLabel={`Project ${row.number}-${row.subNumber} budget`} />
                          </span>
                        </td>
                      </>
                    )}
                    {/* Rank on top, name under it: "5 - Lowest" on one line was
                        the widest thing in a column nobody reads as a sentence. */}
                    <td className="whitespace-nowrap px-sm py-base align-middle">
                      <span className="block text-sm font-semibold text-text-primary">{PRIORITY_LABEL[row.priority].split(' - ')[0]}</span>
                      <span className="block text-xs text-text-muted">{PRIORITY_LABEL[row.priority].split(' - ')[1]}</span>
                    </td>
                    {/* Budget health is not repeated here — the meter beside it
                        already carries it, with the percentage and a signed
                        Remaining as its non-colour cues. */}
                    <td className="whitespace-nowrap px-sm py-base align-middle">
                      <Badge tone={STATUS_TONE[row.status]}>{STATUS_LABEL[row.status]}</Badge>
                    </td>
                    {/* Row opens View; the menu must not trigger it too. */}
                    <td className="px-sm py-base align-middle" onClick={(e) => e.stopPropagation()}>
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
