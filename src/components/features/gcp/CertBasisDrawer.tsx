import { useRef, useState } from 'react'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { AppShell } from '@/components/patterns/AppShell'
import { Stepper } from '@/components/patterns/Stepper'
import { ConfirmDialog } from '@/components/patterns/ConfirmDialog'
import { FileDropzone } from '@/components/patterns/FileDropzone'
import { FileLink } from '@/components/patterns/FileLink'
import { FormSection } from '@/components/patterns/FormSection'
import { FormField } from '@/components/patterns/FormField'
import { UrlField } from '@/components/patterns/UrlField'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { Stat } from '@/components/patterns/Stat'
import { Input } from '@/components/ui/Input'
import { checkPdf, formatBytes, PDF_MAX_BYTES } from '@/lib/pdfCheck'
import type { CertBasis } from '@/types/gcp'
import { RulePicker } from './RulePicker'

export interface CertBasisDrawerProps {
  mode: 'create' | 'edit'
  initial?: CertBasis
  onClose: () => void
  onSubmit: (b: CertBasis) => void
}

/** Full-page two-step editor. aircraftModel remains the legacy Master code
 * storage field; saving never parses an aircraft identity out of that code. */
export function CertBasisDrawer({ mode, initial, onClose, onSubmit }: CertBasisDrawerProps) {
  const isEdit = mode === 'edit'
  const [step, setStep] = useState(0)
  const [pendingRules, setPendingRules] = useState(false)
  const [discard, setDiscard] = useState(false)
  const [aircraftModel, setAircraftModel] = useState(initial?.aircraftModel ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
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

  const [ruleIds, setRuleIds] = useState<string[]>(initial?.regulationIds ?? [])
  const dirty = pendingRules || aircraftModel !== (initial?.aircraftModel ?? '') || description !== (initial?.description ?? '') || tcdsNumber !== (initial?.tcdsNumber ?? '') || tcdsUrl !== (initial?.tcdsUrl ?? '') || basisStatement !== (initial?.basisStatement ?? '') || !!file || doc !== initial?.sourceDocument || ruleIds.join() !== (initial?.regulationIds ?? []).join()
  const discardTrigger = useRef<HTMLElement | null>(null)
  const cancel = () => {
    if (!dirty) { onClose(); return }
    discardTrigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setDiscard(true)
  }
  const validate = () => {
    if (!aircraftModel.trim() || !description.trim()) { setError('Code and description are required.'); setStep(0); return false }
    if (checking || fileError) return false
    return true
  }

  const submit = () => {
    if (!validate()) return
    /* Typed as PDF, so the browser only ever opens it in its PDF viewer. */
    const sourceDocument = file
      ? { name: file.name, size: file.size, url: URL.createObjectURL(new Blob([file], { type: 'application/pdf' })) }
      : doc
    if (initial?.sourceDocument && initial.sourceDocument !== sourceDocument) URL.revokeObjectURL(initial.sourceDocument.url)
    onSubmit({
      ...initial,
      id: isEdit ? initial!.id : crypto.randomUUID(),
      aircraftModel: aircraftModel.trim(),
      description: description.trim(),
      tcdsNumber: tcdsNumber.trim(),
      tcdsUrl: tcdsUrl.trim(),
      basisStatement: basisStatement.trim(),
      sourceDocument,
      regulationIds: [...new Set(ruleIds)],
    })
  }

  return (
    <AppShell activeItem="General Certification" activeChild="Certification Basis" fill
      headerLeft={isEdit ? undefined : (
        <div className="min-w-0">
          <div className="flex items-center gap-sm">
            <Button variant="tertiary" size="sm" aria-label="Go back" title="Go back"
              leadingIcon={<ArrowLeft size={18} aria-hidden />} onClick={cancel} />
            <h1 className="text-2xl font-bold text-text-primary">Create Certification Basis</h1>
          </div>
        </div>
      )}
      title={isEdit ? `Edit ${initial!.aircraftModel}` : 'Create Certification Basis'}
      description={isEdit ? 'Changes apply to every project using this basis; initialized compliance plans stay as they are.' : undefined}>
      <div className="flex min-h-0 flex-1 flex-col gap-lg">
      {/* The stepper names the step, so the header no longer repeats it, and its
          two steps sit together rather than at opposite edges of a wide screen. */}
      <div style={{ maxWidth: 720 }}><Stepper steps={['Basis details and source', 'Regulations and review']} current={step} /></div>
      <div aria-label="Basis form content" className="min-h-0 flex-1 overflow-y-auto">
      <div className="grid gap-2xl pb-lg">
      {step === 0 && <>
      <FormSection requirement={isEdit ? undefined : 'required'} title="Master details" subtitle="A reusable certification basis, identified by its Master code.">
        <div className={isEdit ? 'grid gap-lg' : 'grid gap-lg laptop:grid-cols-3'}>
        <div className="min-w-0">
        <FormField label={isEdit ? 'Code' : 'Basis code'} htmlFor="basis-model" required error={error} fullWidth>
          <Input id="basis-model" value={aircraftModel} error={!!error} maxLength={255} placeholder="e.g. DHC-8-3XX_A-142"
            onChange={(e) => { setAircraftModel(e.target.value); setError('') }} />
        </FormField>
        </div><div className={isEdit ? 'min-w-0' : 'min-w-0 laptop:col-span-2'}>
        <FormField label="Description" htmlFor="basis-description" required error={error} fullWidth>
          <Input id="basis-description" value={description} maxLength={255} placeholder="e.g. TCCA TCDS A-142 for DHC-8-300 series"
            onChange={(e) => setDescription(e.target.value)} />
        </FormField>
        </div></div>
      </FormSection>
      <FormSection requirement={isEdit ? undefined : 'optional'} title={isEdit ? 'Optional reference details' : 'Reference details'} subtitle="Add source metadata when available.">
        <div className={isEdit ? 'grid gap-lg' : 'grid gap-lg laptop:grid-cols-3'}>
        <div className="min-w-0">
        <FormField label="Type Certificate Data Sheet (TCDS) Number" htmlFor="basis-tcds" fullWidth>
          <Input id="basis-tcds" value={tcdsNumber} maxLength={255} placeholder="e.g. A-123"
            onChange={(e) => setTcdsNumber(e.target.value)} />
        </FormField>
        </div><div className={isEdit ? 'min-w-0' : 'min-w-0 laptop:col-span-2'}>
        <FormField label="TCDS Link" htmlFor="basis-tcds-url" fullWidth>
          <UrlField id="basis-tcds-url" value={tcdsUrl} onChange={setTcdsUrl} placeholder="Link to the TCDS document..." />
        </FormField>
        </div></div>
        <FormField label="Basis as Written on the TCDS" htmlFor="basis-statement" fullWidth>
          {isEdit ? <Input id="basis-statement" value={basisStatement} maxLength={2000} placeholder="e.g. Part 25, Amdt 25-1 to 25-98, plus 25.2 at 25-72" onChange={(e) => setBasisStatement(e.target.value)} />
            : <Textarea id="basis-statement" value={basisStatement} rows={3} maxLength={2000} placeholder="e.g. Part 25, Amdt 25-1 to 25-98, plus 25.2 at 25-72" onChange={(e) => setBasisStatement(e.target.value)} />}
        </FormField>
      </FormSection>
      <FormSection requirement={isEdit ? undefined : 'optional'} title="Source Document" subtitle="Optional · PDF only, up to 20 MB. Regulations are selected separately.">
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
      </>}
      {step === 1 && <>
<FormSection title="Regulations" subtitle="Choose exact library records. Rules can be added later; multiple amendments of one section raise a warning.">
        <RulePicker onPendingChange={setPendingRules} layout={isEdit ? 'stacked' : 'row'} idPrefix="basis-rule" value={ruleIds} onChange={setRuleIds}
          listLabel="Selected regulations" />
      </FormSection>

      <FormSection title="Review" subtitle="Check the Master details and selected regulations before saving.">
        {isEdit ? <>
        <p className="text-sm text-text-primary">{aircraftModel} · {description}</p>
        <p className="text-sm text-text-secondary">{ruleIds.length} regulations · {tcdsNumber || 'No TCDS number'} · {file?.name || doc?.name || 'No source PDF'}</p>
        </> : <dl className="grid gap-lg tablet:grid-cols-2 laptop:grid-cols-3">
          <Stat dl label="Basis code">{aircraftModel}</Stat>
          <div className="min-w-0 laptop:col-span-2"><Stat dl label="Description">{description}</Stat></div>
          <Stat dl label="Selected regulations">{ruleIds.length}</Stat>
          <Stat dl label="TCDS">{tcdsNumber || 'Not provided'}{tcdsUrl && <FileLink url={tcdsUrl} label="Open TCDS" />}</Stat>
          <Stat dl label="Source document">{file?.name || doc?.name || 'Not provided'}</Stat>
        </dl>}
      </FormSection>
      </>}
      </div>
      </div>
      <div className="flex shrink-0 flex-wrap justify-between gap-lg border-t border-border-default bg-neutral-50 pt-lg">
        <Button variant="secondary" onClick={cancel}>Cancel</Button>
        <div className="flex gap-sm">
          {step > 0 && <Button variant="secondary" onClick={() => setStep(0)}>Back</Button>}
          {step === 0 ? <Button disabled={checking || !!fileError} onClick={() => { if (validate()) setStep(1) }}>Continue</Button>
            : <Button onClick={submit} loading={checking}>{isEdit ? 'Save Changes' : 'Create Basis'}</Button>}
        </div>
      </div>
      </div>
      <ConfirmDialog open={discard} title="Discard changes?" description="Your unsaved certification basis changes will be lost."
        confirmLabel="Discard changes" cancelLabel="Keep editing" tone="danger" onConfirm={onClose} onCancel={() => { setDiscard(false); discardTrigger.current?.focus() }} />
    </AppShell>
  )
}
