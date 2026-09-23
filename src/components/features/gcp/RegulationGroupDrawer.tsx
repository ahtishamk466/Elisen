import { useState } from 'react'
import { Drawer } from '@/components/patterns/Drawer'
import { FormSection } from '@/components/patterns/FormSection'
import { FormField } from '@/components/patterns/FormField'
import { ActiveSelect } from '@/components/patterns/ActiveSelect'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useGcpStore } from '@/stores/gcpStore'
import type { RegulationGroup } from '@/types/gcp'

export interface RegulationGroupDrawerProps {
  mode: 'create' | 'edit'
  initial?: RegulationGroup
  onClose: () => void
  onSubmit: (g: RegulationGroup) => void
}

export function RegulationGroupDrawer({ mode, initial, onClose, onSubmit }: RegulationGroupDrawerProps) {
  const isEdit = mode === 'edit'
  const groups = useGcpStore((s) => s.groups)
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [active, setActive] = useState(initial?.active ?? true)
  const [errors, setErrors] = useState<{ title?: string; description?: string }>({})

  const submit = () => {
    const e: typeof errors = {}
    if (!title.trim()) e.title = 'Title is required.'
    else if (groups.some((g) => g.id !== initial?.id && g.title.toLowerCase() === title.trim().toLowerCase())) {
      e.title = `A group called "${title.trim()}" already exists.`
    }
    if (!description.trim()) e.description = 'Description is required.'
    setErrors(e)
    if (Object.keys(e).length > 0) return
    onSubmit({
      id: initial?.id ?? crypto.randomUUID(),
      title: title.trim(),
      description: description.trim(),
      active,
    })
    onClose()
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title={isEdit ? `Edit Regulation Group “${initial!.title}”` : 'Add Regulation Group'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={submit}>{isEdit ? 'Save Changes' : 'Create'}</Button>
        </>
      }
    >
      <FormSection title="Group" subtitle="A kind of modification, and the rules it usually affects.">
        <FormField label="Title" htmlFor="rg-title" required error={errors.title}>
          <Input id="rg-title" value={title} error={!!errors.title} placeholder="e.g. Galley Modification"
            onChange={(e) => { setTitle(e.target.value); setErrors((p) => ({ ...p, title: undefined })) }} />
        </FormField>
        <FormField label="Description" htmlFor="rg-description" required error={errors.description}>
          <Input id="rg-description" value={description} error={!!errors.description} placeholder="e.g. Addition or modification of a galley"
            onChange={(e) => { setDescription(e.target.value); setErrors((p) => ({ ...p, description: undefined })) }} />
        </FormField>
        <FormField label="Active" htmlFor="rg-active" help="Inactive stays on old records, out of pickers.">
          <ActiveSelect id="rg-active" value={active} onChange={setActive} />
        </FormField>
      </FormSection>
    </Drawer>
  )
}
