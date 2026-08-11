import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { ActionsMenu, type ActionsMenuItem } from '@/components/patterns/ActionsMenu'
import { ConfirmDialog } from '@/components/patterns/ConfirmDialog'
import { Button } from '@/components/ui/Button'
import { RoleDrawer } from './RoleDrawer'
import { useAccessStore } from '@/stores/accessStore'
import { roleMembers, rolePermissionClosure } from '@/lib/accessDisplay'
import type { AccessRole } from '@/types/access'

const HEADERS = ['Role', 'Description', 'Inherits', 'Permissions', 'Members', 'Actions']

export function RolesTab({ onToast }: { onToast: (msg: string) => void }) {
  const roles = useAccessStore((s) => s.roles)
  const users = useAccessStore((s) => s.users)
  const addRole = useAccessStore((s) => s.addRole)
  const updateRole = useAccessStore((s) => s.updateRole)
  const removeRole = useAccessStore((s) => s.removeRole)

  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<AccessRole | null>(null)
  const [deleting, setDeleting] = useState<AccessRole | null>(null)

  const itemsFor = (role: AccessRole): ActionsMenuItem[] => {
    const items: ActionsMenuItem[] = [
      { label: 'Edit', icon: <Pencil size={16} />, onSelect: () => setEditing(role) },
    ]
    // Sysadmin is the system's root role — offering delete would be a trap.
    if (role.id !== 'sysadmin') {
      items.push({ label: 'Delete', icon: <Trash2 size={16} />, onSelect: () => setDeleting(role), tone: 'danger' })
    }
    return items
  }

  const deletingMembers = deleting ? roleMembers(deleting.id, users) : []

  return (
    <div className="grid gap-lg">
      <div className="flex justify-end">
        <Button leadingIcon={<Plus size={16} />} onClick={() => setAdding(true)}>Add Role</Button>
      </div>

      <div className="overflow-x-auto rounded-sm border border-border-default bg-neutral-25">
        <table className="w-full border-collapse text-left" style={{ minWidth: 760 }}>
          <caption className="sr-only">Roles</caption>
          <thead>
            <tr className="border-b border-border-default bg-neutral-50">
              {HEADERS.map((h) => (
                <th key={h} scope="col" className="whitespace-nowrap px-lg py-base text-sm font-semibold text-text-secondary">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => (
              <tr key={role.id} className="border-b border-border-default transition-colors duration-fast last:border-b-0 hover:bg-neutral-50">
                <td className="px-lg py-base align-top text-sm font-semibold text-text-primary">{role.name}</td>
                <td className="px-lg py-base align-top text-sm text-text-primary">{role.description}</td>
                <td className="px-lg py-base align-top text-sm text-text-primary">
                  {role.childRoleIds.length === 0
                    ? '—'
                    : role.childRoleIds.map((id) => roles.find((r) => r.id === id)?.name ?? id).join(', ')}
                </td>
                <td className="px-lg py-base align-top text-sm text-text-primary">
                  {role.permissionIds.length}
                  {rolePermissionClosure(role.id, roles).size > role.permissionIds.length && (
                    <span className="text-xs text-text-muted"> (+{rolePermissionClosure(role.id, roles).size - role.permissionIds.length} inherited)</span>
                  )}
                </td>
                <td className="px-lg py-base align-top text-sm text-text-primary">{roleMembers(role.id, users).length}</td>
                <td className="px-lg py-base align-top">
                  <ActionsMenu ariaLabel={`Actions for role ${role.name}`} items={itemsFor(role)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {adding && (
        <RoleDrawer
          mode="create"
          onClose={() => setAdding(false)}
          onSubmit={(r) => { addRole(r); onToast(`Role "${r.name}" created.`) }}
        />
      )}
      {editing && (
        <RoleDrawer
          key={editing.id}
          mode="edit"
          initial={editing}
          onClose={() => setEditing(null)}
          onSubmit={(r) => { updateRole(editing.id, r); onToast(`Role "${r.name}" updated.`) }}
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        title="Delete this role?"
        description={
          deleting
            ? deletingMembers.length > 0
              ? `"${deleting.name}" has ${deletingMembers.length} member${deletingMembers.length === 1 ? '' : 's'} (${deletingMembers.map((m) => m.username).join(', ')}). Deleting it removes the role from them immediately — they may lose access.`
              : `"${deleting.name}" has no members and will be permanently removed.`
            : ''
        }
        confirmLabel="Delete role"
        tone="danger"
        onConfirm={() => { if (deleting) { removeRole(deleting.id); onToast(`Role "${deleting.name}" deleted.`) } setDeleting(null) }}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}
