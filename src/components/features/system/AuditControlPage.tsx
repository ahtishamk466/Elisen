import { useState } from 'react'
import { AppShell } from '@/components/patterns/AppShell'
import { SectionTabs } from '@/components/patterns/SectionTabs'
import { Alert } from '@/components/ui/Alert'
import { AuditPanelTab } from './AuditPanelTab'
import { AuditCleanTab } from './AuditCleanTab'
import { useToastStore } from '@/stores/toastStore'

const TABS = ['Panel', 'Clean'] as const
type Tab = (typeof TABS)[number]

export type PageState = 'ready' | 'loading' | 'error'

/**
 * The old Audit Module's two screens — Panel (what was recorded) and Clean
 * (throw old records away) — as tabs on one page, matching how Roles &
 * Permissions handles its two sections. See docs/DECISIONS.md for why these
 * are tabs rather than a third level in the sidebar.
 */
export function AuditControlPage({ state = 'ready' }: { state?: PageState }) {
  const [tab, setTab] = useState<Tab>('Panel')
  const showToast = useToastStore((s) => s.show)

  if (state === 'error') {
    return (
      <AppShell title="Audit Control" activeItem="System" activeChild="Audit Control">
        <Alert title="We couldn't load the audit data">
          Refresh the page, and if it keeps happening, contact your administrator.
        </Alert>
      </AppShell>
    )
  }

  return (
    <AppShell title="Audit Control" activeItem="System" activeChild="Audit Control">
      <div className="grid gap-lg">

        <SectionTabs tabs={TABS} active={tab} onChange={setTab} ariaLabel="Audit sections" />

        {tab === 'Panel'
          ? <AuditPanelTab loading={state === 'loading'} />
          : <AuditCleanTab loading={state === 'loading'} onCleaned={showToast} />}
      </div>
    </AppShell>
  )
}
