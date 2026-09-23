import { useState } from 'react'
import { Drawer } from '@/components/patterns/Drawer'
import { FormSection } from '@/components/patterns/FormSection'
import { FormField } from '@/components/patterns/FormField'
import { ActiveSelect } from '@/components/patterns/ActiveSelect'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useGcpStore } from '@/stores/gcpStore'
import type { Subpart } from '@/types/gcp'

export interface SubpartDrawerProps {
  mode: 'create' | 'edit'
  initial?: Subpart
  onClose: () => void
  onSubmit: (s: Subpart) => void
}

export function SubpartDrawer({ mode, initial, onClose, onSubmit }: SubpartDrawerProps) {
  const isEdit = mode === 'edit'
  const subparts = useGcpStore((s) => s.subparts)
  const [code, setCode] = useState(initial?.code ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [sort, setSort] = useState(initial?.sort ?? '')
  const [active, setActive] = useState(initial?.active ?? true)
  const [errors, setErrors] = useState<{ code?: string; description?: string; sort?: string }>({})

  /** Next free two-digit slot, so a blank Sort still lands in order. */
  const nextSort = String(
    subparts.reduce((n, s) => Math.max(n, Number(s.sort) || 0), 0) + 1,
  ).padStart(2, '0')

  const submit = () => {
    const e: typeof errors = {}
    if (!code.trim()) e.code = 'Code is required.'
    else if (subparts.some((s) => s.id !== initial?.id && s.code.toLowerCase() === code.trim().toLowerCase())) {
      e.code = `Subpart ${code.trim()} already exists.`
    }
    if (!description.trim()) e.description = 'Description is required.'
    setErrors(e)
    if (Object.keys(e).length > 0) return
    onSubmit({
      id: initial?.id ?? crypto.randomUUID(),
      code: code.trim(),
      description: description.trim(),
      sort: (sort.trim() || nextSort),
      active,
    })
    onClose()
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title={isEdit ? `Edit Subpart “${initial!.code}”` : 'Add Subpart'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={submit}>{isEdit ? 'Save Changes' : 'Create'}</Button>
        </>
      }
    >
      <FormSection title="Subpart" subtitle="A top-level grouping of the rules, as the FAA files them.">
        <FormField label="Code" htmlFor="sp-code" required error={errors.code}>
          <Input id="sp-code" value={code} error={!!errors.code} placeholder="e.g. C"
            onChange={(e) => { setCode(e.target.value); setErrors((p) => ({ ...p, code: undefined })) }} />
        </FormField>
        <FormField label="Description" htmlFor="sp-description" required error={errors.description}>
          <Input id="sp-description" value={description} error={!!errors.description} placeholder="e.g. STRUCTURE / STRENGTH REQUIREMENTS"
            onChange={(e) => { setDescription(e.target.value); setErrors((p) => ({ ...p, description: undefined })) }} />
        </FormField>
        <FormField label="Sort" htmlFor="sp-sort" required error={errors.sort}
          help="Where this subpart prints in a report. Leave blank to take the suggestion.">
          <Input id="sp-sort" value={sort} error={!!errors.sort} placeholder={nextSort}
            onChange={(e) => { setSort(e.target.value); setErrors((p) => ({ ...p, sort: undefined })) }} />
        </FormField>
        <FormField label="Active" htmlFor="sp-active" help="Inactive stays on old records, out of pickers.">
          <ActiveSelect id="sp-active" value={active} onChange={setActive} />
        </FormField>
      </FormSection>
    </Drawer>
  )
}
