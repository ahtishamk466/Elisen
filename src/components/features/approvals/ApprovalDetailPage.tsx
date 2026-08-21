import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Award, FileText, Link2, Pencil, Plus, Trash2, Unlink,
} from 'lucide-react'
import { AppShell } from '@/components/patterns/AppShell'
import { StatCard } from '@/components/patterns/StatCard'
import { EmptyState } from '@/components/patterns/EmptyState'
import { ActionsMenu } from '@/components/patterns/ActionsMenu'
import { ConfirmDialog } from '@/components/patterns/ConfirmDialog'
import { DetailCard as Card, DetailField as Field } from '@/components/patterns/DetailView'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { ApprovalDrawer } from './ApprovalDrawer'
import { ApprovalRevisionDrawer } from './ApprovalRevisionDrawer'
import { useApprovalsStore } from '@/stores/approvalsStore'
import { useProjectsStore } from '@/stores/projectsStore'
import { useLookupStore } from '@/stores/lookupStore'
import type { ApprovalRevision } from '@/types/documents'
import { formatDate } from '@/lib/formatDate'
import { DateText } from '@/components/patterns/DateText'

const TABS = ['Overview', 'Revisions', 'Aircraft', 'Serial Numbers', 'Projects'] as const
type Tab = (typeof TABS)[number]

const REVISION_HEADERS = ['Revision', 'Change Description', 'Revision Date', 'Document', 'Actions']

/**
 * The Approval workspace — "keep Approval separate… Approval itself should have
 * a proper workspace, the way the project does… From there we can create a new
 * approval. We can add two aircraft in it. After that, inside it we can add more
 * revisions. Or aircraft or serial numbers can be added. Or a project, we can link
 * a project from there as well."
 *
 * That sentence is the whole page: one certificate, its revision history, the
 * aircraft and airframes it covers, and the projects that reference it — with
 * project linking working from this side as well as from the project's tab.
 */
