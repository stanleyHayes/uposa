// @ts-nocheck
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusCircle, Pencil, Trash2, ShieldCheck, UserX, UserCheck } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Select from '../../components/ui/Select'
import SearchInput from '../../components/ui/SearchInput'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'
import Pagination from '../../components/ui/Pagination'
import PageStats from '../../components/ui/PageStats'
import { PageSkeleton } from '../../components/ui/Skeleton'
import { adminUsersApi } from '../../api/services'
import { useActivityStore } from '../../stores/activity.store'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { formatDate } from '../../utils/formatters'
import { ROLES } from '../../constants/roles'
import type { AdminUser, Role } from '../../types'

export default function AdminUsersPage() {
  const navigate = useNavigate()
  const { addActivity } = useActivityStore()
  const { currentUser } = useAuth()
  const { toast } = useToast()

  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null)
  const [deactivateTarget, setDeactivateTarget] = useState<AdminUser | null>(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')

  const fetchUsers = useCallback(async () => {
    try {
      const res = await adminUsersApi.list({ limit: 100 })
      setUsers(res.data.data || [])
    } catch {
      toast.error('Failed to load admin users')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const roleFilterOptions = [
    { value: '', label: 'All Roles' },
    { value: 'super_admin', label: 'Super Admin' },
    { value: 'content_manager', label: 'Content Manager' },
    { value: 'membership_manager', label: 'Membership Manager' },
    { value: 'moderator', label: 'Moderator' },
  ]

  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter((u) => u.isActive).length,
    inactive: users.filter((u) => !u.isActive).length,
    superAdmins: users.filter((u) => u.role === 'super_admin').length,
  }), [users])

  const filtered = useMemo(() => users.filter((u) => {
    const matchesSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
    const matchesRole = !roleFilter || u.role === roleFilter
    return matchesSearch && matchesRole
  }), [users, search, roleFilter])

  const handleDelete = async () => {
    if (!deleteTarget || !currentUser) return
    try {
      await adminUsersApi.deactivate(deleteTarget.id)
      addActivity({ action: 'deleted admin user', targetType: deleteTarget.name, targetId: deleteTarget.id, performedBy: currentUser.id, performedByName: currentUser.name })
      toast.success('User deleted')
      setDeleteTarget(null)
      fetchUsers()
    } catch {
      toast.error('Failed to delete user')
    }
  }

  const handleDeactivate = async () => {
    if (!deactivateTarget || !currentUser) return
    try {
      if (deactivateTarget.isActive) {
        await adminUsersApi.update(deactivateTarget.id, { isActive: false })
        addActivity({ action: 'deactivated admin user', targetType: deactivateTarget.name, targetId: deactivateTarget.id, performedBy: currentUser.id, performedByName: currentUser.name })
        toast.success('User deactivated')
      } else {
        await adminUsersApi.update(deactivateTarget.id, { isActive: true })
        addActivity({ action: 'activated admin user', targetType: deactivateTarget.name, targetId: deactivateTarget.id, performedBy: currentUser.id, performedByName: currentUser.name })
        toast.success('User activated')
      }
      setDeactivateTarget(null)
      fetchUsers()
    } catch {
      toast.error('Failed to update user status')
    }
  }

  if (loading) return <PageSkeleton cols={6} rows={5} />

  return (
    <div className="page-enter">
      <PageHeader
        title="Admin Users"
        description={`${users.length} admin users`}
        actions={
          <Button leftIcon={<PlusCircle size={16} />} onClick={() => navigate('/admin-users/new')}>
            Add User
          </Button>
        }
      />

      <PageStats
        stats={[
          { label: 'Total Users', value: stats.total, icon: ShieldCheck, color: 'text-brand-600', bg: 'bg-brand-50', border: 'border-brand-100' },
          { label: 'Active', value: stats.active, icon: UserCheck, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
          { label: 'Inactive', value: stats.inactive, icon: UserX, color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-100' },
          { label: 'Super Admins', value: stats.superAdmins, icon: ShieldCheck, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
        ]}
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setCurrentPage(1) }} placeholder="Search users..." className="flex-1" />
        <Select
          options={roleFilterOptions}
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1) }}
          className="sm:w-44"
        />
      </div>

      <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-dark-border shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<ShieldCheck size={40} />}
            title="No admin users"
            description={search || roleFilter ? 'No users match your filters. Try adjusting your search.' : 'Add your first admin user to manage the platform.'}
            action={!search && !roleFilter ? <Button leftIcon={<PlusCircle size={16} />} onClick={() => navigate('/admin-users/new')}>Add User</Button> : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table w-full text-sm">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-50/50 dark:from-dark-hover dark:to-dark-hover/50 border-b-2 border-gray-100 dark:border-dark-border">
                <tr>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Last Login</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Created</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filtered.slice((currentPage - 1) * 10, currentPage * 10).map((user) => {
                  const isSelf = user.id === currentUser?.id
                  return (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={user.avatarUrl ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=4f46e5&color=fff`}
                            alt={user.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {user.name}
                              {isSelf && <span className="ml-1.5 text-xs text-brand-600 bg-brand-50 dark:bg-brand-900/30 px-1.5 py-0.5 rounded-full">You</span>}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={user.role as Role} label={ROLES[user.role]} />
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                        {user.lastLoginAt ? formatDate(user.lastLoginAt) : <span className="text-gray-300 dark:text-gray-600">Never</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{formatDate(user.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => navigate(`/admin-users/${user.id}/edit`)}
                            className="rounded-lg p-1.5 text-gray-500 hover:bg-brand-50 dark:hover:bg-brand-900/30 hover:text-brand-600 transition-colors"
                            title="Edit user"
                          >
                            <Pencil size={15} />
                          </button>
                          {!isSelf && (
                            <>
                              <button
                                onClick={() => setDeactivateTarget(user)}
                                className={`rounded-lg p-1.5 transition-colors ${user.isActive ? 'text-gray-500 hover:bg-yellow-50 hover:text-yellow-600' : 'text-gray-500 hover:bg-green-50 hover:text-green-600'}`}
                                title={user.isActive ? 'Deactivate' : 'Activate'}
                              >
                                {user.isActive ? <UserX size={15} /> : <UserCheck size={15} />}
                              </button>
                              <button
                                onClick={() => setDeleteTarget(user)}
                                className="rounded-lg p-1.5 text-gray-500 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 transition-colors"
                                title="Delete"
                              >
                                <Trash2 size={15} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="px-4 border-t border-gray-100 dark:border-dark-border">
          <Pagination currentPage={currentPage} totalPages={Math.ceil(filtered.length / 10)} totalItems={filtered.length} itemsPerPage={10} onPageChange={setCurrentPage} />
        </div>
      </div>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Admin User"
        message={`Are you sure you want to delete ${deleteTarget?.name}? This action cannot be undone.`}
        confirmLabel="Delete"
      />

      {/* Deactivate/Activate Confirm */}
      <ConfirmDialog
        open={!!deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={handleDeactivate}
        title={deactivateTarget?.isActive ? 'Deactivate User' : 'Activate User'}
        message={
          deactivateTarget?.isActive
            ? `Deactivate ${deactivateTarget?.name}? They will no longer be able to log in.`
            : `Activate ${deactivateTarget?.name}? They will be able to log in again.`
        }
        confirmLabel={deactivateTarget?.isActive ? 'Deactivate' : 'Activate'}
      />
    </div>
  )
}
