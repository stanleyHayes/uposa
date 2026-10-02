// Server-enforced RBAC: permissions are `${resource}:${action}` strings from the API's catalog.
export type PermissionResource =
  | 'registrations' | 'members' | 'mentorship' | 'dues' | 'donations' | 'payments' | 'payment_methods'
  | 'events' | 'news' | 'projects' | 'announcements' | 'executives' | 'school_leaders' | 'gallery'
  | 'jobs' | 'polls' | 'elections' | 'forum' | 'reports' | 'contact' | 'newsletter'
  | 'about' | 'site' | 'admin_users' | 'roles' | 'ai'

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete'

export const PERMISSION_ACTIONS: PermissionAction[] = ['view', 'create', 'edit', 'delete']

type CRUD = PermissionAction

/** Actions each resource supports, mirroring the API catalog (apps/api/src/config/permissions.ts). */
interface CatalogActions {
  /** Approve / reject new member registrations. */
  registrations: 'view' | 'edit'
  /** Member records: suspend, status, profile. */
  members: 'view' | 'edit' | 'delete'
  mentorship: 'view' | 'delete'
  dues: CRUD
  donations: CRUD
  payments: 'view'
  payment_methods: 'view' | 'edit'
  events: CRUD
  news: CRUD
  projects: CRUD
  announcements: CRUD
  executives: CRUD
  school_leaders: CRUD
  gallery: CRUD
  jobs: CRUD
  polls: CRUD
  elections: CRUD
  forum: 'view' | 'edit' | 'delete'
  reports: 'view' | 'edit'
  contact: 'view' | 'edit' | 'delete'
  newsletter: 'view' | 'edit' | 'delete'
  /** About-page content, document upload, year-group reps. */
  about: 'view' | 'edit'
  /** Site config only: contact details, donor payment details, platform fee. */
  site: 'view' | 'edit'
  admin_users: CRUD
  roles: 'view' | 'edit'
  ai: 'create'
}

/** A real catalog permission, e.g. 'donations:edit' (invalid combinations don't type-check). */
export type Permission = { [R in PermissionResource]: `${R}:${CatalogActions[R]}` }[PermissionResource]

/** The system role with every permission; it can't be edited or deleted. */
export const SUPER_ADMIN_ROLE = 'SUPER_ADMIN'

export interface RoleInfo {
  key: string
  name: string
}

export interface AdminUser {
  id: string
  name: string
  email: string
  password: string
  /** Server role (system or custom), e.g. { key: 'ADMIN', name: 'Admin' }. */
  roleInfo?: RoleInfo
  /** Effective permissions from the server (role + individual grants - revokes). */
  permissions?: string[]
  avatarUrl?: string
  createdAt: string
  lastLoginAt?: string
  isActive: boolean
}

/** Admin record as returned by /admin/admins (password stripped). */
export interface ApiAdmin {
  id: string
  fullName: string
  email: string
  /** Role key, e.g. SUPER_ADMIN / ADMIN / MODERATOR or a custom role's key. */
  role: string
  roleInfo?: RoleInfo
  isActive: boolean
  createdAt: string
  lastLoginAt?: string | null
}

export function toAdminUser(admin: ApiAdmin, roleNames?: Map<string, string>): AdminUser {
  return {
    id: admin.id,
    name: admin.fullName,
    email: admin.email,
    password: '',
    roleInfo: admin.roleInfo ?? { key: admin.role, name: roleNames?.get(admin.role) ?? admin.role },
    createdAt: admin.createdAt,
    lastLoginAt: admin.lastLoginAt ?? undefined,
    isActive: admin.isActive,
  }
}

/** One resource in GET /admin/permissions (the catalog). */
export interface PermissionCatalogEntry {
  resource: PermissionResource
  label: string
  description?: string
  actions: PermissionAction[]
}

/** A role from GET /admin/roles. */
export interface AdminRole {
  key: string
  name: string
  description?: string | null
  permissions: string[]
  isSystem: boolean
  adminCount: number
}

/** GET/PUT /admin/admins/:id/permissions. */
export interface AdminPermissionsDetail {
  role: RoleInfo
  grant: string[]
  revoke: string[]
  effective: string[]
}
