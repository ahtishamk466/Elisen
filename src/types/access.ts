/**
 * User Access Control — mirrors the client's Yii2-RBAC chain:
 * User ──(assignment)──► Role ──► Permission ──(rule?)──► Route.
 * The old admin exposed six pages (one per table); this app groups them into
 * three by job: Users, Roles & Permissions, System — see docs/DECISIONS.md.
 */
export type UserStatus = 'active' | 'inactive'

export interface AccessUser {
  id: string
  username: string
  email: string
  status: UserStatus
  roleIds: string[]
  /** Rare grants outside any role — always shown distinctly so access can't
      hide in an unexpected place. */
  directPermissionIds: string[]
}

export interface AccessRole {
  id: string
  name: string
  description: string
  /** Permissions granted directly by this role. */
  permissionIds: string[]
  /** Inherited roles — this role also grants everything they grant
      (recursively). Cycles are prevented in the UI. */
  childRoleIds: string[]
  /** Optional condition, matching the client's "Rule Name" column. Rules are
      code-defined classes; the client currently defines none. */
  ruleId?: string
}

export interface AccessPermission {
  /** The kebab-case name doubles as the id, e.g. 'activity-assign'. */
  id: string
  description: string
  /** Guarded route paths; entries ending in /* cover all child routes. */
  routes: string[]
  /** Optional condition — rules are code-defined classes, referenced only. */
  ruleId?: string
}

export interface AccessRule {
  id: string
  name: string
  className: string
}
