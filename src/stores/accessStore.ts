import { create } from 'zustand'
import { ACCESS_PERMISSIONS, ACCESS_ROLES, ACCESS_RULES, ACCESS_USERS, ROUTE_REGISTRY } from '@/lib/accessFixtures'
import type { AccessPermission, AccessRole, AccessRule, AccessUser } from '@/types/access'

interface AccessState {
  users: AccessUser[]
  roles: AccessRole[]
  permissions: AccessPermission[]
  rules: AccessRule[]
  routeRegistry: string[]
  updateUser: (id: string, patch: Partial<AccessUser>) => void
  addRole: (role: AccessRole) => void
  updateRole: (id: string, patch: Partial<AccessRole>) => void
  /** Also strips the role from every user holding it (guarded in the UI). */
  removeRole: (id: string) => void
  addPermission: (p: AccessPermission) => void
  updatePermission: (id: string, patch: Partial<AccessPermission>) => void
  addRoute: (path: string) => void
}

export const useAccessStore = create<AccessState>((set) => ({
  users: ACCESS_USERS,
  roles: ACCESS_ROLES,
  permissions: ACCESS_PERMISSIONS,
  rules: ACCESS_RULES,
  routeRegistry: ROUTE_REGISTRY,

  updateUser: (id, patch) =>
    set((s) => ({ users: s.users.map((u) => (u.id === id ? { ...u, ...patch } : u)) })),

  addRole: (role) => set((s) => ({ roles: [...s.roles, role] })),
  updateRole: (id, patch) =>
    set((s) => ({ roles: s.roles.map((r) => (r.id === id ? { ...r, ...patch } : r)) })),
  removeRole: (id) =>
    set((s) => ({
      roles: s.roles.filter((r) => r.id !== id),
      users: s.users.map((u) => (u.roleIds.includes(id) ? { ...u, roleIds: u.roleIds.filter((r) => r !== id) } : u)),
    })),

  addPermission: (p) => set((s) => ({ permissions: [...s.permissions, p] })),
  updatePermission: (id, patch) =>
    set((s) => ({ permissions: s.permissions.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),

  addRoute: (path) =>
    set((s) => (s.routeRegistry.includes(path) ? s : { routeRegistry: [...s.routeRegistry, path].sort() })),
}))
