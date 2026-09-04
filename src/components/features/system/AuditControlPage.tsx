import { useState } from 'react'
import { AppShell } from '@/components/patterns/AppShell'
import { Alert } from '@/components/ui/Alert'
import { AuditPanelTab } from './AuditPanelTab'
import { AuditCleanTab } from './AuditCleanTab'

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
  const [toast, setToast] = useState<string | null>(null)

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
        {toast && <Alert tone="info" title={toast} />}

        <nav className="flex gap-lg rounded-sm border border-border-default bg-neutral-25 px-lg" aria-label="Audit sections">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { setTab(t); setToast(null) }}
              aria-current={tab === t ? 'page' : undefined}
              className={`whitespace-nowrap border-b-2 py-base text-sm transition-colors duration-fast focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary
                ${tab === t ? 'border-text-primary font-semibold text-text-primary' : 'border-transparent text-text-muted hover:text-text-primary'}`}
            >
              {t}
            </button>
          ))}
        </nav>

        {tab === 'Panel'
          ? <AuditPanelTab loading={state === 'loading'} />
          : <AuditCleanTab loading={state === 'loading'} onCleaned={setToast} />}
      </div>
    </AppShell>
  )
}
