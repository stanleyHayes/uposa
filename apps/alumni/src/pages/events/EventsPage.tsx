import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  Image,
  LayoutGrid,
  List,
  MapPin,
  Search,
  Sparkles,
  Ticket,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import PageTransition from '../../components/common/PageTransition'
import ScrollReveal from '../../components/common/ScrollReveal'
import StatusBadge from '../../components/ui/StatusBadge'
import { eventsApi } from '../../api/services'
import { formatDate, truncate } from '../../utils/formatters'
import type { Event, EventStatus } from '../../types'

type EventFilter = 'all' | 'upcoming' | 'past'
type DisplayMode = 'grid' | 'list'

const filters: Array<{ key: EventFilter; label: string; icon: LucideIcon }> = [
  { key: 'all', label: 'All events', icon: CalendarDays },
  { key: 'upcoming', label: 'Upcoming', icon: CheckCircle2 },
  { key: 'past', label: 'Past', icon: Clock },
]

const statusTone: Record<EventStatus, string> = {
  UPCOMING: 'bg-secondary/15 text-primary',
  ONGOING: 'bg-success/12 text-success',
  PAST: 'bg-base-300/50 text-base-content/55',
  CANCELLED: 'bg-error/10 text-error',
}

function MetaItem({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5 text-xs font-semibold text-base-content/48">
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{children}</span>
    </span>
  )
}

function EventImage({ event, compact = false }: { event: Event; compact?: boolean }) {
  if (event.imageUrl) {
    return (
      <img
        src={event.imageUrl}
        alt={event.title}
        className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] ${compact ? 'min-h-24' : 'min-h-52'}`}
      />
    )
  }

  return (
    <div className="grid h-full min-h-52 place-items-center bg-primary text-primary-content">
      <div className="grid h-16 w-16 place-items-center bg-primary-content/10 text-secondary rounded-[18px_4px_18px_4px]">
        <Image className="h-7 w-7" />
      </div>
    </div>
  )
}

function DateTile({ date }: { date: string }) {
  return (
    <span className="grid h-20 w-20 shrink-0 place-items-center bg-primary text-center text-primary-content rounded-[18px_4px_18px_4px]">
      <span>
        <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-primary-content/55">{formatDate(date, 'MMM')}</span>
        <span className="block text-3xl font-bold leading-none text-secondary">{formatDate(date, 'd')}</span>
      </span>
    </span>
  )
}

function EventCard({ event, index }: { event: Event; index: number }) {
  return (
    <ScrollReveal delay={index * 0.04}>
      <Link
        to={`/events/${event.slug}`}
        className="group flex h-full flex-col overflow-hidden border border-primary/10 bg-base-100/92 shadow-[0_14px_38px_rgba(0,27,80,0.07)] transition-all hover:-translate-y-0.5 hover:border-primary/18 hover:shadow-[0_22px_55px_rgba(0,27,80,0.11)] rounded-[24px_4px_24px_4px]"
      >
        <div className="relative h-56 overflow-hidden bg-base-200">
          <EventImage event={event} />
          <div className="absolute left-4 top-4">
            <DateTile date={event.date} />
          </div>
          {event.isFeatured && (
            <span className="absolute right-4 top-4 inline-flex items-center gap-1.5 bg-secondary px-3 py-1.5 text-xs font-bold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Featured
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ${statusTone[event.status]}`}>
              <Ticket className="h-3.5 w-3.5" />
              {event.status}
            </span>
            <MetaItem icon={Clock}>{formatDate(event.date, 'h:mm a')}</MetaItem>
          </div>
          <h2 className="mt-4 line-clamp-2 text-xl font-bold leading-tight text-base-content">{event.title}</h2>
          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-base-content/58">
            {truncate(event.description, 136)}
          </p>
          <div className="mt-auto flex items-center justify-between gap-4 pt-5">
            <MetaItem icon={MapPin}>{event.location || 'Venue pending'}</MetaItem>
            <span className="grid h-10 w-10 shrink-0 place-items-center bg-primary/8 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-content rounded-[14px_3px_14px_3px]">
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>
      </Link>
    </ScrollReveal>
  )
}

