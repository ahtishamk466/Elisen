import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { AppShell } from '@/components/patterns/AppShell'
import { EmptyState } from '@/components/patterns/EmptyState'
import { SectionTabs } from '@/components/patterns/SectionTabs'
import { useTccaStore } from '@/stores/tccaStore'
import { GcpTabPanel } from './GcpTabPanel'
import { GcpReportsTab } from './GcpReportsTab'

/** The legacy GCP screens that work on one TCCA project, in the order the
    work happens: link a basis, scope the rules, plan each rule, report. */
const TABS = ['Cert Basis', 'Cert Plan Initialize', 'Cert Plan', 'GCP', 'Reports'] as const
type Tab = (typeof TABS)[number]

const tabSlug = (t: Tab) => t.toLowerCase().replace(/ /g, '-')

const PANELS: Record<Exclude<Tab, 'Reports'>, { title: string; description: string }> = {
  'Cert Basis': {
    title: 'Master Cert Basis Associate',
    description: 'Links this project to the cert basis that sets which rules, at which amendments, apply to the aircraft.',
  },
  'Cert Plan Initialize': {
    title: 'Cert Plan Initialize',
    description: 'Every rule in the linked basis, marked affected or not affected by this modification. The affected ones become the cert plan.',
  },
  'Cert Plan': {
    title: 'Cert Plan and Dashboard',
    description: 'The affected rules for this project. Opening a rule shows its compliance planning: method, comments, DDS and GCP items.',
  },
  GCP: {
    title: 'GCP',
    description: 'The GCP records the reports read from. Its exact contents are still to be confirmed with the client.',
  },
}

export function GcpProjectWorkspace() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const tcca = useTccaStore((s) => s.tccaProjects.find((t) => t.id === id))

  const tab: Tab = TABS.find((t) => tabSlug(t) === searchParams.get('tab')) ?? 'Cert Basis'
  const setTab = (next: Tab) => {
    const params = new URLSearchParams(searchParams)
    if (next === 'Cert Basis') params.delete('tab')
    else params.set('tab', tabSlug(next))
    setSearchParams(params, { replace: true })
  }

  if (!tcca) {
    return (
      <AppShell activeItem="GCP" activeChild="GCP Projects" title="Project not found">
        <EmptyState
          title="Project not found"
          description="It may have been deleted, or the link is out of date."
          action={
            <button type="button" onClick={() => navigate('/gcp/projects')}
              className="text-sm font-semibold text-accent underline-offset-2 hover:underline">
              Back to GCP Projects
            </button>
          }
        />
      </AppShell>
    )
  }

  return (
    <AppShell
      activeItem="GCP"
      activeChild="GCP Projects"
      title={tcca.number}
      description={tcca.description}
      headerLeft={
        <button type="button" onClick={() => navigate('/gcp/projects')}
          className="inline-flex items-center gap-sm rounded-sm text-sm text-text-secondary transition-colors duration-fast hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary">
          <ArrowLeft size={18} aria-hidden />
          Back to GCP Projects
        </button>
      }
    >
      <div className="grid gap-lg">
        <SectionTabs tabs={TABS} active={tab} onChange={setTab} ariaLabel="GCP sections" />
        {tab === 'Reports' ? (
          <GcpReportsTab />
        ) : (
          <div className="rounded-sm border border-border-default bg-neutral-25">
            <GcpTabPanel {...PANELS[tab]} />
          </div>
        )}
      </div>
    </AppShell>
  )
}
