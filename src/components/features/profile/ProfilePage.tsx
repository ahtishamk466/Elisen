import { useState } from 'react'
import { AppShell } from '@/components/patterns/AppShell'
import { SectionTabs } from '@/components/patterns/SectionTabs'
import { Alert } from '@/components/ui/Alert'
import { ProfileDetailsTab } from './ProfileDetailsTab'
import { ChangePasswordTab } from './ChangePasswordTab'
import { useToastStore } from '@/stores/toastStore'

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
  const showToast = useToastStore((s) => s.show)

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

        <SectionTabs tabs={TABS} active={tab} onChange={setTab} ariaLabel="Profile sections" />

        {tab === 'Profile'
          ? <ProfileDetailsTab loading={state === 'loading'} />
          : <ChangePasswordTab loading={state === 'loading'} onChanged={showToast} />}
      </div>
    </AppShell>
  )
}
