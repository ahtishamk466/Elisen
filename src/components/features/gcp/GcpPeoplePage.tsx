import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import { AppShell } from '@/components/patterns/AppShell'
import { TableTabs } from '@/components/patterns/TableTabs'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useGcpStore } from '@/stores/gcpStore'
import { GcpDelegationTab } from './GcpDelegationTab'
import { GcpDisciplineTab } from './GcpDisciplineTab'
import { GcpFocTab } from './GcpFocTab'

/** Who may sign, for which rule, in which technical field — the three lists
    that decide what the compliance-item picker offers. */
const TABS = [
  { key: 'foc', label: 'FOC', addLabel: 'Add FOC', searchPlaceholder: 'Search by code, specialist or specialty...' },
  { key: 'delegation', label: 'Delegation', addLabel: 'Add Delegation', searchPlaceholder: 'Search by section root or FOC code...' },
  { key: 'discipline', label: 'Discipline', addLabel: 'Add Discipline', searchPlaceholder: 'Search by code or discipline...' },
] as const

/**
 * Tabs and table sit in their own containers, not one shared card. The
 * page's one Add action and its search box both live top-right in the
 * header (`AppShell`'s `headerActions`) — Add's label swaps to name the
 * active tab ("Add FOC", "Add Delegation") — and each tab's label carries
 * its own row count, matching the app's Aircraft / Serial Numbers reference
 * data screen. See docs/COMPONENTS.md, "Tabbed page layout".
 */
export function GcpPeoplePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const active = TABS.find((t) => t.key === searchParams.get('tab')) ?? TABS[0]
  const [createOpen, setCreateOpen] = useState(false)
  const [query, setQuery] = useState('')

  const focs = useGcpStore((s) => s.focs)
  const delegations = useGcpStore((s) => s.delegations)
  const disciplines = useGcpStore((s) => s.disciplines)

  const setTab = (key: string) => {
    const params = new URLSearchParams(searchParams)
    if (key === TABS[0].key) params.delete('tab')
    else params.set('tab', key)
    setSearchParams(params, { replace: true })
    setCreateOpen(false)
    setQuery('')
  }

  return (
    <AppShell
      activeItem="GCP"
      activeChild="People & Authority"
      title="People & Authority"
      description="Who can find or recommend compliance, and on which rules."
      headerActions={
        <>
          <div className="min-w-0" style={{ width: 320 }}>
            <label htmlFor="people-authority-search" className="sr-only">Search {active.label}</label>
            <Input id="people-authority-search" size="sm" leadingIcon={<Search size={16} />}
              placeholder={active.searchPlaceholder} value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <Button leadingIcon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>{active.addLabel}</Button>
        </>
      }
    >
      <div className="grid gap-lg">
        <div className="overflow-hidden rounded-sm border border-border-default bg-neutral-25">
          <TableTabs
            ariaLabel="People and authority"
            activeKey={active.key}
            onChange={setTab}
            tabs={TABS.map((t) => ({
              key: t.key,
              label: t.label,
              count: t.key === 'foc' ? focs.length : t.key === 'delegation' ? delegations.length : disciplines.length,
            }))}
          />
        </div>

        <div role="tabpanel" aria-labelledby={`tab-${active.key}`} tabIndex={0}>
          {active.key === 'foc' ? (
            <GcpFocTab createOpen={createOpen} onCreateOpenChange={setCreateOpen} query={query} />
          ) : active.key === 'delegation' ? (
            <GcpDelegationTab createOpen={createOpen} onCreateOpenChange={setCreateOpen} query={query} />
          ) : (
            <GcpDisciplineTab createOpen={createOpen} onCreateOpenChange={setCreateOpen} query={query} />
          )}
        </div>
      </div>
    </AppShell>
  )
}
