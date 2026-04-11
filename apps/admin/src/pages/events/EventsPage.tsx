// @ts-nocheck
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusCircle, Pencil, Trash2, Calendar, MapPin, CheckCircle, Clock, XCircle } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import SearchInput from '../../components/ui/SearchInput'
import Select from '../../components/ui/Select'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'
import Pagination from '../../components/ui/Pagination'
import ViewToggle, { type ViewMode } from '../../components/ui/ViewToggle'
import PageStats from '../../components/ui/PageStats'
import { PageSkeleton } from '../../components/ui/Skeleton'
import RoleGate from '../../components/auth/RoleGate'
import { adminEventsApi } from '../../api/services'
import { useActivityStore } from '../../stores/activity.store'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { formatDate } from '../../utils/formatters'
import type { Event } from '../../types'

const filterStatusOptions = [
  { value: 'all', label: 'All Statuses' },
  { value: 'UPCOMING', label: 'Upcoming' },
  { value: 'ONGOING', label: 'Ongoing' },
  { value: 'PAST', label: 'Past' },
  { value: 'CANCELLED', label: 'Cancelled' },
]

export default function EventsPage() {
  const navigate = useNavigate()
  const { addActivity } = useActivityStore()
  const { currentUser } = useAuth()
  const { toast } = useToast()

  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [deleteTarget, setDeleteTarget] = useState<Event | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewMode, setViewMode] = useState<ViewMode>('table')

  const fetchEvents = useCallback(async () => {
    try {
      const res = await adminEventsApi.list({ limit: 100 })
      setEvents(res.data.data || [])
    } catch {
      toast.error('Failed to load events')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { fetchEvents() }, [fetchEvents])

  const stats = useMemo(() => {
    return {
      total: events.length,
      upcoming: events.filter((e) => e.status === 'UPCOMING').length,
      ongoing: events.filter((e) => e.status === 'ONGOING').length,
      cancelled: events.filter((e) => e.status === 'CANCELLED').length,
    }
  }, [events])

  const filteredEvents = useMemo(() => {
    let result = events
    if (search) {
      const q = search.toLowerCase()
      result = result.filter((e) => e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q) || e.location.toLowerCase().includes(q))
    }
    if (statusFilter !== 'all') {
      result = result.filter((e) => e.status === statusFilter)
    }
    return result
  }, [events, search, statusFilter])

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setCurrentPage(1)
  }

  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value)
    setCurrentPage(1)
  }

  const handleDelete = async () => {
    if (!deleteTarget || !currentUser) return
    try {
      await adminEventsApi.delete(deleteTarget.id)
      addActivity({ action: 'deleted event', targetType: deleteTarget.title, targetId: deleteTarget.id, performedBy: currentUser.id, performedByName: currentUser.name })
      toast.success('Event deleted')
      setDeleteTarget(null)
      fetchEvents()
    } catch {
      toast.error('Failed to delete event')
    }
  }

  if (loading) {
    return <PageSkeleton cols={5} rows={6} />
  }

  return (
    <div className="page-enter">
      <PageHeader
        title="Events"
        description={`${events.length} events`}
        actions={
          <RoleGate permission="events:create">
            <Button leftIcon={<PlusCircle size={16} />} onClick={() => navigate('/events/new')}>
              New Event
            </Button>
          </RoleGate>
        }
      />

      <PageStats
        stats={[
          { label: 'Total Events', value: stats.total, icon: Calendar, color: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-100' },
          { label: 'Upcoming', value: stats.upcoming, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
          { label: 'Ongoing', value: stats.ongoing, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
          { label: 'Cancelled', value: stats.cancelled, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
        ]}
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <SearchInput value={search} onChange={handleSearchChange} placeholder="Search events..." className="flex-1" />
        <Select
          options={filterStatusOptions}
          value={statusFilter}
          onChange={handleStatusFilterChange}
          className="sm:w-44"
        />
        <ViewToggle view={viewMode} onChange={(v) => { setViewMode(v); setCurrentPage(1) }} />
      </div>

      <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-dark-border shadow-sm overflow-hidden">
        {filteredEvents.length === 0 ? (
          <EmptyState
            icon={<Calendar size={40} />}
            title={search || statusFilter !== 'all' ? 'No matching results' : 'No events yet'}
            description={search || statusFilter !== 'all' ? 'Try adjusting your search or filters.' : 'Create your first event to get started.'}
            action={
              !(search || statusFilter !== 'all') ? (
                <RoleGate permission="events:create">
                  <Button leftIcon={<PlusCircle size={16} />} onClick={() => navigate('/events/new')}>
                    Create Event
                  </Button>
                </RoleGate>
              ) : undefined
            }
          />
        ) : viewMode === 'table' ? (
          <div className="overflow-x-auto">
            <table className="data-table w-full text-sm">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-50/50 dark:from-dark-hover dark:to-dark-hover/50 border-b-2 border-gray-100 dark:border-dark-border">
                <tr>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Event</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Dates</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Location</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {filteredEvents.slice((currentPage - 1) * (viewMode === 'grid' ? 12 : 10), currentPage * (viewMode === 'grid' ? 12 : 10)).map((ev) => (
                  <tr key={ev.id} className="border-b border-gray-50 dark:border-dark-border cursor-pointer hover:bg-gray-50/80 dark:hover:bg-dark-hover/50 hover:-translate-y-px transition-all" onClick={() => navigate(`/events/${ev.id}`)}>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-gray-900 dark:text-gray-100">{ev.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">{ev.description}</p>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 dark:text-gray-400 text-xs">
                      <p>{formatDate(ev.date)}</p>
                      <p className="text-gray-400 dark:text-gray-500">to {formatDate(ev.endDate)}</p>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <MapPin size={14} className="text-gray-400 shrink-0" />
                        <span className="text-xs truncate max-w-32">{ev.location}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant={ev.status.toLowerCase() as any} label={ev.status.charAt(0) + ev.status.slice(1).toLowerCase()} />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <RoleGate permission="events:edit">
                          <button
                            onClick={() => navigate(`/events/${ev.id}/edit`)}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-brand-50 dark:hover:bg-brand-900/30 hover:text-brand-600 transition-all duration-150"
                            title="Edit"
                          >
                            <Pencil size={15} />
                          </button>
                        </RoleGate>
                        <RoleGate permission="events:delete">
                          <button
                            onClick={() => setDeleteTarget(ev)}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 transition-all duration-150"
                            title="Delete"
                          >
                            <Trash2 size={15} />
                          </button>
                        </RoleGate>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {filteredEvents.slice((currentPage - 1) * 12, currentPage * 12).map((ev) => (
              <div key={ev.id} onClick={() => navigate(`/events/${ev.id}`)} className="bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-dark-border shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group">
                {ev.imageUrl ? (
                  <img src={ev.imageUrl} alt={ev.title} className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-40 bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-900/30 dark:to-brand-800/20 flex items-center justify-center">
                    <Calendar size={32} className="text-brand-300" />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant={ev.status.toLowerCase()} label={ev.status.charAt(0) + ev.status.slice(1).toLowerCase()} />
                    <span className="text-xs text-gray-400">{formatDate(ev.date)}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 line-clamp-1">{ev.title}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">{ev.description}</p>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <MapPin size={12} />
                    <span className="truncate">{ev.location}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="px-4 border-t border-gray-100 dark:border-dark-border">
          <Pagination currentPage={currentPage} totalPages={Math.ceil(filteredEvents.length / (viewMode === 'grid' ? 12 : 10))} totalItems={filteredEvents.length} itemsPerPage={viewMode === 'grid' ? 12 : 10} onPageChange={setCurrentPage} />
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Event"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  )
}
