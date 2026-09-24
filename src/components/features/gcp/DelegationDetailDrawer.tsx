import { Drawer } from '@/components/patterns/Drawer'
import { DetailCard, DetailField } from '@/components/patterns/DetailView'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import type { Delegation } from '@/types/gcp'

export interface DelegationDetailDrawerProps {
  delegation: Delegation
  onClose: () => void
  onEdit: () => void
}

/** Read-only view of one delegation — every stored field, editing behind
    the Edit action, the same split as every other View in the app. */
export function DelegationDetailDrawer({ delegation: d, onClose, onEdit }: DelegationDetailDrawerProps) {
  return (
    <Drawer
      open
      onClose={onClose}
      title={`${d.sectionRoot} · ${d.focCode}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Close</Button>
          <Button onClick={onEdit}>Edit</Button>
        </>
      }
    >
      <DetailCard title="Delegation">
        <div className="grid grid-cols-2 gap-lg">
          <DetailField label="Section Root">{d.sectionRoot}</DetailField>
          <DetailField label="FOC Code">{d.focCode}</DetailField>
        </div>
        <div className="mt-lg grid grid-cols-2 gap-lg">
          <DetailField label="Limitation">
            <Badge tone={d.limitation ? 'success' : 'danger'}>{d.limitation ? 'Yes' : 'No'}</Badge>
          </DetailField>
          <DetailField label="Active">
            <Badge tone={d.active ? 'success' : 'neutral'}>{d.active ? 'Active' : 'Inactive'}</Badge>
          </DetailField>
        </div>
      </DetailCard>
    </Drawer>
  )
}
