import { Pencil, Plus, Trash2 } from 'lucide-react'
import { ActionsMenu } from '@/components/patterns/ActionsMenu'
import { IdentityCard } from '@/components/patterns/IdentityCard'
import { Stat } from '@/components/patterns/Stat'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/formatDate'
import type { Approval, ApprovalRevision } from '@/types/documents'

export interface ApprovalIdentityCardProps {
  approval: Approval
  /** Newest revision, or undefined before revision 1 is recorded. */
  latestRevision?: ApprovalRevision
  onEdit: () => void
  onAddRevision: () => void
  onDelete: () => void
}

/**
 * The certificate's identity card, beside every tab of Approval Detail: its
 * number, what it approves, primary/change and active status, then the
 * holder and where its revision history stands.
 */
export function ApprovalIdentityCard({ approval, latestRevision, onEdit, onAddRevision, onDelete }: ApprovalIdentityCardProps) {
  return (
    <IdentityCard
      label="Approval summary"
      title={approval.number}
      subtitle={approval.description}
      badges={<>
        <Badge tone={approval.primary ? 'info' : 'neutral'}>{approval.primary ? 'Primary approval' : 'Change approval'}</Badge>
        <Badge tone={approval.active ? 'success' : 'neutral'}>{approval.active ? 'Active' : 'Inactive'}</Badge>
      </>}
      actions={
        <ActionsMenu
          ariaLabel={`Actions for ${approval.number}`}
          items={[
            { label: 'Edit approval', icon: <Pencil size={16} />, onSelect: onEdit },
            { label: 'Add Revision', icon: <Plus size={16} />, onSelect: onAddRevision },
            { label: 'Delete approval', icon: <Trash2 size={16} />, onSelect: onDelete, tone: 'danger' },
          ]}
        />
      }
    >
      <dl className="grid gap-lg">
        <Stat dl label="Design Approval Holder">{approval.designApprovalHolder || undefined}</Stat>
        <Stat dl label="Latest revision" nowrap>
          {latestRevision ? `Rev ${latestRevision.revision} · ${formatDate(latestRevision.revisionDate)}` : undefined}
        </Stat>
        {approval.comment && <Stat dl label="Comment">{approval.comment}</Stat>}
      </dl>
    </IdentityCard>
  )
}
