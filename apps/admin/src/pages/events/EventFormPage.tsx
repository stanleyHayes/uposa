import { useEffect, useRef, useState } from 'react'
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
import MarkdownEditor from '../../components/ui/MarkdownEditor'
import { adminEventsApi } from '../../api/services'
import { useActivityStore } from '../../stores/activity.store'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { compressImage } from '../../lib/image'
import { apiErrorMessage } from '../../utils/apiError'
import { toDateTimeLocal } from '../../utils/formatters'
import type { Event, EventStatus } from '../../types'

const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

const eventSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  description: z.string().min(10, 'Description is required'),
  imageUrl: z.string().url('Must be a valid URL').or(z.literal('')),
  date: z.string().min(1, 'Date is required'),
  endDate: z.string(),
  location: z.string(),
  rsvpLink: z.string().url('Must be a valid URL').or(z.literal('')),
  status: z.enum(['UPCOMING', 'ONGOING', 'PAST', 'CANCELLED']),
  isFeatured: z.boolean(),
})

type EventForm = z.infer<typeof eventSchema>

const statusOptions: { value: EventStatus; label: string }[] = [
  { value: 'UPCOMING', label: 'Upcoming' },
  { value: 'ONGOING', label: 'Ongoing' },
  { value: 'PAST', label: 'Past' },
  { value: 'CANCELLED', label: 'Cancelled' },
]

function toFormValues(ev?: Event): EventForm {
  if (!ev) return { title: '', description: '', imageUrl: '', date: '', endDate: '', location: '', rsvpLink: '', status: 'UPCOMING', isFeatured: false }
  return {
    title: ev.title,
    description: ev.description,
    imageUrl: ev.imageUrl ?? '',
    date: toDateTimeLocal(ev.date),
    endDate: toDateTimeLocal(ev.endDate),
    location: ev.location ?? '',
    rsvpLink: ev.rsvpLink ?? '',
    status: ev.status,
    isFeatured: ev.isFeatured,
  }
}

