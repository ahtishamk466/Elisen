import { Drawer } from '@/components/patterns/Drawer'
import { DetailCard, DetailField } from '@/components/patterns/DetailView'
import { Button } from '@/components/ui/Button'
import type { Moc } from '@/types/gcp'

export interface MocDetailDrawerProps {
  moc: Moc
  onClose: () => void
  onEdit: () => void
}

/** Read-only view of one MOC code — every stored field, editing behind the
    Edit action, the same split as every other View in the app. */
export function MocDetailDrawer({ moc: m, onClose, onEdit }: MocDetailDrawerProps) {
  return (
    <Drawer
      open
      onClose={onClose}
      title={m.code}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Close</Button>
          <Button onClick={onEdit}>Edit</Button>
        </>
      }
    >
      <DetailCard title="Means of Compliance">
        <div className="grid grid-cols-2 gap-lg">
          <DetailField label="Code" nowrap>{m.code}</DetailField>
          <DetailField label="Title">{m.title}</DetailField>
        </div>
        <div className="mt-lg">
          <DetailField label="Description">{m.description}</DetailField>
        </div>
      </DetailCard>
    </Drawer>
  )
}
