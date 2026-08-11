import { useState } from 'react'
import { X } from 'lucide-react'
import { Drawer } from '@/components/patterns/Drawer'
import { FormSection } from '@/components/patterns/FormSection'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { Badge } from '@/components/ui/Badge'
import { useAccessStore } from '@/stores/accessStore'
import { effectivePermissionIds, groupByModule, moduleLabel, roleMembers } from '@/lib/accessDisplay'
import type { AccessUser } from '@/types/access'

export interface UserAccessDrawerProps {
  user: AccessUser
  onClose: () => void
  onSave: (patch: Pick<AccessUser, 'roleIds' | 'directPermissionIds'>) => void
}

/** The old Users + Assignments pages merged: account info, role assignment,
    distinct direct grants, and the effective-access rollup — one place
    answers "what can this person do, and why". */
export function UserAccessDrawer({ user, onClose, onSave }: UserAccessDrawerProps) {
  const roles = useAccessStore((s) => s.roles)
  const users = useAccessStore((s) => s.users)
  const [roleIds, setRoleIds] = useState(user.roleIds)
  const [directIds, setDirectIds] = useState(user.directPermissionIds)

  // Self-lockout guard: the last active Sysadmin can't lose the role.
  const otherSysadmins = roleMembers('sysadmin', users).filter((u) => u.id !== user.id && u.status === 'active')
  const sysadminLocked = user.roleIds.includes('sysadmin') && otherSysadmins.length === 0

  const toggleRole = (id: string) =>
    setRoleIds((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]))

  const effective = effectivePermissionIds({ ...user, roleIds, directPermissionIds: directIds }, roles)

  return (
    <Drawer
      open
      onClose={onClose}
      title={`Manage Access “${user.username}”`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={() => { onSave({ roleIds, directPermissionIds: directIds }); onClose() }}>Save Changes</Button>
        </>
      }
    >
      <FormSection title="Account" subtitle="Managed under user maintenance — shown here for context.">
        <div className="grid grid-cols-2 gap-lg">
          <div>
            <p className="text-xs text-text-muted">Username</p>
            <p className="mt-xxss text-sm text-text-primary">{user.username}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Email</p>
            <p className="mt-xxss text-sm text-text-primary">{user.email}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Status</p>
            <p className="mt-xxss"><Badge tone={user.status === 'active' ? 'success' : 'neutral'} dot>{user.status === 'active' ? 'Active' : 'Inactive'}</Badge></p>
          </div>
        </div>
      </FormSection>

      <FormSection title="Roles" subtitle="What this user's access is built from.">
        <div className="grid gap-sm">
          {roles.map((r) => {
            const locked = r.id === 'sysadmin' && sysadminLocked
            return (
              <div key={r.id}>
                <Checkbox
                  label={`${r.name} — ${r.description}`}
                  checked={roleIds.includes(r.id)}
                  disabled={locked}
                  onChange={() => toggleRole(r.id)}
                />
                {locked && (
                  <p className="mt-xxss pl-2xl text-xs text-text-muted">
                    Can't be removed — this is the only active Sysadmin, and the system must keep one.
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </FormSection>

      <FormSection
        title="Direct permissions"
        subtitle="Grants outside any role — kept visible so access never hides here. Prefer roles."
      >
        {directIds.length === 0 ? (
          <p className="text-sm text-text-muted">None — all access comes from roles.</p>
        ) : (
          <div className="flex flex-wrap gap-sm">
            {directIds.map((id) => (
              <span key={id} className="inline-flex items-center gap-xs rounded-sm bg-warning-subtle px-sm py-xxss text-xs font-medium text-warning">
                {id}
                <button
                  type="button"
                  aria-label={`Remove direct permission ${id}`}
                  onClick={() => setDirectIds((prev) => prev.filter((p) => p !== id))}
                  className="rounded-sm hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
                >
                  <X size={12} aria-hidden />
                </button>
              </span>
            ))}
          </div>
        )}
      </FormSection>

      <FormSection title="Effective access" subtitle="Everything the selections above add up to — read-only.">
        {effective.length === 0 ? (
          <p className="text-sm text-text-muted">No permissions — assign a role above.</p>
        ) : (
          <div className="grid gap-base">
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
        )}
      </FormSection>
    </Drawer>
  )
}
