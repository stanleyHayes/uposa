import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import Select from '../../components/ui/Select'
import { useAnnouncementsStore } from '../../stores/announcements.store'
import { useActivityStore } from '../../stores/activity.store'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import type { AnnouncementType, AnnouncementStatus, AnnouncementAudience } from '../../types'

const announcementSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  body: z.string().min(10, 'Body is required'),
  type: z.enum(['info', 'warning', 'urgent', 'success']),
  status: z.enum(['draft', 'published', 'archived']),
  publishedAt: z.string().optional(),
  expiresAt: z.string().optional(),
  targetAudience: z.enum(['All', 'Members Only', 'Executives Only']),
})

type AnnouncementForm = z.infer<typeof announcementSchema>

const typeOptions: { value: AnnouncementType; label: string }[] = [
  { value: 'info', label: 'Info' },
  { value: 'warning', label: 'Warning' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'success', label: 'Success' },
]

const statusOptions: { value: AnnouncementStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
]

const audienceOptions: { value: AnnouncementAudience; label: string }[] = [
  { value: 'All', label: 'All' },
  { value: 'Members Only', label: 'Members Only' },
  { value: 'Executives Only', label: 'Executives Only' },
]

export default function AnnouncementFormPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEditing = Boolean(id)

  const { announcements, addAnnouncement, updateAnnouncement } = useAnnouncementsStore()
  const { addActivity } = useActivityStore()
  const { currentUser } = useAuth()
  const { toast } = useToast()

  const existing = isEditing ? announcements.find((a) => a.id === id) : undefined

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<AnnouncementForm>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      title: '',
      body: '',
      type: 'info',
      status: 'draft',
      publishedAt: '',
      expiresAt: '',
      targetAudience: 'All',
    },
  })

  useEffect(() => {
    if (existing) {
      reset({
        title: existing.title,
        body: existing.body,
        type: existing.type,
        status: existing.status,
        publishedAt: existing.publishedAt ? existing.publishedAt.substring(0, 10) : '',
        expiresAt: existing.expiresAt ? existing.expiresAt.substring(0, 10) : '',
        targetAudience: existing.targetAudience,
      })
    }
  }, [existing, reset])

  useEffect(() => {
    if (isEditing && !existing) {
      toast.error('Announcement not found')
      navigate('/announcements')
    }
  }, [isEditing, existing, navigate, toast])

  const onSubmit = async (data: AnnouncementForm) => {
    if (!currentUser) return
    const payload = {
      ...data,
      publishedAt:
        data.status === 'published' && !data.publishedAt
          ? new Date().toISOString()
          : (data.publishedAt ?? ''),
      expiresAt: data.expiresAt ?? '',
      createdBy: existing?.createdBy ?? currentUser.name,
    }

    if (isEditing && existing) {
      updateAnnouncement(existing.id, payload)
      addActivity({
        action: 'updated announcement',
        targetType: data.title,
        targetId: existing.id,
        performedBy: currentUser.id,
        performedByName: currentUser.name,
      })
      toast.success('Announcement updated')
      navigate(`/announcements/${existing.id}`)
    } else {
      const ann = addAnnouncement(payload)
      addActivity({
        action: 'created announcement',
        targetType: data.title,
        targetId: ann.id,
        performedBy: currentUser.id,
        performedByName: currentUser.name,
      })
      toast.success('Announcement created')
      navigate('/announcements')
    }
  }

  if (isEditing && !existing) return null

  return (
    <div className="page-enter">
      <div className="mb-6">
        <button
          onClick={() => navigate('/announcements')}
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          Back to Announcements
        </button>

        <PageHeader
          title={isEditing ? 'Edit Announcement' : 'New Announcement'}
          description={isEditing ? `Editing "${existing?.title}"` : 'Create a new announcement for members'}
        />
      </div>

      <div className="admin-card-surface p-6">
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <Input label="Title" error={errors.title?.message} {...register('title')} />
          <Textarea label="Body" rows={4} error={errors.body?.message} {...register('body')} />
          <div className="grid grid-cols-2 gap-4">
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Select
                  label="Type"
                  options={typeOptions}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                />
              )}
            />
            <Controller
              name="status"
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
          <div className="grid grid-cols-2 gap-4">
            <Controller
              name="targetAudience"
              control={control}
              render={({ field }) => (
                <Select
                  label="Target Audience"
                  options={audienceOptions}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                />
              )}
            />
            <Input
              label="Expires At (optional)"
              type="date"
              error={errors.expiresAt?.message}
              {...register('expiresAt')}
            />
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-dark-border">
            <Button type="submit" loading={isSubmitting}>
              {isEditing ? 'Save Changes' : 'Create Announcement'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/announcements')}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
