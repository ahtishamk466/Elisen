import type { AccessPermission, AccessRole, AccessRule, AccessUser } from '@/types/access'

/**
 * Sourced from the client's existing User Access Control screens.
 *
 * VERBATIM from those screenshots: the 9 role names + descriptions, the
 * permission names/descriptions visible on the Permissions grid (including
 * the non-kebab `Admin - RBAC`), the route strings from the Routes shuttle,
 * and the usernames from the Users + Assignments grids.
 *
 * CONTEXTUAL FILL (not visible anywhere — those live behind the grids' eye
 * icons): which permissions each role grants, which roles each user holds,
 * which routes each permission guards, and the inheritance chain. Derived
 * from the role-name ladder and the meeting transcripts. See docs/DECISIONS.md.
 *
 * Emails use the reserved `.example` domain per docs/SECURITY.md rule 9 —
 * usernames are real so the screen matches what the client recognises.
 */

/** The Rules grid returned no results and every Rule Name cell on both the
    Roles and Permissions grids was blank — so the client defines no rules. */
export const ACCESS_RULES: AccessRule[] = []

export const ACCESS_PERMISSIONS: AccessPermission[] = [
  // --- Activity — all verbatim from the Permissions grid -------------------
  { id: 'activity-assign', description: 'Activity Assign', routes: ['/activity/assign', '/activities/assign'] },
  { id: 'activity-create', description: 'Activity Create', routes: ['/activity/create', '/activities/create'] },
  { id: 'activity-delete', description: 'Activity Delete', routes: ['/activity/delete', '/activities/delete'] },
  { id: 'activity-index', description: 'Activity Index', routes: ['/activity/index', '/activity/list', '/activities/index', '/activities/list'] },
  { id: 'activity-task-create', description: 'Activity Task Create', routes: ['/activity-task/create', '/activity-tasks/create'] },
  { id: 'activity-task-delete', description: 'Activity Task Delete', routes: ['/activity-task/delete', '/activity-tasks/delete'] },
  { id: 'activity-task-index', description: 'Activity Task Index', routes: ['/activity-task/index', '/activity-task/index_detail', '/activity-tasks/index'] },
  { id: 'activity-task-update', description: 'Activity Task Update', routes: ['/activity-task/update', '/activity-task/select', '/activity-tasks/update'] },
  { id: 'activity-task-view', description: 'Activity Task View', routes: ['/activity-task/view', '/activity-tasks/view'] },
  { id: 'activity-update', description: 'Activity Update', routes: ['/activity/update', '/activities/update'] },
  { id: 'activity-view', description: 'Activity View', routes: ['/activity/view', '/activities/view'] },

  // --- Admin — verbatim; `Admin - RBAC` keeps the client's exact spelling --
  { id: 'Admin - RBAC', description: 'Admin RBAC', routes: ['/admin/*'] },
  { id: 'admin-user-change-password', description: 'Admin User Change Password', routes: ['/admin-user/change-password'] },
  { id: 'admin-user-login', description: 'Admin User Login', routes: ['/admin-user/login'] },
  { id: 'admin-user-logout', description: 'Admin User Logout', routes: ['/admin-user/logout'] },
  { id: 'admin-user-request-password-reset', description: 'Admin User Request Password Reset', routes: ['/admin-user/request-password-reset'] },

  // --- ATA Chapter — routes verbatim from the shuttle's available pane -----
  { id: 'atachapter-index', description: 'ATA Chapter Index', routes: ['/atachapter/index', '/atachapter/index_detail'] },
  { id: 'atachapter-view', description: 'ATA Chapter View', routes: ['/atachapter/view', '/atachapter/view_modal'] },
  { id: 'atachapter-create', description: 'ATA Chapter Create', routes: ['/atachapter/create', '/atachapter/create_modal'] },
  { id: 'atachapter-update', description: 'ATA Chapter Update', routes: ['/atachapter/update'] },

  // --- Actions — routes verbatim from the shuttle's assigned pane ----------
  { id: 'actions-index', description: 'Actions Index', routes: ['/actions/index'] },
  { id: 'actions-view', description: 'Actions View', routes: ['/actions/view'] },
  { id: 'actions-create', description: 'Actions Create', routes: ['/actions/create'] },
  { id: 'actions-update', description: 'Actions Update', routes: ['/actions/update'] },
  { id: 'actions-delete', description: 'Actions Delete', routes: ['/actions/delete'] },

  // --- Modules this app models — same naming convention, contextual -------
  { id: 'project-index', description: 'Project Index', routes: ['/project/index', '/project/list'] },
  { id: 'project-view', description: 'Project View', routes: ['/project/view'] },
  { id: 'project-create', description: 'Project Create', routes: ['/project/create'] },
  { id: 'project-update', description: 'Project Update', routes: ['/project/update'] },
  { id: 'project-delete', description: 'Project Delete', routes: ['/project/delete'] },

  { id: 'timesheet-index', description: 'Timesheet Index', routes: ['/timesheet/index'] },
  { id: 'timesheet-create', description: 'Timesheet Create', routes: ['/timesheet/create'] },
  { id: 'timesheet-update', description: 'Timesheet Update', routes: ['/timesheet/update'] },
  { id: 'timesheet-validate', description: 'Timesheet Validate', routes: ['/timesheet/validate'] },

  { id: 'deliverable-index', description: 'Deliverable Index', routes: ['/deliverable/index'] },
  { id: 'deliverable-create', description: 'Deliverable Create', routes: ['/deliverable/create'] },
  { id: 'deliverable-update', description: 'Deliverable Update', routes: ['/deliverable/update'] },

  { id: 'tcca-index', description: 'TCCA Index', routes: ['/tcca/index'] },
  { id: 'tcca-update', description: 'TCCA Update', routes: ['/tcca/update'] },

  { id: 'report-index', description: 'Report Index', routes: ['/report/index'] },
  { id: 'report-hours-worked', description: 'Report: Hours Worked', routes: ['/report/hours-worked'] },
  { id: 'report-pcc', description: 'Report: Project Completion Checklist', routes: ['/report/pcc'] },
]

