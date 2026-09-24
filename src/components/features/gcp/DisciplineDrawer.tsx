import { useState } from 'react'
import { Drawer } from '@/components/patterns/Drawer'
import { FormSection } from '@/components/patterns/FormSection'
import { FormField } from '@/components/patterns/FormField'
import { ActiveSelect } from '@/components/patterns/ActiveSelect'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useGcpStore } from '@/stores/gcpStore'
import type { Discipline } from '@/types/gcp'

export interface DisciplineDrawerProps {
  mode: 'create' | 'edit'
  initial?: Discipline
  onClose: () => void
  onSubmit: (d: Discipline) => void
}

/** One discipline: a DAO Specialty Code mapped to its Elisen and TCCA
    names. Fields mirror the legacy `discipline` table and its create
    screen. */
export function DisciplineDrawer({ mode, initial, onClose, onSubmit }: DisciplineDrawerProps) {
  const isEdit = mode === 'edit'
  const disciplines = useGcpStore((s) => s.disciplines)

  const [daoSpecialtyCode, setDaoSpecialtyCode] = useState(initial?.daoSpecialtyCode ?? '')
  const [elisenDiscipline, setElisenDiscipline] = useState(initial?.elisenDiscipline ?? '')
  const [tccaDiscipline, setTccaDiscipline] = useState(initial?.tccaDiscipline ?? '')
  const [active, setActive] = useState(initial?.active ?? true)
  const [errors, setErrors] = useState<{ daoSpecialtyCode?: string; elisenDiscipline?: string; tccaDiscipline?: string }>({})

  const submit = () => {
    const e: typeof errors = {}
    if (!daoSpecialtyCode.trim()) e.daoSpecialtyCode = 'DAO Specialty Code is required.'
    if (!elisenDiscipline.trim()) e.elisenDiscipline = 'Elisen discipline is required.'
    if (!tccaDiscipline.trim()) e.tccaDiscipline = 'TCCA discipline is required.'
    if (!e.daoSpecialtyCode) {
      const clash = disciplines.find((d) => d.id !== (isEdit ? initial?.id : undefined) && d.daoSpecialtyCode === daoSpecialtyCode.trim())
      if (clash) e.daoSpecialtyCode = `“${clash.daoSpecialtyCode}” already exists — one record per code.`
    }
    setErrors(e)
    if (Object.keys(e).length > 0) return
    onSubmit({
      id: isEdit ? initial!.id : crypto.randomUUID(),
      daoSpecialtyCode: daoSpecialtyCode.trim(),
      elisenDiscipline: elisenDiscipline.trim(),
      tccaDiscipline: tccaDiscipline.trim(),
      active,
    })
    onClose()
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title={isEdit ? `Edit Discipline “${initial!.daoSpecialtyCode}”` : 'Add Discipline'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={submit}>{isEdit ? 'Save Changes' : 'Create'}</Button>
        </>
      }
    >
      <FormSection title="Discipline" subtitle="The technical discipline a compliance item is filed under.">
        <FormField label="DAO Specialty Code" htmlFor="disc-code" required error={errors.daoSpecialtyCode}>
          <Input id="disc-code" value={daoSpecialtyCode} error={!!errors.daoSpecialtyCode} placeholder="e.g. A1"
            onChange={(e) => { setDaoSpecialtyCode(e.target.value); setErrors((p) => ({ ...p, daoSpecialtyCode: undefined })) }} />
        </FormField>
        <FormField label="Elisen discipline" htmlFor="disc-elisen" required error={errors.elisenDiscipline}>
          <Input id="disc-elisen" value={elisenDiscipline} error={!!errors.elisenDiscipline} placeholder="e.g. Electrical Systems"
            onChange={(e) => { setElisenDiscipline(e.target.value); setErrors((p) => ({ ...p, elisenDiscipline: undefined })) }} />
        </FormField>
        <FormField label="TCCA discipline" htmlFor="disc-tcca" required error={errors.tccaDiscipline}>
          <Input id="disc-tcca" value={tccaDiscipline} error={!!errors.tccaDiscipline} placeholder="e.g. Avionics & Electrical"
            onChange={(e) => { setTccaDiscipline(e.target.value); setErrors((p) => ({ ...p, tccaDiscipline: undefined })) }} />
        </FormField>
        <FormField label="Active" htmlFor="disc-active" fullWidth>
          <ActiveSelect id="disc-active" value={active} onChange={setActive} />
        </FormField>
      </FormSection>
    </Drawer>
  )
}
