import { useEffect, useState } from 'react'
import { Navigate, useLocation, useSearchParams } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import { AppShell } from '@/components/patterns/AppShell'
import { TableTabs } from '@/components/patterns/TableTabs'
import { InfoPopover } from '@/components/patterns/InfoPopover'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useGcpStore } from '@/stores/gcpStore'
import { useGcpData } from './GcpDataGate'
import { GcpDdsTab } from './GcpDdsTab'
import { GcpDelegationTab } from './GcpDelegationTab'
import { GcpDisciplineTab } from './GcpDisciplineTab'
import { GcpFocTab } from './GcpFocTab'
import { GcpMocTab } from './GcpMocTab'
import { WalkthroughButton } from './WalkthroughButton'

const TABS = [
  {
    key: 'foc', label: 'Finding of Compliance (FOC)', addLabel: 'Add FOC',
    searchPlaceholder: 'Search by code, specialist or specialty...',
    summary: 'People and authorities who make or recommend compliance findings.',
    contains: 'FOC codes, specialist names, specialties and default status. Entries include authorised specialists, candidates, external specialists and Transport Canada.',
    used: 'Choose the responsible person or authority for a compliance item. The Specialist Coverage tab identifies which rules an authorised specialist can cover.',
  },
  {
    key: 'delegation', label: 'Specialist Coverage', addLabel: 'Add Specialist Coverage',
    searchPlaceholder: 'Search by specialist, FOC code or rule...',
    summary: 'Find the rules linked to each specialist.',
    contains: 'Specialists listed by FOC code and name, with their linked rule numbers, titles, limitations and active status.',
    used: 'Select a specialist to review their rule coverage. Each delegation links to a Section Root, independently of the amendment selected for an aircraft or project.',
  },
  {
    key: 'discipline', label: 'Disciplines', addLabel: 'Add Discipline',
    searchPlaceholder: 'Search by code or discipline...',
    summary: 'Technical specialties used in compliance planning.',
    contains: 'DAO specialty codes and their corresponding Elisen and TCCA discipline names, such as Electrical Systems or Interiors.',
    used: 'Choose the technical area for each compliance item, alongside the person responsible and the method used.',
  },
  {
    key: 'moc', label: 'Means of Compliance (MOC)', addLabel: 'Add MOC',
    searchPlaceholder: 'Search by code, title or description...',
    summary: 'Methods used to demonstrate compliance.',
    contains: 'Reusable method codes, titles and descriptions for design review, analysis, inspection, ground tests and flight tests.',
    used: 'Select the method for a compliance item. Describe the planned work separately in that project’s MOC text.',
  },
  {
    key: 'dds', label: 'DDS Types', addLabel: 'Add DDS Type',
    searchPlaceholder: 'Search by type or text...',
    summary: 'Specification types for applicable Part 23 requirements.',
    contains: 'Detailed Design Specification types and their supporting text, including types based on ASTM material or other accepted or proposed specifications.',
    used: 'Identify the source or category of detailed specifications used for relevant Part 23 work. Select the DDS type in the compliance plan when applicable.',
  },
] as const

/** Legacy links retain their tab, other query parameters and fragment. */
export function GcpComplianceSetupRedirect({ defaultTab = 'foc' }: { defaultTab?: 'foc' | 'moc' }) {
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const tab = TABS.find((item) => item.key === params.get('tab'))?.key ?? defaultTab
  if (tab === 'foc') params.delete('tab')
  else params.set('tab', tab)
  const search = params.toString()
  return <Navigate replace to={{ pathname: '/gcp/compliance-setup', search: search ? `?${search}` : '', hash: location.hash }} />
}

