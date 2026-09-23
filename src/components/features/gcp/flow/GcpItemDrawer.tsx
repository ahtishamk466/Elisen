import { useState } from 'react'
import { Drawer } from '@/components/patterns/Drawer'
import { FormSection } from '@/components/patterns/FormSection'
import { FormField } from '@/components/patterns/FormField'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useGcpFlowStore } from '@/stores/gcpFlowStore'

export interface GcpItemDrawerProps {
  planEntryId: string
  /** The rule the item belongs to, named in the title so the group is never
      asked for twice. */
  ruleLabel: string
  onClose: () => void
}

/**
 * One discipline's plan for one rule.
 *
 * The client's lists of disciplines, means of compliance and delegated people
 * are not in the system yet, so each is a plain field here rather than a picker
 * over invented options. They become dropdowns — with delegation deciding who
 * may find compliance — as soon as those lists arrive.
 */
export function GcpItemDrawer({ planEntryId, ruleLabel, onClose }: GcpItemDrawerProps) {
  const addItem = useGcpFlowStore((s) => s.addItem)
  const [disciplineCode, setDisciplineCode] = useState('')
  const [moc, setMoc] = useState('')
  const [focCode, setFocCode] = useState('')
  const [documentId, setDocumentId] = useState('')

  return (
    <Drawer
      open
      onClose={onClose}
      title={`Compliance item for ${ruleLabel}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={() => {
            addItem({ id: crypto.randomUUID(), planEntryId, disciplineCode, moc, focCode, documentId })
            onClose()
          }}>
            Add item
          </Button>
        </>
      }
    >
      <FormSection title="Item" subtitle="Who shows compliance with this rule, how, and where it is written.">
        <FormField label="Discipline" htmlFor="item-discipline">
          <Input id="item-discipline" value={disciplineCode} placeholder="e.g. A1"
            onChange={(e) => setDisciplineCode(e.target.value)} />
        </FormField>
        <FormField label="Means of Compliance" htmlFor="item-moc">
          <Input id="item-moc" value={moc} placeholder="e.g. DR"
            onChange={(e) => setMoc(e.target.value)} />
        </FormField>
        <FormField label="Finding of Compliance by" htmlFor="item-foc"
          help="Delegation decides who may find compliance on this rule.">
          <Input id="item-foc" value={focCode} placeholder="e.g. APO1"
            onChange={(e) => setFocCode(e.target.value)} />
        </FormField>
        <FormField label="Document" htmlFor="item-document"
          help="The report this rule's evidence goes into.">
          <Input id="item-document" value={documentId} placeholder="e.g. DCR-1234"
            onChange={(e) => setDocumentId(e.target.value)} />
        </FormField>
      </FormSection>
    </Drawer>
  )
}
