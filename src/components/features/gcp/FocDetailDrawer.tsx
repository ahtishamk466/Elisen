import { Drawer } from '@/components/patterns/Drawer'
import { DetailCard, DetailField } from '@/components/patterns/DetailView'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import type { Foc } from '@/types/gcp'

export interface FocDetailDrawerProps {
  foc: Foc
  onClose: () => void
  onEdit: () => void
}

/** Read-only view of one FOC code — every stored field, editing behind the
    Edit action, the same split as every other View in the app. */
export function FocDetailDrawer({ foc: f, onClose, onEdit }: FocDetailDrawerProps) {
  return (
    <Drawer
      open
      onClose={onClose}
      title={f.code}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Close</Button>
          <Button onClick={onEdit}>Edit</Button>
        </>
      }
    >
      <DetailCard title="FOC">
        <div className="grid grid-cols-2 gap-lg">
          <DetailField label="Code">{f.code}</DetailField>
          <DetailField label="Default">
            <Badge tone={f.isDefault ? 'success' : 'neutral'}>{f.isDefault ? 'Yes' : 'No'}</Badge>
          </DetailField>
        </div>
        <div className="mt-lg">
          <DetailField label="Authority Specialist">{f.authoritySpecialist}</DetailField>
        </div>
        <div className="mt-lg">
          <DetailField label="Specialty">{f.specialty || '—'}</DetailField>
        </div>
      </DetailCard>
    </Drawer>
  )
}
