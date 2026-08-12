import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, Copy, Trash2, Users, CalendarDays, DollarSign, Clock, Check, Minus } from 'lucide-react'
import { AppShell } from '@/components/patterns/AppShell'
import { EmptyState } from '@/components/patterns/EmptyState'
import { ActionsMenu } from '@/components/patterns/ActionsMenu'
import { ConfirmDialog } from '@/components/patterns/ConfirmDialog'
import { ReportCard } from '@/components/patterns/ReportCard'
import { DetailCard as Card, DetailField as Field } from '@/components/patterns/DetailView'
import { Avatar } from '@/components/patterns/Avatar'
import { Badge } from '@/components/ui/Badge'
import { useProjectsStore } from '@/stores/projectsStore'
import { useTccaStore } from '@/stores/tccaStore'
import { deliverableSummaries, useDocumentsStore } from '@/stores/documentsStore'
import { getNextProjectNumber } from '@/lib/projectFixtures'
import { PRIORITY_LABEL, PRIORITY_TONE, STATUS_LABEL, STATUS_TONE, TYPE_LABEL } from '@/lib/projectDisplay'
import { PENDING_REPORTS } from '@/lib/pendingReports'
import { downloadCompletionChecklist } from '@/lib/pccReport'
import { AddProjectDrawer } from './AddProjectDrawer'
import { ProposalEditDrawer } from './ProposalEditDrawer'
import { NotesEditDrawer } from './NotesEditDrawer'
import { AircraftEditDrawer } from './AircraftEditDrawer'
import { ProjectTccaTab } from '@/components/features/tcca/ProjectTccaTab'
import { ProjectWorkPackagesTab } from './ProjectWorkPackagesTab'
import { ProjectDocumentsTab } from './ProjectDocumentsTab'
import { ProjectApprovalsTab } from './ProjectApprovalsTab'
import type { ProjectListRow, ScopeKey } from '@/types/project'
import type { DeliverableRevision } from '@/types/tcca'
import type { AddProjectValues } from './useAddProjectForm'

const TABS = ['Overview', 'Work Packages', 'Deliverables', 'Design Data', 'TCCA', 'Approvals'] as const
type Tab = (typeof TABS)[number]

const SCOPES: { key: ScopeKey; label: string }[] = [
  { key: 'design', label: 'Design' },
  { key: 'validation', label: 'Validation' },
  { key: 'certification', label: 'Certification' },
  { key: 'parts-kit', label: 'Parts kit' },
  { key: 'aircraft-mod', label: 'Aircraft mod' },
]

/** The project-level actions menu opens the full edit wizard at step 1. */
const STEP_BASIC = 0

function rowToInitialValues(row: ProjectListRow): Partial<AddProjectValues> {
  return {
    number: row.number,
    subNumber: row.subNumber,
    type: row.type,
    priority: row.priority,
    description: row.title,
    company: row.companyName,
    contact: row.contactName === '—' ? '' : row.contactName,
    personResponsible: row.personResponsible,
    scope: row.scope,
    contractCurrency: row.contractCurrency,
    contractValue: row.contractValue,
    status: row.status,
    openedDate: row.openedDate,
    dueDate: row.dueDate,
    aircraftInputDate: row.aircraftInputDate,
    closedDate: row.closedDate,
    proposalSubmitted: row.proposalSubmitted,
    proposalSubmittedDate: row.proposalSubmittedDate,
    proposalAccepted: row.proposalAccepted,
    proposalAcceptedDate: row.proposalAcceptedDate,
    nextAction: row.nextAction,
    comments: row.comments,
  }
}

