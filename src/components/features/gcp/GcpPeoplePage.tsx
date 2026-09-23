import { useSearchParams } from 'react-router-dom'
import { AppShell } from '@/components/patterns/AppShell'
import { TableTabs } from '@/components/patterns/TableTabs'
import { GcpTabPanel } from './GcpTabPanel'

/** Who may sign, for which rule, in which technical field — the three lists
    that decide what the compliance-item picker offers. */
const TABS = [
  { key: 'foc', label: 'FOC', title: 'Finding of Compliance', description: 'Every code that can find or recommend compliance: delegates, candidates, certification engineers, outside specialists and Transport Canada.' },
  { key: 'delegation', label: 'Delegation', title: 'Delegation', description: 'Which rule numbers each delegate may sign for, from their letter. Delegation follows the rule number, not the amendment.' },
  { key: 'discipline', label: 'Discipline', title: 'Discipline', description: 'The Transport Canada technical disciplines a compliance item is filed under.' },
] as const

export function GcpPeoplePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const active = TABS.find((t) => t.key === searchParams.get('tab')) ?? TABS[0]

  const setTab = (key: string) => {
    const params = new URLSearchParams(searchParams)
    if (key === TABS[0].key) params.delete('tab')
    else params.set('tab', key)
    setSearchParams(params, { replace: true })
  }

  return (
    <AppShell
      activeItem="GCP"
      activeChild="People & Authority"
      title="People & Authority"
      description="Who can find or recommend compliance, and on which rules."
    >
      <div className="overflow-hidden rounded-sm border border-border-default bg-neutral-25">
        <TableTabs
          ariaLabel="People and authority"
          activeKey={active.key}
          onChange={setTab}
          tabs={TABS.map((t) => ({ key: t.key, label: t.label }))}
        />
        <div role="tabpanel" aria-labelledby={`tab-${active.key}`} tabIndex={0}>
          <GcpTabPanel title={active.title} description={active.description} />
        </div>
      </div>
    </AppShell>
  )
}
