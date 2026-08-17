import { DetailCard, DetailField } from '@/components/patterns/DetailView'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { useSessionStore } from '@/stores/sessionStore'
import { useAccessStore } from '@/stores/accessStore'
import { effectivePermissionIds, groupByModule, moduleLabel } from '@/lib/accessDisplay'

/** The signed-in user's account details and effective access — read-only.
    Editing accounts and roles stays under User Access, where it's audited. */
export function ProfileDetailsTab({ loading = false }: { loading?: boolean }) {
  const currentUserId = useSessionStore((s) => s.currentUserId)
  const users = useAccessStore((s) => s.users)
  const roles = useAccessStore((s) => s.roles)

  const user = users.find((u) => u.id === currentUserId)
  const effective = user ? effectivePermissionIds(user, roles) : []

  if (loading) {
    return (
      <div className="grid gap-lg">
        {Array.from({ length: 2 }, (_, i) => (
          <div key={i} className="rounded-sm border border-border-default bg-neutral-25 p-lg">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="mt-lg h-24 w-full" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-lg">
      <DetailCard title="Account">
        <div className="grid grid-cols-2 gap-lg tablet:grid-cols-4">
          <DetailField label="Username" nowrap>{user?.username}</DetailField>
          <DetailField label="Email">{user?.email}</DetailField>
          <div>
            <p className="text-xs text-text-muted">Status</p>
            <p className="mt-xxss">
              <Badge tone={user?.status === 'inactive' ? 'neutral' : 'success'}>
                {user?.status === 'inactive' ? 'Inactive' : 'Active'}
              </Badge>
            </p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Roles</p>
            <div className="mt-xxss flex flex-wrap gap-xs">
              {user?.roleIds.length
                ? user.roleIds.map((id) => (
                    <Badge key={id} appearance="outline">{roles.find((r) => r.id === id)?.name ?? id}</Badge>
                  ))
                : <span className="text-sm text-text-muted">—</span>}
            </div>
          </div>
        </div>
      </DetailCard>

      <DetailCard title="Your access">
        <p className="-mt-base text-xs text-text-muted">
          Everything your roles grant, including inherited permissions. Managed under User Access.
        </p>
        <div className="mt-lg grid gap-base">
          {effective.length === 0 && <p className="text-sm text-text-muted">No permissions.</p>}
          {groupByModule(effective).map(([module, ids]) => (
            <div key={module}>
              <p className="text-xs font-semibold text-text-secondary">{moduleLabel(module)} · {ids.length}</p>
              <div className="mt-xs flex flex-wrap gap-xs">
                {ids.map((id) => (
                  <span key={id} className="rounded-sm bg-neutral-100 px-sm py-xxss text-xs text-text-secondary">{id}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DetailCard>
    </div>
  )
}
