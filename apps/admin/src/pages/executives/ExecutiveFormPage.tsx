import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Upload, X } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import Select from '../../components/ui/Select'
import Spinner from '../../components/ui/Spinner'
import { adminExecutivesApi } from '../../api/services'
import { useActivityStore } from '../../stores/activity.store'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import type { Executive } from '../../types'

const executiveSchema = z.object({
  name: z.string().min(2, 'Full name is required'),
  position: z.string().min(2, 'Position is required'),
  classOf: z.string().optional(),
  email: z.string().email('Valid email required').or(z.string().length(0)).optional(),
  phone: z.string().optional(),
  bio: z.string().optional(),
  isActive: z.enum(['true', 'false']),
  order: z.coerce.number().int().min(0, 'Order must be at least 0'),
})

type ExecutiveForm = z.infer<typeof executiveSchema>

const termOptions = [
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
]

export default function ExecutiveFormPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEditing = Boolean(id)

  const { addActivity } = useActivityStore()
  const { currentUser } = useAuth()
  const { toast } = useToast()

  const [existing, setExisting] = useState<Executive | null>(null)
  const [loadingExisting, setLoadingExisting] = useState(isEditing)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ExecutiveForm>({
    resolver: zodResolver(executiveSchema),
    defaultValues: { name: '', position: '', classOf: '', email: '', phone: '', bio: '', isActive: 'true', order: 0 },
  })

  const fetchExisting = useCallback(async () => {
    if (!id) return
    try {
      const res = await adminExecutivesApi.getById(id)
      const exec = res.data.data as Executive
      setExisting(exec)
      setPhotoPreview(exec.photoUrl || null)
      reset({
        name: exec.name,
        position: exec.position,
        classOf: exec.classOf || '',
        email: exec.email || '',
        phone: exec.phone || '',
        bio: exec.bio || '',
        isActive: exec.isActive ? 'true' : 'false',
        order: exec.order,
      })
    } catch {
      toast.error('Executive not found')
      navigate('/executives')
    } finally {
      setLoadingExisting(false)
    }
  }, [id, reset, navigate, toast])

  useEffect(() => { fetchExisting() }, [fetchExisting])

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Photo must be under 5MB')
      return
    }
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const clearPhoto = () => {
    setPhotoFile(null)
    setPhotoPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const onSubmit = async (data: ExecutiveForm) => {
    if (!currentUser) return

    const formData = new FormData()
    formData.append('name', data.name)
    formData.append('position', data.position)
    if (data.classOf) formData.append('classOf', data.classOf)
    if (data.email) formData.append('email', data.email)
    if (data.phone) formData.append('phone', data.phone)
    if (data.bio) formData.append('bio', data.bio)
    formData.append('order', String(data.order))
    formData.append('isActive', data.isActive)
    if (photoFile) formData.append('photo', photoFile)

    try {
      if (isEditing && existing) {
        await adminExecutivesApi.update(existing.id, formData)
        addActivity({
          action: 'updated executive',
          targetType: data.name,
          targetId: existing.id,
          performedBy: currentUser.id,
          performedByName: currentUser.name,
        })
        toast.success('Executive updated')
        navigate(`/executives/${existing.id}`)
      } else {
        await adminExecutivesApi.create(formData)
        addActivity({
          action: 'added executive',
          targetType: data.name,
          targetId: '',
          performedBy: currentUser.id,
          performedByName: currentUser.name,
        })
        toast.success('Executive added')
        navigate('/executives')
      }
    } catch {
      toast.error('Failed to save executive')
    }
  }

  if (loadingExisting) {
    return (
      <div className="page-enter flex items-center justify-center py-32">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="page-enter">
      <div className="mb-6">
        <button
          onClick={() => navigate('/executives')}
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          Back to Executives
        </button>

        <PageHeader
          title={isEditing ? 'Edit Executive' : 'Add Executive'}
          description={isEditing ? `Editing "${existing?.name}"` : 'Add a new council member'}
        />
      </div>

      <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-dark-border shadow-sm p-6">
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          {/* Photo upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Photo</label>
            <div className="flex items-center gap-4">
              {photoPreview ? (
                <div className="relative">
                  <img src={photoPreview} alt="Preview" className="w-20 h-20 rounded-xl object-cover border border-gray-200 dark:border-dark-border" />
                  <button
                    type="button"
                    onClick={clearPhoto}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <div className="w-20 h-20 rounded-xl bg-gray-100 dark:bg-dark-hover border-2 border-dashed border-gray-300 dark:border-dark-border flex items-center justify-center">
                  <Upload size={20} className="text-gray-400" />
                </div>
              )}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {photoPreview ? 'Change Photo' : 'Upload Photo'}
                </Button>
                <p className="text-xs text-gray-500 mt-1">JPG, PNG, GIF, WebP. Max 5MB.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Full Name" error={errors.name?.message} {...register('name')} />
            <Input label="Position" placeholder="President" error={errors.position?.message} {...register('position')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Class Of" placeholder="2005" error={errors.classOf?.message} {...register('classOf')} />
            <Input label="Display Order" type="number" error={errors.order?.message} {...register('order')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
            <Input label="Phone" placeholder="+233 24 000 0000" error={errors.phone?.message} {...register('phone')} />
          </div>
          <Textarea label="Bio" rows={3} error={errors.bio?.message} {...register('bio')} />
          <Controller
            name="isActive"
            control={control}
            render={({ field }) => (
              <Select
                label="Status"
                options={termOptions}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
              />
            )}
          />

          <div className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-dark-border">
            <Button type="submit" loading={isSubmitting}>
              {isEditing ? 'Save Changes' : 'Add Executive'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/executives')}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
