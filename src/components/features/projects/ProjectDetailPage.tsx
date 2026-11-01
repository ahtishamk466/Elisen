import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Check, Minus } from 'lucide-react'
import { AppShell } from '@/components/patterns/AppShell'
import { BackLink } from '@/components/patterns/BackLink'
import { RecordLayout } from '@/components/patterns/RecordLayout'
import { SectionTabs } from '@/components/patterns/SectionTabs'
import { EmptyState } from '@/components/patterns/EmptyState'
import { ConfirmDialog } from '@/components/patterns/ConfirmDialog'
import { ReportCard } from '@/components/patterns/ReportCard'
import { DetailCard as Card, DetailField as Field } from '@/components/patterns/DetailView'
import { HealthSummary } from '@/components/patterns/HealthSummary'
import { useProjectsStore } from '@/stores/projectsStore'
import { useWorkPackagesStore } from '@/stores/workPackagesStore'
import { useTccaStore } from '@/stores/tccaStore'
import { deliverableSummaries, useDocumentsStore } from '@/stores/documentsStore'
import { useApprovalsStore } from '@/stores/approvalsStore'
import { PENDING_REPORTS } from '@/lib/pendingReports'
import { rollUpProject } from '@/lib/projectHealth'
import { downloadCompletionChecklist } from '@/lib/pccReport'
import { AddProjectDrawer } from './AddProjectDrawer'
import { ProjectIdentityCard } from './ProjectIdentityCard'
import { ProposalEditDrawer } from './ProposalEditDrawer'
import { NotesEditDrawer } from './NotesEditDrawer'
import { AircraftEditDrawer } from './AircraftEditDrawer'
import { ProjectTccaTab } from '@/components/features/tcca/ProjectTccaTab'
import { ProjectWorkPackagesTab } from './ProjectWorkPackagesTab'
import { ProjectTeamTab } from './ProjectTeamTab'
import { ProjectDocumentsTab } from './ProjectDocumentsTab'
import { ProjectApprovalsTab } from './ProjectApprovalsTab'
import type { ProjectListRow, ScopeKey } from '@/types/project'
import type { DeliverableRevision } from '@/types/tcca'
import type { AddProjectValues } from './useAddProjectForm'
import { formatDate } from '@/lib/formatDate'

const TABS = ['Overview', 'Work Packages', 'Team', 'Deliverables', 'Design Data', 'TCCA', 'Approvals'] as const
type Tab = (typeof TABS)[number]

