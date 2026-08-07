import { MoreVertical } from 'lucide-react'
import { Badge, type BadgeTone } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import type { ProjectListRow, ProjectPriority, ProjectStatus, ProjectType } from '@/types/project'

const PRIORITY_TONE: Record<ProjectPriority, BadgeTone> = {
  '1-fire': 'danger', '2-high': 'warning', '3-med': 'info', '4-low': 'neutral',
}
const PRIORITY_LABEL: Record<ProjectPriority, string> = {
  '1-fire': '1 - Fire', '2-high': '2 - High', '3-med': '3 - Med', '4-low': '4 - Low',
}
const STATUS_TONE: Record<ProjectStatus, BadgeTone> = {
  quoted: 'info', active: 'success', 'on-hold': 'warning', complete: 'neutral', cancelled: 'danger',
}
const STATUS_LABEL: Record<ProjectStatus, string> = {
  quoted: 'Quoted', active: 'Active', 'on-hold': 'On hold', complete: 'Complete', cancelled: 'Cancelled',
}
const TYPE_LABEL: Record<ProjectType, string> = {
  internal: 'Internal', 'preferred-duncan': 'Duncan', 'preferred-topaces': 'Top Aces', external: 'External',
}

const HEADERS = ['No. / Type', 'Project', 'Company Name', 'Contact Name', 'Person Res.', 'Hours (Act/Bud)', 'Priority', 'Status', 'Actions']

export interface ProjectsTableProps {
  rows: ProjectListRow[]
  loading?: boolean
  /** Hours are budget data — hidden below manager per docs/SECURITY.md rule 8. */
  canSeeFinancials?: boolean
  onOpen?: (row: ProjectListRow) => void
}

export function ProjectsTable({ rows, loading = false, canSeeFinancials = true, onOpen }: ProjectsTableProps) {
  const headers = canSeeFinancials ? HEADERS : HEADERS.filter((h) => h !== 'Hours (Act/Bud)')

  return (
    <div className="overflow-x-auto rounded-sm border border-border-default bg-neutral-25">
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
                <tr key={row.id} className="border-b border-border-default transition-colors duration-fast last:border-b-0 hover:bg-neutral-50">
                  <td className="px-lg py-base align-top">
                    <span className="block text-sm text-text-primary">{row.number}-{row.subNumber}</span>
                    <span className="block text-xs text-text-muted">{TYPE_LABEL[row.type]}</span>
                  </td>
                  <td className="px-lg py-base align-top">
                    <button
                      type="button"
                      onClick={() => onOpen?.(row)}
                      className="text-left text-sm text-text-primary underline-offset-2 hover:text-accent hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
                    >
                      {row.title}
                    </button>
                  </td>
                  <td className="px-lg py-base align-top">
                    <span className="block text-sm text-text-primary">{row.companyName}</span>
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
                  <td className="px-lg py-base align-top">
                    <Badge tone={PRIORITY_TONE[row.priority]}>{PRIORITY_LABEL[row.priority]}</Badge>
                  </td>
                  <td className="px-lg py-base align-top">
                    <Badge tone={STATUS_TONE[row.status]} appearance="outline" dot>{STATUS_LABEL[row.status]}</Badge>
                  </td>
                  <td className="px-lg py-base align-top">
                    <button
                      type="button"
                      aria-label={`Actions for project ${row.number}-${row.subNumber}`}
                      className="rounded-sm p-xs text-text-secondary transition-colors duration-fast hover:bg-neutral-100 hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
                    >
                      <MoreVertical size={18} aria-hidden />
                    </button>
                  </td>
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  )
}
