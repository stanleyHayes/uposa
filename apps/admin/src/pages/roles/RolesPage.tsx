import { useState } from 'react'
import { RotateCcw, Info } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import RoleGate from '../../components/auth/RoleGate'
import { useRolePermissionsStore } from '../../stores/rolePermissions.store'
import { useActivityStore } from '../../stores/activity.store'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { ROLES } from '../../constants/roles'
import type { Permission, Role } from '../../types'

// Grouped permission matrix definition
const PERMISSION_GROUPS: { group: string; color: string; permissions: { key: Permission; label: string }[] }[] = [
  {
    group: 'Alumni',
    color: 'bg-violet-500',
    permissions: [
      { key: 'alumni:view', label: 'View registrations' },
      { key: 'alumni:approve', label: 'Approve registrations' },
      { key: 'alumni:reject', label: 'Reject registrations' },
      { key: 'alumni:export', label: 'Export CSV' },
    ],
  },
  {
    group: 'Members',
    color: 'bg-blue-500',
    permissions: [
      { key: 'members:view', label: 'View directory' },
    ],
  },
  {
    group: 'Events',
    color: 'bg-cyan-500',
    permissions: [
      { key: 'events:view', label: 'View events' },
      { key: 'events:create', label: 'Create events' },
      { key: 'events:edit', label: 'Edit events' },
      { key: 'events:delete', label: 'Delete events' },
    ],
  },
  {
    group: 'News',
    color: 'bg-sky-500',
    permissions: [
      { key: 'news:view', label: 'View articles' },
      { key: 'news:create', label: 'Create articles' },
      { key: 'news:edit', label: 'Edit articles' },
      { key: 'news:delete', label: 'Delete articles' },
    ],
  },
  {
    group: 'Projects',
    color: 'bg-emerald-500',
    permissions: [
      { key: 'projects:view', label: 'View projects' },
      { key: 'projects:create', label: 'Create projects' },
      { key: 'projects:edit', label: 'Edit projects' },
      { key: 'projects:delete', label: 'Delete projects' },
    ],
  },
  {
    group: 'Donations',
    color: 'bg-green-500',
    permissions: [
      { key: 'donations:view', label: 'View donations' },
      { key: 'donations:create', label: 'Record donations' },
      { key: 'donations:edit', label: 'Edit donations' },
      { key: 'donations:delete', label: 'Delete donations' },
      { key: 'donations:export', label: 'Export CSV' },
    ],
  },
  {
    group: 'Admin Users',
    color: 'bg-orange-500',
    permissions: [
      { key: 'admin_users:view', label: 'View admin users' },
      { key: 'admin_users:create', label: 'Create admin users' },
      { key: 'admin_users:edit', label: 'Edit admin users' },
      { key: 'admin_users:delete', label: 'Delete admin users' },
      { key: 'admin_users:assign_role', label: 'Assign roles' },
    ],
  },
  {
    group: 'Roles',
    color: 'bg-red-500',
    permissions: [
      { key: 'roles:view', label: 'View permissions matrix' },
      { key: 'roles:edit', label: 'Edit role permissions' },
    ],
  },
  {
    group: 'Settings',
    color: 'bg-slate-500',
    permissions: [
      { key: 'settings:view', label: 'View settings' },
      { key: 'settings:edit', label: 'Edit settings' },
    ],
  },
]

const ROLE_KEYS: Role[] = ['super_admin', 'content_manager', 'membership_manager', 'moderator']

// Permissions that super_admin must always keep (safety lock)
const SUPER_ADMIN_LOCKED: Permission[] = ['roles:view', 'roles:edit', 'admin_users:view', 'settings:edit']

