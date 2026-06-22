import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Upload, X } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Spinner from '../../components/ui/Spinner'
import { adminSchoolLeadersApi } from '../../api/services'
import { useActivityStore } from '../../stores/activity.store'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import type { SchoolLeader } from '../../types'

const leaderSchema = z.object({
  name: z.string().min(2, 'Full name is required'),
  position: z.string().min(2, 'Position is required'),
  isActive: z.enum(['true', 'false']),
  order: z.coerce.number().int().min(0, 'Order must be at least 0'),
})

type LeaderFormInput = z.input<typeof leaderSchema>
type LeaderForm = z.output<typeof leaderSchema>

const positionOptions = [
  // Tier 0 — Head of School
  { value: 'Headmaster', label: 'Headmaster' },
  { value: 'Headmistress', label: 'Headmistress' },
  // Tier 1 — Assistant / Deputy Heads
  { value: 'Assistant Headmaster (Academic)', label: 'Assistant Headmaster (Academic)' },
  { value: 'Assistant Headmistress (Academic)', label: 'Assistant Headmistress (Academic)' },
  { value: 'Assistant Headmaster (Administration)', label: 'Assistant Headmaster (Administration)' },
  { value: 'Assistant Headmistress (Administration)', label: 'Assistant Headmistress (Administration)' },
  { value: 'Assistant Headmaster (Domestic)', label: 'Assistant Headmaster (Domestic)' },
  { value: 'Assistant Headmistress (Domestic)', label: 'Assistant Headmistress (Domestic)' },
  // Tier 2 — Senior Staff / HODs
  { value: 'Senior Housemaster', label: 'Senior Housemaster' },
  { value: 'Senior Housemistress', label: 'Senior Housemistress' },
  { value: 'Head of Department (Science)', label: 'Head of Department (Science)' },
  { value: 'Head of Department (Mathematics)', label: 'Head of Department (Mathematics)' },
  { value: 'Head of Department (English)', label: 'Head of Department (English)' },
  { value: 'Head of Department (Social Studies)', label: 'Head of Department (Social Studies)' },
  { value: 'Head of Department (ICT)', label: 'Head of Department (ICT)' },
  { value: 'Head of Department (Technical/Vocational)', label: 'Head of Department (Technical/Vocational)' },
  { value: 'Bursar', label: 'Bursar' },
  { value: 'Chaplain', label: 'Chaplain' },
  { value: 'Imam', label: 'Imam' },
  { value: 'Dean of Students', label: 'Dean of Students' },
  { value: 'Guidance & Counselling Coordinator', label: 'Guidance & Counselling Coordinator' },
  // Tier 3 — Housemasters / Other
  { value: 'Housemaster', label: 'Housemaster' },
  { value: 'Housemistress', label: 'Housemistress' },
  { value: 'Sports Coordinator', label: 'Sports Coordinator' },
  { value: 'Examination Officer', label: 'Examination Officer' },
  { value: 'Librarian', label: 'Librarian' },
  { value: 'Store Keeper', label: 'Store Keeper' },
]

const statusOptions = [
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
]

export default function SchoolLeaderFormPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEditing = Boolean(id)

  const { addActivity } = useActivityStore()
  const { currentUser } = useAuth()
  const { toast } = useToast()

  const [existing, setExisting] = useState<SchoolLeader | null>(null)
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
  } = useForm<LeaderFormInput, unknown, LeaderForm>({
    resolver: zodResolver(leaderSchema),
    defaultValues: { name: '', position: '', isActive: 'true', order: 0 },
  })

  const fetchExisting = useCallback(async () => {
    if (!id) return
    try {
      const res = await adminSchoolLeadersApi.getById(id)
      const leader = res.data.data as SchoolLeader
      setExisting(leader)
      setPhotoPreview(leader.photoUrl || null)
      reset({
        name: leader.name,
        position: leader.position,
        isActive: leader.isActive ? 'true' : 'false',
        order: leader.order,
      })
    } catch {
      toast.error('School leader not found')
      navigate('/school-leaders')
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

  const onSubmit = async (data: LeaderForm) => {
    if (!currentUser) return

    const formData = new FormData()
    formData.append('name', data.name)
    formData.append('position', data.position)
    formData.append('order', String(data.order))
    formData.append('isActive', data.isActive)
    if (photoFile) formData.append('photo', photoFile)

    try {
      if (isEditing && existing) {
        await adminSchoolLeadersApi.update(existing.id, formData)
        addActivity({
          action: 'updated school leader',
          targetType: data.name,
          targetId: existing.id,
          performedBy: currentUser.id,
          performedByName: currentUser.name,
        })
        toast.success('School leader updated')
        navigate('/school-leaders')
      } else {
        await adminSchoolLeadersApi.create(formData)
        addActivity({
          action: 'added school leader',
          targetType: data.name,
          targetId: '',
          performedBy: currentUser.id,
          performedByName: currentUser.name,
        })
        toast.success('School leader added')
        navigate('/school-leaders')
      }
    } catch {
      toast.error('Failed to save school leader')
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
          onClick={() => navigate('/school-leaders')}
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          Back to School Leaders
        </button>

        <PageHeader
          title={isEditing ? 'Edit School Leader' : 'Add School Leader'}
          description={isEditing ? `Editing "${existing?.name}"` : 'Add a new school leader'}
        />
      </div>

      <div className="admin-card-surface p-6">
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
            <Controller
              name="position"
              control={control}
              render={({ field }) => (
                <Select
                  label="Position"
                  options={positionOptions}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  error={errors.position?.message}
                />
              )}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Display Order" type="number" error={errors.order?.message} {...register('order')} />
            <Controller
              name="isActive"
              control={control}
              render={({ field }) => (
                <Select
                  label="Status"
                  options={statusOptions}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                />
              )}
            />
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-dark-border">
            <Button type="submit" loading={isSubmitting}>
              {isEditing ? 'Save Changes' : 'Add Leader'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/school-leaders')}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
