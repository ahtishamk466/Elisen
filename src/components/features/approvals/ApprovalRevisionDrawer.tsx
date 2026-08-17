import { useMemo, useState } from 'react'
import { FileText } from 'lucide-react'
import { Drawer } from '@/components/patterns/Drawer'
import { FormSection } from '@/components/patterns/FormSection'
import { FormField } from '@/components/patterns/FormField'
import { FileDropzone } from '@/components/patterns/FileDropzone'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { useApprovalsStore } from '@/stores/approvalsStore'
import { nextRevisionNumber } from '@/lib/documentDisplay'
import type { Approval, ApprovalRevision } from '@/types/documents'

export interface ApprovalRevisionDrawerProps {
  /** Fixed certificate (opened from an approval's workspace). Omit on the
      global Revisions list, where the approval is picked in the form — the
      legacy create screen leads with exactly that select. */
  approval?: Approval
  /** Edit an existing revision instead of raising the next one. */
  initial?: ApprovalRevision
  onClose: () => void
  onSaved?: (message: string) => void
}

const today = () => new Date().toISOString().slice(0, 10)

/**
 * Raise or edit an approval **Revision** — the paperwork that changes a
 * certificate, and what authorises extending one to further aircraft: "another
 * two or three aircraft were added inside it through an issue file." The
 * aircraft themselves are added on the approval's Aircraft tab, not here.
 *
 * Fields follow the legacy create screen (Approval Number, Approval Revision,
 * Change Description, Revision Date, Document); only the wording moved from
 * "Issue" to "Revision" — where the call landed.
 */
