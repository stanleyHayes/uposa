import { useCallback, useEffect, useMemo, useState } from 'react'
import { PlusCircle, Pencil, Trash2, ShieldHalf, Eye, Lock } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'
import { PageSkeleton } from '../../components/ui/Skeleton'
import RoleGate from '../../components/auth/RoleGate'
import PermissionGrid from '../../components/permissions/PermissionGrid'
import { adminPermissionsApi, adminRolesApi } from '../../api/services'
import { useActivityStore } from '../../stores/activity.store'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { apiErrorMessage } from '../../utils/apiError'
import { SUPER_ADMIN_ROLE, type AdminRole, type PermissionAction, type PermissionCatalogEntry } from '../../types'

const perm = (entry: PermissionCatalogEntry, action: PermissionAction) => `${entry.resource}:${action}`

interface EditorState {
  /** null = creating a new role */
  role: AdminRole | null
  name: string
  description: string
  selected: Set<string>
}

export default function RolesPage() {
  const { addActivity } = useActivityStore()
  const { currentUser } = useAuth()
  const { toast } = useToast()

  const [roles, setRoles] = useState<AdminRole[]>([])
  const [catalog, setCatalog] = useState<PermissionCatalogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [editor, setEditor] = useState<EditorState | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<AdminRole | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const [rolesRes, catalogRes] = await Promise.all([adminRolesApi.list(), adminPermissionsApi.catalog()])
      setRoles(rolesRes.data.data ?? [])
      setCatalog(catalogRes.data.data?.catalog ?? [])
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to load roles'))
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { fetchData() }, [fetchData])

  const allPermissions = useMemo(() => catalog.flatMap((e) => e.actions.map((a) => perm(e, a))), [catalog])

  const isFullAccess = editor?.role?.key === SUPER_ADMIN_ROLE
  // The API refuses permission changes to the role you hold yourself (name/description are fine).
  const isOwnRole = !!editor?.role && editor.role.key === currentUser?.roleInfo?.key

  const openCreate = () => setEditor({ role: null, name: '', description: '', selected: new Set() })
  const openEdit = (role: AdminRole) =>
    setEditor({ role, name: role.name, description: role.description ?? '', selected: new Set(role.permissions) })

  const toggle = (keys: string[], on: boolean) => {
    setEditor((prev) => {
      if (!prev) return prev
      const next = new Set(prev.selected)
      keys.forEach((k) => (on ? next.add(k) : next.delete(k)))
      return { ...prev, selected: next }
    })
  }

  const handleSave = async () => {
    if (!editor || !currentUser) return
    const name = editor.name.trim()
    if (name.length < 2) {
      toast.error('Role name is required')
      return
    }
    setSaving(true)
    const payload = {
      name,
      description: editor.description.trim() || undefined,
      ...(isOwnRole ? {} : { permissions: [...editor.selected] }),
    }
    try {
      if (editor.role) {
        await adminRolesApi.update(editor.role.key, payload)
        toast.success('Role updated', 'Admins with this role get the change within about 30 seconds.')
      } else {
        await adminRolesApi.create({ ...payload, permissions: [...editor.selected] })
        toast.success('Role created')
      }
      addActivity({
        action: editor.role ? 'updated role' : 'created role',
        targetType: name,
        targetId: editor.role?.key ?? '',
        performedBy: currentUser.id,
        performedByName: currentUser.name,
      })
      setEditor(null)
      fetchData()
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to save role'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget || !currentUser) return
    setDeleting(true)
    try {
      await adminRolesApi.delete(deleteTarget.key)
      addActivity({ action: 'deleted role', targetType: deleteTarget.name, targetId: deleteTarget.key, performedBy: currentUser.id, performedByName: currentUser.name })
      toast.success('Role deleted')
      setDeleteTarget(null)
      fetchData()
    } catch (err) {
      // 409 when admins still have this role.
      toast.error(apiErrorMessage(err, 'Failed to delete role'))
    } finally {
      setDeleting(false)
    }
  }

  if (loading) return <PageSkeleton cols={5} rows={4} />

  return (
    <div className="page-enter">
      <PageHeader
        title="Roles & Permissions"
        description="Roles are enforced by the API. Changes reach signed-in admins within about 30 seconds."
        actions={
          <RoleGate permission="roles:edit">
            <Button leftIcon={<PlusCircle size={16} />} onClick={openCreate} disabled={catalog.length === 0}>
              Create Role
            </Button>
          </RoleGate>
        }
      />

      <div className="admin-card-surface overflow-hidden">
        {roles.length === 0 ? (
          <EmptyState icon={<ShieldHalf size={40} />} title="No roles" description="Roles from the server will appear here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table w-full text-sm">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-50/50 dark:from-dark-hover dark:to-dark-hover/50 border-b-2 border-gray-100 dark:border-dark-border">
                <tr>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Permissions</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Admins</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {roles.map((role) => {
                  const fullAccess = role.key === SUPER_ADMIN_ROLE
                  return (
                    <tr key={role.key} className="border-b border-gray-50 dark:border-dark-border">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900 dark:text-gray-100">{role.name}</p>
                          {role.isSystem && <Badge variant="default" label="System" />}
                        </div>
                        {role.description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{role.description}</p>}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-600 dark:text-gray-400">
                        {fullAccess ? 'Full access' : `${role.permissions.length} of ${allPermissions.length}`}
                      </td>
                      <td className="px-5 py-3.5 text-gray-700 dark:text-gray-300">{role.adminCount}</td>
                      <td className="px-5 py-3.5">
                        <div className="inline-flex items-center gap-1">
                          {fullAccess ? (
                            <button onClick={() => openEdit(role)} title="View" className="rounded-lg p-1.5 text-gray-400 hover:bg-brand-50 dark:hover:bg-brand-900/30 hover:text-brand-600 transition-all duration-150">
                              <Eye size={15} />
                            </button>
                          ) : (
                            <RoleGate permission="roles:edit">
                              <button onClick={() => openEdit(role)} title="Edit" className="rounded-lg p-1.5 text-gray-400 hover:bg-brand-50 dark:hover:bg-brand-900/30 hover:text-brand-600 transition-all duration-150">
                                <Pencil size={15} />
                              </button>
                            </RoleGate>
                          )}
                          {!role.isSystem && (
                            <RoleGate permission="roles:edit">
                              <button onClick={() => setDeleteTarget(role)} title="Delete" className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 transition-all duration-150">
                                <Trash2 size={15} />
                              </button>
                            </RoleGate>
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
      </div>

      {/* Role editor */}
      <Modal
        open={!!editor}
        onClose={() => { if (!saving) setEditor(null) }}
        title={isFullAccess ? editor?.role?.name : editor?.role ? `Edit Role: ${editor.role.name}` : 'Create Role'}
        size="xl"
        footer={
          isFullAccess ? (
            <Button variant="secondary" onClick={() => setEditor(null)}>Close</Button>
          ) : (
            <>
              <Button variant="secondary" onClick={() => setEditor(null)} disabled={saving}>Cancel</Button>
              <Button onClick={handleSave} loading={saving}>{editor?.role ? 'Save Role' : 'Create Role'}</Button>
            </>
          )
        }
      >
        {editor && (
          isFullAccess ? (
            <p className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Lock size={14} /> Full access. The Super Admin role always has every permission and can't be changed.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Role name"
                  value={editor.name}
                  onChange={(e) => setEditor({ ...editor, name: e.target.value })}
                />
                <Textarea
                  label="Description"
                  rows={2}
                  value={editor.description}
                  onChange={(e) => setEditor({ ...editor, description: e.target.value })}
                />
              </div>
              {isOwnRole && (
                <p className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Lock size={14} /> You hold this role, so its permissions are read-only for you. Ask another administrator to change your own permissions.
                </p>
              )}
              <PermissionGrid
                catalog={catalog}
                rowControlLabel="All"
                renderCell={(entry, action) => (
                  <input
                    type="checkbox"
                    aria-label={`${entry.label} ${action}`}
                    className="h-4 w-4 rounded border-gray-300 accent-brand-600"
                    checked={editor.selected.has(perm(entry, action))}
                    disabled={isOwnRole}
                    onChange={(e) => toggle([perm(entry, action)], e.target.checked)}
                  />
                )}
                renderRowControl={(entry) => {
                  const keys = entry.actions.map((a) => perm(entry, a))
                  const all = keys.every((k) => editor.selected.has(k))
                  return (
                    <input
                      type="checkbox"
                      aria-label={`All ${entry.label} permissions`}
                      className="h-4 w-4 rounded border-gray-300 accent-brand-600"
                      checked={all}
                      disabled={isOwnRole}
                      onChange={(e) => toggle(keys, e.target.checked)}
                    />
                  )
                }}
                renderColumnControl={(action) => {
                  const keys = catalog.filter((e) => e.actions.includes(action)).map((e) => perm(e, action))
                  const all = keys.length > 0 && keys.every((k) => editor.selected.has(k))
                  return (
                    <button
                      type="button"
                      disabled={isOwnRole}
                      className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:underline disabled:opacity-40 disabled:no-underline"
                      onClick={() => toggle(keys, !all)}
                    >
                      {all ? 'None' : 'All'}
                    </button>
                  )
                }}
              />
            </div>
          )
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Role"
        message={`Delete the "${deleteTarget?.name}" role? Roles still assigned to admins can't be deleted.`}
        confirmLabel="Delete"
      />
    </div>
  )
}
