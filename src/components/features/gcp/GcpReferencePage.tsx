import { useSearchParams } from 'react-router-dom'
import { AppShell } from '@/components/patterns/AppShell'
import { TableTabs } from '@/components/patterns/TableTabs'
import { GcpTabPanel } from './GcpTabPanel'

/** Two short lists that are only ever picked from inside a compliance item. */
const TABS = [
  { key: 'moc', label: 'MOC', title: 'Means of Compliance', description: 'How compliance with a rule is shown — design review, inspection, test, and the rest.' },
  { key: 'dds', label: 'DDS', title: 'Detailed Design Specification', description: 'The specification types used on Part 23 projects under the new rule format.' },
] as const

export function GcpReferencePage() {
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
      activeChild="Reference Lists"
      title="Reference Lists"
      description="The short lists a compliance item is built from."
    >
      <div className="overflow-hidden rounded-sm border border-border-default bg-neutral-25">
        <TableTabs
          ariaLabel="Reference lists"
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