/** `Work Packages` <-> `work-packages`, so the URL stays readable. */
export const tabSlug = (t: Tab) => t.toLowerCase().replace(/ /g, '-')

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
  const workPackages = useWorkPackagesStore((s) => s.workPackages)
  const wpActivities = useWorkPackagesStore((s) => s.activities)
  const updateRow = useProjectsStore((s) => s.updateRow)
  const removeRow = useProjectsStore((s) => s.removeRow)
  const duplicateRow = useProjectsStore((s) => s.duplicateRow)

  const tccaProjects = useTccaStore((s) => s.tccaProjects)
  const docLinks = useTccaStore((s) => s.docLinks)
  const documents = useDocumentsStore((s) => s.documents)
  const docRevisions = useDocumentsStore((s) => s.revisions)
  const projectRevisionLinks = useDocumentsStore((s) => s.links)
  const approvals = useApprovalsStore((s) => s.approvals)

  const row = rows.find((r) => r.id === id)
  /** The open tab lives in the URL, so a row action can deep-link straight to
      Work Packages and a refresh or a shared link lands in the same place. */
  const [searchParams, setSearchParams] = useSearchParams()
  const tab: Tab = TABS.find((t) => tabSlug(t) === searchParams.get('tab')) ?? 'Overview'
  const setTab = (next: Tab) => {
    const params = new URLSearchParams(searchParams)
    if (next === 'Overview') params.delete('tab')
    else params.set('tab', tabSlug(next))
    // replace, not push: flicking through tabs shouldn't fill the back stack,
    // and Back should return to wherever the project was opened from.
    setSearchParams(params, { replace: true })
  }
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
    duplicateRow(row.id)
    navigate('/projects')
  }

  const linkedTcca = tccaProjects.filter((t) => t.projectIds.includes(row.id))

  /** Counts in the tab bar, so the project's shape is legible before anything
      is clicked — "nothing feels hidden". Overview has no count: it is a
      summary, not a collection. A tab with genuinely nothing in it still shows
      0 rather than dropping the pill, because a missing count reads as "not
      counted" instead of "empty". */
  const revisionsOfKind = (kind: 'deliverable' | 'drawing') =>
    projectRevisionLinks.filter((l) => {
      if (l.projectId !== row.id) return false
      const rev = docRevisions.find((r) => r.id === l.revisionId)
      const doc = rev && documents.find((d) => d.id === rev.documentId)
      return !!doc && doc.kind === kind
    }).length

  const projectPackageIds = new Set(workPackages.filter((w) => w.projectId === row.id).map((w) => w.id))
  const tabCounts: Partial<Record<Tab, number>> = {
    'Work Packages': projectPackageIds.size,
    Team: new Set(
      wpActivities
        .filter((a) => projectPackageIds.has(a.workPackageId) && a.responsible)
        .map((a) => a.responsible),
    ).size,
    Deliverables: revisionsOfKind('deliverable'),
    'Design Data': revisionsOfKind('drawing'),
    TCCA: linkedTcca.length,
    Approvals: approvals.filter((a) => a.projectIds.includes(row.id)).length,
  }
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

  /** Same roll-up the list uses, so the two can never disagree. */
  const health = rollUpProject(row.id, workPackages, wpActivities, {
    budgetHours: row.budgetHours, actualHours: row.actualHours, complete: row.status === 'complete',
  })

  return (
    <AppShell
      title={`${row.number}-${row.subNumber}`}
      headerLeft={<BackLink to="/projects" label="Go back to all projects" />}
    >
      <div className="grid gap-lg">
        {/* Health first, above everything — the question "is this project in
            trouble?" gets answered before any detail is read. */}
        {canSeeFinancials && (
          <HealthSummary health={health} />
        )}

        {/* Figma "Opt-2 – Project Details": the identity card stays beside
            every tab (user decision, 2026-11-01). */}
        <RecordLayout identity={
          <ProjectIdentityCard row={row} canSeeFinancials={canSeeFinancials} onEdit={() => setEditStep(STEP_BASIC)}
            onDuplicate={handleDuplicate} onDelete={() => setDeleting(true)} />
        }>
          <SectionTabs tabs={TABS} active={tab} onChange={setTab} ariaLabel="Project sections" counts={tabCounts} />
          {tab === 'Overview' ? (
            <div className="grid gap-lg">
              <Card title="Dates">
                <div className="grid grid-cols-2 gap-lg tablet:grid-cols-3">
                  <Field label="Project opened date">{formatDate(row.openedDate)}</Field>
                  <Field label="Due date">{formatDate(row.dueDate)}</Field>
                  <Field label="Company Number">{row.companyNumber}</Field>
                  <Field label="Aircraft Input Date">{formatDate(row.aircraftInputDate)}</Field>
                  <Field label="Closed Date">{formatDate(row.closedDate)}</Field>
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
                  <Field label="Submitted Date">{formatDate(row.proposalSubmittedDate)}</Field>
                  <Field label="Proposal Accepted">{row.proposalAccepted === 'yes' ? 'Yes' : 'No'}</Field>
                  <Field label="Accepted Date">{formatDate(row.proposalAcceptedDate)}</Field>
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
                          <Field label="Model Number" nowrap>{a.modelNumber || '—'}</Field>
                          <Field label="Manufacture">{a.manufacturer || '—'}</Field>
                          {/* Blank until the specific airframe is assigned —
                              the project often starts with only a type. */}
                          <Field label="Serial No" nowrap>{a.serial || 'Not assigned yet'}</Field>
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
          ) : tab === 'Team' ? (
            <ProjectTeamTab projectId={row.id} />
          ) : tab === 'Deliverables' ? (
            <ProjectDocumentsTab kind="deliverable" projectId={row.id} />
          ) : tab === 'Design Data' ? (
            <ProjectDocumentsTab kind="drawing" projectId={row.id} />
          ) : tab === 'Approvals' ? (
            <ProjectApprovalsTab projectId={row.id} />
          ) : (
            <ProjectTccaTab projectId={row.id} />
          )}
        </RecordLayout>
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

