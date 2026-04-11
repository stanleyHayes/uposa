import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ROLE_PERMISSIONS } from '../constants/roles'
import type { Permission, Role } from '../types'

interface RolePermissionsState {
  permissions: Record<Role, Permission[]>
  togglePermission: (role: Role, permission: Permission) => void
  resetToDefaults: () => void
}

export const useRolePermissionsStore = create<RolePermissionsState>()(
  persist(
    (set) => ({
      permissions: {
        super_admin: [...ROLE_PERMISSIONS.super_admin],
        content_manager: [...ROLE_PERMISSIONS.content_manager],
        membership_manager: [...ROLE_PERMISSIONS.membership_manager],
        moderator: [...ROLE_PERMISSIONS.moderator],
      },
      togglePermission: (role, permission) =>
        set((s) => {
          const current = s.permissions[role]
          const has = current.includes(permission)
          return {
            permissions: {
              ...s.permissions,
              [role]: has
                ? current.filter((p) => p !== permission)
                : [...current, permission],
            },
          }
        }),
      resetToDefaults: () =>
        set({
          permissions: {
            super_admin: [...ROLE_PERMISSIONS.super_admin],
            content_manager: [...ROLE_PERMISSIONS.content_manager],
            membership_manager: [...ROLE_PERMISSIONS.membership_manager],
            moderator: [...ROLE_PERMISSIONS.moderator],
          },
        }),
    }),
    { name: 'uposa_role_permissions' }
  )
)
