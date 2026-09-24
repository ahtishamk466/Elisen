import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import { AppShell } from '@/components/patterns/AppShell'
import { TableTabs } from '@/components/patterns/TableTabs'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useGcpStore } from '@/stores/gcpStore'
import { GcpDdsTab } from './GcpDdsTab'
import { GcpMocTab } from './GcpMocTab'

/** Two short lists that are only ever picked from inside a compliance item —
    both live now (see docs/COMPONENTS.md, "Tabbed page layout"). */
const TABS = [
  { key: 'moc', label: 'MOC', addLabel: 'Add MOC', searchPlaceholder: 'Search by code, title or description...' },
  { key: 'dds', label: 'DDS', addLabel: 'Add DDS Type', searchPlaceholder: 'Search by type or text...' },
] as const

export function GcpReferencePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const active = TABS.find((t) => t.key === searchParams.get('tab')) ?? TABS[0]
  const [createOpen, setCreateOpen] = useState(false)
  const [query, setQuery] = useState('')

  const mocs = useGcpStore((s) => s.mocs)
  const ddsTypes = useGcpStore((s) => s.ddsTypes)

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
      activeChild="Reference Lists"
      title="Reference Lists"
      description="The short lists a compliance item is built from."
      headerActions={
        <>
          <div className="min-w-0" style={{ width: 320 }}>
            <label htmlFor="reference-lists-search" className="sr-only">Search {active.label}</label>
            <Input id="reference-lists-search" size="sm" leadingIcon={<Search size={16} />}
              placeholder={active.searchPlaceholder} value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <Button leadingIcon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>{active.addLabel}</Button>
        </>
      }
    >
      <div className="grid gap-lg">
        <div className="overflow-hidden rounded-sm border border-border-default bg-neutral-25">
          <TableTabs
            ariaLabel="Reference lists"
            activeKey={active.key}
            onChange={setTab}
            tabs={TABS.map((t) => ({
              key: t.key,
              label: t.label,
              count: t.key === 'moc' ? mocs.length : ddsTypes.length,
            }))}
          />
        </div>

        <div role="tabpanel" aria-labelledby={`tab-${active.key}`} tabIndex={0}>
          {active.key === 'moc' ? (
            <GcpMocTab createOpen={createOpen} onCreateOpenChange={setCreateOpen} query={query} />
          ) : (
            <GcpDdsTab createOpen={createOpen} onCreateOpenChange={setCreateOpen} query={query} />
          )}
        </div>
      </div>
    </AppShell>
  )
}
