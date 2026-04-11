export type Role = 'super_admin' | 'content_manager' | 'membership_manager' | 'moderator'

export type ApiAdminRole = 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR'

export type Permission =
  | 'alumni:view' | 'alumni:approve' | 'alumni:reject' | 'alumni:export'
  | 'members:view'
  | 'events:view' | 'events:create' | 'events:edit' | 'events:delete'
  | 'news:view' | 'news:create' | 'news:edit' | 'news:delete'
  | 'projects:view' | 'projects:create' | 'projects:edit' | 'projects:delete'
  | 'admin_users:view' | 'admin_users:create' | 'admin_users:edit' | 'admin_users:delete' | 'admin_users:assign_role'
  | 'donations:view' | 'donations:create' | 'donations:edit' | 'donations:delete' | 'donations:export'
  | 'roles:view' | 'roles:edit'
  | 'settings:view' | 'settings:edit'
  | 'content:view' | 'content:create' | 'content:edit' | 'content:delete'
  | 'executives:view' | 'executives:create' | 'executives:edit' | 'executives:delete'
  | 'jobs:view' | 'jobs:create' | 'jobs:edit' | 'jobs:delete'
  | 'elections:view' | 'elections:create' | 'elections:edit' | 'elections:delete'
  | 'polls:view' | 'polls:create' | 'polls:edit' | 'polls:delete'
  | 'forum:view' | 'forum:moderate'
  | 'announcements:view' | 'announcements:create' | 'announcements:edit' | 'announcements:delete'
  | 'contact:view' | 'contact:manage'

export interface AdminUser {
  id: string
  name: string
  email: string
  password: string
  role: Role
  apiRole?: ApiAdminRole
  avatarUrl?: string
  createdAt: string
  lastLoginAt?: string
  isActive: boolean
}

// Map API admin roles to frontend roles
export const API_ROLE_MAP: Record<ApiAdminRole, Role> = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'content_manager',
  MODERATOR: 'moderator',
}
