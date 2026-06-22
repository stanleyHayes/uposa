import { BouncingDots } from "../../components/ui/BouncingDots";
import { useEffect, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router'
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Clock,
  MapPin,
  Ticket,
  UserPlus,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import PageTransition from '../../components/common/PageTransition'
import Modal from '../../components/ui/Modal'
import StatusBadge from '../../components/ui/StatusBadge'
import { eventsApi } from '../../api/services'
import MarkdownContent from '../../components/common/MarkdownContent'
import { useAuthStore } from '../../stores/auth.store'
import { useToast } from '../../hooks/useToast'
import { formatDate } from '../../utils/formatters'
import type { Event } from '../../types'

type RsvpForm = {
  name: string
  email: string
  phone: string
}

function DetailSkeleton() {
  return (
    <PageTransition>
      <div className="space-y-5">
        <div className="h-11 w-36 animate-pulse bg-base-300/45 rounded-[14px_3px_14px_3px]" />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="overflow-hidden border border-primary/8 bg-base-100 rounded-[28px_6px_28px_6px]">
            <div className="h-80 animate-pulse bg-base-300/45" />
            <div className="space-y-4 p-6">
              <div className="h-4 w-28 animate-pulse bg-base-300/45" />
              <div className="h-9 w-4/5 animate-pulse bg-base-300/55" />
              <div className="h-4 w-full animate-pulse bg-base-300/35" />
              <div className="h-4 w-5/6 animate-pulse bg-base-300/35" />
            </div>
          </div>
          <div className="h-72 animate-pulse bg-base-300/35 rounded-[24px_4px_24px_4px]" />
        </div>
      </div>
    </PageTransition>
  )
}

function DetailMeta({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 border border-primary/8 bg-base-200/45 p-4 rounded-[18px_4px_18px_4px]">
      <span className="grid h-10 w-10 shrink-0 place-items-center bg-primary/8 text-primary rounded-[14px_3px_14px_3px]">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-base-content/42">{label}</span>
        <span className="mt-1 block text-sm font-bold leading-snug text-base-content">{children}</span>
      </span>
    </div>
  )
}

export default function EventDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const user = useAuthStore((state) => state.user)
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [rsvpModal, setRsvpModal] = useState(false)
  const [rsvpLoading, setRsvpLoading] = useState(false)
  const toast = useToast()

  const { register, handleSubmit } = useForm<RsvpForm>({
    defaultValues: {
      name: user?.fullName || '',
      email: user?.email || '',
      phone: user?.mobileNumber || '',
    },
  })

  useEffect(() => {
    if (!slug) {
      setLoading(false)
      return
    }
    setLoading(true)
    eventsApi.getBySlug(slug)
      .then((res) => setEvent(res.data.data || null))
      .catch(() => setEvent(null))
      .finally(() => setLoading(false))
  }, [slug])

  const onRsvp = async (data: RsvpForm) => {
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

  if (loading) return <DetailSkeleton />

  if (!event) {
    return (
      <PageTransition>
        <div className="flex min-h-[60vh] flex-col items-center justify-center border border-primary/10 bg-base-100/88 px-6 py-14 text-center shadow-[0_16px_44px_rgba(0,27,80,0.07)] rounded-[28px_6px_28px_6px]">
          <span className="grid h-16 w-16 place-items-center bg-primary/8 text-primary rounded-[18px_4px_18px_4px]">
            <CalendarDays className="h-7 w-7" />
          </span>
          <h1 className="mt-5 text-2xl font-bold">Event not found</h1>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-base-content/55">This event may have moved, expired, or is not available in the alumni portal.</p>
          <Link to="/events" className="btn btn-primary mt-6">
            <ArrowLeft className="h-4 w-4" />
            Back to events
          </Link>
        </div>
      </PageTransition>
    )
  }

  const canRsvp = event.status === 'UPCOMING'

  return (
    <PageTransition>
      <div className="relative space-y-5">
        <img
          src="/logo.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none fixed right-[-8rem] top-24 z-0 hidden h-[26rem] w-[26rem] object-contain opacity-[0.025] xl:block"
        />

        <Link
          to="/events"
          className="relative z-10 inline-flex items-center gap-2 border border-primary/10 bg-base-100/82 px-3 py-2 text-sm font-bold text-base-content/68 transition-colors hover:border-primary/20 hover:text-primary rounded-[14px_3px_14px_3px]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to events
        </Link>

        <div className="relative z-10 grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <article className="overflow-hidden border border-primary/10 bg-base-100/94 shadow-[0_20px_58px_rgba(0,27,80,0.08)] rounded-[28px_6px_28px_6px]">
            <header className="relative overflow-hidden bg-primary text-primary-content">
              {event.imageUrl ? (
                <img src={event.imageUrl} alt={event.title} className="absolute inset-0 h-full w-full object-cover opacity-35" />
              ) : (
                <img src="/logo.png" alt="" aria-hidden="true" className="absolute -right-16 -top-20 h-80 w-80 object-contain opacity-[0.055]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/62" />
              <div className="relative min-h-[24rem] p-5 sm:p-7 lg:p-8">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 bg-secondary px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-primary">
                    <Ticket className="h-3.5 w-3.5" />
                    Alumni event
                  </span>
                  <StatusBadge status={event.status} className="border-primary-content/15 bg-primary-content/12 text-primary-content" />
                  {event.isFeatured && (
                    <span className="border border-primary-content/15 bg-primary-content/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-primary-content/72">Featured</span>
                  )}
                </div>
                <div className="flex min-h-[17rem] flex-col justify-end">
                  <p className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-secondary">{formatDate(event.date, 'MMM d, yyyy')}</p>
                  <h1 className="max-w-4xl text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">{event.title}</h1>
                  {event.location && (
                    <p className="mt-4 flex max-w-3xl items-center gap-2 text-sm leading-relaxed text-primary-content/66 sm:text-base">
                      <MapPin className="h-4 w-4 shrink-0 text-secondary" />
                      {event.location}
                    </p>
                  )}
                </div>
              </div>
            </header>

            <div className="p-5 sm:p-7 lg:p-8">
              <MarkdownContent
                content={event.description}
                className="prose-lg prose-headings:font-bold prose-headings:text-primary prose-p:leading-relaxed prose-li:leading-relaxed"
              />
            </div>
          </article>

          <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
            <div className="overflow-hidden border border-primary/10 bg-base-100/90 shadow-[0_16px_44px_rgba(0,27,80,0.07)] rounded-[24px_4px_24px_4px]">
              <div className="h-1 bg-gradient-to-r from-secondary via-primary to-secondary" />
              <div className="p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-secondary">Event details</p>
                <div className="mt-5 space-y-3">
                  <DetailMeta icon={CalendarDays} label="Starts">
                    {formatDate(event.date, 'MMM d, yyyy h:mm a')}
                  </DetailMeta>
                  {event.endDate && (
                    <DetailMeta icon={Clock} label="Ends">
                      {formatDate(event.endDate, 'MMM d, yyyy h:mm a')}
                    </DetailMeta>
                  )}
                  <DetailMeta icon={MapPin} label="Venue">
                    {event.location || 'Venue pending'}
                  </DetailMeta>
                </div>

                {canRsvp ? (
                  <button className="btn btn-primary mt-5 min-h-12 w-full justify-between px-5" onClick={() => setRsvpModal(true)}>
                    <span className="inline-flex items-center gap-2">
                      <UserPlus className="h-4 w-4" />
                      RSVP now
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <div className="mt-5 border border-primary/10 bg-base-200/55 p-4 text-sm font-semibold leading-relaxed text-base-content/56 rounded-[18px_4px_18px_4px]">
                    RSVP is not open for this event.
                  </div>
                )}
              </div>
            </div>

            <div className="border border-primary/10 bg-primary p-5 text-primary-content shadow-[0_18px_48px_rgba(0,27,80,0.13)] rounded-[24px_4px_24px_4px]">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-secondary">Calendar</p>
              <h2 className="mt-2 text-xl font-bold leading-tight">See what else is coming up.</h2>
              <p className="mt-3 text-sm leading-relaxed text-primary-content/58">Return to the event lineup for AGMs, reunions, fundraisers, and school moments.</p>
              <Link to="/events" className="mt-5 inline-flex w-full items-center justify-between bg-secondary px-4 py-3 text-sm font-bold text-primary">
                Browse all events
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </aside>
        </div>
      </div>

      <Modal open={rsvpModal} onClose={() => setRsvpModal(false)} title="RSVP for Event">
        <form onSubmit={handleSubmit(onRsvp)} className="space-y-4">
          <div className="rounded-[18px_4px_18px_4px] border border-primary/10 bg-base-200/45 p-4">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center bg-primary/8 text-primary rounded-[14px_3px_14px_3px]">
                <Users className="h-4 w-4" />
              </span>
              <div>
                <p className="font-bold leading-tight">{event.title}</p>
                <p className="mt-1 text-sm text-base-content/55">{formatDate(event.date, 'MMM d, yyyy h:mm a')}</p>
              </div>
            </div>
          </div>

          <label className="form-control">
            <span className="label pb-2"><span className="text-xs font-bold uppercase tracking-[0.14em] text-base-content/50">Name</span></span>
            <input type="text" className="input input-bordered h-12 border-primary/10 bg-base-100 focus:border-primary" {...register('name', { required: true })} />
          </label>
          <label className="form-control">
            <span className="label pb-2"><span className="text-xs font-bold uppercase tracking-[0.14em] text-base-content/50">Email</span></span>
            <input type="email" className="input input-bordered h-12 border-primary/10 bg-base-100 focus:border-primary" {...register('email', { required: true })} />
          </label>
          <label className="form-control">
            <span className="label pb-2"><span className="text-xs font-bold uppercase tracking-[0.14em] text-base-content/50">Phone</span></span>
            <input type="tel" className="input input-bordered h-12 border-primary/10 bg-base-100 focus:border-primary" {...register('phone')} />
          </label>

          <button type="submit" className="btn btn-primary min-h-12 w-full" disabled={rsvpLoading}>
            {rsvpLoading ? <BouncingDots /> : 'Confirm RSVP'}
          </button>
        </form>
      </Modal>
    </PageTransition>
  )
}
