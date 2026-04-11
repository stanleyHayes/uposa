import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import { useAdminUsersStore } from '../../stores/adminUsers.store'
import { useActivityStore } from '../../stores/activity.store'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { ROLES } from '../../constants/roles'
import type { AdminUser, Role } from '../../types'

const createSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email required'),
  role: z.enum(['super_admin', 'content_manager', 'membership_manager', 'moderator']),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

const editSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email required'),
  role: z.enum(['super_admin', 'content_manager', 'membership_manager', 'moderator']),
  password: z.string().optional(),
})

type CreateForm = z.infer<typeof createSchema>
type EditForm = z.infer<typeof editSchema>

const roleOptions = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'content_manager', label: 'Content Manager' },
  { value: 'membership_manager', label: 'Membership Manager' },
  { value: 'moderator', label: 'Moderator' },
]

export default function AdminUserFormPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEditing = Boolean(id)

  const { users, addUser, updateUser } = useAdminUsersStore()
  const { addActivity } = useActivityStore()
  const { currentUser } = useAuth()
  const { toast } = useToast()

  const existing = isEditing ? users.find((u) => u.id === id) : undefined

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateForm | EditForm>({
    resolver: zodResolver(isEditing ? editSchema : createSchema),
    defaultValues: { name: '', email: '', role: 'moderator', password: isEditing ? '' : 'admin123' },
  })

  useEffect(() => {
    if (existing) {
      reset({ name: existing.name, email: existing.email, role: existing.role, password: '' })
    }
  }, [existing, reset])

  useEffect(() => {
    if (isEditing && !existing) {
      toast.error('User not found')
      navigate('/admin-users')
    }
  }, [isEditing, existing, navigate, toast])

  const onSubmit = async (data: CreateForm | EditForm) => {
    if (!currentUser) return

    if (isEditing && existing) {
      const updates: Partial<AdminUser> = { name: data.name, email: data.email, role: data.role }
      if (data.password && data.password.length >= 6) updates.password = data.password
      updateUser(existing.id, updates)
      addActivity({ action: 'updated admin user', targetType: data.name, targetId: existing.id, performedBy: currentUser.id, performedByName: currentUser.name })
      toast.success('User updated')
      navigate('/admin-users')
    } else {
      const createData = data as CreateForm
      const newUser = addUser({ ...createData, isActive: true })
      addActivity({ action: 'created admin user', targetType: data.name, targetId: newUser.id, performedBy: currentUser.id, performedByName: currentUser.name })
      toast.success('User created', `${data.name} has been added as ${ROLES[data.role]}.`)
      navigate('/admin-users')
    }
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

      <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-dark-border shadow-sm p-6">
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <Input label="Full Name" error={errors.name?.message} {...register('name')} />
          <Input label="Email Address" type="email" error={errors.email?.message} {...register('email')} />
          <Input
            label={isEditing ? 'New Password' : 'Password'}
            type="password"
            error={errors.password?.message}
            {...register('password')}
            helperText={isEditing ? 'Leave blank to keep current password' : 'Minimum 6 characters'}
          />
          <Controller
            name="role"
            control={control}
            render={({ field }) => (
              <Select
                label="Role"
                options={roleOptions}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value as Role)}
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
