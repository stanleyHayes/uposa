import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router'
import { Calendar, MapPin, ArrowLeft, UserPlus } from 'lucide-react'
import { useForm } from 'react-hook-form'
import PageTransition from '../../components/common/PageTransition'
import Modal from '../../components/ui/Modal'
import StatusBadge from '../../components/ui/StatusBadge'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { eventsApi } from '../../api/services'
import { MOCK_EVENTS } from '../../data/mock'
import { useAuthStore } from '../../stores/auth.store'
import { useToast } from '../../hooks/useToast'
import { formatDate } from '../../utils/formatters'
import type { Event } from '../../types'

export default function EventDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const user = useAuthStore((s) => s.user)
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [rsvpModal, setRsvpModal] = useState(false)
  const [rsvpLoading, setRsvpLoading] = useState(false)
  const toast = useToast()

  const { register, handleSubmit } = useForm({
    defaultValues: { name: user?.fullName || '', email: user?.email || '', phone: user?.mobileNumber || '' },
  })

  useEffect(() => {
    if (!slug) return
    eventsApi.getBySlug(slug)
      .then((res) => setEvent(res.data.data || MOCK_EVENTS.find((e) => e.slug === slug) || null))
      .catch(() => setEvent(MOCK_EVENTS.find((e) => e.slug === slug) || null))
      .finally(() => setLoading(false))
  }, [slug])

  const onRsvp = async (data: { name: string; email: string; phone: string }) => {
    if (!event) return
    setRsvpLoading(true)
    try {
      await eventsApi.rsvp(event.id, data)
      toast.success('RSVP submitted successfully!')
      setRsvpModal(false)
    } catch {
      toast.error('Failed to submit RSVP')
    } finally {
      setRsvpLoading(false)
    }
  }

  if (loading) return <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
  if (!event) return <div className="text-center py-16"><p>Event not found</p><Link to="/events" className="btn btn-primary mt-4">Back to Events</Link></div>

  return (
    <PageTransition>
      <Link to="/events" className="btn btn-ghost btn-sm mb-4"><ArrowLeft className="w-4 h-4" /> Back to Events</Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {event.imageUrl && <img src={event.imageUrl} alt={event.title} className="w-full h-64 md:h-80 object-cover rounded-xl mb-6" />}
          <div className="flex items-center gap-2 mb-3">
            <StatusBadge status={event.status} />
            {event.isFeatured && <span className="badge badge-secondary badge-sm">Featured</span>}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-4">{event.title}</h1>
          <div className="prose max-w-none text-base-content/80 whitespace-pre-wrap">{event.description}</div>
        </div>

        <div className="space-y-4">
          <div className="card bg-base-100 border border-base-300">
            <div className="card-body space-y-3">
              <h3 className="font-semibold">Event Details</h3>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">{formatDate(event.date)}</p>
                  {event.endDate && <p className="text-base-content/60">to {formatDate(event.endDate)}</p>}
                </div>
              </div>
              {event.location && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-5 h-5 text-primary" />
                  <p>{event.location}</p>
                </div>
              )}
              {event.status === 'UPCOMING' && (
                <button className="btn btn-primary w-full mt-4" onClick={() => setRsvpModal(true)}>
                  <UserPlus className="w-4 h-4" /> RSVP Now
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <Modal open={rsvpModal} onClose={() => setRsvpModal(false)} title="RSVP for Event">
        <form onSubmit={handleSubmit(onRsvp)} className="space-y-4">
          <div className="form-control">
            <label className="label"><span className="label-text">Name</span></label>
            <input type="text" className="input input-bordered" {...register('name', { required: true })} />
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text">Email</span></label>
            <input type="email" className="input input-bordered" {...register('email', { required: true })} />
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text">Phone</span></label>
            <input type="tel" className="input input-bordered" {...register('phone')} />
          </div>
          <button type="submit" className={`btn btn-primary w-full ${rsvpLoading ? 'loading' : ''}`} disabled={rsvpLoading}>
            {rsvpLoading ? 'Submitting...' : 'Confirm RSVP'}
          </button>
        </form>
      </Modal>
    </PageTransition>
  )
}
