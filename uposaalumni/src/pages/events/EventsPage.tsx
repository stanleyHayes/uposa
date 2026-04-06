import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { Calendar, MapPin, Search } from 'lucide-react'
import PageTransition from '../../components/common/PageTransition'
import PageHeader from '../../components/ui/PageHeader'
import ScrollReveal from '../../components/common/ScrollReveal'
import StatusBadge from '../../components/ui/StatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { eventsApi } from '../../api/services'
import { MOCK_EVENTS } from '../../data/mock'
import { formatDate } from '../../utils/formatters'
import type { Event } from '../../types'

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        let res
        if (filter === 'upcoming') res = await eventsApi.upcoming()
        else if (filter === 'past') res = await eventsApi.past()
        else res = await eventsApi.list()
        const data = res.data.data
        setEvents(data?.length ? data : MOCK_EVENTS)
      } catch {
        setEvents(filter === 'upcoming'
          ? MOCK_EVENTS.filter((e) => e.status === 'UPCOMING')
          : filter === 'past'
            ? MOCK_EVENTS.filter((e) => e.status === 'PAST')
            : MOCK_EVENTS)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [filter])

  const filtered = events.filter((e) =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.location?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <PageTransition>
      <PageHeader title="Events" description="Stay updated with alumni gatherings and activities" />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="join">
          {(['all', 'upcoming', 'past'] as const).map((f) => (
            <button key={f} className={`join-item btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/50" />
          <input type="text" className="input input-sm input-bordered w-full pl-9" placeholder="Search events..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Calendar} title="No events found" description={search ? 'Try adjusting your search' : 'Check back later for upcoming events'} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((event, i) => (
            <ScrollReveal key={event.id} delay={i * 0.05}>
              <Link to={`/events/${event.slug}`} className="card bg-base-100 border border-base-300 hover:shadow-lg transition-shadow h-full">
                {event.imageUrl && (
                  <figure><img src={event.imageUrl} alt={event.title} className="h-48 w-full object-cover" /></figure>
                )}
                <div className="card-body">
                  <div className="flex items-center justify-between">
                    <StatusBadge status={event.status} />
                    {event.isFeatured && <span className="badge badge-secondary badge-sm">Featured</span>}
                  </div>
                  <h2 className="card-title text-base mt-2">{event.title}</h2>
                  <p className="text-sm text-base-content/60 line-clamp-2">{event.description}</p>
                  <div className="mt-auto pt-3 space-y-1 text-sm text-base-content/70">
                    <div className="flex items-center gap-2"><Calendar className="w-4 h-4" />{formatDate(event.date)}</div>
                    {event.location && <div className="flex items-center gap-2"><MapPin className="w-4 h-4" />{event.location}</div>}
                  </div>
                </div>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      )}
    </PageTransition>
  )
}
