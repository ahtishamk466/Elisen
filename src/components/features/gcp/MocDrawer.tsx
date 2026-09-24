import { useState } from 'react'
import { Drawer } from '@/components/patterns/Drawer'
import { FormSection } from '@/components/patterns/FormSection'
import { FormField } from '@/components/patterns/FormField'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { useGcpStore } from '@/stores/gcpStore'
import type { Moc } from '@/types/gcp'

export interface MocDrawerProps {
  mode: 'create' | 'edit'
  initial?: Moc
  onClose: () => void
  onSubmit: (m: Moc) => void
}

/** One Means of Compliance code: Code, Title, Description. Fields mirror
    the legacy `moc` table and its create screen — no Active flag, the
    legacy list doesn't carry one. */
export function MocDrawer({ mode, initial, onClose, onSubmit }: MocDrawerProps) {
  const isEdit = mode === 'edit'
  const mocs = useGcpStore((s) => s.mocs)

  const [code, setCode] = useState(initial?.code ?? '')
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [errors, setErrors] = useState<{ code?: string; title?: string; description?: string }>({})

  const submit = () => {
    const e: typeof errors = {}
    if (!code.trim()) e.code = 'Code is required.'
    if (!title.trim()) e.title = 'Title is required.'
    if (!description.trim()) e.description = 'Description is required.'
    if (!e.code) {
      const clash = mocs.find((m) => m.id !== (isEdit ? initial?.id : undefined) && m.code === code.trim())
      if (clash) e.code = `“${clash.code}” already exists — one record per code.`
    }
    setErrors(e)
    if (Object.keys(e).length > 0) return
    onSubmit({
      id: isEdit ? initial!.id : crypto.randomUUID(),
      code: code.trim(),
      title: title.trim(),
      description: description.trim(),
    })
    onClose()
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title={isEdit ? `Edit MOC “${initial!.code}”` : 'Add MOC'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={submit}>{isEdit ? 'Save Changes' : 'Create'}</Button>
        </>
      }
    >
      <FormSection title="Means of Compliance" subtitle="How compliance with a rule is shown.">
        <FormField label="Code" htmlFor="moc-code" required error={errors.code}>
          <Input id="moc-code" value={code} error={!!errors.code} placeholder="e.g. DR"
            onChange={(e) => { setCode(e.target.value); setErrors((p) => ({ ...p, code: undefined })) }} />
        </FormField>
        <FormField label="Title" htmlFor="moc-title" required error={errors.title}>
          <Input id="moc-title" value={title} error={!!errors.title} placeholder="e.g. DESIGN REVIEW"
            onChange={(e) => { setTitle(e.target.value); setErrors((p) => ({ ...p, title: undefined })) }} />
        </FormField>
        <FormField label="Description" htmlFor="moc-description" required error={errors.description} fullWidth>
          <Textarea id="moc-description" rows={3} value={description} error={!!errors.description}
            placeholder="e.g. Design Review based on drawings, schematics, specifications or descriptions"
            onChange={(e) => { setDescription(e.target.value); setErrors((p) => ({ ...p, description: undefined })) }} />
        </FormField>
      </FormSection>
    </Drawer>
  )
}
