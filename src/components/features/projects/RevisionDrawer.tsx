import { useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { Drawer } from '@/components/patterns/Drawer'
import { FormSection } from '@/components/patterns/FormSection'
import { FormField } from '@/components/patterns/FormField'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { PersonSelect } from '@/components/ui/PersonSelect'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { UrlField, isOpenableUrl } from '@/components/patterns/UrlField'
import { SortableTh } from '@/components/patterns/SortableTh'
import { useTableSort } from '@/components/patterns/useTableSort'
import { PersonCell } from '@/components/patterns/PersonCell'
import { useDocumentsStore } from '@/stores/documentsStore'
import { useProjectsStore } from '@/stores/projectsStore'
import { useTccaStore } from '@/stores/tccaStore'
import { nextRevLetter, REVISION_STATUS_LABEL, REVISION_STATUS_TONE } from '@/lib/documentDisplay'
import { PEOPLE } from '@/lib/projectFixtures'
import type { DocRevision, ProjectDocument, RevisionStatus } from '@/types/documents'
import { useProjectLabel } from './useProjectLabel'
import { DateText } from '@/components/patterns/DateText'

export interface RevisionDrawerProps {
  document: ProjectDocument
  /** Fixed project context (a project's tab). Omit in the Documents workspace,
      where the project a new revision is created for is picked in the form. */
  projectId?: string
  /** Edit an existing revision instead of creating the next one. */
  initial?: DocRevision
  onClose: () => void
  /** Toast copy for the caller, e.g. `DRW-3200-103 rev B added.` */
  onSaved?: (message: string) => void
}

const today = () => new Date().toISOString().slice(0, 10)

/** Add the next revision to an existing document (with its revision history
    visible — "you should be able to see that revisions already exist"), or
    edit one revision's tracking. */
type RevisionSortKey = 'rev' | 'opened' | 'due' | 'closed' | 'nextAction' | 'status' | 'file'

const REVISION_COLUMNS: { label: string; sort?: RevisionSortKey }[] = [
  { label: 'Rev', sort: 'rev' },
  { label: 'Opened', sort: 'opened' },
  { label: 'Due', sort: 'due' },
  { label: 'Closed', sort: 'closed' },
  { label: 'Next Action', sort: 'nextAction' },
  { label: 'Status', sort: 'status' },
  { label: 'File', sort: 'file' },
]

export function RevisionDrawer({ document, projectId, initial, onClose, onSaved }: RevisionDrawerProps) {
  const label = useProjectLabel(projectId ?? '')
  const revisions = useDocumentsStore((s) => s.revisions)
  const addRevision = useDocumentsStore((s) => s.addRevision)
  const updateRevision = useDocumentsStore((s) => s.updateRevision)
  const projects = useProjectsStore((s) => s.rows)
  const tccaProjects = useTccaStore((s) => s.tccaProjects)
  const linkRevisionToTcca = useTccaStore((s) => s.linkRevision)

  const isEdit = !!initial
  const existing = revisions.filter((r) => r.documentId === document.id)

  const { sorted: sortedRevisions, sort, setSort } = useTableSort(existing, {
    rev: (r) => r.rev,
    opened: (r) => r.openedDate,
    due: (r) => r.dueDate,
    closed: (r) => r.closedDate,
    nextAction: (r) => r.nextAction,
    status: (r) => REVISION_STATUS_LABEL[r.status],
    file: (r) => (isOpenableUrl(r.url) ? r.url : null),
  })
  const suggested = nextRevLetter(existing.map((r) => r.rev))

  // Workspace mode has no project context; default to whichever project the
  // document's existing revisions were created for, since a new revision of
  // the same document almost always continues the same work.
  const [project, setProject] = useState(projectId ?? initial?.initialProjectId ?? existing[0]?.initialProjectId ?? '')
  const effectiveProject = projectId ?? project
  const linkedTcca = tccaProjects.filter((t) => effectiveProject && t.projectIds.includes(effectiveProject))
  const projectOptions = projects.map((p) => ({
    value: p.id,
    label: `${p.number}-${p.subNumber}: ${p.title}`,
    hint: p.companyName || undefined,
  }))

  /* Blank with the suggested letter as the placeholder — the box shows
     what it will use, and a blank submit takes it. */
  const [rev, setRev] = useState(initial?.rev ?? '')
  const [openedDate, setOpenedDate] = useState(initial?.openedDate ?? today())
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? '')
  const [releasedDate, setReleasedDate] = useState(initial?.releasedDate ?? '')
  const [receivedDate, setReceivedDate] = useState(initial?.receivedDate ?? '')
  const [closedDate, setClosedDate] = useState(initial?.closedDate ?? '')
  const [nextAction, setNextAction] = useState(initial?.nextAction ?? '')
  const [status, setStatus] = useState<RevisionStatus | ''>(initial?.status ?? '')
  const [url, setUrl] = useState(initial?.url ?? '')
  const [tccaId, setTccaId] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const submit = () => {
    const e: Record<string, string> = {}
    const revValue = (rev.trim() || suggested).toUpperCase()
    if (!isEdit && existing.some((r) => r.rev === revValue))
      e.rev = `Rev ${revValue} already exists, suggested next is ${suggested}.`
    if (!status) e.status = 'Status is required.'
    if (!isEdit && !effectiveProject) e.project = 'Choose the project this revision is created for.'
    setErrors(e)
    if (Object.values(e).some(Boolean)) return

    if (isEdit) {
      updateRevision(initial.id, { rev: revValue, openedDate, dueDate, releasedDate, receivedDate, closedDate, nextAction, status: status as RevisionStatus, url })
      onSaved?.(`${document.number} rev ${revValue} saved.`)
    } else {
      const revId = crypto.randomUUID()
      addRevision({
        id: revId, documentId: document.id, rev: revValue, initialProjectId: effectiveProject,
        openedDate, dueDate, releasedDate, receivedDate, closedDate, nextAction, url,
        status: status as RevisionStatus,
      })
      if (document.kind === 'deliverable' && tccaId) linkRevisionToTcca(tccaId, revId)
      onSaved?.(`${document.number} rev ${revValue} added.`)
    }
    onClose()
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title={
        isEdit
          ? `Edit Revision ${document.number} rev ${initial.rev}${label ? `: ${label}` : ''}`
          : `Add Revision to ${document.number}${label ? `: ${label}` : ''}`
      }
      footer={
        <>
          <div className="flex gap-sm">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button onClick={submit}>{isEdit ? 'Save Changes' : 'Add Revision'}</Button>
          </div>
        </>
      }
    >
      {!isEdit && (
        <FormSection title="Previous revisions" subtitle={document.title}>
          {/* The same facts the workspace table shows, so deciding what the
              next revision needs doesn't mean closing this and going back. */}
          <div className="overflow-x-auto rounded-sm border border-border-default">
            <table className="w-full border-collapse text-left">
              <caption className="sr-only">Revisions that already exist of {document.number}</caption>
              <thead>
                <tr className="border-b border-border-default bg-neutral-50">
                  {REVISION_COLUMNS.map((c) => (
                    <SortableTh key={c.label} sortKey={c.sort} sort={sort} onSortChange={setSort}
                      className="whitespace-nowrap px-base py-sm text-xs font-semibold text-text-secondary">{c.label}</SortableTh>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedRevisions.map((r) => (
                  <tr key={r.id} className="border-b border-border-default last:border-b-0">
                    <td className="whitespace-nowrap px-base py-sm text-sm font-semibold text-text-primary">{r.rev}</td>
                    <td className="px-base py-sm text-sm text-text-primary"><DateText value={r.openedDate} /></td>
                    <td className="px-base py-sm text-sm text-text-primary"><DateText value={r.dueDate} /></td>
                    <td className="px-base py-sm text-sm text-text-primary"><DateText value={r.closedDate} /></td>
                    <td className="px-base py-sm">
                      {r.nextAction ? <PersonCell name={r.nextAction} /> : <span className="text-sm text-text-muted">—</span>}
                    </td>
                    <td className="whitespace-nowrap px-base py-sm">
                      <Badge tone={REVISION_STATUS_TONE[r.status]}>{REVISION_STATUS_LABEL[r.status]}</Badge>
                    </td>
                    <td className="whitespace-nowrap px-base py-sm">
                      {isOpenableUrl(r.url)
                        ? (
                          <Button variant="tertiary" size="sm" leadingIcon={<ExternalLink size={14} />}
                            onClick={() => window.open(r.url.trim(), '_blank', 'noopener,noreferrer')}>
                            Go To
                          </Button>
                        )
                        : <span className="text-sm text-text-muted">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </FormSection>
      )}

      <FormSection title={isEdit ? 'Revision' : 'New revision'} subtitle="Every revision is tracked — a regulatory requirement.">
        {/* Workspace mode: a revision is always created *for* a project, so
            with no project context it has to be picked here. */}
        {!isEdit && !projectId && (
          <FormField label="Project" htmlFor="rd-project" required error={errors.project}
            help="Linkable to other projects afterwards.">
            <SearchableSelect
              id="rd-project" value={project} error={!!errors.project}
              onChange={(v) => { setProject(v); setErrors((p) => ({ ...p, project: '' })) }}
              options={projectOptions}
              placeholder="Search projects by number, title or company..."
              emptyLabel="No projects exist yet."
            />
          </FormField>
        )}
        <FormField label="Revision" htmlFor="rd-rev" required error={errors.rev}
          help={isEdit ? undefined : `Next in sequence is ${suggested}.`}>
          <Input id="rd-rev" value={rev} error={!!errors.rev} maxLength={2} placeholder={isEdit ? undefined : suggested}
            onChange={(e) => { setRev(e.target.value); setErrors((p) => ({ ...p, rev: '' })) }} />
        </FormField>
        <FormField label="Opened Date" htmlFor="rd-opened">
          <Input id="rd-opened" type="date" value={openedDate} onChange={(e) => setOpenedDate(e.target.value)} />
        </FormField>
        <FormField label="Due Date" htmlFor="rd-due">
          <Input id="rd-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </FormField>
        <FormField label="Released Date" htmlFor="rd-released">
          <Input id="rd-released" type="date" value={releasedDate} onChange={(e) => setReleasedDate(e.target.value)} />
        </FormField>
        <FormField label="Received Date" htmlFor="rd-received">
          <Input id="rd-received" type="date" value={receivedDate} onChange={(e) => setReceivedDate(e.target.value)} />
        </FormField>
        <FormField label="Closed Date" htmlFor="rd-closed">
          <Input id="rd-closed" type="date" value={closedDate} onChange={(e) => setClosedDate(e.target.value)} />
        </FormField>
        <FormField label="Next Action" htmlFor="rd-next" help="Optional — they see it on their to-do list.">
          <PersonSelect id="rd-next" value={nextAction} people={PEOPLE}
            onChange={(v) => { setNextAction(v); setErrors((p) => ({ ...p, nextAction: '' })) }} />
        </FormField>
        <FormField label="Status" htmlFor="rd-status" required error={errors.status}>
          <Select id="rd-status" value={status} error={!!errors.status} placeholder="Select a status..."
            onChange={(e) => { setStatus(e.target.value as RevisionStatus); setErrors((p) => ({ ...p, status: '' })) }}>
            {Object.entries(REVISION_STATUS_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </Select>
        </FormField>
        <FormField label="URL" htmlFor="rd-url" help="Optional — Go To opens it in a new tab.">
          <UrlField id="rd-url" value={url} onChange={setUrl} />
        </FormField>
        {!isEdit && document.kind === 'deliverable' && linkedTcca.length > 0 && (
          <FormField label="TCCA Project" htmlFor="rd-tcca" help="Optional — the TCCA project this is for.">
            <Select id="rd-tcca" value={tccaId} placeholder="Not for a TCCA project" onChange={(e) => setTccaId(e.target.value)}>
              <option value="">Not for a TCCA project</option>
              {linkedTcca.map((t) => <option key={t.id} value={t.id}>{t.number} — {t.description}</option>)}
            </Select>
          </FormField>
        )}
      </FormSection>
    </Drawer>
  )
}
