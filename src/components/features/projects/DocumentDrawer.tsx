import { useMemo, useState } from 'react'
import { Drawer } from '@/components/patterns/Drawer'
import { ConfirmDialog } from '@/components/patterns/ConfirmDialog'
import { FormSection } from '@/components/patterns/FormSection'
import { FormField } from '@/components/patterns/FormField'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { PersonSelect } from '@/components/ui/PersonSelect'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { useDocumentsStore } from '@/stores/documentsStore'
import { useProjectsStore } from '@/stores/projectsStore'
import { useTccaStore } from '@/stores/tccaStore'
import { DOC_TYPES, KIND_LABEL } from '@/lib/documentDisplay'
import { PEOPLE } from '@/lib/projectFixtures'
import type { DocumentKind, ProjectDocument, RevisionStatus } from '@/types/documents'

export interface DocumentDrawerProps {
  kind: DocumentKind
  /** Editing an existing document — document-level fields only. */
  initial?: ProjectDocument
  onClose: () => void
  /** Toast copy for the caller, e.g. `DRW-3200-103 saved.` */
  onSaved?: (message: string) => void
}

const today = () => new Date().toISOString().slice(0, 10)

/**
 * Create a document — which forces its first revision, exactly like the
 * client's system ("it'll force me to put in information for a revision") —
 * or edit an existing document's own fields.
 *
 * Only the Documents workspace opens this. A project links to revisions that
 * already exist and never creates them (requirement §1.2: "Project ↔
 * Deliverable Revisions — List, assign", against §1.3/1.4 "List, CRUD" for the
 * modules), so the revision's project is always chosen here in the form.
 */
