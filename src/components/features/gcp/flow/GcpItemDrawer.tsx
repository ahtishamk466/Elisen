import { useState } from 'react'
import { Drawer } from '@/components/patterns/Drawer'
import { FormSection } from '@/components/patterns/FormSection'
import { FormField } from '@/components/patterns/FormField'
import { ActiveSelect } from '@/components/patterns/ActiveSelect'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useGcpFlowStore } from '@/stores/gcpFlowStore'
import type { GcpItem } from '@/types/gcp'

export interface GcpItemDrawerProps {
  mode: 'create' | 'edit'
  planEntryId: string
  initial?: GcpItem
  /** The rule the item belongs to, named in the title so the group is never
      asked for twice. */
  ruleLabel: string
  onClose: () => void
}

/**
 * One GCP Data row: who shows compliance with a rule, how, and where.
 *
 * The client's Discipline, MOC and FOC reference lists (and Delegation, which
 * would filter FOC Code to only those authorized on this rule's Section Root)
 * are not in the system yet, so each is a plain field here rather than a
 * picker over invented options. They become dropdowns as soon as those lists
 * arrive.
 */
export function GcpItemDrawer({ mode, planEntryId, initial, ruleLabel, onClose }: GcpItemDrawerProps) {
  const isEdit = mode === 'edit'
  const addItem = useGcpFlowStore((s) => s.addItem)
  const updateItem = useGcpFlowStore((s) => s.updateItem)
  const [daoSpecialtyCode, setDaoSpecialtyCode] = useState(initial?.daoSpecialtyCode ?? '')
  const [mocCode, setMocCode] = useState(initial?.mocCode ?? '')
  const [focCode, setFocCode] = useState(initial?.focCode ?? '')
  const [deliverableId, setDeliverableId] = useState(initial?.deliverableId ?? '')
  const [active, setActive] = useState(initial?.active ?? true)

  const submit = () => {
    if (isEdit && initial) {
      updateItem(initial.id, { daoSpecialtyCode, mocCode, focCode, deliverableId, active })
    } else {
      addItem({ id: crypto.randomUUID(), planEntryId, daoSpecialtyCode, mocCode, focCode, deliverableId, active })
    }
    onClose()
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title={isEdit ? `Edit GCP data for ${ruleLabel}` : `GCP data for ${ruleLabel}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={submit}>{isEdit ? 'Save Changes' : 'Add'}</Button>
        </>
      }
    >
      <FormSection title="GCP Data" subtitle="Who shows compliance with this rule, how, and where it is written.">
        <FormField label="DAO Specialty Code" htmlFor="item-dao">
          <Input id="item-dao" value={daoSpecialtyCode} placeholder="e.g. A1"
            onChange={(e) => setDaoSpecialtyCode(e.target.value)} />
        </FormField>
        <FormField label="MOC Code" htmlFor="item-moc">
          <Input id="item-moc" value={mocCode} placeholder="e.g. DR"
            onChange={(e) => setMocCode(e.target.value)} />
        </FormField>
        <FormField label="FOC Code" htmlFor="item-foc"
          help="Delegation decides who may find compliance on this rule.">
          <Input id="item-foc" value={focCode} placeholder="e.g. AP-01"
            onChange={(e) => setFocCode(e.target.value)} />
        </FormField>
        <FormField label="Deliverable #" htmlFor="item-deliverable"
          help="The report this rule's evidence goes into.">
          <Input id="item-deliverable" value={deliverableId} placeholder="e.g. A4ALL-2-08-1-1623-CR"
            onChange={(e) => setDeliverableId(e.target.value)} />
        </FormField>
        <FormField label="Active" htmlFor="item-active">
          <ActiveSelect id="item-active" value={active} onChange={setActive} />
        </FormField>
      </FormSection>
    </Drawer>
  )
}
