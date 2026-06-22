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
import MarkdownEditor from '../../components/ui/MarkdownEditor'
import { useEventsStore } from '../../stores/events.store'
import { useActivityStore } from '../../stores/activity.store'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import type { Event, EventStatus } from '../../types'

const eventSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  slug: z.string().min(3, 'Slug is required'),
  description: z.string().min(10, 'Description is required'),
  imageUrl: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
  endDate: z.string().min(1, 'End date is required'),
  location: z.string().min(2, 'Location is required'),
  rsvpLink: z.string().optional(),
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
  if (!ev) return { title: '', slug: '', description: '', imageUrl: '', date: '', endDate: '', location: '', rsvpLink: '', status: 'UPCOMING', isFeatured: false }
  return {
    title: ev.title,
    slug: ev.slug,
    description: ev.description,
    imageUrl: ev.imageUrl ?? '',
    date: ev.date.slice(0, 16),
    endDate: ev.endDate.slice(0, 16),
    location: ev.location,
    rsvpLink: ev.rsvpLink ?? '',
    status: ev.status,
    isFeatured: ev.isFeatured,
  }
}

export default function EventFormPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEditMode = Boolean(id)

  const { events, addEvent, updateEvent } = useEventsStore()
  const { addActivity } = useActivityStore()
  const { currentUser } = useAuth()
  const { toast } = useToast()

  const existingEvent = isEditMode ? events.find((e) => e.id === id) : undefined

  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } = useForm<EventForm>({
    resolver: zodResolver(eventSchema),
    defaultValues: toFormValues(existingEvent),
  })

  useEffect(() => {
    if (isEditMode && existingEvent) {
      reset(toFormValues(existingEvent))
    }
  }, [isEditMode, existingEvent, reset])

  useEffect(() => {
    if (isEditMode && !existingEvent) {
      toast.error('Event not found')
      navigate('/events', { replace: true })
    }
  }, [isEditMode, existingEvent, navigate, toast])

  const onSubmit = async (data: EventForm) => {
    if (!currentUser) return
    const payload = {
      ...data,
      imageUrl: data.imageUrl || '',
      rsvpLink: data.rsvpLink || '',
    }

    if (isEditMode && existingEvent) {
      updateEvent(existingEvent.id, payload)
      addActivity({ action: 'updated event', targetType: data.title, targetId: existingEvent.id, performedBy: currentUser.id, performedByName: currentUser.name })
      toast.success('Event updated')
    } else {
      const ev = addEvent(payload)
      addActivity({ action: 'created event', targetType: data.title, targetId: ev.id, performedBy: currentUser.id, performedByName: currentUser.name })
      toast.success('Event created')
    }
    navigate('/events')
  }

  return (
    <div className="page-enter">
      <div className="mb-6">
        <button
          onClick={() => navigate('/events')}
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          Back to all events
        </button>
      </div>

      <PageHeader
        title={isEditMode ? 'Edit Event' : 'New Event'}
        description={isEditMode ? `Editing "${existingEvent?.title}"` : 'Create a new event'}
      />

      <div className="admin-card-surface p-6">
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <Input label="Title" error={errors.title?.message} {...register('title')} />
          <Input label="Slug" helperText="URL-friendly identifier" error={errors.slug?.message} {...register('slug')} />
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
          <Input label="Image URL" placeholder="https://..." {...register('imageUrl')} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Date & Time" type="datetime-local" error={errors.date?.message} {...register('date')} />
            <Input label="End Date & Time" type="datetime-local" error={errors.endDate?.message} {...register('endDate')} />
          </div>
          <Input label="Location" error={errors.location?.message} {...register('location')} />
          <Input label="RSVP Link" placeholder="https://..." {...register('rsvpLink')} />
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
            <Button variant="secondary" onClick={() => navigate('/events')} type="button">
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