export function GcpComplianceSetupPage() {
  // Only Delegation's root picker needs the fetched library. Local lists
  // remain usable while it loads or if the request fails.
  useGcpData()
  const [searchParams, setSearchParams] = useSearchParams()
  const active = TABS.find((tab) => tab.key === searchParams.get('tab')) ?? TABS[0]
  const personWorkspace = active.key === 'delegation'
  const [controls, setControls] = useState({ tab: active.key, query: '', createOpen: false })
  const query = controls.tab === active.key ? controls.query : ''
  const createOpen = controls.tab === active.key && controls.createOpen

  // Covers direct URL changes and browser Back/Forward as well as tab clicks.
  // The tab guard above prevents the previous form appearing before reset.
  useEffect(() => {
    setControls({ tab: active.key, query: '', createOpen: false })
  }, [active.key])

  const focs = useGcpStore((s) => s.focs)
  const delegations = useGcpStore((s) => s.delegations)
  const disciplines = useGcpStore((s) => s.disciplines)
  const mocs = useGcpStore((s) => s.mocs)
  const ddsTypes = useGcpStore((s) => s.ddsTypes)
  const counts = { foc: focs.length, delegation: delegations.length, discipline: disciplines.length, moc: mocs.length, dds: ddsTypes.length }

  const setTab = (key: string) => {
    const next = TABS.find((tab) => tab.key === key)
    if (!next || next.key === active.key) return
    const params = new URLSearchParams(searchParams)
    if (next.key === TABS[0].key) params.delete('tab')
    else params.set('tab', next.key)
    setControls({ tab: next.key, query: '', createOpen: false })
    setSearchParams(params, { replace: true })
  }
  const onCreateOpenChange = (open: boolean) => setControls((current) => ({ ...current, tab: active.key, createOpen: open }))
  const panelProps = { createOpen, onCreateOpenChange, query }

  return (
    <AppShell
      activeItem="General Certification"
      activeChild="Compliance Setup"
      title="Compliance Setup"
      fill={personWorkspace}
      description="Shared reference lists used to prepare certification plans."
      headerActions={
        <>
          <div className="min-w-0 max-w-full" style={{ width: 320 }}>
            <label htmlFor="compliance-setup-search" className="sr-only">Search {active.label}</label>
            <Input id="compliance-setup-search" size="sm" leadingIcon={<Search size={16} />}
              placeholder={active.searchPlaceholder} value={query}
              onChange={(event) => setControls((current) => ({ ...current, tab: active.key, query: event.target.value }))} />
          </div>
          <WalkthroughButton to="/gcp/compliance-setup/walkthrough" />
          <Button leadingIcon={<Plus size={16} />} aria-label={active.addLabel} onClick={() => onCreateOpenChange(true)}>Add</Button>
        </>
      }
    >
      <div className={personWorkspace ? 'flex min-h-0 flex-1 flex-col gap-lg' : 'grid gap-lg'}>
        <div className="sticky top-0 z-sticky flex shrink-0 items-stretch overflow-hidden rounded-sm border border-border-default bg-neutral-25">
          <div className="min-w-0 flex-1">
            <TableTabs ariaLabel="Compliance setup" activeKey={active.key} onChange={setTab}
              tabs={TABS.map((tab) => ({ key: tab.key, label: tab.label, count: counts[tab.key] }))} />
          </div>
          <div className="flex shrink-0 items-center border-b border-l border-border-default px-sm">
            <InfoPopover key={active.key} title={active.label} summary={active.summary}>
              <dl className="grid gap-lg">
              <div>
                <dt className="text-sm font-semibold text-text-primary">What you can manage</dt>
                <dd className="mt-xs text-sm text-text-secondary">{active.contains}</dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-text-primary">Where it is used</dt>
                <dd className="mt-xs text-sm text-text-secondary">{active.used}</dd>
              </div>
            </dl>
            </InfoPopover>
          </div>
        </div>
        <div key={active.key} role="tabpanel" aria-labelledby={`tab-${active.key}`}
          tabIndex={0} className={personWorkspace ? 'flex min-h-0 flex-1 flex-col gap-lg' : 'grid gap-lg'}>
          {active.key === 'foc' ? <GcpFocTab {...panelProps} />
            : active.key === 'delegation' ? <GcpDelegationTab {...panelProps} />
              : active.key === 'discipline' ? <GcpDisciplineTab {...panelProps} />
                : active.key === 'moc' ? <GcpMocTab {...panelProps} />
                  : <GcpDdsTab {...panelProps} />}
        </div>
      </div>
    </AppShell>
  )
}
