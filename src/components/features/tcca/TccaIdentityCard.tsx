import { Pencil, Trash2 } from 'lucide-react'
import { ActionsMenu } from '@/components/patterns/ActionsMenu'
import { IdentityCard } from '@/components/patterns/IdentityCard'
import { Stat } from '@/components/patterns/Stat'
import { Badge } from '@/components/ui/Badge'
import { TCCA_STATUS_LABEL, TCCA_STATUS_TONE } from '@/lib/tccaDisplay'
import { formatDate } from '@/lib/formatDate'
import type { TccaProject } from '@/types/tcca'

export interface TccaIdentityCardProps {
  tcca: TccaProject
  onEdit: () => void
  onDelete: () => void
}

/** The TCCA project's identity card, beside every tab of TCCA Project Detail. */
export function TccaIdentityCard({ tcca, onEdit, onDelete }: TccaIdentityCardProps) {
  return (
    <IdentityCard
      label="TCCA project summary"
      title={tcca.number}
      subtitle={tcca.description}
      badges={<Badge tone={TCCA_STATUS_TONE[tcca.status]}>{TCCA_STATUS_LABEL[tcca.status]}</Badge>}
      actions={
        <ActionsMenu
          ariaLabel={`Actions for TCCA project ${tcca.number}`}
          items={[
            { label: 'Edit', icon: <Pencil size={16} />, onSelect: onEdit },
            { label: 'Delete', icon: <Trash2 size={16} />, onSelect: onDelete, tone: 'danger' },
          ]}
        />
      }
    >
      <dl className="grid gap-lg">
        <Stat dl label="Opened" nowrap>{formatDate(tcca.openedDate)}</Stat>
        <Stat dl label="Closed" nowrap>{formatDate(tcca.closedDate)}</Stat>
        <Stat dl label="Linked projects" nowrap>{tcca.projectIds.length}</Stat>
      </dl>
    </IdentityCard>
  )
}
