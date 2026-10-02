import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Check, Lock, X } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Spinner from '../../components/ui/Spinner'
import PermissionGrid from '../../components/permissions/PermissionGrid'
import { adminPermissionsApi, adminRolesApi, adminUsersApi } from '../../api/services'
import { useActivityStore } from '../../stores/activity.store'
import { useAuth } from '../../hooks/useAuth'
import { usePermission } from '../../hooks/usePermission'
import { useToast } from '../../hooks/useToast'
import { apiErrorMessage } from '../../utils/apiError'
import { isSuperAdmin } from '../../utils/permissions'
import {
  SUPER_ADMIN_ROLE,
  toAdminUser,
  type AdminPermissionsDetail,
  type AdminRole,
  type AdminUser,
  type ApiAdmin,
  type PermissionAction,
  type PermissionCatalogEntry,
} from '../../types'

const createSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

const editSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email required'),
  password: z.string().optional(),
})

type AdminUserForm = z.infer<typeof editSchema>

type CellState = 'inherit' | 'allow' | 'deny'

// Mirrors the API's 400 for self-changes (roles.service SELF_CHANGE_MESSAGE).
const SELF_EDIT_MESSAGE = 'Ask another administrator to change your own permissions.'

export default function AdminUserFormPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEditing = Boolean(id)

  const { addActivity } = useActivityStore()
  const { currentUser } = useAuth()
  const { can } = usePermission()
  const { toast } = useToast()

  const [existing, setExisting] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [roles, setRoles] = useState<AdminRole[]>([])
  const [catalog, setCatalog] = useState<PermissionCatalogEntry[]>([])
  const [access, setAccess] = useState<AdminPermissionsDetail | null>(null)
  const [roleKey, setRoleKey] = useState('')
  const [grant, setGrant] = useState<Set<string>>(new Set())
  const [revoke, setRevoke] = useState<Set<string>>(new Set())

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm<AdminUserForm>({
    resolver: zodResolver(isEditing ? editSchema : createSchema),
    defaultValues: { name: '', email: '', password: '' },
  })

  const isSelf = Boolean(existing && existing.id === currentUser?.id)
  const viewerIsSuperAdmin = isSuperAdmin(currentUser)
  // Only a SUPER_ADMIN can assign (or change) the SUPER_ADMIN role.
  const targetIsSuperAdmin = existing?.roleInfo?.key === SUPER_ADMIN_ROLE
  // Roles, the catalog and per-admin permissions are all behind roles:view on the API.
  const canViewRoles = can('roles:view')
  const canEditAccess = canViewRoles && can('roles:edit') && !isSelf && (viewerIsSuperAdmin || !targetIsSuperAdmin)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        let serverRoles: AdminRole[] = []
        if (canViewRoles) {
          const [rolesRes, catalogRes] = await Promise.all([adminRolesApi.list(), adminPermissionsApi.catalog()])
          if (cancelled) return
          serverRoles = rolesRes.data.data ?? []
          setRoles(serverRoles)
          setCatalog(catalogRes.data.data?.catalog ?? [])
        }

        if (!id) {
          setRoleKey(serverRoles.find((r) => r.key === 'MODERATOR')?.key ?? serverRoles.find((r) => r.key !== SUPER_ADMIN_ROLE)?.key ?? '')
          return
        }

        // No GET-by-id for admins; the list is small (and capped at 100 per page).
        const [listRes, permsRes] = await Promise.all([
          adminUsersApi.list({ limit: 100 }),
          canViewRoles ? adminUsersApi.getPermissions(id) : Promise.resolve(null),
        ])
        if (cancelled) return
        const found = ((listRes.data.data || []) as ApiAdmin[]).find((a) => a.id === id)
        if (!found) throw new Error('not found')
        const user = toAdminUser(found, new Map(serverRoles.map((r) => [r.key, r.name])))
        setExisting(user)
        setRoleKey(user.roleInfo?.key ?? '')
        const detail = permsRes?.data.data
        if (detail) {
          setAccess(detail)
          setRoleKey(detail.role.key)
          setGrant(new Set(detail.grant))
          setRevoke(new Set(detail.revoke))
        }
        reset({ name: user.name, email: user.email, password: '' })
      } catch (err) {
        if (cancelled) return
        toast.error(apiErrorMessage(err, id ? 'User not found' : 'Failed to load roles'))
        if (id) navigate('/admin-users', { replace: true })
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [id, canViewRoles, reset, navigate, toast])

  const selectedRole = roles.find((r) => r.key === roleKey)
  const roleGrantsAll = roleKey === SUPER_ADMIN_ROLE
  const rolePermissions = useMemo(() => new Set(selectedRole?.permissions ?? []), [selectedRole])

  const roleOptions = roles.length
    ? roles
        .filter((r) => r.key !== SUPER_ADMIN_ROLE || viewerIsSuperAdmin || r.key === roleKey)
        .map((r) => ({ value: r.key, label: r.name }))
    : existing?.roleInfo
      ? [{ value: existing.roleInfo.key, label: existing.roleInfo.name }]
      : []

  const cellState = (p: string): CellState => (revoke.has(p) ? 'deny' : grant.has(p) ? 'allow' : 'inherit')

  const setCell = (p: string, state: CellState) => {
    const nextGrant = new Set(grant)
    const nextRevoke = new Set(revoke)
    nextGrant.delete(p)
    nextRevoke.delete(p)
    if (state === 'allow') nextGrant.add(p)
    if (state === 'deny') nextRevoke.add(p)
    setGrant(nextGrant)
    setRevoke(nextRevoke)
  }

  const effective = (p: string): { allowed: boolean; source: 'role' | 'granted' | 'revoked' | 'none' } => {
    if (roleGrantsAll) return { allowed: true, source: 'role' }
    if (revoke.has(p)) return { allowed: false, source: 'revoked' }
    if (grant.has(p)) return { allowed: true, source: 'granted' }
    return rolePermissions.has(p) ? { allowed: true, source: 'role' } : { allowed: false, source: 'none' }
  }

  const accessChanged =
    !!access &&
    (roleKey !== access.role.key ||
      [...grant].sort().join() !== [...access.grant].sort().join() ||
      [...revoke].sort().join() !== [...access.revoke].sort().join())

  const onSubmit = async (data: AdminUserForm) => {
    if (!currentUser) return

    try {
      if (isEditing && existing) {
        if (dirtyFields.name || dirtyFields.email) {
          await adminUsersApi.update(existing.id, { fullName: data.name, email: data.email })
        }
        if (canEditAccess && accessChanged) {
          const res = await adminUsersApi.updatePermissions(existing.id, {
            ...(roleKey !== access?.role.key ? { role: roleKey } : {}),
            grant: [...grant],
            revoke: [...revoke],
          })
          if (res.data.data) setAccess(res.data.data)
        }
        addActivity({ action: 'updated admin user', targetType: data.name, targetId: existing.id, performedBy: currentUser.id, performedByName: currentUser.name })
        toast.success('User updated', canEditAccess && accessChanged ? 'Their new permissions apply within about 30 seconds.' : undefined)
      } else {
        const res = await adminUsersApi.create({ fullName: data.name, email: data.email, password: data.password ?? '', role: roleKey || undefined })
        const created = res.data.data as ApiAdmin | undefined
        addActivity({ action: 'created admin user', targetType: data.name, targetId: created?.id ?? '', performedBy: currentUser.id, performedByName: currentUser.name })
        toast.success('User created', `${data.name} has been added as ${selectedRole?.name ?? roleKey}.`)
      }
      navigate('/admin-users')
    } catch (err) {
      toast.error(apiErrorMessage(err, isEditing ? 'Failed to update user' : 'Failed to create user'))
    }
  }

  if (loading) {
    return (
      <div className="page-enter flex items-center justify-center py-32">
        <Spinner size="lg" />
      </div>
    )
  }

  if (isEditing && !existing) return null

  const renderAccessCell = (entry: PermissionCatalogEntry, action: PermissionAction) => {
    const p = `${entry.resource}:${action}`
    const result = effective(p)
    const sourceLabel = { role: 'role', granted: 'granted', revoked: 'revoked', none: '' }[result.source]
    return (
      <div className="flex flex-col items-center gap-1">
        {!roleGrantsAll && (
          <select
            aria-label={`${entry.label} ${action}`}
            value={cellState(p)}
            disabled={!canEditAccess}
            onChange={(e) => setCell(p, e.target.value as CellState)}
            className="w-24 border border-brand-950/15 bg-cream-50/80 px-1.5 py-1 text-xs dark:border-gray-600 dark:bg-dark-hover dark:text-gray-100 disabled:opacity-60"
          >
            <option value="inherit">Inherit</option>
            <option value="allow">Allow</option>
            <option value="deny">Deny</option>
          </select>
        )}
        <span
          className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${result.allowed ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'} ${result.source === 'revoked' ? '!text-red-600 dark:!text-red-400' : ''}`}
          title={result.allowed ? 'Allowed' : 'Not allowed'}
        >
          {result.allowed ? <Check size={12} /> : <X size={12} />}
          {sourceLabel}
        </span>
      </div>
    )
  }

  return (
    <div className="page-enter">
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin-users')}
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          Back to Admin Users
        </button>

        <PageHeader
          title={isEditing ? 'Edit Admin User' : 'Add Admin User'}
          description={isEditing ? `Editing "${existing?.name}"` : 'Create a new admin user'}
        />
      </div>

      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <div className="admin-card-surface p-6 space-y-4">
          <Input label="Full Name" error={errors.name?.message} {...register('name')} />
          <Input label="Email Address" type="email" error={errors.email?.message} {...register('email')} />
          {!isEditing && (
            <Input
              label="Password"
              type="password"
              autoComplete="new-password"
              error={errors.password?.message}
              {...register('password')}
              helperText="Minimum 8 characters"
            />
          )}
          {roleOptions.length > 0 ? (
            <Select
              label="Role"
              options={roleOptions}
              value={roleKey}
              disabled={isEditing && !canEditAccess}
              onChange={(e) => setRoleKey(e.target.value)}
            />
          ) : (
            !isEditing && <p className="text-xs text-gray-500 dark:text-gray-400">New admins get the Admin role. Ask someone with Roles access to change it.</p>
          )}
          {selectedRole?.description && <p className="text-xs text-gray-500 dark:text-gray-400 -mt-2">{selectedRole.description}</p>}
        </div>

        {isEditing && canViewRoles && (
          <div className="admin-card-surface p-6 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Individual permissions</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Inherit uses the role. Allow or Deny overrides it for this admin only. Each cell shows the result and where it comes from.
              </p>
            </div>
            {!canEditAccess && (
              <p className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Lock size={14} />
                {isSelf
                  ? SELF_EDIT_MESSAGE
                  : targetIsSuperAdmin && !viewerIsSuperAdmin
                    ? 'Only a Super Admin can change a Super Admin.'
                    : "You don't have permission to change roles or permissions."}
              </p>
            )}
            {roleGrantsAll ? (
              <p className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Lock size={14} /> Full access. Super Admins always have every permission.
              </p>
            ) : (
              <PermissionGrid catalog={catalog} renderCell={renderAccessCell} />
            )}
          </div>
        )}

        <div className="flex items-center gap-3">
          <Button type="submit" loading={isSubmitting}>
            {isEditing ? 'Save Changes' : 'Create User'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/admin-users')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
