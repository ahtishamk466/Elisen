import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { ActionsMenu, type ActionsMenuItem } from '@/components/patterns/ActionsMenu'
import { AutoLoadFooter } from '@/components/patterns/AutoLoadFooter'
import { SortableTh } from '@/components/patterns/SortableTh'
import { useTableSort } from '@/components/patterns/useTableSort'
import { useInfiniteReveal } from '@/components/patterns/useInfiniteReveal'
import { Truncate } from '@/components/patterns/Truncate'
import { ConfirmDialog } from '@/components/patterns/ConfirmDialog'
import { RoleDrawer } from './RoleDrawer'
import { useAccessStore } from '@/stores/accessStore'
import { roleMembers, rolePermissionClosure } from '@/lib/accessDisplay'
import type { AccessRole } from '@/types/access'

type SortKey = 'role' | 'description' | 'rule' | 'inherits' | 'permissions' | 'members'

const COLUMNS: { label: string; sort?: SortKey }[] = [
  { label: 'Role', sort: 'role' },
  { label: 'Description', sort: 'description' },
  { label: 'Rule Name', sort: 'rule' },
  { label: 'Inherits', sort: 'inherits' },
  { label: 'Permissions', sort: 'permissions' },
  { label: 'Members', sort: 'members' },
  { label: 'Actions' },
]

export interface RolesTabProps {
  onToast: (msg: string) => void
  /** Lifted so the page can host the CTA in the shared header row. */
  adding: boolean
  setAdding: (v: boolean) => void
}

export function RolesTab({ onToast, adding, setAdding }: RolesTabProps) {
  const roles = useAccessStore((s) => s.roles)
  const rules = useAccessStore((s) => s.rules)
  const users = useAccessStore((s) => s.users)
  const addRole = useAccessStore((s) => s.addRole)
  const updateRole = useAccessStore((s) => s.updateRole)
  const removeRole = useAccessStore((s) => s.removeRole)

  const { visibleCount, loadingMore, loadMore, reset: resetVisible } = useInfiniteReveal(roles.length, 25)

  /* Inherits and Permissions sort by their counts, which is what the cell
     leads with — the joined role names underneath are the detail, not the
     figure a reader is ordering by. */
  const { sorted, sort, setSort } = useTableSort(roles, {
    role: (r) => r.name,
    description: (r) => r.description,
    rule: (r) => rules.find((x) => x.id === r.ruleId)?.name,
    inherits: (r) => r.childRoleIds.length,
    permissions: (r) => r.permissionIds.length,
    members: (r) => roleMembers(r.id, users).length,
  }, { onSortChange: resetVisible })
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
      <div className="overflow-hidden rounded-sm border border-border-default bg-neutral-25">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left" style={{ minWidth: 760 }}>
          <caption className="sr-only">Roles</caption>
          <thead>
            <tr className="border-b border-border-default bg-neutral-50">
              {COLUMNS.map((c) => (
                <SortableTh key={c.label} sortKey={c.sort} sort={sort} onSortChange={setSort}
                  className="whitespace-nowrap px-lg py-base text-sm font-semibold text-text-secondary">{c.label}</SortableTh>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.slice(0, visibleCount).map((role) => (
              <tr
                key={role.id}
                onClick={() => setEditing(role)}
                className="cursor-pointer border-b border-border-default transition-colors duration-fast last:border-b-0 hover:bg-accent-subtle"
              >
                <td className="px-lg py-base align-top">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setEditing(role) }}
                    className="text-left text-sm font-semibold text-text-primary underline-offset-2 hover:text-accent hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
                  >
                    {role.name}
                  </button>
                </td>
                <td className="px-lg py-base align-top text-sm text-text-primary" style={{ maxWidth: 240 }}><Truncate>{role.description}</Truncate></td>
                <td className="px-lg py-base align-top text-sm text-text-primary">
                  {rules.find((r) => r.id === role.ruleId)?.name ?? '—'}
                </td>
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
                <td className="px-lg py-base align-top" onClick={(e) => e.stopPropagation()}>
                  <ActionsMenu ariaLabel={`Actions for role ${role.name}`} items={itemsFor(role)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <AutoLoadFooter total={roles.length} visibleCount={visibleCount} loading={loadingMore} onLoadMore={loadMore} itemLabel="roles" />
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
              ? `"${deleting.name}" has ${deletingMembers.length} member${deletingMembers.length === 1 ? '' : 's'} (${deletingMembers.map((m) => m.username).join(', ')}). Deleting it removes the role from them immediately. They may lose access.`
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