export function ApprovalDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const approvals = useApprovalsStore((s) => s.approvals)
  const allRevisions = useApprovalsStore((s) => s.revisions)
  const {
    updateApproval, removeApproval, removeRevision,
    linkToProject, unlinkFromProject,
    linkAircraft, unlinkAircraft, linkSerial, unlinkSerial,
  } = useApprovalsStore()
  const projects = useProjectsStore((s) => s.rows)
  const catalog = useLookupStore((s) => s.aircraft)
  const serials = useLookupStore((s) => s.serials)

  const [tab, setTab] = useState<Tab>('Overview')
  const [editing, setEditing] = useState(false)
  const [revDrawer, setRevDrawer] = useState<{ revision?: ApprovalRevision } | null>(null)
  const [deletingRev, setDeletingRev] = useState<ApprovalRevision | null>(null)
  const [deletingApproval, setDeletingApproval] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [projectChoice, setProjectChoice] = useState('')
  const [aircraftChoice, setAircraftChoice] = useState('')
  const [serialChoice, setSerialChoice] = useState('')

  const approval = approvals.find((a) => a.id === id)

  const revisions = useMemo(
    () => allRevisions.filter((r) => r.approvalId === id).sort((a, b) => b.revision - a.revision),
    [allRevisions, id],
  )

  if (!approval) {
    return (
      <AppShell title="Approval not found" activeItem="Approvals" activeChild="Approvals List">
        <EmptyState
          icon={<Award size={48} strokeWidth={1.5} />}
          title="Approval not found"
          description="This certificate may have been deleted, or the link is out of date."
          action={<Button variant="secondary" onClick={() => navigate('/approvals')}>Back to Approvals</Button>}
        />
      </AppShell>
    )
  }

  const linkedAircraft = approval.aircraftIds
    .map((aid) => catalog.find((a) => a.id === aid))
    .filter((a): a is NonNullable<typeof a> => !!a)
  const linkedSerials = approval.serialIds
    .map((sid) => serials.find((s) => s.id === sid))
    .filter((s): s is NonNullable<typeof s> => !!s)
  const linkedProjects = approval.projectIds
    .map((pid) => projects.find((p) => p.id === pid))
    .filter((p): p is NonNullable<typeof p> => !!p)

  /** Serials of models this certificate actually covers — offering a tail under
      an uncovered model would record something meaningless. */
  const serialOptions = serials
    .filter((sn) => approval.aircraftIds.includes(sn.aircraftId))
    .map((sn) => ({
      value: sn.id,
      label: sn.registration ? `${sn.serial}: ${sn.registration}` : sn.serial,
      hint: catalog.find((a) => a.id === sn.aircraftId)?.modelNumber,
      disabled: approval.serialIds.includes(sn.id),
      disabledReason: 'Already on this approval',
    }))

  const latestRevision = revisions[0]

  return (
    <AppShell
      title={`${approval.number}: ${approval.description}`}
      activeItem="Approvals"
      activeChild="Approvals List"
      headerActions={
        <>
          <Button variant="secondary" leadingIcon={<Pencil size={16} />} onClick={() => setEditing(true)}>
            Edit approval
          </Button>
          <Button leadingIcon={<Plus size={16} />} onClick={() => setRevDrawer({})}>
            Raise revision
          </Button>
          <ActionsMenu
            ariaLabel={`More actions for ${approval.number}`}
            items={[
              { label: 'Delete approval', icon: <Trash2 size={16} />, onSelect: () => setDeletingApproval(true), tone: 'danger' },
            ]}
          />
        </>
      }
    >
      <div className="grid gap-lg">
        {toast && <Alert tone="info" title={toast} />}

        <button
          type="button"
          onClick={() => navigate('/approvals')}
          className="inline-flex items-center gap-sm self-start rounded-sm text-sm text-text-secondary transition-colors duration-fast hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
        >
          <ArrowLeft size={16} aria-hidden /> Back to all approvals
        </button>

        {/* Four counts, same compact tiles as the Project List header. */}
        <div className="grid gap-lg mobile:grid-cols-2 laptop:grid-cols-4">
          <StatCard value={revisions.length} label="Revisions" />
          <StatCard value={linkedAircraft.length} label="Aircraft covered" />
          <StatCard value={linkedSerials.length} label="Serial numbers" />
          <StatCard value={linkedProjects.length} label="Projects linked" />
        </div>

        <div className="grid gap-lg laptop:grid-cols-[300px_1fr]">
          <aside className="rounded-sm border border-border-default bg-neutral-25 p-lg">
            <p className="text-xl font-bold text-text-primary">{approval.number}</p>
            <p className="mt-xxss text-sm text-text-secondary">{approval.description}</p>
            <div className="mt-base flex flex-wrap gap-xs">
              <Badge tone={approval.primary ? 'info' : 'neutral'}>
                {approval.primary ? 'Primary approval' : 'Change approval'}
              </Badge>
              <Badge tone={approval.active ? 'success' : 'neutral'}>
                {approval.active ? 'Active' : 'Inactive'}
              </Badge>
            </div>

            <div className="mt-lg border-t border-border-default pt-lg">
              <Field label="Design Approval Holder">{approval.designApprovalHolder || '—'}</Field>
            </div>
            {latestRevision && (
              <div className="mt-lg border-t border-border-default pt-lg">
                <Field label="Latest revision" nowrap>
                  Rev {latestRevision.revision} · {formatDate(latestRevision.revisionDate)}
                </Field>
              </div>
            )}
            {approval.comment && (
              <div className="mt-lg border-t border-border-default pt-lg">
                <Field label="Comment">{approval.comment}</Field>
              </div>
            )}
          </aside>

          <div className="grid content-start gap-lg">
            <nav className="flex gap-lg overflow-x-auto rounded-sm border border-border-default bg-neutral-25 px-lg" aria-label="Approval sections">
              {TABS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  aria-current={tab === t ? 'page' : undefined}
                  className={`whitespace-nowrap border-b-2 py-base text-sm transition-colors duration-fast focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary
                    ${tab === t ? 'border-text-primary font-semibold text-text-primary' : 'border-transparent text-text-muted hover:text-text-primary'}`}
                >
                  {t}
                </button>
              ))}
            </nav>

            {tab === 'Overview' ? (
              <div className="grid gap-lg">
                <Card title="Certificate" onEdit={() => setEditing(true)}>
                  <div className="grid grid-cols-2 gap-lg tablet:grid-cols-3">
                    <Field label="Number" nowrap>{approval.number}</Field>
                    <Field label="Primary Approval">{approval.primary ? 'Yes' : 'No'}</Field>
                    <Field label="Design Approval Holder">{approval.designApprovalHolder || '—'}</Field>
                    <Field label="Description">{approval.description}</Field>
                    <Field label="Status">{approval.active ? 'Active' : 'Inactive'}</Field>
                    <Field label="Comment">{approval.comment || '—'}</Field>
                  </div>
                </Card>

                {/* An approval has no date of its own — its first revision is when
                    it was granted, its latest is where it stands now. */}
                <Card title="Revision history">
                  {revisions.length === 0 ? (
                    <p className="text-sm text-text-muted">
                      No revisions recorded yet. A certificate is granted by its first revision, raise revision 1 to record it.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-lg tablet:grid-cols-3">
                      <Field label="First issued" nowrap>{revisions[revisions.length - 1].revisionDate}</Field>
                      <Field label="Current revision" nowrap>Rev {latestRevision.revision}</Field>
                      <Field label="Current revision date" nowrap>{formatDate(latestRevision.revisionDate)}</Field>
                      <Field label="Latest change">{latestRevision.changeDescription}</Field>
                    </div>
                  )}
                </Card>
              </div>
            ) : tab === 'Revisions' ? (
              <div className="grid gap-lg">
                <div className="flex flex-wrap items-center justify-between gap-sm">
                  <p className="text-sm text-text-secondary">
                    {revisions.length} revision{revisions.length === 1 ? '' : 's'} — each one a change to this
                    certificate, newest first.
                  </p>
                  <Button leadingIcon={<Plus size={16} />} onClick={() => setRevDrawer({})}>Raise revision</Button>
                </div>

                {revisions.length === 0 ? (
                  <div className="rounded-sm border border-border-default bg-neutral-25">
                    <EmptyState
                      icon={<FileText size={48} strokeWidth={1.5} />}
                      title="No revisions recorded yet"
                      description="A certificate is granted by its first revision. Raise revision 1 to record when it was granted and what it covered."
                      action={<Button leadingIcon={<Plus size={16} />} onClick={() => setRevDrawer({})}>Raise revision</Button>}
                    />
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-sm border border-border-default bg-neutral-25">
                    <table className="w-full border-collapse text-left" style={{ minWidth: 820 }}>
                      <caption className="sr-only">Revisions of {approval.number}</caption>
                      <thead>
                        <tr className="border-b border-border-default bg-neutral-50">
                          {REVISION_HEADERS.map((h) => (
                            <th key={h} scope="col" className="whitespace-nowrap px-lg py-base text-sm font-semibold text-text-secondary">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {revisions.map((r) => (
                          <tr key={r.id} className="border-b border-border-default transition-colors duration-fast last:border-b-0 hover:bg-neutral-50">
                            <td className="whitespace-nowrap px-lg py-base align-top">
                              <Badge appearance="outline">Rev {r.revision}</Badge>
                            </td>
                            <td className="px-lg py-base align-top text-sm text-text-primary" style={{ maxWidth: 380 }}>
                              {r.changeDescription}
                            </td>
                            <td className="px-lg py-base align-top text-sm text-text-primary"><DateText value={r.revisionDate} /></td>
                            <td className="px-lg py-base align-top text-sm text-text-primary">
                              {r.document
                                ? <span className="inline-flex items-center gap-xs"><FileText size={14} aria-hidden />{r.document}</span>
                                : <span className="text-text-muted">—</span>}
                            </td>
                            <td className="px-lg py-base align-top">
                              <ActionsMenu
                                ariaLabel={`Actions for revision ${r.revision}`}
                                items={[
                                  { label: 'Edit revision', icon: <Pencil size={16} />, onSelect: () => setRevDrawer({ revision: r }) },
                                  { label: 'Delete revision', icon: <Trash2 size={16} />, onSelect: () => setDeletingRev(r), tone: 'danger' },
                                ]}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : tab === 'Aircraft' ? (
              <AssignList
                summary={`${linkedAircraft.length} aircraft covered by this certificate`}
                emptyTitle="No aircraft on this approval"
                emptyDescription="Select an aircraft below to record that this certificate covers it. Aircraft models are managed in Reference Data."
                selectId="ap-link-aircraft"
                selectLabel="Select an aircraft to add"
                selectHelp="From Reference Data. A revision is what authorises extending a certificate to further aircraft."
                placeholder="Search aircraft by model or manufacturer..."
                emptyLabel="No aircraft in Reference Data yet."
                options={catalog
                  .filter((a) => a.active || approval.aircraftIds.includes(a.id))
                  .map((a) => ({
                    value: a.id,
                    label: a.modelName ? `${a.modelNumber}: ${a.modelName}` : a.modelNumber,
                    hint: a.manufacturer,
                    disabled: approval.aircraftIds.includes(a.id),
                    disabledReason: 'Already on this approval',
                  }))}
                choice={aircraftChoice}
                onChoice={setAircraftChoice}
                onAdd={() => {
                  linkAircraft(approval.id, aircraftChoice)
                  const m = catalog.find((a) => a.id === aircraftChoice)
                  setToast(`${m?.modelNumber ?? 'Aircraft'} added to ${approval.number}.`)
                  setAircraftChoice('')
                }}
                rows={linkedAircraft.map((a) => ({
                  id: a.id,
                  primary: a.modelNumber,
                  secondary: [a.modelName, a.manufacturer].filter(Boolean).join(' · '),
                  onRemove: () => {
                    // Serials of a model the approval no longer covers would be
                    // orphaned, so they go with it.
                    serials.filter((sn) => sn.aircraftId === a.id).forEach((sn) => unlinkSerial(approval.id, sn.id))
                    unlinkAircraft(approval.id, a.id)
                    setToast(`${a.modelNumber} removed from ${approval.number}.`)
                  },
                  removeLabel: 'Remove from approval',
                }))}
              />
            ) : tab === 'Serial Numbers' ? (
              <AssignList
                summary={`${linkedSerials.length} airframe${linkedSerials.length === 1 ? '' : 's'} named on this certificate`}
                emptyTitle="No serial numbers on this approval"
                emptyDescription={approval.aircraftIds.length === 0
                  ? 'Add an aircraft first. Serials are listed per model.'
                  : 'Optional. An approval often covers a type generally, with specific airframes named as they are fitted.'}
                selectId="ap-link-serial"
                selectLabel="Select a serial number to add"
                selectHelp="Only serials of the aircraft this certificate covers are offered."
                placeholder={approval.aircraftIds.length === 0 ? 'Add an aircraft first' : 'Search by serial or registration...'}
                emptyLabel="No serials recorded for the covered aircraft."
                options={serialOptions}
                choice={serialChoice}
                onChoice={setSerialChoice}
                onAdd={() => {
                  linkSerial(approval.id, serialChoice)
                  const sn = serials.find((s) => s.id === serialChoice)
                  setToast(`S/N ${sn?.serial ?? ''} added to ${approval.number}.`)
                  setSerialChoice('')
                }}
                rows={linkedSerials.map((sn) => ({
                  id: sn.id,
                  primary: sn.registration ? `${sn.serial}: ${sn.registration}` : sn.serial,
                  secondary: catalog.find((a) => a.id === sn.aircraftId)?.modelNumber ?? '',
                  onRemove: () => { unlinkSerial(approval.id, sn.id); setToast(`S/N ${sn.serial} removed from ${approval.number}.`) },
                  removeLabel: 'Remove from approval',
                }))}
              />
            ) : (
              /* The gap this page closes: linking a project from the approval
                 side. Same two store verbs the project's Approvals tab calls,
                 so the two directions can never disagree. */
              <AssignList
                summary={`${linkedProjects.length} project${linkedProjects.length === 1 ? '' : 's'} linked to this certificate`}
                emptyTitle="No projects linked to this certificate"
                emptyDescription="Select a project below, or link this certificate from the project's own Approvals tab. Both do the same thing."
                selectId="ap-link-project"
                selectLabel="Select a project to link"
                selectHelp="One certificate can serve several projects, a change project references the STC it amends."
                placeholder="Search projects by number, title or company..."
                emptyLabel="No projects exist yet."
                options={projects.map((p) => ({
                  value: p.id,
                  label: `${p.number}-${p.subNumber}: ${p.title}`,
                  hint: p.companyName || undefined,
                  disabled: approval.projectIds.includes(p.id),
                  disabledReason: 'Already linked to this approval',
                }))}
                choice={projectChoice}
                onChoice={setProjectChoice}
                addLabel="Link to approval"
                onAdd={() => {
                  linkToProject(approval.id, projectChoice)
                  const p = projects.find((x) => x.id === projectChoice)
                  setToast(`${p ? `${p.number}-${p.subNumber}` : 'Project'} linked to ${approval.number}.`)
                  setProjectChoice('')
                }}
                rows={linkedProjects.map((p) => ({
                  id: p.id,
                  primary: `${p.number}-${p.subNumber}`,
                  secondary: [p.title, p.companyName].filter(Boolean).join(' · '),
                  href: `/projects/${p.id}`,
                  onRemove: () => {
                    unlinkFromProject(approval.id, p.id)
                    setToast(`${p.number}-${p.subNumber} unlinked from ${approval.number}.`)
                  },
                  removeLabel: 'Unlink from approval',
                }))}
              />
            )}
          </div>
        </div>
      </div>

      {editing && (
        <ApprovalDrawer
          key={approval.id}
          initial={approval}
          onClose={() => setEditing(false)}
          onSave={(a) => { updateApproval(approval.id, a); setToast(`${a.number} saved.`) }}
        />
      )}
      {revDrawer && (
        <ApprovalRevisionDrawer
          key={revDrawer.revision?.id ?? 'new'}
          approval={approval}
          initial={revDrawer.revision}
          onClose={() => setRevDrawer(null)}
          onSaved={setToast}
        />
      )}

      <ConfirmDialog
        open={!!deletingRev}
        title="Delete this revision?"
        description={deletingRev
          ? `Revision ${deletingRev.revision} of ${approval.number} will be permanently removed from the certificate's history. This can't be undone.`
          : ''}
        confirmLabel="Delete revision"
        tone="danger"
        onConfirm={() => {
          if (deletingRev) { removeRevision(deletingRev.id); setToast(`${approval.number} revision ${deletingRev.revision} deleted.`) }
          setDeletingRev(null)
        }}
        onCancel={() => setDeletingRev(null)}
      />

      <ConfirmDialog
        open={deletingApproval}
        title="Delete this approval?"
        description={`${approval.number}, its ${revisions.length} revision${revisions.length === 1 ? '' : 's'} and its coverage will be permanently removed${
          approval.projectIds.length > 0 ? `, and unlinked from ${approval.projectIds.length} project${approval.projectIds.length === 1 ? '' : 's'}` : ''
        }. This can't be undone.`}
        confirmLabel="Delete approval"
        tone="danger"
        onConfirm={() => { removeApproval(approval.id); navigate('/approvals') }}
        onCancel={() => setDeletingApproval(false)}
      />
    </AppShell>
  )
}

interface AssignRow {
  id: string
  primary: string
  secondary: string
  href?: string
  onRemove: () => void
  removeLabel: string
}

/**
 * The approval's three assign lists share one shape — list what is on the
 * certificate, plus a select-and-add row underneath. Local to this page on
 * purpose: it exists to stop Aircraft, Serial Numbers and Projects drifting
 * apart, not as a general abstraction.
 */
function AssignList({
  summary, emptyTitle, emptyDescription,
  selectId, selectLabel, selectHelp, placeholder, emptyLabel, options,
  choice, onChoice, onAdd, addLabel = 'Add to approval', rows,
}: {
  summary: string
  emptyTitle: string
  emptyDescription: string
  selectId: string
  selectLabel: string
  selectHelp: string
  placeholder: string
  emptyLabel: string
  options: { value: string; label: string; hint?: string; disabled?: boolean; disabledReason?: string }[]
  choice: string
  onChoice: (v: string) => void
  onAdd: () => void
  addLabel?: string
  rows: AssignRow[]
}) {
  return (
    <div className="grid gap-lg">
      {rows.length === 0 ? (
        <div className="rounded-sm border border-border-default bg-neutral-25">
          <EmptyState icon={<Award size={48} strokeWidth={1.5} />} title={emptyTitle} description={emptyDescription} />
        </div>
      ) : (
        <>
          <p className="text-sm text-text-secondary">{summary}</p>
          <ul className="grid gap-sm rounded-sm border border-border-default bg-neutral-25 p-lg">
            {rows.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-lg border-b border-border-default pb-sm last:border-b-0 last:pb-0">
                <div className="min-w-0">
                  {r.href ? (
                    <Link to={r.href} className="text-sm font-semibold text-text-primary underline-offset-2 hover:text-accent hover:underline">
                      {r.primary}
                    </Link>
                  ) : (
                    <p className="text-sm font-semibold text-text-primary">{r.primary}</p>
                  )}
                  {r.secondary && <p className="truncate text-xs text-text-muted">{r.secondary}</p>}
                </div>
                <Button variant="tertiary" size="sm" leadingIcon={<Unlink size={16} />} onClick={r.onRemove}>
                  {r.removeLabel}
                </Button>
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="grid gap-sm rounded-sm border border-border-default bg-neutral-25 p-lg">
        <div className="grid gap-xxss">
          <label htmlFor={selectId} className="text-sm font-semibold text-text-primary">{selectLabel}</label>
          <p className="text-xs text-text-muted">{selectHelp}</p>
        </div>
        <div className="flex flex-wrap items-center gap-sm">
          <div className="min-w-0 flex-1" style={{ minWidth: 260 }}>
            <SearchableSelect
              id={selectId} size="sm" value={choice} onChange={onChoice}
              placeholder={placeholder} emptyLabel={emptyLabel} options={options}
            />
          </div>
          <Button leadingIcon={<Link2 size={16} />} onClick={onAdd} disabled={!choice}>{addLabel}</Button>
        </div>
      </div>
    </div>
  )
}