export function ApprovalRevisionDrawer({ approval, initial, onClose, onSaved }: ApprovalRevisionDrawerProps) {
  const approvals = useApprovalsStore((s) => s.approvals)
  const allRevisions = useApprovalsStore((s) => s.revisions)
  const addRevision = useApprovalsStore((s) => s.addRevision)
  const updateRevision = useApprovalsStore((s) => s.updateRevision)

  const isEdit = !!initial
  const [approvalId, setApprovalId] = useState(approval?.id ?? initial?.approvalId ?? '')
  const target = approval ?? approvals.find((a) => a.id === approvalId)

  /** Numbering is per certificate, so the history and the suggestion both move
      with whichever approval is selected. */
  const existing = useMemo(
    () => allRevisions.filter((r) => r.approvalId === approvalId).sort((a, b) => a.revision - b.revision),
    [allRevisions, approvalId],
  )
  const suggested = nextRevisionNumber(existing.map((r) => r.revision))

  const [revision, setRevision] = useState(String(initial?.revision ?? ''))
  const [changeDescription, setChangeDescription] = useState(initial?.changeDescription ?? '')
  const [revisionDate, setRevisionDate] = useState(initial?.revisionDate ?? today())
  /** Existing revisions carry a filename from the server; a fresh pick carries
      a real File. Only the name is stored — there is no backend to upload to. */
  const [documentName, setDocumentName] = useState(initial?.document ?? '')
  const [file, setFile] = useState<File | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  /** Blank means "use the next unused number" — the field is prefilled the
      moment an approval is chosen, so this is only the fallback. */
  const effective = revision.trim() === '' ? suggested : Number(revision)

  const submit = () => {
    const e: Record<string, string> = {}
    if (!approvalId) e.approvalId = 'Choose the approval this revision is raised against.'
    if (revision.trim() !== '' && (!Number.isInteger(Number(revision)) || Number(revision) < 1))
      e.revision = 'Approval revision must be a whole number, 1 or higher.'
    else if (existing.some((r) => r.revision === effective && r.id !== initial?.id))
      e.revision = `Revision ${effective} already exists on this approval, the next unused number is ${suggested}.`
    if (!changeDescription.trim()) e.changeDescription = 'Describe what this revision changed.'
    if (!revisionDate) e.revisionDate = 'Revision date is required.'
    setErrors(e)
    if (Object.values(e).some(Boolean)) return

    const label = target?.number ?? 'Approval'
    const fields = {
      revision: effective,
      changeDescription: changeDescription.trim(),
      revisionDate,
      document: file?.name ?? documentName.trim(),
    }
    if (isEdit) {
      updateRevision(initial.id, { approvalId, ...fields })
      onSaved?.(`${label} revision ${effective} saved.`)
    } else {
      addRevision({ id: crypto.randomUUID(), approvalId, ...fields })
      onSaved?.(`${label} revision ${effective} raised.`)
    }
    onClose()
  }

  const title = isEdit
    ? `Edit Revision ${initial.revision}${target ? `: ${target.number}` : ''}`
    : `Raise Revision${target ? `: ${target.number}` : ''}`

  return (
    <Drawer
      open
      onClose={onClose}
      title={title}
      footer={
        <>
          <div className="flex gap-sm">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button onClick={submit}>{isEdit ? 'Save Changes' : 'Raise Revision'}</Button>
          </div>
        </>
      }
    >
      {/* The history is shown when raising a new one, so nobody re-describes a
          change that is already on the record. */}
      {!isEdit && existing.length > 0 && (
        <FormSection title="Revision history" subtitle={target?.description}>
          <ul className="grid gap-xs">
            {existing.map((r) => (
              <li key={r.id} className="flex items-start justify-between gap-lg text-sm">
                <span className="min-w-0 text-text-primary">
                  <Badge appearance="outline">Rev {r.revision}</Badge>{' '}
                  <span className="text-text-secondary">{r.changeDescription}</span>
                </span>
                <span className="shrink-0 whitespace-nowrap text-xs text-text-muted">{r.revisionDate}</span>
              </li>
            ))}
          </ul>
        </FormSection>
      )}

      <FormSection
        title={isEdit ? 'Revision' : 'New revision'}
        subtitle="What changed, when it was issued, and the document that carries it."
      >
        {/* Fixed when raised from a certificate's own workspace; picked here on
            the global Revisions list. */}
        {approval ? (
          <FormField label="Approval Number" htmlFor="ar-approval">
            <Input id="ar-approval" value={approval.number} readOnly />
          </FormField>
        ) : (
          <FormField label="Approval Number" htmlFor="ar-approval" required error={errors.approvalId}
            help="The certificate this revision is raised against.">
            <SearchableSelect
              id="ar-approval" value={approvalId} error={!!errors.approvalId}
              onChange={(v) => {
                setApprovalId(v)
                setErrors((p) => ({ ...p, approvalId: '', revision: '' }))
                // Numbering is per approval, so a stale suggestion must not
                // follow the user across certificates.
                if (!isEdit) setRevision('')
              }}
              options={approvals.map((a) => ({ value: a.id, label: a.number, hint: a.description }))}
              placeholder="Select an approval number..."
              emptyLabel="No approvals exist yet, create one first."
            />
          </FormField>
        )}
        <FormField label="Approval Revision" htmlFor="ar-revision" error={errors.revision}
          help={approvalId
            ? `Leave blank to use the next unused number (${suggested}).`
            : 'Select an approval first. Revisions are numbered per certificate.'}>
          <Input id="ar-revision" type="number" min={1} value={revision} error={!!errors.revision} className="w-24"
            placeholder={approvalId ? String(suggested) : ''}
            onChange={(e) => { setRevision(e.target.value); setErrors((p) => ({ ...p, revision: '' })) }} />
        </FormField>
        <FormField label="Change Description" htmlFor="ar-change" required error={errors.changeDescription}
          help="What this revision changed, e.g. further airframes added, or a design change.">
          <Textarea id="ar-change" value={changeDescription} error={!!errors.changeDescription}
            onChange={(e) => { setChangeDescription(e.target.value); setErrors((p) => ({ ...p, changeDescription: '' })) }} />
        </FormField>
        <FormField label="Revision Date" htmlFor="ar-date" required error={errors.revisionDate}>
          <Input id="ar-date" type="date" value={revisionDate} error={!!errors.revisionDate}
            onChange={(e) => { setRevisionDate(e.target.value); setErrors((p) => ({ ...p, revisionDate: '' })) }} />
        </FormField>
      </FormSection>

      {/* The legacy screen has a real file picker here, and the requirement
          document asks for a PDF view — so this is the app's one upload
          pattern, not a filename text box. */}
      <FormSection title="Document" subtitle="The revision file, the signed approval document.">
        {documentName && !file && (
          <p className="flex items-center gap-xs text-sm text-text-secondary">
            <FileText size={16} aria-hidden />
            Current document: <span className="font-semibold text-text-primary">{documentName}</span>
          </p>
        )}
        <FileDropzone
          label={documentName && !file ? 'Replace document' : 'Upload document'}
          accept=".pdf"
          file={file}
          onSelect={(f) => { setFile(f); if (f) setDocumentName(f.name) }}
          hint="PDF only (.pdf)"
        />
      </FormSection>
    </Drawer>
  )
}
