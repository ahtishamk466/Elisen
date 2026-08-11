import { useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { AppShell } from '@/components/patterns/AppShell'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { RolesTab } from './RolesTab'
import { PermissionsTab } from './PermissionsTab'

const TABS = ['Roles', 'Permissions'] as const
type Tab = (typeof TABS)[number]

export type PageState = 'ready' | 'loading' | 'error'

/** Old "Roles" + "Permissions" (+ per-permission route mapping) merged:
    what access *means*, in one place — see docs/DECISIONS.md. */
export function RolesPermissionsPage({ state = 'ready' }: { state?: PageState }) {
  const [tab, setTab] = useState<Tab>('Roles')
  const [toast, setToast] = useState<string | null>(null)
  // Lifted from the tabs so search + CTA can live in the shared header row.
  const [permQuery, setPermQuery] = useState('')
  const [addingRole, setAddingRole] = useState(false)
  const [addingPermission, setAddingPermission] = useState(false)

  return (
    <AppShell
      title="Roles & Permissions"
      activeItem="User Access Control"
      activeChild="Roles & Permissions"
      headerActions={
        tab === 'Roles' ? (
          <Button size="lg" leadingIcon={<Plus size={16} />} onClick={() => setAddingRole(true)}>Add Role</Button>
        ) : (
          <>
            <div className="min-w-0" style={{ width: 300 }}>
              <label htmlFor="perm-search" className="sr-only">Search permissions</label>
              <Input
                id="perm-search" value={permQuery} onChange={(e) => setPermQuery(e.target.value)}
                placeholder="Search by name or description..." leadingIcon={<Search size={16} />}
              />
            </div>
            <Button size="lg" leadingIcon={<Plus size={16} />} onClick={() => setAddingPermission(true)}>Add Permission</Button>
          </>
        )
      }
    >
      <div className="grid gap-lg">
        {toast && <Alert tone="info" title={toast} />}

        <nav className="flex gap-lg rounded-sm border border-border-default bg-neutral-25 px-lg" aria-label="Roles and permissions sections">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              aria-current={tab === t ? 'page' : undefined}
              className={`whitespace-nowrap border-b-2 py-base text-sm transition-colors duration-fast focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary
                ${tab === t ? 'border-text-primary font-semibold text-text-primary' : 'border-transparent text-text-muted hover:text-text-primary'}`}
            >
              {t}
            </button>
          ))}
        </nav>

        {state === 'error' ? (
          <Alert title="We couldn't load roles and permissions">
            Something went wrong. Refresh the page, and if it keeps happening, contact your administrator.
          </Alert>
        ) : state === 'loading' ? (
          <div className="grid gap-lg rounded-sm border border-border-default bg-neutral-25 p-lg">
            {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-6 w-full" />)}
          </div>
        ) : tab === 'Roles' ? (
          <RolesTab onToast={setToast} adding={addingRole} setAdding={setAddingRole} />
        ) : (
          <PermissionsTab onToast={setToast} query={permQuery} adding={addingPermission} setAdding={setAddingPermission} />
        )}
      </div>
    </AppShell>
  )
}
