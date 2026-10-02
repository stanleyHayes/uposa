import { useAuthStore } from '../stores/auth.store'
import { hasPermission, hasAnyPermission } from '../utils/permissions'
import type { Permission } from '../types'

/** Permission checks against the server's effective permissions for the signed-in admin. */
export function usePermission() {
  const currentUser = useAuthStore((s) => s.currentUser)

  const can = (permission: Permission): boolean => hasPermission(currentUser, permission)
  const canAny = (perms: Permission[]): boolean => hasAnyPermission(currentUser, perms)

  return { can, canAny }
}