export function DocumentDrawer({ kind, initial, onClose, onSaved }: DocumentDrawerProps) {
  const documents = useDocumentsStore((s) => s.documents)
  const addDocument = useDocumentsStore((s) => s.addDocument)
  const updateDocument = useDocumentsStore((s) => s.updateDocument)
  const projects = useProjectsStore((s) => s.rows)
  const tccaProjects = useTccaStore((s) => s.tccaProjects)
  const linkRevision = useTccaStore((s) => s.linkRevision)

  const isEdit = !!initial
  const isDrawing = kind === 'drawing'
  const label = KIND_LABEL[kind]

  const [number, setNumber] = useState(initial?.number ?? '')
  const [title, setTitle] = useState(initial?.title ?? '')
  const [type, setType] = useState(initial?.type ?? '')
  const [owner, setOwner] = useState(initial?.owner ?? '')
  const [aircraft, setAircraft] = useState(initial?.aircraft ?? '')
  const [ataChapter, setAtaChapter] = useState(initial?.ataChapter ?? '')
  // First-revision fields — create only; revisions are edited in RevisionDrawer.
  const [project, setProject] = useState('')
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

  /** Only TCCA projects tied to the revision's project can be offered — a
      revision can't be tracked under a TCCA project it has no relation to. */
  const linkedTcca = tccaProjects.filter((t) => project && t.projectIds.includes(project))
  const projectOptions = useMemo(
    () =>
      projects.map((p) => ({
        value: p.id,
        label: `${p.number}-${p.subNumber}: ${p.title}`,
        hint: p.companyName || undefined,
      })),
    [projects],
  )
  const chosenProject = projects.find((p) => p.id === project)
  const numberHint = chosenProject
    ? `${isDrawing ? 'DRW' : 'COM'}-${chosenProject.number}${isDrawing ? '-103' : ''}`
    : `${isDrawing ? 'DRW' : 'COM'}-3200${isDrawing ? '-103' : ''}`

  const requestClose = () => (dirty ? setConfirmClose(true) : close())
  const close = () => { setConfirmClose(false); onClose() }
  const set = <T,>(fn: (v: T) => void, key?: string) => (v: T) => {
    fn(v); setDirty(true)
    if (key) setErrors((p) => ({ ...p, [key]: '' }))
  }

  const submit = () => {
    const e: Record<string, string> = {}
    if (!number.trim()) e.number = `${isDrawing ? 'Drawing' : 'Document'} number is required.`
    // Only *new* collisions are blocked. The existing data legitimately holds
    // several documents on one number (three separate "COM-0000 Certification
    // Plan" records, one per project), so an edit that leaves the number alone
    // must not be held hostage to a duplicate that predates it.
    else if (
      number.trim().toLowerCase() !== (initial?.number ?? '').toLowerCase() &&
      documents.some((d) => d.id !== initial?.id && d.number.toLowerCase() === number.trim().toLowerCase())
    )
      e.number = `${number.trim()} already exists, add a revision to it instead.`
    if (!title.trim()) e.title = 'Title is required.'
    if (!type) e.type = 'Type is required.'
    if (!owner) e.owner = 'Owner is required.'
    if (!isEdit) {
      if (!project) e.project = 'Choose the project this first revision is created for.'
      if (!rev.trim()) e.rev = 'Revision letter is required.'
      if (!nextAction) e.nextAction = 'Next action person is required. It drives their to-do list.'
    }
    setErrors(e)
    if (Object.values(e).some(Boolean)) return

    const fields = {
      kind, number: number.trim(), title: title.trim(), type, owner,
      ...(isDrawing ? { aircraft: aircraft.trim(), ataChapter: ataChapter.trim() } : {}),
    }

    if (isEdit) {
      updateDocument(initial.id, fields)
      onSaved?.(`${number.trim()} saved.`)
      close()
      return
    }

    const docId = crypto.randomUUID()
    const revId = crypto.randomUUID()
    addDocument(
      { id: docId, ...fields },
      {
        id: revId, documentId: docId, rev: rev.trim().toUpperCase(), initialProjectId: project,
        openedDate, dueDate, releasedDate: '', receivedDate: '', closedDate: '', nextAction, url, status,
      },
    )
    if (!isDrawing && tccaId) linkRevision(tccaId, revId)
    onSaved?.(`${number.trim()} rev ${rev.trim().toUpperCase()} created.`)
    close()
  }

  const noun = isDrawing ? 'Drawing' : 'Deliverable'
  const title_ = isEdit ? `Edit ${noun} ${initial.number}` : `Add ${noun}`

  return (
    <>
      <Drawer
        open
        onClose={requestClose}
        title={title_}
        footer={
          <>
            <div className="flex gap-sm">
              <Button variant="secondary" onClick={requestClose}>Cancel</Button>
              <Button onClick={submit}>{isEdit ? 'Save Changes' : `Create ${noun}`}</Button>
            </div>
          </>
        }
      >
        <FormSection
          title={isDrawing ? 'Drawing' : 'Document'}
          subtitle="Number, title, type and owner live at the document level, everything else belongs to its revisions."
        >
          <FormField label="Number" htmlFor="doc-number" required error={errors.number} help={`e.g. ${numberHint}`}>
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
            <PersonSelect id="doc-owner" value={owner} error={!!errors.owner} people={PEOPLE}
              onChange={set(setOwner, 'owner')} />
          </FormField>
          {isDrawing && (
            <>
              <FormField label="Aircraft Type" htmlFor="doc-aircraft" help="So the drawing can be found and reused on future projects.">
                <Input id="doc-aircraft" value={aircraft} placeholder="e.g. King Air 350" onChange={(e) => set(setAircraft)(e.target.value)} />
              </FormField>
              <FormField label="ATA Chapter" htmlFor="doc-ata" help="e.g. 25-10, equipment/furnishings, cockpit.">
                <Input id="doc-ata" value={ataChapter} placeholder="e.g. 25-10" onChange={(e) => set(setAtaChapter)(e.target.value)} />
              </FormField>
            </>
          )}
        </FormSection>

        {/* Editing never touches revisions: they are tracked individually by
            law, so each one is opened and saved on its own. */}
        {isEdit ? (
          <FormSection title="Revisions" subtitle={`Revisions of this ${label.singular} are edited one at a time from the table's Actions menu.`}>
            <p className="text-sm text-text-secondary">
              Every revision is tracked separately, so this form only changes the {label.singular} itself —
              its number, title, type and owner. Dates, status and next action belong to a revision.
            </p>
          </FormSection>
        ) : (
          <FormSection title="Initial Revision" subtitle="A document can't exist without a revision. This creates rev A.">
            {/* A revision is always created *for* a project, so it is picked
                here — it can be linked to further projects afterwards. */}
            <FormField label="Project" htmlFor="doc-project" required error={errors.project}
              help="The project this first revision is created for. It can be linked to other projects afterwards.">
              <SearchableSelect
                id="doc-project" value={project} onChange={set(setProject, 'project')}
                error={!!errors.project} options={projectOptions}
                placeholder="Search projects by number, title or company..."
                emptyLabel="No projects exist yet."
              />
            </FormField>
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
              <PersonSelect id="rev-next" value={nextAction} error={!!errors.nextAction} people={PEOPLE}
                onChange={set(setNextAction, 'nextAction')} />
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
                help="Optional, links this revision to the Transport Canada project it's created for.">
                <Select id="rev-tcca" value={tccaId} placeholder="Not for a TCCA project" onChange={(e) => set(setTccaId)(e.target.value)}>
                  <option value="">Not for a TCCA project</option>
                  {linkedTcca.map((t) => <option key={t.id} value={t.id}>{t.number} — {t.description}</option>)}
                </Select>
              </FormField>
            )}
          </FormSection>
        )}
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
