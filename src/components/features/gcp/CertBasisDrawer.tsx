import { useMemo, useRef, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Drawer } from '@/components/patterns/Drawer'
import { FileDropzone } from '@/components/patterns/FileDropzone'
import { FileLink } from '@/components/patterns/FileLink'
import { FormSection } from '@/components/patterns/FormSection'
import { FormField } from '@/components/patterns/FormField'
import { UrlField } from '@/components/patterns/UrlField'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { MultiSelect } from '@/components/ui/MultiSelect'
import { useGcpStore } from '@/stores/gcpStore'
import { checkPdf, formatBytes, PDF_MAX_BYTES } from '@/lib/pdfCheck'
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
  const [tcdsUrl, setTcdsUrl] = useState(initial?.tcdsUrl ?? '')
  const [basisStatement, setBasisStatement] = useState(initial?.basisStatement ?? '')
  const [error, setError] = useState('')
  const [doc, setDoc] = useState(initial?.sourceDocument)
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState('')
  const [checking, setChecking] = useState(false)
  const lastPick = useRef<File | null>(null)

  /* Every pick passes `checkPdf` before it's kept; a later pick wins over a
     slower earlier one still being read. */
  const pickFile = async (f: File | null) => {
    lastPick.current = f
    setFile(null)
    setFileError('')
    setChecking(!!f)
    if (!f) return
    const problem = await checkPdf(f)
    if (lastPick.current !== f) return
    setChecking(false)
    if (problem) setFileError(problem)
    else setFile(f)
  }

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

  /* Untouched pickers keep the basis's own rules on save: rebuilding them from
     section × amdt pulls in every pool regulation that matches, so opening
     Edit just to add a PDF used to add rules too. */
  const [regsTouched, setRegsTouched] = useState(false)

  const handleSectionsChange = (next: string[]) => {
    setRegsTouched(true)
    setSections(next)
    if (next.length > 0) {
      const stillValid = new Set(regulations.filter((r) => next.includes(r.section)).map((r) => r.amdt))
      setAmdts((prev) => prev.filter((a) => stillValid.has(a)))
    }
  }

  const handleAmdtsChange = (next: string[]) => {
    setRegsTouched(true)
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
    /* Typed as PDF, so the browser only ever opens it in its PDF viewer. */
    const sourceDocument = file
      ? { name: file.name, size: file.size, url: URL.createObjectURL(new Blob([file], { type: 'application/pdf' })) }
      : doc
    if (initial?.sourceDocument && initial.sourceDocument !== sourceDocument) URL.revokeObjectURL(initial.sourceDocument.url)
    onSubmit({
      ...initial,
      id: isEdit ? initial!.id : crypto.randomUUID(),
      aircraftModel: aircraftModel.trim(),
      tcdsNumber: tcdsNumber.trim(),
      tcdsUrl: tcdsUrl.trim(),
      basisStatement: basisStatement.trim(),
      sourceDocument,
      regulationIds: isEdit && !regsTouched ? initial!.regulationIds : matched.map((r) => r.id),
    })
    onClose()
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title={isEdit ? `Edit Certification Basis "${initial!.aircraftModel}"` : 'Add Certification Basis'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={checking}>{isEdit ? 'Save Changes' : 'Create'}</Button>
        </>
      }
    >
      <FormSection title="Certification Basis" subtitle="Which aircraft, or which project, this rule set is for.">
        <FormField label="Aircraft Model" htmlFor="basis-model" required error={error} fullWidth>
          <Input id="basis-model" value={aircraftModel} error={!!error} placeholder="e.g. CL-650"
            onChange={(e) => { setAircraftModel(e.target.value); setError('') }} />
        </FormField>
        <FormField label="TCDS Number" htmlFor="basis-tcds" fullWidth
          help="The Type Certificate Data Sheet the basis comes from. Blank for a project-specific basis.">
          <Input id="basis-tcds" value={tcdsNumber} placeholder="e.g. A-123"
            onChange={(e) => setTcdsNumber(e.target.value)} />
        </FormField>
        <FormField label="TCDS Link" htmlFor="basis-tcds-url" fullWidth>
          <UrlField id="basis-tcds-url" value={tcdsUrl} onChange={setTcdsUrl} placeholder="Link to the TCDS document..." />
        </FormField>
        <FormField label="Basis as Written on the TCDS" htmlFor="basis-statement" fullWidth
          help="Copy the certification basis line, so the rules can be checked against it.">
          <Input id="basis-statement" value={basisStatement} placeholder="e.g. Part 25, Amdt 25-1 to 25-98, plus 25.2 at 25-72"
            onChange={(e) => setBasisStatement(e.target.value)} />
        </FormField>
      </FormSection>
      <FormSection title="Source Document" subtitle="The PDF the rules were read from, kept so the basis can be checked against it.">
        {doc && !file && (
          <div className="flex items-center gap-sm rounded-sm border border-border-default bg-neutral-25 px-lg py-sm">
            <div className="min-w-0 flex-1 text-sm"><FileLink url={doc.url} label={doc.name} /></div>
            <span className="shrink-0 text-xs text-text-muted">{formatBytes(doc.size)}</span>
            <Button variant="tertiary" size="sm" leadingIcon={<Trash2 size={14} />} aria-label={`Remove ${doc.name}`}
              onClick={() => setDoc(undefined)}>Remove</Button>
          </div>
        )}
        <FileDropzone label={doc ? 'Replace Document' : 'Upload Document'} accept=".pdf" file={file} error={fileError}
          hint={checking ? 'Checking the file…' : `PDF only, up to ${formatBytes(PDF_MAX_BYTES)}`}
          onSelect={pickFile} onReject={() => setFileError('Only PDF files (.pdf) can be uploaded.')} />
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
