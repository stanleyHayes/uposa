import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Spinner from '../../components/ui/Spinner'
import { adminUsersApi } from '../../api/services'
import { useActivityStore } from '../../stores/activity.store'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { ROLES } from '../../constants/roles'
import { apiErrorMessage } from '../../utils/apiError'
import { toAdminUser, type AdminUser, type ApiAdmin, type ApiAdminRole } from '../../types'

// Only roles the API can store (SUPER_ADMIN / ADMIN / MODERATOR).
const ROLE_TO_API = {
  super_admin: 'SUPER_ADMIN',
  content_manager: 'ADMIN',
  moderator: 'MODERATOR',
} as const satisfies Record<string, ApiAdminRole>

type AssignableRole = keyof typeof ROLE_TO_API

const roleEnum = z.enum(['super_admin', 'content_manager', 'moderator'])

const createSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email required'),
  role: roleEnum,
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

// The API has no admin-side password reset, so editing only covers profile + role.
const editSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email required'),
  role: roleEnum,
  password: z.string().optional(),
})

type AdminUserForm = z.infer<typeof editSchema>

const roleOptions = (Object.keys(ROLE_TO_API) as AssignableRole[]).map((value) => ({ value, label: ROLES[value] }))

function toAssignableRole(role: AdminUser['role']): AssignableRole {
  return role in ROLE_TO_API ? (role as AssignableRole) : 'moderator'
}

export default function AdminUserFormPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEditing = Boolean(id)

  const { addActivity } = useActivityStore()
  const { currentUser } = useAuth()
  const { toast } = useToast()

  const [existing, setExisting] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(isEditing)

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<AdminUserForm>({
    resolver: zodResolver(isEditing ? editSchema : createSchema),
    defaultValues: { name: '', email: '', role: 'moderator', password: '' },
  })

  // No GET-by-id endpoint for admins; the list is small (and capped at 100 per page).
  useEffect(() => {
    if (!id) return
    let cancelled = false
    adminUsersApi.list({ limit: 100 })
      .then((res) => {
        if (cancelled) return
        const found = ((res.data.data || []) as ApiAdmin[]).find((a) => a.id === id)
        if (!found) throw new Error('not found')
        const user = toAdminUser(found)
        setExisting(user)
        reset({ name: user.name, email: user.email, role: toAssignableRole(user.role), password: '' })
      })
      .catch(() => {
        if (cancelled) return
        toast.error('User not found')
        navigate('/admin-users', { replace: true })
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id, reset, navigate, toast])

  const onSubmit = async (data: AdminUserForm) => {
    if (!currentUser) return

    try {
      if (isEditing && existing) {
        await adminUsersApi.update(existing.id, { fullName: data.name, email: data.email, role: ROLE_TO_API[data.role] })
        addActivity({ action: 'updated admin user', targetType: data.name, targetId: existing.id, performedBy: currentUser.id, performedByName: currentUser.name })
        toast.success('User updated')
      } else {
        const res = await adminUsersApi.create({ fullName: data.name, email: data.email, password: data.password ?? '', role: ROLE_TO_API[data.role] })
        const created = res.data.data as ApiAdmin | undefined
        addActivity({ action: 'created admin user', targetType: data.name, targetId: created?.id ?? '', performedBy: currentUser.id, performedByName: currentUser.name })
        toast.success('User created', `${data.name} has been added as ${ROLES[data.role]}.`)
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

      <div className="admin-card-surface p-6">
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
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
          <Controller
            name="role"
            control={control}
            render={({ field }) => (
              <Select
                label="Role"
                options={roleOptions}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
              />
            )}
          />

          <div className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-dark-border">
            <Button type="submit" loading={isSubmitting}>
              {isEditing ? 'Save Changes' : 'Create User'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/admin-users')}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
