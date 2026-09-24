import { Drawer } from '@/components/patterns/Drawer'
import { DetailCard, DetailField } from '@/components/patterns/DetailView'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import type { Discipline } from '@/types/gcp'

export interface DisciplineDetailDrawerProps {
  discipline: Discipline
  onClose: () => void
  onEdit: () => void
}

/** Read-only view of one discipline — every stored field, editing behind
    the Edit action, the same split as every other View in the app. */
export function DisciplineDetailDrawer({ discipline: d, onClose, onEdit }: DisciplineDetailDrawerProps) {
  return (
    <Drawer
      open
      onClose={onClose}
      title={d.daoSpecialtyCode}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Close</Button>
          <Button onClick={onEdit}>Edit</Button>
        </>
      }
    >
      <DetailCard title="Discipline">
        <div className="grid grid-cols-2 gap-lg">
          <DetailField label="Dao Specialty Code">{d.daoSpecialtyCode}</DetailField>
          <DetailField label="Active">
            <Badge tone={d.active ? 'success' : 'neutral'}>{d.active ? 'Active' : 'Inactive'}</Badge>
          </DetailField>
        </div>
        <div className="mt-lg">
          <DetailField label="Elisen discipline">{d.elisenDiscipline}</DetailField>
        </div>
        <div className="mt-lg">
          <DetailField label="TCCA discipline">{d.tccaDiscipline}</DetailField>
        </div>
      </DetailCard>
    </Drawer>
  )
}
