import { useAuth } from './useAuth'
import { useRolePermissionsStore } from '../stores/rolePermissions.store'
import type { Permission } from '../types'

export function usePermission() {
  const { currentUser } = useAuth()
  const { permissions } = useRolePermissionsStore()

  const can = (permission: Permission): boolean => {
    if (!currentUser) return false
    return permissions[currentUser.role]?.includes(permission) ?? false
  }

  const canAny = (perms: Permission[]): boolean => {
    if (!currentUser) return false
    return perms.some((p) => can(p))
  }

  return { can, canAny }
}