export default function RolesPage() {
  const { permissions, togglePermission, resetToDefaults } = useRolePermissionsStore()
  const { addActivity } = useActivityStore()
  const { currentUser } = useAuth()
  const { toast } = useToast()
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false)

  const handleToggle = (role: Role, permission: Permission) => {
    // Prevent removing locked super_admin permissions
    if (role === 'super_admin' && SUPER_ADMIN_LOCKED.includes(permission)) {
      toast.error('Locked', 'This permission is required for Super Admin.')
      return
    }
    togglePermission(role, permission)
    const currentlyHas = permissions[role].includes(permission)
    addActivity({
      action: `${currentlyHas ? 'removed' : 'granted'} permission "${permission}" for ${ROLES[role]}`,
      targetType: 'Role',
      targetId: role,
      performedBy: currentUser?.id ?? '',
      performedByName: currentUser?.name ?? '',
    })
  }

  const handleReset = () => {
    resetToDefaults()
    addActivity({
      action: 'reset all role permissions to defaults',
      targetType: 'Roles',
      targetId: 'all',
      performedBy: currentUser?.id ?? '',
      performedByName: currentUser?.name ?? '',
    })
    toast.success('Permissions reset to defaults')
    setResetConfirmOpen(false)
  }

  return (
    <div className="page-enter">
      <PageHeader
        title="Roles & Permissions"
        description="Control what each role can access and do across the admin portal"
        actions={
          <RoleGate permission="roles:edit">
            <Button
              variant="secondary"
              leftIcon={<RotateCcw size={16} />}
              onClick={() => setResetConfirmOpen(true)}
            >
              Reset to Defaults
            </Button>
          </RoleGate>
        }
      />

      {/* Role legend */}
      <div className="flex flex-wrap gap-3 mb-6">
        {ROLE_KEYS.map((role) => (
          <div key={role} className="flex items-center gap-2 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg px-3 py-2 shadow-sm">
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{ROLES[role]}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 ml-auto self-center">
          <Info size={13} />
          Grayed checkboxes on Super Admin are locked for safety
        </div>
      </div>

      {/* Permission matrix */}
      <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-dark-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-gray-50/50 dark:from-dark-hover dark:to-dark-hover/50 border-b-2 border-gray-100 dark:border-dark-border">
                <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-56">
                  Permission
                </th>
                {ROLE_KEYS.map((role) => (
                  <th
                    key={role}
                    className="px-5 py-3.5 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    {ROLES[role]}
                  </th>
                ))}
              </tr>
            </thead>
              {PERMISSION_GROUPS.map((group) => (
                <tbody key={group.group}>
                  {/* Group header row */}
                  <tr className="bg-gray-50/60 dark:bg-dark-hover/60 border-t border-b border-gray-100 dark:border-dark-border">
                    <td colSpan={ROLE_KEYS.length + 1} className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <span className={`inline-block w-2 h-2 rounded-full ${group.color}`} />
                        <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide">{group.group}</span>
                      </div>
                    </td>
                  </tr>
                  {/* Permission rows */}
                  {group.permissions.map((perm) => (
                    <tr key={perm.key} className="border-b border-gray-50 dark:border-dark-border hover:bg-gray-50/50 dark:hover:bg-dark-hover/50 transition-colors">
                      <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300 text-sm pl-8">{perm.label}</td>
                      {ROLE_KEYS.map((role) => {
                        const isGranted = permissions[role].includes(perm.key)
                        const isLocked = role === 'super_admin' && SUPER_ADMIN_LOCKED.includes(perm.key)
                        return (
                          <td key={role} className="px-4 py-2.5 text-center">
                            <RoleGate permission="roles:edit" fallback={
                              <span className={`inline-block w-4 h-4 rounded ${isGranted ? 'bg-brand-500' : 'bg-gray-200'}`} />
                            }>
                              <button
                                onClick={() => handleToggle(role, perm.key)}
                                disabled={isLocked}
                                className={`
                                  w-5 h-5 rounded border-2 flex items-center justify-center mx-auto transition-all
                                  ${isGranted
                                    ? isLocked
                                      ? 'bg-brand-300 border-brand-300 cursor-not-allowed'
                                      : 'bg-brand-600 border-brand-600 hover:bg-brand-700'
                                    : isLocked
                                      ? 'border-gray-200 bg-gray-100 cursor-not-allowed'
                                      : 'border-gray-300 hover:border-brand-400'
                                  }
                                `}
                                title={isLocked ? 'Locked for Super Admin' : isGranted ? 'Remove permission' : 'Grant permission'}
                              >
                                {isGranted && (
                                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </button>
                            </RoleGate>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              ))}

          </table>
        </div>
      </div>

      <ConfirmDialog
        open={resetConfirmOpen}
        onClose={() => setResetConfirmOpen(false)}
        onConfirm={handleReset}
        title="Reset Permissions to Defaults"
        message="This will revert all role permissions back to their original defaults. Any custom changes will be lost."
        confirmLabel="Reset"
      />
    </div>
  )
}
