import { useState } from 'react'
import { Drawer } from '@/components/patterns/Drawer'
import { ConfirmDialog } from '@/components/patterns/ConfirmDialog'
import { FormSection } from '@/components/patterns/FormSection'
import { FormField } from '@/components/patterns/FormField'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useDocumentsStore } from '@/stores/documentsStore'
import { useTccaStore } from '@/stores/tccaStore'
import { DOC_TYPES } from '@/lib/documentDisplay'
import { PEOPLE } from '@/lib/projectFixtures'
import type { DocumentKind, RevisionStatus } from '@/types/documents'

export interface DocumentDrawerProps {
  kind: DocumentKind
  projectId: string
  projectNumber: string
  onClose: () => void
}

const today = () => new Date().toISOString().slice(0, 10)

/** Create a document — which forces its first revision, exactly like the
    client's system ("it'll force me to put in information for a revision"). */
export function DocumentDrawer({ kind, projectId, projectNumber, onClose }: DocumentDrawerProps) {
  const documents = useDocumentsStore((s) => s.documents)
  const addDocument = useDocumentsStore((s) => s.addDocument)
  const tccaProjects = useTccaStore((s) => s.tccaProjects)
  const linkRevision = useTccaStore((s) => s.linkRevision)
  const linkedTcca = tccaProjects.filter((t) => t.projectIds.includes(projectId))

  const isDrawing = kind === 'drawing'
  const [number, setNumber] = useState('')
  const [title, setTitle] = useState('')
  const [type, setType] = useState('')
  const [owner, setOwner] = useState('')
  const [aircraft, setAircraft] = useState('')
  const [ataChapter, setAtaChapter] = useState('')
  const [rev, setRev] = useState('A')
  const [openedDate, setOpenedDate] = useState(today())
  const [dueDate, setDueDate] = useState('')
  const [nextAction, setNextAction] = useState('')
  const [status, setStatus] = useState<RevisionStatus>('wip')
  const [url, setUrl] = useState('')
  const [tccaId, setTccaId] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [dirty, setDirty] = useState(false)
  const [confirmClose, setConfirmClose] = useState(false)

  const requestClose = () => (dirty ? setConfirmClose(true) : close())
  const close = () => { setConfirmClose(false); onClose() }
  const set = <T,>(fn: (v: T) => void, key?: string) => (v: T) => {
    fn(v); setDirty(true)
    if (key) setErrors((p) => ({ ...p, [key]: '' }))
  }

  const submit = () => {
    const e: Record<string, string> = {}
    if (!number.trim()) e.number = `${isDrawing ? 'Drawing' : 'Document'} number is required.`
    else if (documents.some((d) => d.number.toLowerCase() === number.trim().toLowerCase()))
      e.number = `${number.trim()} already exists — add a revision to it instead.`
    if (!title.trim()) e.title = 'Title is required.'
    if (!type) e.type = 'Type is required.'
    if (!owner) e.owner = 'Owner is required.'
    if (!rev.trim()) e.rev = 'Revision letter is required.'
    if (!nextAction) e.nextAction = 'Next action person is required — it drives their to-do list.'
    setErrors(e)
    if (Object.values(e).some(Boolean)) return

    const docId = crypto.randomUUID()
    const revId = crypto.randomUUID()
    addDocument(
      {
        id: docId, kind, number: number.trim(), title: title.trim(), type, owner,
        ...(isDrawing ? { aircraft: aircraft.trim(), ataChapter: ataChapter.trim() } : {}),
      },
      {
        id: revId, documentId: docId, rev: rev.trim().toUpperCase(), initialProjectId: projectId,
        openedDate, dueDate, releasedDate: '', receivedDate: '', closedDate: '', nextAction, url, status,
      },
    )
    if (!isDrawing && tccaId) linkRevision(tccaId, revId)
    close()
  }

  return (
    <>
      <Drawer
        open
        onClose={requestClose}
        title={isDrawing ? 'Add drawing' : 'Add deliverable'}
        footer={
          <>
            <span />
            <div className="flex gap-sm">
              <Button variant="secondary" onClick={requestClose}>Cancel</Button>
              <Button onClick={submit}>{isDrawing ? 'Create Drawing' : 'Create Deliverable'}</Button>
            </div>
          </>
        }
      >
        <FormSection
          title={isDrawing ? 'Drawing' : 'Document'}
          subtitle="Number, title, type and owner live at the document level — everything else belongs to its revisions."
        >
          <FormField label="Number" htmlFor="doc-number" required error={errors.number}
            help={isDrawing ? `e.g. DRW-${projectNumber}-103` : `e.g. COM-${projectNumber}`}>
            <Input id="doc-number" value={number} error={!!errors.number} onChange={(e) => set(setNumber, 'number')(e.target.value)} />
          </FormField>
          <FormField label="Title" htmlFor="doc-title" required error={errors.title}>
            <Input id="doc-title" value={title} error={!!errors.title} onChange={(e) => set(setTitle, 'title')(e.target.value)} />
          </FormField>
          <FormField label="Type" htmlFor="doc-type" required error={errors.type}>
            <Select id="doc-type" value={type} error={!!errors.type} placeholder="Select a type..." onChange={(e) => set(setType, 'type')(e.target.value)}>
              {DOC_TYPES[kind].map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </FormField>
          <FormField label="Owner" htmlFor="doc-owner" required error={errors.owner}>
            <Select id="doc-owner" value={owner} error={!!errors.owner} placeholder="Select a person..." onChange={(e) => set(setOwner, 'owner')(e.target.value)}>
              {PEOPLE.map((p) => <option key={p} value={p}>{p}</option>)}
            </Select>
          </FormField>
          {isDrawing && (
            <>
              <FormField label="Aircraft Type" htmlFor="doc-aircraft" help="So the drawing can be found and reused on future projects.">
                <Input id="doc-aircraft" value={aircraft} placeholder="e.g. King Air 350" onChange={(e) => set(setAircraft)(e.target.value)} />
              </FormField>
              <FormField label="ATA Chapter" htmlFor="doc-ata" help="e.g. 25-10 — equipment/furnishings, cockpit.">
                <Input id="doc-ata" value={ataChapter} placeholder="e.g. 25-10" onChange={(e) => set(setAtaChapter)(e.target.value)} />
              </FormField>
            </>
          )}
        </FormSection>

        <FormSection title="Initial Revision" subtitle="A document can't exist without a revision — this creates rev A.">
          <FormField label="Revision" htmlFor="rev-letter" required error={errors.rev}>
            <Input id="rev-letter" value={rev} error={!!errors.rev} maxLength={2} className="w-24" onChange={(e) => set(setRev, 'rev')(e.target.value)} />
          </FormField>
          <FormField label="Opened Date" htmlFor="rev-opened">
            <Input id="rev-opened" type="date" value={openedDate} onChange={(e) => set(setOpenedDate)(e.target.value)} />
          </FormField>
          <FormField label="Due Date" htmlFor="rev-due">
            <Input id="rev-due" type="date" value={dueDate} onChange={(e) => set(setDueDate)(e.target.value)} />
          </FormField>
          <FormField label="Next Action" htmlFor="rev-next" required error={errors.nextAction}
            help="Whoever you pick sees this on their to-do list when they open Elisen.">
            <Select id="rev-next" value={nextAction} error={!!errors.nextAction} placeholder="Select a person..." onChange={(e) => set(setNextAction, 'nextAction')(e.target.value)}>
              {PEOPLE.map((p) => <option key={p} value={p}>{p}</option>)}
            </Select>
          </FormField>
          <FormField label="Status" htmlFor="rev-status">
            <Select id="rev-status" value={status} onChange={(e) => set(setStatus)(e.target.value as RevisionStatus)}>
              <option value="wip">Work in Progress</option>
              <option value="in-review">In Review</option>
              <option value="signature">Signature Cycle</option>
              <option value="accepted">Accepted</option>
            </Select>
          </FormField>
          <FormField label="URL" htmlFor="rev-url">
            <Input id="rev-url" value={url} placeholder="Link to the file..." onChange={(e) => set(setUrl)(e.target.value)} />
          </FormField>
          {!isDrawing && linkedTcca.length > 0 && (
            <FormField label="TCCA Project" htmlFor="rev-tcca"
              help="Optional — links this revision to the Transport Canada project it's created for.">
              <Select id="rev-tcca" value={tccaId} placeholder="Not for a TCCA project" onChange={(e) => set(setTccaId)(e.target.value)}>
                <option value="">Not for a TCCA project</option>
                {linkedTcca.map((t) => <option key={t.id} value={t.id}>{t.number} — {t.description}</option>)}
              </Select>
            </FormField>
          )}
        </FormSection>
      </Drawer>

      <ConfirmDialog
        open={confirmClose}
        title="Discard these changes?"
        description="Your changes haven't been saved. Closing now will discard everything you've entered."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        tone="danger"
        onConfirm={close}
        onCancel={() => setConfirmClose(false)}
      />
    </>
  )
}