export default function EventFormPage() {
  const navigate = useNavigate()
  const { slug } = useParams<{ slug: string }>()
  const isEditMode = Boolean(slug)

  const { addActivity } = useActivityStore()
  const { currentUser } = useAuth()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [existingEvent, setExistingEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(isEditMode)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState('')

  const { register, handleSubmit, reset, control, watch, setValue, formState: { errors, isSubmitting } } = useForm<EventForm>({
    resolver: zodResolver(eventSchema),
    defaultValues: toFormValues(),
  })

  useEffect(() => {
    if (!slug) return
    let cancelled = false
    adminEventsApi.getBySlug(slug)
      .then((res) => {
        if (cancelled) return
        const ev = res.data.data as Event
        setExistingEvent(ev)
        reset(toFormValues(ev))
      })
      .catch(() => {
        if (cancelled) return
        toast.error('Event not found')
        navigate('/events', { replace: true })
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [slug, reset, navigate, toast])

  // Release the previous object URL whenever the preview changes, and on unmount.
  useEffect(() => () => { if (filePreview) URL.revokeObjectURL(filePreview) }, [filePreview])

  const imageUrl = watch('imageUrl')
  const previewSrc = filePreview || imageUrl

  const handleImageSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!IMAGE_TYPES.includes(file.type)) {
      toast.error('Only JPEG, PNG, GIF, WEBP allowed')
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error('Max 10MB')
      return
    }
    setImageFile(file)
    setFilePreview(URL.createObjectURL(file))
  }

  const removeImage = () => {
    setImageFile(null)
    setFilePreview('')
    setValue('imageUrl', '', { shouldDirty: true })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const onSubmit = async (data: EventForm) => {
    if (!currentUser) return

    try {
      const fd = new FormData()
      fd.append('title', data.title)
      fd.append('description', data.description)
      fd.append('date', new Date(data.date).toISOString())
      if (data.endDate) fd.append('endDate', new Date(data.endDate).toISOString())
      fd.append('location', data.location)
      fd.append('rsvpLink', data.rsvpLink)
      fd.append('status', data.status)
      fd.append('isFeatured', String(data.isFeatured))
      // An uploaded file wins; otherwise send the URL ('' clears the image).
      if (imageFile) fd.append('image', await compressImage(imageFile))
      else fd.append('imageUrl', data.imageUrl)

      if (existingEvent) {
        await adminEventsApi.update(existingEvent.id, fd)
        addActivity({ action: 'updated event', targetType: data.title, targetId: existingEvent.id, performedBy: currentUser.id, performedByName: currentUser.name })
        toast.success('Event updated')
        navigate(`/events/${existingEvent.slug}`)
      } else {
        const res = await adminEventsApi.create(fd)
        const created = res.data.data as Event | undefined
        addActivity({ action: 'created event', targetType: data.title, targetId: created?.id ?? '', performedBy: currentUser.id, performedByName: currentUser.name })
        toast.success('Event created')
        navigate(created?.slug ? `/events/${created.slug}` : '/events')
      }
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to save event'))
    }
  }

  if (loading) {
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
          onClick={() => navigate(existingEvent ? `/events/${existingEvent.slug}` : '/events')}
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          {existingEvent ? 'Back to event' : 'Back to all events'}
        </button>
      </div>

      <PageHeader
        title={isEditMode ? 'Edit Event' : 'New Event'}
        description={isEditMode ? `Editing "${existingEvent?.title}"` : 'Create a new event'}
      />

      <div className="admin-card-surface p-6">
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <Input label="Title" error={errors.title?.message} {...register('title')} />
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <MarkdownEditor
                label="Description"
                value={field.value || ''}
                onChange={field.onChange}
                height={250}
                helperText="Supports Markdown formatting"
              />
            )}
          />
          {errors.description && <p className="text-red-500 text-xs -mt-3">{errors.description.message}</p>}

          {/* Cover image: upload a file, or paste a URL */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Cover Image</label>
            {previewSrc ? (
              <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-dark-border mb-3">
                <img src={previewSrc} alt="Preview" className="w-full h-48 object-cover" />
                <button
                  type="button"
                  onClick={removeImage}
                  title="Remove image"
                  className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex flex-col items-center gap-2 p-6 mb-3 border-2 border-dashed border-gray-300 dark:border-dark-border rounded-xl hover:border-brand-400 hover:bg-brand-50/50 dark:hover:bg-brand-900/10 transition-colors cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-dark-hover flex items-center justify-center">
                <Upload size={18} className="text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{imageFile ? 'Replace Image' : 'Upload Image'}</p>
              <p className="text-xs text-gray-400">JPEG, PNG, GIF, WEBP — max 10MB</p>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={handleImageSelected}
            />
            <Input
              label="Or Image URL"
              placeholder="https://..."
              helperText={imageFile ? 'The uploaded file will be used instead of this URL.' : 'Leave blank for no image.'}
              error={errors.imageUrl?.message}
              {...register('imageUrl')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Date & Time" type="datetime-local" error={errors.date?.message} {...register('date')} />
            <Input label="End Date & Time" type="datetime-local" error={errors.endDate?.message} {...register('endDate')} />
          </div>
          <Input label="Location" error={errors.location?.message} {...register('location')} />
          <Input label="RSVP Link" placeholder="https://..." error={errors.rsvpLink?.message} {...register('rsvpLink')} />
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select
                label="Status"
                options={statusOptions}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                error={errors.status?.message}
              />
            )}
          />
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input type="checkbox" {...register('isFeatured')} className="rounded border-gray-300" />
            Featured Event
          </label>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-dark-border">
            <Button variant="secondary" onClick={() => navigate(existingEvent ? `/events/${existingEvent.slug}` : '/events')} type="button">
              Cancel
            </Button>
            <Button loading={isSubmitting} type="submit">
              {isEditMode ? 'Save Changes' : 'Create Event'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
