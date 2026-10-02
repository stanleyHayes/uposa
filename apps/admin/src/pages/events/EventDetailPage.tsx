import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, Trash2, Calendar, MapPin, ExternalLink } from 'lucide-react'
import Button from '../../components/ui/Button'
import Badge, { type BadgeVariant } from '../../components/ui/Badge'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import Spinner from '../../components/ui/Spinner'
import RoleGate from '../../components/auth/RoleGate'
import { adminEventsApi } from '../../api/services'
import { useActivityStore } from '../../stores/activity.store'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { formatDate } from '../../utils/formatters'
import { apiErrorMessage } from '../../utils/apiError'
import type { Event } from '../../types'

export default function EventDetailPage() {
  const navigate = useNavigate()
  const { slug } = useParams<{ slug: string }>()
  const { addActivity } = useActivityStore()
  const { currentUser } = useAuth()
  const { toast } = useToast()

  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  useEffect(() => {
    if (!slug) return
    let cancelled = false
    adminEventsApi.getBySlug(slug)
      .then((res) => { if (!cancelled) setEvent(res.data.data as Event) })
      .catch(() => {
        if (cancelled) return
        toast.error('Event not found')
        navigate('/events', { replace: true })
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [slug, navigate, toast])

  if (loading) {
    return (
      <div className="page-enter flex items-center justify-center py-32">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!event) return null

  const handleDelete = async () => {
    if (!currentUser) return
    setDeleting(true)
    try {
      await adminEventsApi.delete(event.id)
      addActivity({ action: 'deleted event', targetType: event.title, targetId: event.id, performedBy: currentUser.id, performedByName: currentUser.name })
      toast.success('Event deleted')
      navigate('/events')
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to delete event'))
      setDeleting(false)
    }
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

        {event.imageUrl && (
          <div className="rounded-xl overflow-hidden mb-6 border border-gray-200 dark:border-dark-border">
            <img src={event.imageUrl} alt={event.title} className="w-full h-64 object-cover" />
          </div>
        )}

        <div className="admin-card-surface p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge variant={event.status.toLowerCase() as BadgeVariant} label={event.status.charAt(0) + event.status.slice(1).toLowerCase()} />
                {event.isFeatured && (
                  <Badge variant="warning" label="Featured" />
                )}
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{event.title}</h1>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <RoleGate permission="events:edit">
                <Button size="sm" variant="secondary" leftIcon={<Pencil size={14} />} onClick={() => navigate(`/events/${event.slug}/edit`)}>
                  Edit
                </Button>
              </RoleGate>
              <RoleGate permission="events:delete">
                <Button size="sm" variant="danger" leftIcon={<Trash2 size={14} />} onClick={() => setShowDeleteDialog(true)}>
                  Delete
                </Button>
              </RoleGate>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Calendar size={16} className="text-gray-400 shrink-0" />
              <div>
                <p>{formatDate(event.date)}</p>
                {event.endDate && <p className="text-gray-400 dark:text-gray-500">to {formatDate(event.endDate)}</p>}
              </div>
            </div>
            {event.location && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <MapPin size={16} className="text-gray-400 shrink-0" />
                <span>{event.location}</span>
              </div>
            )}
          </div>

          {event.rsvpLink && (
            <div className="mb-6">
              <a
                href={event.rsvpLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-brand-600 dark:text-brand-400 hover:underline"
              >
                <ExternalLink size={14} />
                RSVP Link
              </a>
            </div>
          )}

          <div className="bg-gray-50 dark:bg-dark-hover rounded-lg p-4 text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
            {event.description}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-dark-border flex items-center gap-6 text-xs text-gray-400 dark:text-gray-500">
            <span>Created: {formatDate(event.createdAt)}</span>
            <span>Updated: {formatDate(event.updatedAt)}</span>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Event"
        message={`Are you sure you want to delete "${event.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  )
}
