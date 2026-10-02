import { ROLE_PERMISSIONS } from '../constants/roles'
import type { AdminUser, Permission, Role } from '../types'

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  return permissions.some(p => hasPermission(role, p))
}

/**
 * The API refuses some actions to MODERATOR admins regardless of the (locally
 * editable) role-permission matrix, e.g. payment credential edits and member deletion.
 */
export function isModerator(user: AdminUser | null | undefined): boolean {
  return user?.apiRole === 'MODERATOR' || user?.role === 'moderator'
}
