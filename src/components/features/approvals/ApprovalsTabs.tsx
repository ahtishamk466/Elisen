import { useNavigate } from 'react-router-dom'
import { TableTabs } from '@/components/patterns/TableTabs'
import { useApprovalsStore } from '@/stores/approvalsStore'

/**
 * The two listings inside the Approvals workspace, as tabs over one page —
 * the same shape as Aircraft / Serial Numbers.
 *
 * A revision is still a record in its own right with its own listing and its
 * own create screen; it just no longer needs a second sidebar row to reach it,
 * and the two are read together often enough that switching should not be a
 * navigation.
 */
export function ApprovalsTabs({ active }: { active: 'approvals' | 'revisions' }) {
  const navigate = useNavigate()
  const approvals = useApprovalsStore((s) => s.approvals)
  const revisions = useApprovalsStore((s) => s.revisions)

  return (
    <TableTabs
      ariaLabel="Approvals views"
      activeKey={active}
      onChange={(k) => navigate(k === 'revisions' ? '/approvals?tab=revisions' : '/approvals')}
      tabs={[
        { key: 'approvals', label: 'Approvals', count: approvals.length },
        { key: 'revisions', label: 'Revisions', count: revisions.length },
      ]}
    />
  )
}
