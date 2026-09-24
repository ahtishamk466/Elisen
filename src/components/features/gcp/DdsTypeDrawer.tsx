import { useState } from 'react'
import { Drawer } from '@/components/patterns/Drawer'
import { FormSection } from '@/components/patterns/FormSection'
import { FormField } from '@/components/patterns/FormField'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { RichTextEditor } from '@/components/ui/RichTextEditor'
import { useGcpStore } from '@/stores/gcpStore'
import type { DdsType } from '@/types/gcp'

export interface DdsTypeDrawerProps {
  mode: 'create' | 'edit'
  initial?: DdsType
  onClose: () => void
  onSubmit: (d: DdsType) => void
}

/** One DDS type: just Type and DDS Text — the same `RichTextEditor` (full
    toolbar) `FlowStepPlan`'s own DDS Text field uses, so a type's starting
    text is written the same way it's edited on a compliance item. */
export function DdsTypeDrawer({ mode, initial, onClose, onSubmit }: DdsTypeDrawerProps) {
  const isEdit = mode === 'edit'
  const ddsTypes = useGcpStore((s) => s.ddsTypes)

  const [type, setType] = useState(initial?.type ?? '')
  const [ddsText, setDdsText] = useState(initial?.ddsText ?? '')
  const [errors, setErrors] = useState<{ type?: string }>({})

  const submit = () => {
    const e: typeof errors = {}
    if (!type.trim()) e.type = 'Type is required.'
    if (!e.type) {
      const clash = ddsTypes.find((d) => d.id !== (isEdit ? initial?.id : undefined) && d.type === type.trim())
      if (clash) e.type = `“${clash.type}” already exists — one record per type.`
    }
    setErrors(e)
    if (Object.keys(e).length > 0) return
    onSubmit({
      id: isEdit ? initial!.id : crypto.randomUUID(),
      type: type.trim(),
      ddsText,
    })
    onClose()
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title={isEdit ? `Edit DDS Type “${initial!.type}”` : 'Add DDS Type'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={submit}>{isEdit ? 'Save Changes' : 'Create'}</Button>
        </>
      }
    >
      <FormSection title="DDS Type" subtitle="A detailed design specification kind, used on Part 23 projects.">
        <FormField label="Type" htmlFor="dds-type" required error={errors.type} fullWidth>
          <Input id="dds-type" value={type} error={!!errors.type} placeholder="e.g. Published ASTM"
            onChange={(e) => { setType(e.target.value); setErrors((p) => ({ ...p, type: undefined })) }} />
        </FormField>
        <FormField label="DDS Text" htmlFor="dds-text" fullWidth>
          <RichTextEditor
            id="dds-text"
            toolbar="full"
            ariaLabel="DDS Text"
            value={ddsText}
            onChange={setDdsText}
          />
        </FormField>
      </FormSection>
    </Drawer>
  )
}
