import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, Copy, Trash2, Users } from 'lucide-react'
import { AppShell } from '@/components/patterns/AppShell'
import { EmptyState } from '@/components/patterns/EmptyState'
import { ActionsMenu } from '@/components/patterns/ActionsMenu'
import { ConfirmDialog } from '@/components/patterns/ConfirmDialog'
import { Badge } from '@/components/ui/Badge'
import { useProjectsStore } from '@/stores/projectsStore'
import { getNextProjectNumber } from '@/lib/projectFixtures'
import { PRIORITY_LABEL, STATUS_LABEL, STATUS_TONE, TYPE_LABEL } from '@/lib/projectDisplay'
import { AddProjectDrawer } from './AddProjectDrawer'
import { ProjectTccaTab } from '@/components/features/tcca/ProjectTccaTab'
import { ProjectWorkPackagesTab } from './ProjectWorkPackagesTab'
import { ProjectDocumentsTab } from './ProjectDocumentsTab'
import { ProjectApprovalsTab } from './ProjectApprovalsTab'
import type { ProjectListRow } from '@/types/project'
import type { AddProjectValues } from './useAddProjectForm'

const TABS = ['Overview', 'Work Packages', 'Deliverables', 'Design Data', 'TCCA', 'Approvals'] as const
type Tab = (typeof TABS)[number]

function rowToInitialValues(row: ProjectListRow): Partial<AddProjectValues> {
  return {
    number: row.number,
    subNumber: row.subNumber,
    type: row.type,
    priority: row.priority,
    company: row.companyName,
    contact: row.contactName === '—' ? '' : row.contactName,
    personResponsible: row.personResponsible,
  }
}

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const rows = useProjectsStore((s) => s.rows)
  const addRow = useProjectsStore((s) => s.addRow)
  const updateRow = useProjectsStore((s) => s.updateRow)
  const removeRow = useProjectsStore((s) => s.removeRow)

  const row = rows.find((r) => r.id === id)
  const [tab, setTab] = useState<Tab>('Overview')
  const [editing, setEditing] = useState(false)
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

  const handleDeleteConfirmed = () => {
    removeRow(row.id)
    navigate('/projects')
  }

  return (
    <AppShell title={`${row.number}-${row.subNumber}`}>
      <div className="grid gap-lg">
        <button
          type="button"
          onClick={() => navigate('/projects')}
          className="inline-flex w-fit items-center gap-xs text-sm text-text-secondary hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
        >
          <ArrowLeft size={16} aria-hidden />
          Back to Projects
        </button>

        <div className="grid gap-lg laptop:grid-cols-[320px_1fr]">
          <aside className="grid content-start gap-lg rounded-sm border border-border-default bg-neutral-25 p-lg">
            <div>
              <div className="flex items-center gap-xs">
                <p className="text-2xl font-bold text-text-primary">{row.number}-{row.subNumber}</p>
                <ActionsMenu
                  ariaLabel={`Actions for project ${row.number}-${row.subNumber}`}
                  items={[
                    { label: 'Edit', icon: <Pencil size={16} />, onSelect: () => setEditing(true) },
                    { label: 'Duplicate', icon: <Copy size={16} />, onSelect: handleDuplicate },
                    { label: 'Delete', icon: <Trash2 size={16} />, onSelect: () => setDeleting(true), tone: 'danger' },
                  ]}
                />
              </div>
              <p className="mt-xs text-sm text-text-primary">{row.title}</p>
              <p className="mt-xxss text-sm text-text-muted">{row.companyName} · {TYPE_LABEL[row.type]}</p>
            </div>
            <div className="flex flex-wrap gap-sm">
              <span className="text-sm text-text-primary">{PRIORITY_LABEL[row.priority]}</span>
              <Badge tone={STATUS_TONE[row.status]}>{STATUS_LABEL[row.status]}</Badge>
            </div>
            <div>
              <p className="text-xs text-text-muted">Hours used</p>
              <p className="mt-xxss text-lg font-bold text-text-primary">
                {row.actualHours} <span className="text-sm font-normal text-text-muted">/ {row.budgetHours}h</span>
              </p>
              <div className="mt-sm h-sm w-full overflow-hidden rounded-sm bg-neutral-100">
                <div
                  className={`h-full ${row.actualHours > row.budgetHours ? 'bg-danger' : 'bg-accent'}`}
                  style={{ width: `${Math.min(100, (row.actualHours / Math.max(1, row.budgetHours)) * 100)}%` }}
                />
              </div>
            </div>
            <div>
              <p className="mb-sm flex items-center gap-xs text-xs text-text-muted">
                <Users size={14} aria-hidden /> People
              </p>
              <p className="text-sm text-text-primary">{row.personResponsible}</p>
              <p className="text-xs text-text-muted">Person responsible</p>
              {row.contactName !== '—' && (
                <>
                  <p className="mt-sm text-sm text-text-primary">{row.contactName}</p>
                  <p className="text-xs text-text-muted">Contact</p>
                </>
              )}
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
                <section className="rounded-sm border border-border-default bg-neutral-25 p-lg">
                  <h2 className="text-sm font-semibold text-text-primary">Details</h2>
                  <div className="mt-lg grid grid-cols-2 gap-lg tablet:grid-cols-3">
                    <Field label="Company">{row.companyName} ({row.companyNumber})</Field>
                    <Field label="Type">{TYPE_LABEL[row.type]}</Field>
                    <Field label="Contact">{row.contactName}</Field>
                    <Field label="Person Responsible">{row.personResponsible}</Field>
                    <Field label="Priority">{PRIORITY_LABEL[row.priority]}</Field>
                    <Field label="Status">
                      <Badge tone={STATUS_TONE[row.status]}>{STATUS_LABEL[row.status]}</Badge>
                    </Field>
                  </div>
                </section>
                <EmptyState
                  title="More project data isn't wired up yet"
                  description="Dates, aircraft, proposal, notes and reports will appear here once those sections are built against real project data."
                />
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

      <AddProjectDrawer
        key={row.id}
        open={editing}
        mode="edit"
        initialValues={rowToInitialValues(row)}
        onClose={() => setEditing(false)}
        onSubmit={(v) =>
          updateRow(row.id, {
            number: v.number,
            subNumber: v.subNumber,
            type: v.type as ProjectListRow['type'],
            priority: v.priority as ProjectListRow['priority'],
            companyName: v.company,
            contactName: v.contact || '—',
            personResponsible: v.personResponsible,
          })
        }
      />

      <ConfirmDialog
        open={deleting}
        title="Delete this project?"
        description={`"${row.title}" (${row.number}-${row.subNumber}) will be permanently removed. This cannot be undone.`}
        confirmLabel="Delete project"
        tone="danger"
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setDeleting(false)}
      />
    </AppShell>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-text-muted">{label}</p>
      <p className="mt-xxss text-sm text-text-primary">{children}</p>
    </div>
  )
}
