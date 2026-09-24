import { useMemo, useState } from 'react'
import { Drawer } from '@/components/patterns/Drawer'
import { FormSection } from '@/components/patterns/FormSection'
import { FormField } from '@/components/patterns/FormField'
import { Button } from '@/components/ui/Button'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { Select } from '@/components/ui/Select'
import { useGcpStore } from '@/stores/gcpStore'
import type { Delegation } from '@/types/gcp'

export interface DelegationDrawerProps {
  mode: 'create' | 'edit'
  initial?: Delegation
  onClose: () => void
  onSubmit: (d: Delegation) => void
}

/** One delegation: which Section Root a FOC Code may sign for, and whether
    that comes with a limitation. Fields mirror the legacy `delegation` table
    and its create screen — Section Root and FOC Code are pickers rather
    than free text there, so they are here too. */
export function DelegationDrawer({ mode, initial, onClose, onSubmit }: DelegationDrawerProps) {
  const isEdit = mode === 'edit'
  const delegations = useGcpStore((s) => s.delegations)
  const regulations = useGcpStore((s) => s.regulations)
  const focs = useGcpStore((s) => s.focs)

  const sectionRootOptions = useMemo(() => {
    const roots = new Set(regulations.map((r) => r.sectionRoot).filter(Boolean))
    return [...roots].sort().map((root) => ({ value: root, label: root }))
  }, [regulations])

  const [sectionRoot, setSectionRoot] = useState(initial?.sectionRoot ?? '')
  const [focCode, setFocCode] = useState(initial?.focCode ?? '')
  const [limitation, setLimitation] = useState(initial?.limitation ?? false)
  const [active, setActive] = useState(initial?.active ?? true)
  const [errors, setErrors] = useState<{ sectionRoot?: string; focCode?: string }>({})

  const submit = () => {
    const e: typeof errors = {}
    if (!sectionRoot.trim()) e.sectionRoot = 'Section Root is required.'
    if (!focCode.trim()) e.focCode = 'FOC Code is required.'
    if (!e.sectionRoot && !e.focCode) {
      const clash = delegations.find((d) => d.id !== (isEdit ? initial?.id : undefined)
        && d.sectionRoot === sectionRoot.trim() && d.focCode === focCode.trim())
      if (clash) e.focCode = `${clash.sectionRoot} · ${clash.focCode} already exists.`
    }
    setErrors(e)
    if (Object.keys(e).length > 0) return
    onSubmit({
      id: isEdit ? initial!.id : crypto.randomUUID(),
      sectionRoot: sectionRoot.trim(),
      focCode: focCode.trim(),
      limitation,
      active,
    })
    onClose()
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title={isEdit ? `Edit Delegation “${initial!.sectionRoot} · ${initial!.focCode}”` : 'Add Delegation'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={submit}>{isEdit ? 'Save Changes' : 'Create'}</Button>
        </>
      }
    >
      <FormSection title="Delegation" subtitle="Which rule numbers this FOC code may sign for.">
        <FormField label="Section Root" htmlFor="delegation-section-root" required error={errors.sectionRoot}>
          <SearchableSelect
            id="delegation-section-root"
            value={sectionRoot}
            error={!!errors.sectionRoot}
            placeholder="Select a Section Root"
            emptyLabel="No section roots yet."
            options={sectionRootOptions}
            onChange={(v) => { setSectionRoot(v); setErrors((p) => ({ ...p, sectionRoot: undefined })) }}
          />
        </FormField>
        <FormField label="FOC Code" htmlFor="delegation-foc-code" required error={errors.focCode}>
          <SearchableSelect
            id="delegation-foc-code"
            value={focCode}
            error={!!errors.focCode}
            placeholder="Select a Foc Code"
            emptyLabel="No FOC codes yet."
            options={focs.map((f) => ({ value: f.code, label: f.code, hint: f.authoritySpecialist }))}
            onChange={(v) => { setFocCode(v); setErrors((p) => ({ ...p, focCode: undefined })) }}
          />
        </FormField>
        <FormField label="Limitation" htmlFor="delegation-limitation" fullWidth>
          <Select id="delegation-limitation" value={limitation ? 'yes' : 'no'}
            onChange={(e) => setLimitation(e.target.value === 'yes')}>
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </Select>
        </FormField>
        <FormField label="Active" htmlFor="delegation-active" fullWidth>
          <Select id="delegation-active" value={active ? 'yes' : 'no'}
            onChange={(e) => setActive(e.target.value === 'yes')}>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </Select>
        </FormField>
      </FormSection>
    </Drawer>
  )
}
