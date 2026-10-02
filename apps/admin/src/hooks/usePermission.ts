import { useAuth } from './useAuth'
import { useRolePermissionsStore } from '../stores/rolePermissions.store'
import { isModerator } from '../utils/permissions'
import type { Permission } from '../types'

// Actions the API refuses to MODERATOR admins (403), whatever the locally editable role matrix says.
const MODERATOR_API_DENIED: Permission[] = ['alumni:reject', 'donations:create', 'donations:edit', 'donations:delete']

export function usePermission() {
  const { currentUser } = useAuth()
  const { permissions } = useRolePermissionsStore()

  const can = (permission: Permission): boolean => {
    if (!currentUser) return false
    if (isModerator(currentUser) && MODERATOR_API_DENIED.includes(permission)) return false
    return permissions[currentUser.role]?.includes(permission) ?? false
  }

  const canAny = (perms: Permission[]): boolean => {
    if (!currentUser) return false
    return perms.some((p) => can(p))
  }

  return { can, canAny }
}
