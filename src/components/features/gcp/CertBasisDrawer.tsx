import { useMemo, useState } from 'react'
import { Drawer } from '@/components/patterns/Drawer'
import { FormSection } from '@/components/patterns/FormSection'
import { FormField } from '@/components/patterns/FormField'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { MultiSelect } from '@/components/ui/MultiSelect'
import { useGcpStore } from '@/stores/gcpStore'
import type { CertBasis } from '@/types/gcp'

export interface CertBasisDrawerProps {
  mode: 'create' | 'edit'
  initial?: CertBasis
  onClose: () => void
  onSubmit: (b: CertBasis) => void
}

/** A basis's own identity: the aircraft model and, for one read straight off
    a type certificate, its TCDS number — blank for a project-specific basis,
    which has none. Regulation Section and Regulation Amdt attach its rule
    set directly here — the same cascading `MultiSelect` pair and "both
    fields pick a real regulation" rule as GCP Projects' own Certification
    Basis step (client instruction, 2026-09-24: this drawer had no way to
    attach a regulation at all before, only Import or that step). Import
    stays for building a basis from an FAA/TCCA export in one pass. */
export function CertBasisDrawer({ mode, initial, onClose, onSubmit }: CertBasisDrawerProps) {
  const isEdit = mode === 'edit'
  const regulations = useGcpStore((s) => s.regulations)
  const [aircraftModel, setAircraftModel] = useState(initial?.aircraftModel ?? '')
  const [tcdsNumber, setTcdsNumber] = useState(initial?.tcdsNumber ?? '')
  const [error, setError] = useState('')

  const existingRegs = useMemo(
    () => (initial?.regulationIds ?? []).map((id) => regulations.find((r) => r.id === id)).filter((r): r is NonNullable<typeof r> => !!r),
    [initial, regulations],
  )
  const [sections, setSections] = useState<string[]>(() => [...new Set(existingRegs.map((r) => r.section))])
  const [amdts, setAmdts] = useState<string[]>(() => [...new Set(existingRegs.map((r) => r.amdt))])

  const sectionOptions = useMemo(() => [...new Set(regulations.map((r) => r.section))].sort(), [regulations])

  /* Same cascade as `FlowStepBasis`: Amdt narrows to whichever section(s)
     are picked, Section itself is never narrowed by Amdt. */
  const amdtOptions = useMemo(() => {
    const pool = sections.length === 0 ? regulations : regulations.filter((r) => sections.includes(r.section))
    return [...new Set(pool.map((r) => r.amdt))].sort()
  }, [regulations, sections])

  const handleSectionsChange = (next: string[]) => {
    setSections(next)
    if (next.length > 0) {
      const stillValid = new Set(regulations.filter((r) => next.includes(r.section)).map((r) => r.amdt))
      setAmdts((prev) => prev.filter((a) => stillValid.has(a)))
    }
  }

  const handleAmdtsChange = (next: string[]) => {
    if (sections.length === 0 && next.length > 0) {
      const parentSections = [...new Set(regulations.filter((r) => next.includes(r.amdt)).map((r) => r.section))]
      setSections(parentSections)
    }
    setAmdts(next)
  }

  /* A regulation only counts as attached once both a section and an amdt
     are picked — same rule as `FlowStepBasis`, so a section alone doesn't
     silently attach every amendment under it. */
  const matched = sections.length > 0 && amdts.length > 0
    ? regulations.filter((r) => sections.includes(r.section) && amdts.includes(r.amdt))
    : []

  const submit = () => {
    if (!aircraftModel.trim()) { setError('Aircraft model is required.'); return }
    onSubmit({
      id: isEdit ? initial!.id : crypto.randomUUID(),
      aircraftModel: aircraftModel.trim(),
      tcdsNumber: tcdsNumber.trim(),
      regulationIds: matched.map((r) => r.id),
    })
    onClose()
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title={isEdit ? `Edit Cert Basis "${initial!.aircraftModel}"` : 'Add Cert Basis'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={submit}>{isEdit ? 'Save Changes' : 'Create'}</Button>
        </>
      }
    >
      <FormSection title="Cert Basis" subtitle="Which aircraft, or which project, this rule set is for.">
        <FormField label="Aircraft Model" htmlFor="basis-model" required error={error} fullWidth>
          <Input id="basis-model" value={aircraftModel} error={!!error} placeholder="e.g. CL-650"
            onChange={(e) => { setAircraftModel(e.target.value); setError('') }} />
        </FormField>
        <FormField label="TCDS Number" htmlFor="basis-tcds" fullWidth
          help="Leave blank for a project-specific basis — one with no type certificate of its own.">
          <Input id="basis-tcds" value={tcdsNumber} placeholder="e.g. A-123"
            onChange={(e) => setTcdsNumber(e.target.value)} />
        </FormField>
      </FormSection>
      <FormSection title="Regulations" subtitle="The rules this basis attaches — pick both a section and an amdt to attach one.">
        <FormField label="Regulation Section" htmlFor="basis-section" fullWidth>
          <MultiSelect
            id="basis-section"
            value={sections}
            onChange={handleSectionsChange}
            placeholder="Select regulation section…"
            emptyLabel="No sections in the rule pool yet."
            showChips={false}
            options={sectionOptions.map((s) => ({ value: s, label: s }))}
          />
        </FormField>
        <FormField label="Regulation Amdt" htmlFor="basis-amdt" fullWidth
          help={matched.length > 0 ? `Attaches ${matched.length} regulation${matched.length === 1 ? '' : 's'}.` : undefined}>
          <MultiSelect
            id="basis-amdt"
            value={amdts}
            onChange={handleAmdtsChange}
            placeholder="Select regulation amdt…"
            emptyLabel="No amendments in the rule pool yet."
            showChips={false}
            options={amdtOptions.map((a) => ({ value: a, label: a }))}
          />
        </FormField>
      </FormSection>
    </Drawer>
  )
}
