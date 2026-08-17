import type { ReactNode } from 'react'
import { Eye, Pencil, Package } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { ActionsMenu } from '@/components/patterns/ActionsMenu'
import { Truncate } from '@/components/patterns/Truncate'
import { PRIORITY_LABEL, STATUS_LABEL, STATUS_TONE, TYPE_LABEL } from '@/lib/projectDisplay'
import { agingDays } from '@/lib/reviewPresets'
import type { ProjectListRow } from '@/types/project'

/**
 * One superset column set covering every legacy Review tab, so nothing is
 * hidden behind "which tab was it on again?". Columns that only apply to
 * part of the list (Aging pre-award, hours post-award) show an em dash
 * rather than disappearing — a column set that changes shape under a
 * merged table reads as broken, not simplified.
 */
const HEADERS = [
  'Number', 'Company Name', 'Description', 'Priority', 'Status', 'Comments', 'Next Action',
  'Due Date', 'Aging', 'Bdg Hrs', 'Actl Hrs', 'Active', 'Actions',
]

const HOURS = new Intl.NumberFormat('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export interface ProjectReviewTableProps {
  rows: ProjectListRow[]
  loading?: boolean
  /** Budget/actual hours are financial data — hidden below manager. */
  canSeeFinancials?: boolean
  onView: (row: ProjectListRow) => void
  /** Straight to the project's Work Packages tab. */
  onOpenWorkPackages?: (row: ProjectListRow) => void
  onEdit: (row: ProjectListRow) => void
  /** Preset tabs, rendered as the card's own header above the columns. */
  tabs?: ReactNode
  /** Active tab's key — makes the table the labelled tabpanel for it. */
  activeTabKey?: string
  pagination?: ReactNode
}

export function ProjectReviewTable({
  rows, loading = false, canSeeFinancials = true, onView, onOpenWorkPackages, onEdit, tabs, activeTabKey, pagination,
}: ProjectReviewTableProps) {
  const headers = canSeeFinancials ? HEADERS : HEADERS.filter((h) => h !== 'Bdg Hrs' && h !== 'Actl Hrs')

  return (
    // Tabs, columns and pagination share one bordered card — the tabs are the
    // table's header, not a control floating above it.
    <div className="overflow-hidden rounded-sm border border-border-default bg-neutral-25">
      {tabs}
      {/* The scroll container is the tabpanel, and is itself a tab stop so it
          can be scrolled from the keyboard. */}
      <div
        className="overflow-x-auto"
        {...(activeTabKey
          ? { role: 'tabpanel', 'aria-labelledby': `tab-${activeTabKey}`, tabIndex: 0 }
          : {})}
      >
        <table className="w-full border-collapse text-left" style={{ minWidth: 1800 }}>
          <caption className="sr-only">Projects review</caption>
          <thead>
            <tr className="border-b border-border-default bg-neutral-50">
              {headers.map((h) => (
                <th key={h} scope="col" className="whitespace-nowrap px-lg py-base text-sm font-semibold text-text-secondary">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 8 }, (_, i) => (
                  <tr key={i} className="border-b border-border-default last:border-b-0">
                    {headers.map((h) => <td key={h} className="px-lg py-base"><Skeleton className="h-4 w-full" /></td>)}
                  </tr>
                ))
              : rows.map((row) => {
                  // Aging is only meaningful before award — exactly the two
                  // RFQ statuses the legacy Aging column appeared on.
                  const aging = row.status === 'query' || row.status === 'quoted' ? agingDays(row.openedDate) : null
                  return (
                    <tr
                      key={row.id}
                      onClick={() => onView(row)}
                      className="cursor-pointer border-b border-border-default transition-colors duration-fast last:border-b-0 hover:bg-accent-subtle"
                    >
                      <td className="whitespace-nowrap px-lg py-base align-top">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); onView(row) }}
                          className="text-left text-sm font-semibold text-text-primary underline-offset-2 hover:text-accent hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
                        >
                          {row.number}-{row.subNumber}
                        </button>
                        <span className="block text-xs text-text-muted">{TYPE_LABEL[row.type]}</span>
                      </td>
                      <td className="px-lg py-base align-top text-sm text-text-primary" style={{ maxWidth: 180 }}>
                        <Truncate lines={1}>{row.companyName || '—'}</Truncate>
                      </td>
                      <td className="px-lg py-base align-top text-sm text-text-primary" style={{ maxWidth: 260 }}>
                        <Truncate>{row.title}</Truncate>
                      </td>
                      <td className="whitespace-nowrap px-lg py-base align-top text-sm text-text-primary">{PRIORITY_LABEL[row.priority]}</td>
                      <td className="whitespace-nowrap px-lg py-base align-top">
                        <Badge tone={STATUS_TONE[row.status]}>{STATUS_LABEL[row.status]}</Badge>
                      </td>
                      <td className="px-lg py-base align-top text-sm text-text-primary" style={{ maxWidth: 280 }}>
                        <Truncate>{row.comments || '—'}</Truncate>
                      </td>
                      <td className="px-lg py-base align-top text-sm text-text-primary" style={{ maxWidth: 280 }}>
                        <Truncate>{row.nextAction || '—'}</Truncate>
                      </td>
                      <td className="whitespace-nowrap px-lg py-base align-top text-sm text-text-primary">{row.dueDate || '—'}</td>
                      <td className="whitespace-nowrap px-lg py-base align-top text-sm text-text-primary">{aging ?? '—'}</td>
                      {canSeeFinancials && (
                        <>
                          <td className="whitespace-nowrap px-lg py-base align-top text-sm text-text-primary">{HOURS.format(row.budgetHours)}</td>
                          <td className="whitespace-nowrap px-lg py-base align-top text-sm text-text-primary">
                            {HOURS.format(row.actualHours)}
                            {row.budgetHours > 0 && row.actualHours > row.budgetHours && (
                              <span className="ml-xs text-xs text-danger">over</span>
                            )}
                          </td>
                        </>
                      )}
                      <td className="whitespace-nowrap px-lg py-base align-top">
                        <Badge tone={row.active ? 'success' : 'neutral'}>{row.active ? 'Active' : 'Inactive'}</Badge>
                      </td>
                      <td className="px-lg py-base align-top" onClick={(e) => e.stopPropagation()}>
                        <ActionsMenu
                          ariaLabel={`Actions for project ${row.number}-${row.subNumber}`}
                          items={[
                            { label: 'View', icon: <Eye size={16} />, onSelect: () => onView(row) },
                            { label: 'Work Packages', icon: <Package size={16} />, onSelect: () => onOpenWorkPackages?.(row) },
                            { label: 'Edit', icon: <Pencil size={16} />, onSelect: () => onEdit(row) },
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
