import { useRef, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Drawer } from '@/components/patterns/Drawer'
import { FileDropzone } from '@/components/patterns/FileDropzone'
import { FileLink } from '@/components/patterns/FileLink'
import { FormSection } from '@/components/patterns/FormSection'
import { FormField } from '@/components/patterns/FormField'
import { UrlField } from '@/components/patterns/UrlField'
import { Button } from '@/components/ui/Button'
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

/** A basis's own identity: the aircraft model and, for one read straight off
    a type certificate, its TCDS number — blank for a project-specific basis,
    which has none. Its rules are added here one exact rule at a time
    (`RulePicker`): on create they are the basis's rules; on edit they are
    added to it, and removing one stays on the page's rules table, as in the
    legacy Bulk Create. Import stays for adding a whole export in one pass. */
export function CertBasisDrawer({ mode, initial, onClose, onSubmit }: CertBasisDrawerProps) {
  const isEdit = mode === 'edit'
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

  const [ruleIds, setRuleIds] = useState<string[]>([])

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
      description: description.trim(),
      tcdsNumber: tcdsNumber.trim(),
      tcdsUrl: tcdsUrl.trim(),
      basisStatement: basisStatement.trim(),
      sourceDocument,
      regulationIds: isEdit ? [...initial!.regulationIds, ...ruleIds] : ruleIds,
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
        <FormField label="Description" htmlFor="basis-description" fullWidth>
          <Input id="basis-description" value={description} maxLength={255} placeholder="e.g. TCCA TCDS A-142 for DHC-8-300 series"
            onChange={(e) => setDescription(e.target.value)} />
        </FormField>
        <FormField label="Type Certificate Data Sheet (TCDS) Number" htmlFor="basis-tcds" fullWidth
          help="Blank for a project-specific basis.">
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
      <FormSection title="Regulations" subtitle={isEdit ? 'Rules to add to this basis. Remove a rule from its rules table.' : 'The rules this basis applies, each at one amendment.'}>
        <RulePicker idPrefix="basis-rule" value={ruleIds} onChange={setRuleIds} existing={initial?.regulationIds}
          listLabel={isEdit ? 'Rules to add' : 'Rules in this basis'} />
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
    </Drawer>
  )
}
