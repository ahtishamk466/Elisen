import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, Trash2, ShieldCheck } from 'lucide-react'
import { AppShell } from '@/components/patterns/AppShell'
import { EmptyState } from '@/components/patterns/EmptyState'
import { ActionsMenu } from '@/components/patterns/ActionsMenu'
import { ConfirmDialog } from '@/components/patterns/ConfirmDialog'
import { Badge } from '@/components/ui/Badge'
import { useTccaStore } from '@/stores/tccaStore'
import { TCCA_STATUS_LABEL, TCCA_STATUS_TONE } from '@/lib/tccaDisplay'
import { TccaOverviewTab } from './TccaOverviewTab'
import { TccaProjectsTab } from './TccaProjectsTab'
import { TccaDocumentsTab } from './TccaDocumentsTab'
import { TccaChecklistTab } from './TccaChecklistTab'
import { TccaReportsTab } from './TccaReportsTab'
import { TccaProjectDrawer } from './TccaProjectDrawer'

const TABS = ['Overview', 'Projects', 'Documents', 'Checklist', 'Reports', 'GCP'] as const
type Tab = (typeof TABS)[number]

export function TccaProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const tcca = useTccaStore((s) => s.tccaProjects.find((t) => t.id === id))
  const updateTcca = useTccaStore((s) => s.updateTcca)
  const removeTcca = useTccaStore((s) => s.removeTcca)

  const [tab, setTab] = useState<Tab>('Overview')
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)

  if (!tcca) {
    return (
      <AppShell activeChild="TCCA Projects" title="TCCA project not found">
        <EmptyState
          title="TCCA project not found"
          description="It may have been deleted, or the link is out of date."
          action={
            <button type="button" onClick={() => navigate('/tcca-projects')}
              className="text-sm font-semibold text-accent underline-offset-2 hover:underline">
              Back to TCCA Projects
            </button>
          }
        />
      </AppShell>
    )
  }

  return (
    <AppShell
      activeChild="TCCA Projects"
      title={tcca.number}
      headerLeft={
        <button type="button" onClick={() => navigate('/tcca-projects')}
          className="inline-flex items-center gap-sm rounded-sm text-sm text-text-secondary transition-colors duration-fast hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary">
          <ArrowLeft size={18} aria-hidden />
          Back to TCCA Projects
        </button>
      }
    >
      <div className="grid gap-lg">
        {/* Status + actions pinned right so a long description never shifts
            them; the number keeps its own line. */}
        <div className="flex items-start justify-between gap-lg rounded-sm border border-border-default bg-neutral-25 px-lg py-base">
          <div className="min-w-0">
            <p className="text-2xl font-bold text-text-primary">{tcca.number}</p>
            <p className="mt-xxss text-sm text-text-secondary">{tcca.description}</p>
          </div>
          <div className="flex shrink-0 items-center gap-sm">
            <Badge tone={TCCA_STATUS_TONE[tcca.status]}>{TCCA_STATUS_LABEL[tcca.status]}</Badge>
            <ActionsMenu
              ariaLabel={`Actions for TCCA project ${tcca.number}`}
              items={[
                { label: 'Edit', icon: <Pencil size={16} />, onSelect: () => setEditing(true) },
                { label: 'Delete', icon: <Trash2 size={16} />, onSelect: () => setDeleting(true), tone: 'danger' },
              ]}
            />
          </div>
        </div>

        <nav className="flex gap-lg overflow-x-auto rounded-sm border border-border-default bg-neutral-25 px-lg" aria-label="TCCA sections">
          {TABS.map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)} aria-current={tab === t ? 'page' : undefined}
              className={`whitespace-nowrap border-b-2 py-base text-sm transition-colors duration-fast focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary
                ${tab === t ? 'border-text-primary font-semibold text-text-primary' : 'border-transparent text-text-muted hover:text-text-primary'}`}>
              {t}
            </button>
          ))}
        </nav>

        {tab === 'Overview' && <TccaOverviewTab tcca={tcca} />}
        {tab === 'Projects' && <TccaProjectsTab tcca={tcca} />}
        {tab === 'Documents' && <TccaDocumentsTab tcca={tcca} />}
        {tab === 'Checklist' && <TccaChecklistTab tcca={tcca} />}
        {tab === 'Reports' && <TccaReportsTab tcca={tcca} />}
        {tab === 'GCP' && (
          <div className="rounded-sm border border-border-default bg-neutral-25">
            <EmptyState
              icon={<ShieldCheck size={48} strokeWidth={1.5} />}
              title="GCP module is deferred"
              description="The compliance-plan module (regulations, amendments, means of compliance) is a separate module. It will link here once it's scoped with the client."
            />
          </div>
        )}
      </div>

      {editing && (
        <TccaProjectDrawer
          open
          mode="edit"
          initial={tcca}
          onClose={() => setEditing(false)}
          onSubmit={(t) => updateTcca(tcca.id, t)}
        />
      )}

      <ConfirmDialog
        open={deleting}
        title="Delete this TCCA project?"
        description={`"${tcca.number}" and its checklist and document tracking will be permanently removed. Linked Elisen projects are not affected.`}
        confirmLabel="Delete TCCA project"
        tone="danger"
        onConfirm={() => { removeTcca(tcca.id); navigate('/tcca-projects') }}
        onCancel={() => setDeleting(false)}
      />
    </AppShell>
  )
}