/** Registered but guarded by nothing — the "Unassigned" state on System.
    `/*` is the catch-all the client had in the shuttle's assigned pane. */
export const UNASSIGNED_ROUTES = ['/*', '/site/about', '/site/contact', '/debug/*', '/activity/*', '/activity-task/*', '/activities/*', '/activity-tasks/*']

export const ROUTE_REGISTRY: string[] = [
  ...new Set([...ACCESS_PERMISSIONS.flatMap((p) => p.routes), ...UNASSIGNED_ROUTES]),
].sort()

/** Role names + descriptions are verbatim from the client's Roles grid.
    Their permission sets and inheritance are contextual fill. */
export const ACCESS_ROLES: AccessRole[] = [
  {
    id: 'sysadmin', name: 'Sysadmin', description: 'System Administrator',
    permissionIds: ACCESS_PERMISSIONS.map((p) => p.id), childRoleIds: [],
  },
  {
    id: 'elisen-admin', name: 'Elisen - Admin', description: 'Elisen - Administrator',
    permissionIds: ['Admin - RBAC', 'admin-user-login', 'admin-user-logout', 'admin-user-change-password', 'admin-user-request-password-reset', 'report-index', 'report-hours-worked', 'report-pcc'],
    childRoleIds: ['elisen-manager'],
  },
  {
    id: 'elisen-manager', name: 'Elisen - Manager', description: 'Elisen - Manager',
    permissionIds: ['project-create', 'project-update', 'project-delete', 'tcca-update', 'report-index', 'report-hours-worked', 'report-pcc'],
    childRoleIds: ['elisen-supervisor'],
  },
  {
    id: 'elisen-supervisor', name: 'Elisen - Supervisor', description: 'Elisen - Supervisor',
    permissionIds: ['activity-assign', 'activity-create', 'activity-update', 'activity-task-update', 'timesheet-validate'],
    childRoleIds: ['elisen-employee'],
  },
  {
    id: 'elisen-specialist', name: 'Elisen - Specialist', description: 'Elisen - Specialist',
    permissionIds: ['activity-task-create', 'activity-task-update', 'deliverable-create', 'deliverable-update', 'atachapter-create', 'atachapter-update'],
    childRoleIds: ['elisen-employee'],
  },
  {
    id: 'elisen-employee', name: 'Elisen - Employee', description: 'Elisen - Employee',
    permissionIds: ['activity-index', 'activity-view', 'activity-task-index', 'activity-task-view', 'atachapter-index', 'atachapter-view', 'timesheet-index', 'timesheet-create', 'timesheet-update', 'project-index', 'project-view', 'deliverable-index', 'admin-user-login', 'admin-user-logout'],
    childRoleIds: [],
  },
  {
    id: 'elisen-project-group', name: 'Elisen - Project Group', description: 'Elisen - Project Group',
    permissionIds: ['project-index', 'project-view', 'deliverable-index', 'tcca-index', 'report-pcc'],
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

/**
 * Usernames are verbatim — the union of the Users grid and the Assignments
 * grid (the latter adds Sysadmin, tony.francis, clement.neveux, paul.thomas).
 * The Users grid was filtered to Status = Active, so inactive accounts exist
 * off-screen; two are kept here to exercise that state. Role assignments are
 * contextual fill.
 */
export const ACCESS_USERS: AccessUser[] = [
  { id: 'u-sysadmin', username: 'Sysadmin', email: 'sysadmin@elisen.example', status: 'active', roleIds: ['sysadmin'], directPermissionIds: [] },
  { id: 'u-lloyd', username: 'Lloyd', email: 'lloyd@elisen.example', status: 'active', roleIds: ['elisen-admin'], directPermissionIds: [] },
  { id: 'u-andrew', username: 'andrew.armstrong', email: 'andrew.armstrong@elisen.example', status: 'active', roleIds: ['elisen-manager'], directPermissionIds: [] },
  { id: 'u-taif', username: 'taif.rahman', email: 'taif.rahman@elisen.example', status: 'active', roleIds: ['elisen-specialist'], directPermissionIds: [] },
  { id: 'u-charles', username: 'charles.turriff', email: 'charles.turriff@elisen.example', status: 'active', roleIds: ['elisen-supervisor'], directPermissionIds: [] },
  { id: 'u-gordon', username: 'gordon.macleod', email: 'gordon.macleod@elisen.example', status: 'active', roleIds: ['elisen-employee'], directPermissionIds: [] },
  { id: 'u-stephan', username: 'stephan.durand', email: 'stephan.durand@elisen.example', status: 'active', roleIds: ['elisen-employee'], directPermissionIds: [] },
  { id: 'u-tony-s', username: 'tony.smith', email: 'tony.smith@elisen.example', status: 'active', roleIds: ['elisen-employee'], directPermissionIds: [] },
  { id: 'u-harris', username: 'harris.caplan', email: 'harris.caplan@elisen.example', status: 'active', roleIds: ['elisen-manager'], directPermissionIds: [] },
  { id: 'u-francois', username: 'francois.riendeau', email: 'francois.riendeau@elisen.example', status: 'active', roleIds: ['elisen-specialist'], directPermissionIds: [] },
  { id: 'u-cristian', username: 'cristian.villalobos', email: 'cristian.villalobos@elisen.example', status: 'active', roleIds: ['elisen-employee'], directPermissionIds: [] },
  { id: 'u-halina', username: 'halina.brand', email: 'halina.brand@elisen.example', status: 'active', roleIds: ['elisen-project-group'], directPermissionIds: [] },
  { id: 'u-tony-f', username: 'tony.francis', email: 'tony.francis@elisen.example', status: 'active', roleIds: ['elisen-employee'], directPermissionIds: [] },
  { id: 'u-dumitru', username: 'Dumitru.Cristea', email: 'dumitru.cristea@elisen.example', status: 'active', roleIds: ['elisen-employee'], directPermissionIds: [] },
  { id: 'u-clement', username: 'clement.neveux', email: 'clement.neveux@elisen.example', status: 'active', roleIds: ['elisen-employee'], directPermissionIds: [] },
  { id: 'u-hany', username: 'hany.sadek', email: 'hany.sadek@elisen.example', status: 'active', roleIds: ['elisen-specialist'], directPermissionIds: [] },
  { id: 'u-jalal', username: 'jalal.ahmed', email: 'jalal.ahmed@elisen.example', status: 'active', roleIds: ['elisen-manager'], directPermissionIds: ['report-index'] },
  { id: 'u-martin', username: 'martin.dickinson', email: 'martin.dickinson@elisen.example', status: 'active', roleIds: ['elisen-supervisor'], directPermissionIds: [] },
  { id: 'u-arthur', username: 'arthur.mcclements', email: 'arthur.mcclements@elisen.example', status: 'active', roleIds: ['elisen-employee'], directPermissionIds: [] },
  { id: 'u-paul', username: 'paul.thomas', email: 'paul.thomas@elisen.example', status: 'active', roleIds: ['client-manager'], directPermissionIds: [] },
  // Off-screen on the client's grid (it was filtered to Status = Active).
  { id: 'u-rachel', username: 'rachel.dube', email: 'rachel.dube@elisen.example', status: 'inactive', roleIds: ['elisen-employee'], directPermissionIds: [] },
  { id: 'u-owen', username: 'owen.mcgrath', email: 'owen.mcgrath@elisen.example', status: 'inactive', roleIds: ['client-employee'], directPermissionIds: [] },
]