export function ProjectDetailPage({ canSeeFinancials = true }: { canSeeFinancials?: boolean }) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const rows = useProjectsStore((s) => s.rows)
  const addRow = useProjectsStore((s) => s.addRow)
  const updateRow = useProjectsStore((s) => s.updateRow)
  const removeRow = useProjectsStore((s) => s.removeRow)

  const tccaProjects = useTccaStore((s) => s.tccaProjects)
  const docLinks = useTccaStore((s) => s.docLinks)
  const documents = useDocumentsStore((s) => s.documents)
  const docRevisions = useDocumentsStore((s) => s.revisions)

  const row = rows.find((r) => r.id === id)
  const [tab, setTab] = useState<Tab>('Overview')
  /** null = closed; number = open at that step. */
  const [editStep, setEditStep] = useState<number | null>(null)
  /** Proposal/Notes/Aircraft each get their own focused edit drawer instead
      of the shared multi-field step. */
  const [activeDrawer, setActiveDrawer] = useState<'proposal' | 'notes' | 'aircraft' | null>(null)
  const [deleting, setDeleting] = useState(false)

  if (!row) {
    return (
      <AppShell title="Project not found">
        <EmptyState
          title="Project not found"
          description="This project may have been deleted, or the link is out of date."
          action={
            <button
              type="button"
              onClick={() => navigate('/projects')}
              className="text-sm font-semibold text-accent underline-offset-2 hover:underline"
            >
              Back to Projects List
            </button>
          }
        />
      </AppShell>
    )
  }

  const handleDuplicate = () => {
    const number = getNextProjectNumber(rows)
    addRow({ ...row, id: crypto.randomUUID(), number, subNumber: '00', title: `${row.title} (Copy)`, actualHours: 0, status: 'quoted' })
    navigate('/projects')
  }

  const linkedTcca = tccaProjects.filter((t) => t.projectIds.includes(row.id))
  const generatePcc = () => {
    const tcca = linkedTcca[0]
    if (!tcca) return
    const revisions = deliverableSummaries(documents, docRevisions)
    const links = docLinks
      .filter((l) => l.tccaProjectId === tcca.id)
      .map((link) => ({ link, revision: revisions.find((r) => r.id === link.revisionId) }))
      .filter((x): x is { link: typeof x.link; revision: DeliverableRevision } => !!x.revision)
    downloadCompletionChecklist(tcca, [row], links)
  }

  const hoursPct = Math.min(100, (row.actualHours / Math.max(1, row.budgetHours)) * 100)

  return (
    <AppShell
      title={`${row.number}-${row.subNumber}`}
      headerLeft={
        <button
          type="button"
          onClick={() => navigate('/projects')}
          className="inline-flex items-center gap-sm rounded-sm text-sm text-text-secondary transition-colors duration-fast hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
        >
          <ArrowLeft size={18} aria-hidden />
          Go back to all projects
        </button>
      }
    >
      <div className="grid gap-lg">
        <div className="grid gap-lg laptop:grid-cols-[320px_1fr]">
          <aside className="h-fit rounded-sm border border-border-default bg-neutral-25 p-lg">
            <div className="flex items-start justify-between gap-sm">
              <p className="text-2xl font-bold leading-tight text-text-primary">{row.number}-{row.subNumber}</p>
              <ActionsMenu
                ariaLabel={`Actions for project ${row.number}-${row.subNumber}`}
                items={[
                  { label: 'Edit', icon: <Pencil size={16} />, onSelect: () => setEditStep(STEP_BASIC) },
                  { label: 'Duplicate', icon: <Copy size={16} />, onSelect: handleDuplicate },
                  { label: 'Delete', icon: <Trash2 size={16} />, onSelect: () => setDeleting(true), tone: 'danger' },
                ]}
              />
            </div>

            <p className="mt-sm text-sm text-text-secondary">{row.title}</p>
            <p className="mt-xs text-xs text-text-muted">{row.companyName} · {TYPE_LABEL[row.type]}</p>

            <div className="mt-base flex flex-wrap items-center gap-sm">
              <Badge tone={PRIORITY_TONE[row.priority]} appearance="outline">{PRIORITY_LABEL[row.priority]}</Badge>
              <Badge tone={STATUS_TONE[row.status]} appearance="outline" dot>{STATUS_LABEL[row.status]}</Badge>
            </div>

            <div className="mt-lg border-t border-border-default pt-lg">
              <p className="flex items-center gap-xs text-xs text-text-muted">
                <Clock size={14} aria-hidden /> Hours used
              </p>
              <p className="mt-xs text-base font-bold text-text-primary">
                {row.actualHours} / {row.budgetHours}
              </p>
              <div className="mt-sm h-xs w-full overflow-hidden rounded-full bg-neutral-100">
                <div
                  className={`h-full rounded-full ${row.actualHours > row.budgetHours ? 'bg-danger' : 'bg-warning'}`}
                  style={{ width: `${hoursPct}%` }}
                />
              </div>
            </div>

            <div className="mt-lg border-t border-border-default pt-lg">
              <p className="flex items-center gap-xs text-xs text-text-muted">
                <CalendarDays size={14} aria-hidden /> Due date
              </p>
              <p className="mt-xs text-base font-bold text-text-primary">{formatDate(row.dueDate)}</p>
            </div>

            {canSeeFinancials && (
              <div className="mt-lg border-t border-border-default pt-lg">
                <p className="flex items-center gap-xs text-xs text-text-muted">
                  <DollarSign size={14} aria-hidden /> Contract value
                </p>
                <p className="mt-xs text-base font-bold text-text-primary">
                  {row.contractValue
                    ? `${row.contractCurrency} ${Number(row.contractValue).toLocaleString()}`
                    : '—'}
                </p>
              </div>
            )}

            <div className="mt-lg border-t border-border-default pt-lg">
              <p className="flex items-center gap-xs text-xs text-text-muted">
                <Users size={14} aria-hidden /> People
              </p>
              <div className="mt-base grid gap-base">
                {row.contactName !== '—' && (
                  <div className="flex items-center gap-sm">
                    <Avatar name={row.contactName} tone="accent" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-text-primary">{row.contactName}</p>
                      {row.contactEmail ? (
                        <a
                          href={`mailto:${row.contactEmail}`}
                          className="block truncate text-xs text-text-muted hover:text-accent hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
                        >
                          Contact
                        </a>
                      ) : (
                        <p className="text-xs text-text-muted">Contact</p>
                      )}
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-sm">
                  <Avatar name={row.personResponsible} tone="success" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-text-primary">{row.personResponsible}</p>
                    <p className="text-xs text-text-muted">Person responsible</p>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <div className="grid content-start gap-lg">
            <nav className="flex gap-lg overflow-x-auto rounded-sm border border-border-default bg-neutral-25 px-lg" aria-label="Project sections">
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
                <Card title="Dates">
                  <div className="grid grid-cols-2 gap-lg tablet:grid-cols-3">
                    <Field label="Project opened date">{row.openedDate || '—'}</Field>
                    <Field label="Due date">{row.dueDate || '—'}</Field>
                    <Field label="Company Number">{row.companyNumber}</Field>
                    <Field label="Aircraft Input Date">{row.aircraftInputDate || '—'}</Field>
                    <Field label="Closed Date">{row.closedDate || '—'}</Field>
                  </div>
                </Card>

                <Card title="Scope">
                  <div className="flex flex-wrap gap-sm">
                    {SCOPES.map((s) => {
                      const on = row.scope.includes(s.key)
                      return (
                        <span
                          key={s.key}
                          className={`inline-flex items-center gap-xs rounded-sm px-sm py-xxss text-xs font-medium
                            ${on ? 'bg-success-subtle text-success' : 'bg-neutral-100 text-text-muted'}`}
                        >
                          {on ? <Check size={13} aria-hidden /> : <Minus size={13} aria-hidden />}
                          {s.label}
                        </span>
                      )
                    })}
                  </div>
                </Card>

                {/* Only Proposal, Notes and Aircraft pass `onEdit` — those three
                    sections own a focused edit drawer. Dates and Scope are
                    edited from the project-level actions menu instead, so
                    they render without an affordance. */}
                <Card title="Proposal" onEdit={() => setActiveDrawer('proposal')}>
                  <div className="grid grid-cols-2 gap-lg">
                    <Field label="Proposal Submitted">{row.proposalSubmitted === 'yes' ? 'Yes' : 'No'}</Field>
                    <Field label="Submitted Date">{row.proposalSubmittedDate || '—'}</Field>
                    <Field label="Proposal Accepted">{row.proposalAccepted === 'yes' ? 'Yes' : 'No'}</Field>
                    <Field label="Accepted Date">{row.proposalAcceptedDate || '—'}</Field>
                  </div>
                </Card>

                <Card title="Notes" onEdit={() => setActiveDrawer('notes')}>
                  <div className="grid gap-lg">
                    <Field label="Next Action">{row.nextAction || '—'}</Field>
                    <Field label="Comments">{row.comments || '—'}</Field>
                  </div>
                </Card>

                <Card title="Aircraft" onEdit={() => setActiveDrawer('aircraft')}>
                  {row.aircraft.length === 0 ? (
                    <p className="text-sm text-text-muted">No aircraft added yet.</p>
                  ) : (
                    <div className="grid gap-lg">
                      {row.aircraft.map((a, i) => (
                        <div key={a.id} className={i > 0 ? 'border-t border-border-default pt-lg' : ''}>
                          <div className="grid grid-cols-2 gap-lg tablet:grid-cols-3">
                            <Field label="Model Name">{a.modelName || '—'}</Field>
                            <Field label="Model Number">{a.modelNumber || '—'}</Field>
                            <Field label="Manufacture">{a.manufacturer || '—'}</Field>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

                <Card title="Reports">
                  <div className="grid gap-lg tablet:grid-cols-2">
                    <ReportCard
                      title="Project Completion Checklist"
                      onDownload={generatePcc}
                      pending={linkedTcca.length === 0}
                      subtitle={linkedTcca.length === 0 ? 'Needs a linked TCCA project' : undefined}
                    />
                    {PENDING_REPORTS.map((name) => (
                      <ReportCard key={name} title={name} pending />
                    ))}
                  </div>
                </Card>
              </div>
            ) : tab === 'Work Packages' ? (
              <ProjectWorkPackagesTab projectId={row.id} />
            ) : tab === 'Deliverables' ? (
              <ProjectDocumentsTab kind="deliverable" projectId={row.id} projectNumber={row.number} />
            ) : tab === 'Design Data' ? (
              <ProjectDocumentsTab kind="drawing" projectId={row.id} projectNumber={row.number} />
            ) : tab === 'Approvals' ? (
              <ProjectApprovalsTab projectId={row.id} />
            ) : (
              <ProjectTccaTab projectId={row.id} />
            )}
          </div>
        </div>
      </div>

      {editStep !== null && (
        <AddProjectDrawer
          key={`${row.id}-${editStep}`}
          open
          mode="edit"
          initialValues={rowToInitialValues(row)}
          initialStep={editStep}
          canSeeFinancials={canSeeFinancials}
          onClose={() => setEditStep(null)}
          onSubmit={(v) =>
            updateRow(row.id, {
              number: v.number,
              subNumber: v.subNumber,
              type: v.type as ProjectListRow['type'],
              title: v.description || row.title,
              priority: v.priority as ProjectListRow['priority'],
              companyName: v.company,
              contactName: v.contact || '—',
              personResponsible: v.personResponsible,
              scope: v.scope,
              contractCurrency: v.contractCurrency,
              contractValue: v.contractValue,
              status: (v.status as ProjectListRow['status']) || row.status,
              openedDate: v.openedDate,
              dueDate: v.dueDate,
              aircraftInputDate: v.aircraftInputDate,
              closedDate: v.closedDate,
              proposalSubmitted: v.proposalSubmitted as ProjectListRow['proposalSubmitted'],
              proposalSubmittedDate: v.proposalSubmittedDate,
              proposalAccepted: v.proposalAccepted as ProjectListRow['proposalAccepted'],
              proposalAcceptedDate: v.proposalAcceptedDate,
              nextAction: v.nextAction,
              comments: v.comments,
            })
          }
        />
      )}

      <ProposalEditDrawer
        open={activeDrawer === 'proposal'}
        row={row}
        onClose={() => setActiveDrawer(null)}
        onSave={(patch) => updateRow(row.id, patch)}
      />
      <NotesEditDrawer
        open={activeDrawer === 'notes'}
        row={row}
        onClose={() => setActiveDrawer(null)}
        onSave={(patch) => updateRow(row.id, patch)}
      />
      <AircraftEditDrawer
        open={activeDrawer === 'aircraft'}
        row={row}
        onClose={() => setActiveDrawer(null)}
        onSave={(aircraft) => updateRow(row.id, { aircraft })}
      />

      <ConfirmDialog
        open={deleting}
        title="Delete this project?"
        description={`"${row.title}" (${row.number}-${row.subNumber}) will be permanently removed. This cannot be undone.`}
        confirmLabel="Delete project"
        tone="danger"
        onConfirm={() => { removeRow(row.id); navigate('/projects') }}
        onCancel={() => setDeleting(false)}
      />
    </AppShell>
  )
}

function formatDate(iso: string) {
  if (!iso) return '—'
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
}