function EventRow({ event }: { event: Event }) {
  return (
    <Link
      to={`/events/${event.slug}`}
      className="group grid gap-4 border border-primary/10 bg-base-100/86 p-3 transition-all hover:border-primary/18 hover:bg-base-100 hover:shadow-[0_16px_44px_rgba(0,27,80,0.08)] sm:grid-cols-[92px_minmax(0,1fr)_auto] sm:items-center rounded-[22px_4px_22px_4px]"
    >
      <DateTile date={event.date} />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={event.status} />
          {event.isFeatured && <span className="bg-secondary px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-primary">Featured</span>}
        </div>
        <h2 className="mt-3 line-clamp-2 text-lg font-bold leading-tight text-base-content">{event.title}</h2>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-base-content/56">{truncate(event.description, 120)}</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <MetaItem icon={Clock}>{formatDate(event.date, 'MMM d, yyyy h:mm a')}</MetaItem>
          <MetaItem icon={MapPin}>{event.location || 'Venue pending'}</MetaItem>
        </div>
      </div>
      <span className="hidden h-11 w-11 place-items-center bg-primary/8 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-content sm:grid rounded-[15px_3px_15px_3px]">
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  )
}

function EventsSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <div className="h-80 animate-pulse bg-base-300/45 rounded-[28px_6px_28px_6px]" />
        <div className="grid gap-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-24 animate-pulse bg-base-300/35 rounded-[20px_4px_20px_4px]" />
          ))}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((item) => (
          <div key={item} className="overflow-hidden border border-primary/8 bg-base-100 rounded-[24px_4px_24px_4px]">
            <div className="h-44 animate-pulse bg-base-300/45" />
            <div className="space-y-3 p-5">
              <div className="h-4 w-24 animate-pulse bg-base-300/45" />
              <div className="h-5 w-4/5 animate-pulse bg-base-300/55" />
              <div className="h-3 w-full animate-pulse bg-base-300/35" />
              <div className="h-3 w-2/3 animate-pulse bg-base-300/35" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function EmptyEvents({ search, filter }: { search: string; filter: EventFilter }) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center border border-primary/10 bg-base-100/86 px-6 py-12 text-center shadow-[0_12px_34px_rgba(0,27,80,0.06)] rounded-[24px_4px_24px_4px]">
      <span className="grid h-16 w-16 place-items-center bg-primary/8 text-primary rounded-[18px_4px_18px_4px]">
        {filter === 'past' ? <Clock className="h-7 w-7" /> : filter === 'upcoming' ? <CalendarDays className="h-7 w-7" /> : <XCircle className="h-7 w-7" />}
      </span>
      <h2 className="mt-5 text-xl font-bold">No events found</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-base-content/55">
        {search ? 'Try a different search term or clear the field.' : filter === 'upcoming' ? 'Upcoming gatherings will appear here once they are published.' : 'There are no matching events in this view yet.'}
      </p>
    </div>
  )
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<EventFilter>('all')
  const [search, setSearch] = useState('')
  const [displayMode, setDisplayMode] = useState<DisplayMode>('grid')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const res = filter === 'upcoming'
          ? await eventsApi.upcoming()
          : filter === 'past'
            ? await eventsApi.past()
            : await eventsApi.list()
        setEvents(res.data.data || [])
      } catch {
        setEvents([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [filter])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return events
    return events.filter((event) => {
      const haystack = [event.title, event.description, event.location, event.status].filter(Boolean).join(' ').toLowerCase()
      return haystack.includes(query)
    })
  }, [events, search])

  const featured = filtered.find((event) => event.isFeatured) || filtered[0]
  const sideEvents = filtered.filter((event) => event.id !== featured?.id).slice(0, 3)
  const bodyEvents = featured ? filtered.filter((event) => event.id !== featured.id) : filtered
  const upcomingCount = events.filter((event) => event.status === 'UPCOMING' || event.status === 'ONGOING').length
  const featuredCount = events.filter((event) => event.isFeatured).length

  return (
    <PageTransition>
      <div className="relative space-y-6">
        <img
          src="/logo.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none fixed right-[-8rem] top-24 z-0 hidden h-[26rem] w-[26rem] object-contain opacity-[0.025] xl:block"
        />

        <section className="relative z-10 overflow-hidden bg-primary text-primary-content shadow-[0_24px_80px_rgba(0,27,80,0.18)] rounded-[28px_6px_28px_6px]">
          <img src="/logo.png" alt="" aria-hidden="true" className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 object-contain opacity-[0.055]" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-secondary/80 to-transparent" />
          <div className="relative grid gap-8 p-5 sm:p-7 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:p-8">
            <div className="min-w-0">
              <div className="mb-4 inline-flex items-center gap-2 border border-primary-content/15 bg-primary-content/10 px-3 py-2 text-xs font-semibold text-primary-content/70 rounded-[14px_3px_14px_3px]">
                <Sparkles className="h-4 w-4 text-secondary" />
                Events desk
              </div>
              <h1 className="max-w-3xl text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
                Gatherings that keep old students close to the school.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-primary-content/62 sm:text-base">
                Track AGMs, reunions, networking nights, fundraisers, and school moments from one clean alumni calendar.
              </p>
            </div>
            <div className="grid content-start gap-3 self-start">
              <div className="flex items-center justify-between gap-4 border border-primary-content/10 bg-primary-content/[0.06] px-4 py-3 rounded-[18px_4px_18px_4px]">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary-content/42">Loaded</p>
                <p className="text-3xl font-bold leading-none text-secondary">{events.length}</p>
              </div>
              <div className="flex items-center justify-between gap-4 border border-primary-content/10 bg-primary-content/[0.06] px-4 py-3 rounded-[18px_4px_18px_4px]">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary-content/42">Open</p>
                <p className="text-3xl font-bold leading-none text-secondary">{upcomingCount}</p>
              </div>
              <div className="flex items-center justify-between gap-4 border border-primary-content/10 bg-primary-content/[0.06] px-4 py-3 rounded-[18px_4px_18px_4px]">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary-content/42">Featured</p>
                <p className="text-3xl font-bold leading-none text-secondary">{featuredCount}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="relative z-10 border border-primary/10 bg-base-100/90 p-3 shadow-[0_14px_38px_rgba(0,27,80,0.06)] rounded-[24px_4px_24px_4px]">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex gap-2 overflow-x-auto pb-1 xl:pb-0">
              {filters.map((item) => {
                const isActive = filter === item.key
                return (
                  <button
                    key={item.key}
                    type="button"
                    className={`flex shrink-0 items-center gap-2 px-3 py-2 text-sm font-bold transition-colors rounded-[16px_3px_16px_3px] ${
                      isActive ? 'bg-primary text-primary-content shadow-[0_10px_22px_rgba(0,27,80,0.13)]' : 'bg-base-200/55 text-base-content/62 hover:bg-base-200 hover:text-primary'
                    }`}
                    onClick={() => setFilter(item.key)}
                  >
                    <item.icon className={`h-4 w-4 ${isActive ? 'text-secondary' : ''}`} />
                    {item.label}
                  </button>
                )
              })}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label className="relative min-w-0 sm:w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-base-content/38" />
                <input
                  type="text"
                  className="input input-bordered h-11 w-full border-primary/10 bg-base-200/45 pl-9 text-sm focus:border-primary focus:bg-base-100"
                  placeholder="Search events"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
              <div className="grid grid-cols-2 gap-1 border border-primary/10 bg-base-200/45 p-1 rounded-[16px_3px_16px_3px]">
                <button type="button" aria-label="Grid view" onClick={() => setDisplayMode('grid')} className={`grid h-9 w-10 place-items-center rounded-[12px_3px_12px_3px] ${displayMode === 'grid' ? 'bg-primary text-primary-content' : 'text-base-content/45 hover:text-primary'}`}>
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button type="button" aria-label="List view" onClick={() => setDisplayMode('list')} className={`grid h-9 w-10 place-items-center rounded-[12px_3px_12px_3px] ${displayMode === 'list' ? 'bg-primary text-primary-content' : 'text-base-content/45 hover:text-primary'}`}>
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {loading ? (
          <EventsSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyEvents search={search} filter={filter} />
        ) : (
          <>
            {featured && (
              <section className="relative z-10 grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
                <Link
                  to={`/events/${featured.slug}`}
                  className="group relative min-h-[25rem] overflow-hidden bg-primary text-primary-content shadow-[0_22px_60px_rgba(0,27,80,0.16)] rounded-[28px_6px_28px_6px]"
                >
                  {featured.imageUrl ? (
                    <img src={featured.imageUrl} alt={featured.title} className="absolute inset-0 h-full w-full object-cover opacity-35 transition-transform duration-500 group-hover:scale-[1.03]" />
                  ) : (
                    <img src="/logo.png" alt="" aria-hidden="true" className="absolute -right-16 -top-16 h-80 w-80 object-contain opacity-[0.06]" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/88 to-primary/62" />
                  <div className="relative flex min-h-[25rem] flex-col justify-end p-5 sm:p-7">
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 bg-secondary px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-primary">
                        <Ticket className="h-3.5 w-3.5" />
                        Lead event
                      </span>
                      <span className="inline-flex items-center gap-1.5 border border-primary-content/15 bg-primary-content/10 px-3 py-1.5 text-xs font-semibold text-primary-content/72">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {formatDate(featured.date, 'MMM d, yyyy')}
                      </span>
                    </div>
                    <h2 className="max-w-3xl text-3xl font-bold leading-tight sm:text-4xl">{featured.title}</h2>
                    <p className="mt-4 max-w-2xl text-sm leading-relaxed text-primary-content/68 sm:text-base">
                      {truncate(featured.description, 178)}
                    </p>
                    <span className="mt-6 inline-flex w-fit items-center gap-2 bg-secondary px-4 py-3 text-sm font-bold text-primary transition-transform group-hover:translate-x-1">
                      View event
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </Link>

                <div className="grid gap-3">
                  {sideEvents.length > 0 ? sideEvents.map((event) => (
                    <EventRow key={event.id} event={event} />
                  )) : (
                    <div className="flex min-h-full flex-col justify-center border border-primary/10 bg-base-100/80 p-5 rounded-[24px_4px_24px_4px]">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-secondary">Calendar queue</p>
                      <p className="mt-2 text-lg font-bold">More events will appear here.</p>
                      <p className="mt-2 text-sm leading-relaxed text-base-content/55">The lead event is the only match for this filter right now.</p>
                    </div>
                  )}
                </div>
              </section>
            )}

            <section className="relative z-10 space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-secondary">Event archive</p>
                  <h2 className="mt-1 text-2xl font-bold">Calendar lineup</h2>
                </div>
                <p className="text-sm font-semibold text-base-content/48">{filtered.length} event{filtered.length === 1 ? '' : 's'} matched</p>
              </div>

              {displayMode === 'grid' ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {(bodyEvents.length > 0 ? bodyEvents : filtered).map((event, index) => (
                    <EventCard key={event.id} event={event} index={index} />
                  ))}
                </div>
              ) : (
                <div className="grid gap-3">
                  {filtered.map((event) => (
                    <EventRow key={event.id} event={event} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </PageTransition>
  )
}
