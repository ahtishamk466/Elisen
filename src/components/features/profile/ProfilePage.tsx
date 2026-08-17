import { useState } from 'react'
import { AppShell } from '@/components/patterns/AppShell'
import { Alert } from '@/components/ui/Alert'
import { ProfileDetailsTab } from './ProfileDetailsTab'
import { ChangePasswordTab } from './ChangePasswordTab'

const TABS = ['Profile', 'Change Password'] as const
type Tab = (typeof TABS)[number]

export type PageState = 'ready' | 'loading' | 'error'

/**
 * The signed-in user's own page — replaces both the sidebar profile drawer
 * and the legacy standalone Change Password screen. Two tabs, same pattern
 * as Roles & Permissions and Audit Control. Not part of any nav section, so
 * activeItem is empty and nothing in the sidebar highlights.
 */
export function ProfilePage({ state = 'ready' }: { state?: PageState }) {
  const [tab, setTab] = useState<Tab>('Profile')
  const [toast, setToast] = useState<string | null>(null)

  if (state === 'error') {
    return (
      <AppShell title="Profile" activeItem="" activeChild="">
        <Alert title="We couldn't load your profile">
          Refresh the page, and if it keeps happening, contact your administrator.
        </Alert>
      </AppShell>
    )
  }

  return (
    <AppShell title="Profile" activeItem="" activeChild="">
      <div className="grid gap-lg">
        {toast && <Alert tone="info" title={toast} />}

        <nav className="flex gap-lg rounded-sm border border-border-default bg-neutral-25 px-lg" aria-label="Profile sections">
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

        {tab === 'Profile'
          ? <ProfileDetailsTab loading={state === 'loading'} />
          : <ChangePasswordTab loading={state === 'loading'} onChanged={setToast} />}
      </div>
    </AppShell>
  )
}
