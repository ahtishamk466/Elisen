import { useMemo, useState } from 'react'
import { Search, ShieldCheck, UserCog, UserX, UserCheck } from 'lucide-react'
import { AppShell } from '@/components/patterns/AppShell'
import { StatCard } from '@/components/patterns/StatCard'
import { EmptyState } from '@/components/patterns/EmptyState'
import { ActionsMenu } from '@/components/patterns/ActionsMenu'
import { Pagination } from '@/components/patterns/Pagination'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { UserAccessDrawer } from './UserAccessDrawer'
import { useAccessStore } from '@/stores/accessStore'
import { roleMembers } from '@/lib/accessDisplay'
import type { AccessUser } from '@/types/access'

const HEADERS = ['Username', 'Email', 'Status', 'Roles', 'Direct grants', 'Actions']

export type PageState = 'ready' | 'loading' | 'error'

/** Old "Users" + "Assignments" pages merged: assignment is an action on a
    user, not a separate place — see docs/DECISIONS.md. */
export function UsersAccessPage({ state = 'ready' }: { state?: PageState }) {
  const users = useAccessStore((s) => s.users)
  const roles = useAccessStore((s) => s.roles)
  const updateUser = useAccessStore((s) => s.updateUser)

  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [editing, setEditing] = useState<AccessUser | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const filtered = useMemo(() => {
    if (!query.trim()) return users
    const q = query.toLowerCase()
    return users.filter((u) =>
      [u.username, u.email, ...u.roleIds.map((id) => roles.find((r) => r.id === id)?.name ?? '')]
        .join(' ').toLowerCase().includes(q),
    )
  }, [users, roles, query])

  const loading = state === 'loading'

  const toggleStatus = (u: AccessUser) => {
    // Guard: never deactivate the last active Sysadmin.
    if (u.status === 'active' && u.roleIds.includes('sysadmin')
      && roleMembers('sysadmin', users).filter((x) => x.id !== u.id && x.status === 'active').length === 0) {
      setToast(`${u.username} is the only active Sysadmin and can't be deactivated.`)
      return
    }
    updateUser(u.id, { status: u.status === 'active' ? 'inactive' : 'active' })
    setToast(`${u.username} ${u.status === 'active' ? 'deactivated' : 'activated'}.`)
  }

  return (
    <AppShell
      title="Users — Access"
      activeItem="User Access"
      activeChild="Users"
      headerActions={
        <div className="min-w-0" style={{ width: 300 }}>
          <label htmlFor="access-user-search" className="sr-only">Search users</label>
          <Input
            id="access-user-search" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1) }}
            placeholder="Search by username, email or role..." leadingIcon={<Search size={16} />}
          />
        </div>
      }
    >
      <div className="grid gap-lg">
        {toast && <Alert tone="info" title={toast} />}

        <div className="grid gap-lg mobile:grid-cols-3">
          <StatCard value={users.length} label="Total users" loading={loading} />
          <StatCard value={users.filter((u) => u.status === 'active').length} label="Active" loading={loading} />
          <StatCard value={users.filter((u) => u.directPermissionIds.length > 0).length} label="With direct grants" loading={loading} />
        </div>

        {state === 'error' ? (
          <Alert title="We couldn't load users">
            Something went wrong fetching users. Refresh the page, and if it keeps happening, contact your administrator.
          </Alert>
        ) : !loading && filtered.length === 0 ? (
          <div className="rounded-sm border border-border-default bg-neutral-25">
            <EmptyState
              icon={<ShieldCheck size={48} strokeWidth={1.5} />}
              title="No users match your search"
              description="Try a different username, email or role name."
            />
          </div>
        ) : (
          <div className="overflow-hidden rounded-sm border border-border-default bg-neutral-25">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left" style={{ minWidth: 960 }}>
              <caption className="sr-only">Users and their access</caption>
              <thead>
                <tr className="border-b border-border-default bg-neutral-50">
                  {HEADERS.map((h) => (
                    <th key={h} scope="col" className="whitespace-nowrap px-lg py-base text-sm font-semibold text-text-secondary">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 6 }, (_, i) => (
                      <tr key={i} className="border-b border-border-default last:border-b-0">
                        {HEADERS.map((h) => <td key={h} className="px-lg py-base"><Skeleton className="h-4 w-full" /></td>)}
                      </tr>
                    ))
                  : filtered.slice((page - 1) * pageSize, page * pageSize).map((u) => (
                      <tr
                        key={u.id}
                        onClick={() => setEditing(u)}
                        className="cursor-pointer border-b border-border-default transition-colors duration-fast last:border-b-0 hover:bg-accent-subtle"
                      >
                        <td className="px-lg py-base align-top">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setEditing(u) }}
                            className="text-left text-sm font-semibold text-text-primary underline-offset-2 hover:text-accent hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
                          >
                            {u.username}
                          </button>
                        </td>
                        <td className="px-lg py-base align-top text-sm text-text-primary">{u.email}</td>
                        <td className="px-lg py-base align-top">
                          <Badge tone={u.status === 'active' ? 'success' : 'neutral'} dot>{u.status === 'active' ? 'Active' : 'Inactive'}</Badge>
                        </td>
                        <td className="px-lg py-base align-top">
                          <div className="flex flex-wrap gap-xs">
                            {u.roleIds.length === 0
                              ? <span className="text-sm text-text-muted">—</span>
                              : u.roleIds.map((id) => (
                                  <Badge key={id} appearance="outline">{roles.find((r) => r.id === id)?.name ?? id}</Badge>
                                ))}
                          </div>
                        </td>
                        <td className="px-lg py-base align-top">
                          {u.directPermissionIds.length > 0
                            ? <Badge tone="warning">{u.directPermissionIds.length}</Badge>
                            : <span className="text-sm text-text-muted">—</span>}
                        </td>
                        <td className="px-lg py-base align-top" onClick={(e) => e.stopPropagation()}>
                          <ActionsMenu
                            ariaLabel={`Actions for ${u.username}`}
                            items={[
                              { label: 'Manage Access', icon: <UserCog size={16} />, onSelect: () => setEditing(u) },
                              u.status === 'active'
                                ? { label: 'Deactivate', icon: <UserX size={16} />, onSelect: () => toggleStatus(u), tone: 'danger' as const }
                                : { label: 'Activate', icon: <UserCheck size={16} />, onSelect: () => toggleStatus(u) },
                            ]}
                          />
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
          {!loading && (
            <Pagination
              page={page} pageSize={pageSize} totalItems={filtered.length} itemLabel="users"
              onPageChange={setPage} onPageSizeChange={setPageSize}
            />
          )}
          </div>
        )}
      </div>

      {editing && (
        <UserAccessDrawer
          key={editing.id}
          user={editing}
          onClose={() => setEditing(null)}
          onSave={(patch) => { updateUser(editing.id, patch); setToast(`Access updated for ${editing.username}.`) }}
        />
      )}
    </AppShell>
  )
}
