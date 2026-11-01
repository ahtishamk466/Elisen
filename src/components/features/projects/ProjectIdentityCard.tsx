import { CalendarDays, Copy, DollarSign, Pencil, Trash2, Users } from 'lucide-react'
import { ActionsMenu } from '@/components/patterns/ActionsMenu'
import { Avatar } from '@/components/patterns/Avatar'
import { IdentityCard } from '@/components/patterns/IdentityCard'
import { Badge } from '@/components/ui/Badge'
import { PRIORITY_LABEL, PRIORITY_TONE, STATUS_LABEL, STATUS_TONE, TYPE_LABEL } from '@/lib/projectDisplay'
import { formatDate } from '@/lib/formatDate'
import type { ProjectListRow } from '@/types/project'

export interface ProjectIdentityCardProps {
  row: ProjectListRow
  canSeeFinancials: boolean
  onEdit: () => void
  onDuplicate: () => void
  onDelete: () => void
}

/**
 * The project's identity card, beside every tab of Project Detail. Content as
 * the client fixed it: number, title, company and type, priority and status,
 * then Due date, Contract value and People. Hours deliberately not repeated
 * here: the health tiles at the top of the page are the single place budget
 * is read.
 */
export function ProjectIdentityCard({ row, canSeeFinancials, onEdit, onDuplicate, onDelete }: ProjectIdentityCardProps) {
  const code = `${row.number}-${row.subNumber}`
  return (
    <IdentityCard
      label="Project summary"
      title={code}
      titleBadge={row.isCopy && <Badge tone="info">Copy</Badge>}
      subtitle={row.title}
      meta={`${row.companyName} · ${TYPE_LABEL[row.type]}`}
      badges={<>
        <Badge tone={PRIORITY_TONE[row.priority]} appearance="outline">{PRIORITY_LABEL[row.priority]}</Badge>
        <Badge tone={STATUS_TONE[row.status]} appearance="outline">{STATUS_LABEL[row.status]}</Badge>
      </>}
      actions={
        <ActionsMenu
          ariaLabel={`Actions for project ${code}`}
          items={[
            { label: 'Edit', icon: <Pencil size={16} />, onSelect: onEdit },
            { label: 'Duplicate', icon: <Copy size={16} />, onSelect: onDuplicate },
            { label: 'Delete', icon: <Trash2 size={16} />, onSelect: onDelete, tone: 'danger' },
          ]}
        />
      }
    >
      <p className="flex items-center gap-xs text-xs text-text-muted">
        <CalendarDays size={14} aria-hidden /> Due date
      </p>
      <p className="mt-xs text-base font-bold text-text-primary">{formatDate(row.dueDate)}</p>

      {canSeeFinancials && (
        <div className="mt-lg border-t border-border-default pt-lg">
          <p className="flex items-center gap-xs text-xs text-text-muted">
            <DollarSign size={14} aria-hidden /> Contract value
          </p>
          <p className="mt-xs text-base font-bold text-text-primary">
            {row.contractValue
              ? `${row.contractCurrency} ${Number(row.contractValue).toLocaleString()}`
              : '—'}
          </p>
        </div>
      )}

      <div className="mt-lg border-t border-border-default pt-lg">
        <p className="flex items-center gap-xs text-xs text-text-muted">
          <Users size={14} aria-hidden /> People
        </p>
        <div className="mt-base grid gap-base">
          {row.contactName !== '—' && (
            <div className="flex items-center gap-sm">
              <Avatar name={row.contactName} />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-text-primary">{row.contactName}</p>
                {row.contactEmail ? (
                  <a
                    href={`mailto:${row.contactEmail}`}
                    className="block truncate text-xs text-text-muted hover:text-accent hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
                  >
                    Contact
                  </a>
                ) : (
                  <p className="text-xs text-text-muted">Contact</p>
                )}
              </div>
            </div>
          )}
          <div className="flex items-center gap-sm">
            <Avatar name={row.personResponsible} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text-primary">{row.personResponsible}</p>
              <p className="text-xs text-text-muted">Person responsible</p>
            </div>
          </div>
        </div>
      </div>
    </IdentityCard>
  )
}
