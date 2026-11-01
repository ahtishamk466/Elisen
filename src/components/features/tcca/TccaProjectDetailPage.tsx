import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { AppShell } from '@/components/patterns/AppShell'
import { BackLink } from '@/components/patterns/BackLink'
import { RecordLayout } from '@/components/patterns/RecordLayout'
import { SectionTabs } from '@/components/patterns/SectionTabs'
import { EmptyState } from '@/components/patterns/EmptyState'
import { ConfirmDialog } from '@/components/patterns/ConfirmDialog'
import { useTccaStore } from '@/stores/tccaStore'
import { TccaIdentityCard } from './TccaIdentityCard'
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
      headerLeft={<BackLink to="/tcca-projects" label="Go back to all TCCA projects" />}
    >
      <RecordLayout identity={<TccaIdentityCard tcca={tcca} onEdit={() => setEditing(true)} onDelete={() => setDeleting(true)} />}>
        <SectionTabs tabs={TABS} active={tab} onChange={setTab} ariaLabel="TCCA sections" />

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
      </RecordLayout>

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
