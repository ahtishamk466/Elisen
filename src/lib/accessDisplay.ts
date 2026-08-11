import type { AccessRole, AccessUser } from '@/types/access'

/** Module a permission belongs to — the first segment of its kebab name
    ('activity-task-create' → 'activity'). Drives grouping at 300+ scale. */
export const moduleOf = (permissionId: string) => permissionId.split('-')[0]

export const moduleLabel = (module: string) => module.charAt(0).toUpperCase() + module.slice(1)

/** All permissions a role grants, including everything inherited through
    child roles (recursively, cycle-safe). */
export function rolePermissionClosure(roleId: string, roles: AccessRole[], seen = new Set<string>()): Set<string> {
  const out = new Set<string>()
  if (seen.has(roleId)) return out
  seen.add(roleId)
  const role = roles.find((r) => r.id === roleId)
  if (!role) return out
  role.permissionIds.forEach((p) => out.add(p))
  for (const childId of role.childRoleIds) {
    rolePermissionClosure(childId, roles, seen).forEach((p) => out.add(p))
  }
  return out
}

/** Permissions a role gets only through inheritance (not granted directly). */
export function inheritedPermissionIds(childRoleIds: string[], roles: AccessRole[]): Set<string> {
  const out = new Set<string>()
  for (const childId of childRoleIds) {
    rolePermissionClosure(childId, roles).forEach((p) => out.add(p))
  }
  return out
}

/** Would adding `candidateId` as a child of `roleId` create a cycle?
    True when the candidate already inherits `roleId` (transitively). */
export function wouldCreateCycle(candidateId: string, roleId: string, roles: AccessRole[]): boolean {
  const visit = (id: string, seen = new Set<string>()): boolean => {
    if (id === roleId) return true
    if (seen.has(id)) return false
    seen.add(id)
    const role = roles.find((r) => r.id === id)
    return !!role && role.childRoleIds.some((c) => visit(c, seen))
  }
  return visit(candidateId)
}

/** Union of everything a user can do: role-granted (incl. inherited) + direct. */
export function effectivePermissionIds(user: AccessUser, roles: AccessRole[]): string[] {
  const ids = new Set<string>(user.directPermissionIds)
  for (const roleId of user.roleIds) {
    rolePermissionClosure(roleId, roles).forEach((p) => ids.add(p))
  }
  return [...ids].sort()
}

export function groupByModule(permissionIds: string[]): [string, string[]][] {
  const map = new Map<string, string[]>()
  for (const id of permissionIds) {
    const m = moduleOf(id)
    map.set(m, [...(map.get(m) ?? []), id])
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
}

/** Roles that grant a permission — directly or via inheritance. */
export function rolesGranting(permissionId: string, roles: AccessRole[]): AccessRole[] {
  return roles.filter((r) => rolePermissionClosure(r.id, roles).has(permissionId))
}

/** Everyone whose effective access includes this permission — the impact
    number shown before a permission or role change. */
export function usersReachedByPermission(permissionId: string, users: AccessUser[], roles: AccessRole[]): AccessUser[] {
  return users.filter((u) => effectivePermissionIds(u, roles).includes(permissionId))
}

export function roleMembers(roleId: string, users: AccessUser[]): AccessUser[] {
  return users.filter((u) => u.roleIds.includes(roleId))
}
