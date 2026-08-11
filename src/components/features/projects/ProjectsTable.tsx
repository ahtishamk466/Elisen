import type { ReactNode } from 'react'
import { Eye, Pencil, Copy, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { ActionsMenu } from '@/components/patterns/ActionsMenu'
import { Truncate } from '@/components/patterns/Truncate'
import { PRIORITY_LABEL, STATUS_LABEL, STATUS_TONE, TYPE_LABEL } from '@/lib/projectDisplay'
import type { ProjectListRow } from '@/types/project'

const HEADERS = ['No. / Type', 'Project', 'Company Name', 'Contact Name', 'Person Res.', 'Hours (Act/Bud)', 'Priority', 'Status', 'Actions']

export interface ProjectsTableProps {
  rows: ProjectListRow[]
  loading?: boolean
  /** Hours are budget data — hidden below manager per docs/SECURITY.md rule 8. */
  canSeeFinancials?: boolean
  onView?: (row: ProjectListRow) => void
  onEdit?: (row: ProjectListRow) => void
  onDuplicate?: (row: ProjectListRow) => void
  onDelete?: (row: ProjectListRow) => void
  /** Rendered as the table's own footer bar — inside the same card, not a
      second box below it. Typically a <Pagination>. */
  pagination?: ReactNode
}

export function ProjectsTable({ rows, loading = false, canSeeFinancials = true, onView, onEdit, onDuplicate, onDelete, pagination }: ProjectsTableProps) {
  const headers = canSeeFinancials ? HEADERS : HEADERS.filter((h) => h !== 'Hours (Act/Bud)')

  return (
    <div className="overflow-hidden rounded-sm border border-border-default bg-neutral-25">
      <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left" style={{ minWidth: 900 }}>
        <caption className="sr-only">Projects</caption>
        <thead>
          <tr className="border-b border-border-default bg-neutral-50">
            {headers.map((h) => (
              <th key={h} scope="col" className="whitespace-nowrap px-lg py-base text-sm font-semibold text-text-secondary">
                {h}
              </th>
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
                <tr
                  key={row.id}
                  onClick={() => onView?.(row)}
                  className="cursor-pointer border-b border-border-default transition-colors duration-fast last:border-b-0 hover:bg-accent-subtle"
                >
                  <td className="px-lg py-base align-top">
                    <span className="block text-sm text-text-primary">{row.number}-{row.subNumber}</span>
                    <span className="block text-xs text-text-muted">{TYPE_LABEL[row.type]}</span>
                  </td>
                  <td className="px-lg py-base align-top" style={{ maxWidth: 260 }}>
                    <button
                      type="button"
                      onClick={() => onView?.(row)}
                      className="block w-full text-left text-sm text-text-primary underline-offset-2 hover:text-accent hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
                    >
                      <Truncate>{row.title}</Truncate>
                    </button>
                  </td>
                  <td className="px-lg py-base align-top" style={{ maxWidth: 180 }}>
                    <span className="block text-sm text-text-primary"><Truncate lines={1}>{row.companyName}</Truncate></span>
                    <span className="block text-xs text-text-muted">{row.companyNumber}</span>
                  </td>
                  <td className="px-lg py-base align-top text-sm text-text-primary">{row.contactName}</td>
                  <td className="px-lg py-base align-top text-sm text-text-primary">{row.personResponsible}</td>
                  {canSeeFinancials && (
                    <td className="px-lg py-base align-top text-sm text-text-primary">
                      {row.actualHours} / {row.budgetHours}h
                      {row.actualHours > row.budgetHours && <span className="ml-xs text-xs text-danger">over</span>}
                    </td>
                  )}
                  <td className="px-lg py-base align-top text-sm text-text-primary">
                    {PRIORITY_LABEL[row.priority]}
                  </td>
                  <td className="px-lg py-base align-top">
                    <Badge tone={STATUS_TONE[row.status]}>{STATUS_LABEL[row.status]}</Badge>
                  </td>
                  {/* Row opens View; the menu must not trigger it too. */}
                  <td className="px-lg py-base align-top" onClick={(e) => e.stopPropagation()}>
                    <ActionsMenu
                      ariaLabel={`Actions for project ${row.number}-${row.subNumber}`}
                      items={[
                        { label: 'View', icon: <Eye size={16} />, onSelect: () => onView?.(row) },
                        { label: 'Edit', icon: <Pencil size={16} />, onSelect: () => onEdit?.(row) },
                        { label: 'Duplicate', icon: <Copy size={16} />, onSelect: () => onDuplicate?.(row) },
                        { label: 'Delete', icon: <Trash2 size={16} />, onSelect: () => onDelete?.(row), tone: 'danger' },
                      ]}
                    />
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
