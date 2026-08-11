import type { AccessPermission, AccessRole, AccessRule, AccessUser } from '@/types/access'

/** Obviously-fake demo data mirroring the client's real RBAC content
    (role names and permission naming style come from their screenshots). */

export const ACCESS_RULES: AccessRule[] = [
  { id: 'is-owner', name: 'isOwner', className: 'app\\rbac\\OwnerRule' },
]

export const ACCESS_PERMISSIONS: AccessPermission[] = [
  // Activity
  { id: 'activity-index', description: 'Activity Index', routes: ['/activity/index', '/activity/list'] },
  { id: 'activity-view', description: 'Activity View', routes: ['/activity/view'] },
  { id: 'activity-create', description: 'Activity Create', routes: ['/activity/create'] },
  { id: 'activity-update', description: 'Activity Update', routes: ['/activity/update'] },
  { id: 'activity-delete', description: 'Activity Delete', routes: ['/activity/delete'] },
  { id: 'activity-assign', description: 'Activity Assign', routes: ['/activity/assign'] },
  { id: 'activity-task-create', description: 'Activity Task Create', routes: ['/activity-task/create'] },
  { id: 'activity-task-view', description: 'Activity Task View', routes: ['/activity-task/view', '/activity-task/index'] },
  // Admin
  { id: 'admin-rbac', description: 'Admin RBAC', routes: ['/admin/*'] },
  { id: 'admin-user-login', description: 'Admin User Login', routes: ['/admin-user/login'] },
  { id: 'admin-user-logout', description: 'Admin User Logout', routes: ['/admin-user/logout'] },
  { id: 'admin-user-change-password', description: 'Admin User Change Password', routes: ['/admin-user/change-password'] },
  // Project
  { id: 'project-index', description: 'Project Index', routes: ['/project/index', '/project/list'] },
  { id: 'project-view', description: 'Project View', routes: ['/project/view'] },
  { id: 'project-create', description: 'Project Create', routes: ['/project/create'] },
  { id: 'project-update', description: 'Project Update', routes: ['/project/update'] },
  { id: 'project-delete', description: 'Project Delete', routes: ['/project/delete'] },
  // Timesheet
  { id: 'timesheet-index', description: 'Timesheet Index', routes: ['/timesheet/index'] },
  { id: 'timesheet-create', description: 'Timesheet Create', routes: ['/timesheet/create'] },
  { id: 'timesheet-update-own', description: 'Timesheet Update — own entries only', routes: ['/timesheet/update'], ruleId: 'is-owner' },
  { id: 'timesheet-validate', description: 'Timesheet Validate', routes: ['/timesheet/validate'] },
  // Deliverable
  { id: 'deliverable-index', description: 'Deliverable Index', routes: ['/deliverable/index'] },
  { id: 'deliverable-create', description: 'Deliverable Create', routes: ['/deliverable/create'] },
  // Report
  { id: 'report-hours-worked', description: 'Report — Hours Worked', routes: ['/report/hours-worked'] },
  { id: 'report-pcc', description: 'Report — Project Completion Checklist', routes: ['/report/pcc'] },
]

/** Registered routes nothing guards yet — surfaced as "Unassigned" on System. */
export const UNASSIGNED_ROUTES = ['/site/about', '/site/contact', '/debug/*', '/atachapter/index']

export const ROUTE_REGISTRY: string[] = [
  ...new Set([...ACCESS_PERMISSIONS.flatMap((p) => p.routes), ...UNASSIGNED_ROUTES]),
].sort()

export const ACCESS_ROLES: AccessRole[] = [
  {
    id: 'sysadmin', name: 'Sysadmin', description: 'System Administrator — full access; cannot be deleted.',
    permissionIds: ACCESS_PERMISSIONS.map((p) => p.id),
    childRoleIds: [],
  },
  {
    id: 'elisen-admin', name: 'Elisen - Admin', description: 'Elisen - Administrator',
    permissionIds: ['admin-user-login', 'admin-user-logout', 'admin-user-change-password', 'project-index', 'project-view', 'timesheet-index', 'timesheet-validate', 'report-hours-worked', 'report-pcc'],
    childRoleIds: [],
  },
  {
    id: 'elisen-manager', name: 'Elisen - Manager', description: 'Elisen - Manager',
    permissionIds: ['project-index', 'project-view', 'project-create', 'project-update', 'report-hours-worked', 'report-pcc'],
    childRoleIds: ['elisen-supervisor'],
  },
  {
    id: 'elisen-supervisor', name: 'Elisen - Supervisor', description: 'Elisen - Supervisor',
    permissionIds: ['activity-assign', 'activity-task-view', 'timesheet-validate'],
    childRoleIds: ['elisen-employee'],
  },
  {
    id: 'elisen-specialist', name: 'Elisen - Specialist', description: 'Elisen - Specialist',
    permissionIds: ['activity-index', 'activity-view', 'activity-task-create', 'activity-task-view', 'deliverable-index', 'deliverable-create'],
    childRoleIds: [],
  },
  {
    id: 'elisen-employee', name: 'Elisen - Employee', description: 'Elisen - Employee',
    permissionIds: ['activity-index', 'activity-view', 'timesheet-index', 'timesheet-create', 'timesheet-update-own'],
    childRoleIds: [],
  },
  {
    id: 'elisen-project-group', name: 'Elisen - Project Group', description: 'Elisen - Project Group',
    permissionIds: ['project-index', 'project-view', 'deliverable-index', 'report-pcc'],
    childRoleIds: [],
  },
  {
    id: 'client-manager', name: 'Client - Manager', description: 'Client - Manager',
    permissionIds: ['deliverable-index', 'report-pcc'],
    childRoleIds: ['client-employee'],
  },
  {
    id: 'client-employee', name: 'Client - Employee', description: 'Client - Employee',
    permissionIds: ['project-view'],
    childRoleIds: [],
  },
]

export const ACCESS_USERS: AccessUser[] = [
  { id: 'u-admin', username: 'admin', email: 'admin@elisen.example', status: 'active', roleIds: ['sysadmin'], directPermissionIds: [] },
  { id: 'u-harris', username: 'harris.bell', email: 'harris.bell@elisen.example', status: 'active', roleIds: ['elisen-admin'], directPermissionIds: [] },
  { id: 'u-sofia', username: 'sofia.reyes', email: 'sofia.reyes@elisen.example', status: 'active', roleIds: ['elisen-manager'], directPermissionIds: [] },
  { id: 'u-lloyd', username: 'lloyd.pedvis', email: 'lloyd.pedvis@elisen.example', status: 'active', roleIds: ['elisen-employee'], directPermissionIds: ['report-hours-worked'] },
  { id: 'u-remi', username: 'remi.rocheleau', email: 'remi.rocheleau@elisen.example', status: 'active', roleIds: ['elisen-employee', 'elisen-specialist'], directPermissionIds: [] },
  { id: 'u-kelly', username: 'kelly.osei', email: 'kelly.osei@elisen.example', status: 'active', roleIds: ['elisen-supervisor'], directPermissionIds: [] },
  { id: 'u-nathalie', username: 'nathalie.gagnon', email: 'nathalie.gagnon@northwindaerospace.example', status: 'active', roleIds: ['client-manager'], directPermissionIds: [] },
  { id: 'u-jane', username: 'jane.doe', email: 'jane.doe@meridiancharter.example', status: 'inactive', roleIds: ['client-employee'], directPermissionIds: [] },
]
