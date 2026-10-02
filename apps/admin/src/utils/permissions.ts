import { SUPER_ADMIN_ROLE, type AdminUser, type Permission } from '../types'

export function isSuperAdmin(user: AdminUser | null | undefined): boolean {
  return user?.roleInfo?.key === SUPER_ADMIN_ROLE
}

/** True when the server granted `permission` to this admin (SUPER_ADMIN has everything). */
export function hasPermission(user: AdminUser | null | undefined, permission: Permission): boolean {
  if (!user) return false
  if (isSuperAdmin(user)) return true
  return user.permissions?.includes(permission) ?? false
}

export function hasAnyPermission(user: AdminUser | null | undefined, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(user, p))
}
