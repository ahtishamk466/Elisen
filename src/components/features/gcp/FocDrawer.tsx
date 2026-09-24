import { useState } from 'react'
import { Drawer } from '@/components/patterns/Drawer'
import { FormSection } from '@/components/patterns/FormSection'
import { FormField } from '@/components/patterns/FormField'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { Input } from '@/components/ui/Input'
import { useGcpStore } from '@/stores/gcpStore'
import type { Foc } from '@/types/gcp'

export interface FocDrawerProps {
  mode: 'create' | 'edit'
  initial?: Foc
  onClose: () => void
  onSubmit: (f: Foc) => void
}

/** One FOC record: a code the compliance-item picker offers, who holds it,
    and the technical field they hold it in. Fields mirror the legacy `foc`
    table and its create screen. */
export function FocDrawer({ mode, initial, onClose, onSubmit }: FocDrawerProps) {
  const isEdit = mode === 'edit'
  const focs = useGcpStore((s) => s.focs)

  const [code, setCode] = useState(initial?.code ?? '')
  const [authoritySpecialist, setAuthoritySpecialist] = useState(initial?.authoritySpecialist ?? '')
  const [specialty, setSpecialty] = useState(initial?.specialty ?? '')
  const [isDefault, setIsDefault] = useState(initial?.isDefault ?? false)
  const [errors, setErrors] = useState<{ code?: string; authoritySpecialist?: string }>({})

  const submit = () => {
    const e: typeof errors = {}
    if (!code.trim()) e.code = 'Code is required.'
    if (!authoritySpecialist.trim()) e.authoritySpecialist = 'Authority Specialist is required.'
    if (!e.code) {
      const clash = focs.find((f) => f.id !== (isEdit ? initial?.id : undefined) && f.code === code.trim())
      if (clash) e.code = `“${clash.code}” already exists — one record per code.`
    }
    setErrors(e)
    if (Object.keys(e).length > 0) return
    onSubmit({
      id: isEdit ? initial!.id : crypto.randomUUID(),
      code: code.trim(),
      authoritySpecialist: authoritySpecialist.trim(),
      specialty: specialty.trim(),
      isDefault,
    })
    onClose()
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title={isEdit ? `Edit FOC “${initial!.code}”` : 'Add FOC'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={submit}>{isEdit ? 'Save Changes' : 'Create'}</Button>
        </>
      }
    >
      <FormSection title="FOC" subtitle="Who can find or recommend compliance under this code.">
        <FormField label="Code" htmlFor="foc-code" required error={errors.code}>
          <Input id="foc-code" value={code} error={!!errors.code} placeholder="e.g. AP-01(C)"
            onChange={(e) => { setCode(e.target.value); setErrors((p) => ({ ...p, code: undefined })) }} />
        </FormField>
        <FormField label="Authority Specialist" htmlFor="foc-specialist" required error={errors.authoritySpecialist}>
          <Input id="foc-specialist" value={authoritySpecialist} error={!!errors.authoritySpecialist} placeholder="e.g. Transport Canada"
            onChange={(e) => { setAuthoritySpecialist(e.target.value); setErrors((p) => ({ ...p, authoritySpecialist: undefined })) }} />
        </FormField>
        <FormField label="Specialty" htmlFor="foc-specialty" help="Leave blank where the legacy record has none.">
          <Input id="foc-specialty" value={specialty} placeholder="e.g. Structures, Occupant Safety"
            onChange={(e) => setSpecialty(e.target.value)} />
        </FormField>
        <Checkbox
          label="Default"
          checked={isDefault}
          onChange={(e) => setIsDefault(e.target.checked)}
        />
      </FormSection>
    </Drawer>
  )
}
