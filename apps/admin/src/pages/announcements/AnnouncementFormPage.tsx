import { useEffect, useState } from 'react'
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
import Spinner from '../../components/ui/Spinner'
import { adminAnnouncementsApi, type AdminAnnouncementInput } from '../../api/services'
import { useActivityStore } from '../../stores/activity.store'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { apiErrorMessage } from '../../utils/apiError'
import { toDateTimeLocal } from '../../utils/formatters'
import {
  AUDIENCE_TO_API,
  toAnnouncement,
  type Announcement,
  type ApiAnnouncement,
  type AnnouncementType,
  type AnnouncementStatus,
  type AnnouncementAudience,
} from '../../types'

const announcementSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  body: z.string().min(10, 'Body is required'),
  type: z.enum(['info', 'warning', 'urgent', 'success']),
  status: z.enum(['draft', 'published', 'archived']),
  expiresAt: z.string(),
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

function toPayload(data: AnnouncementForm): AdminAnnouncementInput {
  return {
    title: data.title,
    body: data.body,
    type: data.type.toUpperCase() as AdminAnnouncementInput['type'],
    status: data.status.toUpperCase() as AdminAnnouncementInput['status'],
    audience: AUDIENCE_TO_API[data.targetAudience],
    // '' clears the expiry.
    expiresAt: data.expiresAt ? new Date(data.expiresAt).toISOString() : '',
  }
}

export default function AnnouncementFormPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEditing = Boolean(id)

  const { addActivity } = useActivityStore()
  const { currentUser } = useAuth()
  const { toast } = useToast()

  const [existing, setExisting] = useState<Announcement | null>(null)
  const [loading, setLoading] = useState(isEditing)

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
      expiresAt: '',
      targetAudience: 'All',
    },
  })

  useEffect(() => {
    if (!id) return
    let cancelled = false
    adminAnnouncementsApi.getById(id)
      .then((res) => {
        if (cancelled) return
        const ann = toAnnouncement(res.data.data as ApiAnnouncement)
        setExisting(ann)
        reset({
          title: ann.title,
          body: ann.body,
          type: ann.type,
          status: ann.status,
          expiresAt: toDateTimeLocal(ann.expiresAt),
          targetAudience: ann.targetAudience,
        })
      })
      .catch(() => {
        if (cancelled) return
        toast.error('Announcement not found')
        navigate('/announcements', { replace: true })
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id, reset, navigate, toast])

  const onSubmit = async (data: AnnouncementForm) => {
    if (!currentUser) return

    try {
      if (existing) {
        await adminAnnouncementsApi.update(existing.id, toPayload(data))
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
        const res = await adminAnnouncementsApi.create(toPayload(data))
        const created = res.data.data as ApiAnnouncement | undefined
        addActivity({
          action: 'created announcement',
          targetType: data.title,
          targetId: created?.id ?? '',
          performedBy: currentUser.id,
          performedByName: currentUser.name,
        })
        toast.success('Announcement created')
        navigate(created?.id ? `/announcements/${created.id}` : '/announcements')
      }
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to save announcement'))
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
          onClick={() => navigate(existing ? `/announcements/${existing.id}` : '/announcements')}
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          {existing ? 'Back to Announcement' : 'Back to Announcements'}
        </button>

        <PageHeader
          title={isEditing ? 'Edit Announcement' : 'New Announcement'}
          description={isEditing ? `Editing "${existing?.title}"` : 'Create a new announcement for members'}
        />
      </div>

      <div className="admin-card-surface p-6">
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <Input label="Title" error={errors.title?.message} {...register('title')} />
          <Textarea label="Body" rows={6} helperText="Supports Markdown" error={errors.body?.message} {...register('body')} />
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
              type="datetime-local"
              helperText="Leave blank for no expiry."
              error={errors.expiresAt?.message}
              {...register('expiresAt')}
            />
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-dark-border">
            <Button type="submit" loading={isSubmitting}>
              {isEditing ? 'Save Changes' : 'Create Announcement'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate(existing ? `/announcements/${existing.id}` : '/announcements')}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
