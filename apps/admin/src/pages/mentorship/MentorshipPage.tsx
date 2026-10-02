import { useCallback, useEffect, useState } from 'react'
import { Handshake, Trash2, Users } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Badge, { type BadgeVariant } from '../../components/ui/Badge'
import Select from '../../components/ui/Select'
import SearchInput from '../../components/ui/SearchInput'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'
import Pagination from '../../components/ui/Pagination'
import { PageSkeleton } from '../../components/ui/Skeleton'
import RoleGate from '../../components/auth/RoleGate'
import { adminMentorshipApi } from '../../api/services'
import { useActivityStore } from '../../stores/activity.store'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { apiErrorMessage } from '../../utils/apiError'
import { formatDate } from '../../utils/formatters'
import type { Mentor, MentorshipRequest, MentorshipStatus } from '../../types'

type Tab = 'requests' | 'mentors'
const PAGE_SIZE = 20

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'DECLINED', label: 'Declined' },
  { value: 'COMPLETED', label: 'Completed' },
]

const STATUS_BADGE: Record<MentorshipStatus, { variant: BadgeVariant; label: string }> = {
  PENDING: { variant: 'pending', label: 'Pending' },
  ACCEPTED: { variant: 'approved', label: 'Accepted' },
  DECLINED: { variant: 'rejected', label: 'Declined' },
  COMPLETED: { variant: 'completed', label: 'Completed' },
}

const thClass = 'px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider'

export default function MentorshipPage() {
  const { addActivity } = useActivityStore()
  const { currentUser } = useAuth()
  const { toast } = useToast()

  const [tab, setTab] = useState<Tab>('requests')
  const [loading, setLoading] = useState(true)

  // Requests
  const [requests, setRequests] = useState<MentorshipRequest[]>([])
  const [requestPage, setRequestPage] = useState(1)
  const [requestPagination, setRequestPagination] = useState({ totalPages: 1, total: 0 })
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<MentorshipRequest | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Mentors
  const [mentors, setMentors] = useState<Mentor[]>([])
  const [mentorPage, setMentorPage] = useState(1)
  const [mentorPagination, setMentorPagination] = useState({ totalPages: 1, total: 0 })

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(t)
  }, [search])

  const fetchRequests = useCallback(async () => {
    try {
      const res = await adminMentorshipApi.listRequests({
        page: requestPage,
        limit: PAGE_SIZE,
        status: statusFilter || undefined,
        search: debouncedSearch || undefined,
      })
      setRequests((res.data.data || []) as MentorshipRequest[])
      setRequestPagination({ totalPages: res.data.pagination?.totalPages ?? 1, total: res.data.pagination?.total ?? 0 })
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to load mentorship requests'))
    } finally {
      setLoading(false)
    }
  }, [requestPage, statusFilter, debouncedSearch, toast])

  const fetchMentors = useCallback(async () => {
    try {
      const res = await adminMentorshipApi.listMentors({ page: mentorPage, limit: PAGE_SIZE })
      setMentors((res.data.data || []) as Mentor[])
      setMentorPagination({ totalPages: res.data.pagination?.totalPages ?? 1, total: res.data.pagination?.total ?? 0 })
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to load mentors'))
    }
  }, [mentorPage, toast])

  useEffect(() => { fetchRequests() }, [fetchRequests])
  useEffect(() => { fetchMentors() }, [fetchMentors])

  const handleDelete = async () => {
    if (!deleteTarget || !currentUser) return
    setDeleting(true)
    try {
      await adminMentorshipApi.deleteRequest(deleteTarget.id)
      addActivity({
        action: 'deleted mentorship request',
        targetType: `${deleteTarget.mentee?.fullName ?? 'Member'} → ${deleteTarget.mentor?.fullName ?? 'mentor'}`,
        targetId: deleteTarget.id,
        performedBy: currentUser.id,
        performedByName: currentUser.name,
      })
      toast.success('Mentorship request deleted')
      setDeleteTarget(null)
      fetchRequests()
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to delete request'))
    } finally {
      setDeleting(false)
    }
  }

  if (loading) return <PageSkeleton cols={6} rows={6} />

  const tabButton = (key: Tab, label: string, count: number) => (
    <button
      key={key}
      onClick={() => setTab(key)}
      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
        tab === key
          ? 'border-brand-500 text-brand-500 dark:text-brand-300 dark:border-brand-400'
          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
      }`}
    >
      {label} <span className="text-xs text-gray-400">{count}</span>
    </button>
  )

  return (
    <div className="page-enter">
      <PageHeader title="Mentorship" description="Mentorship requests between members, and the members available as mentors." />

      <div className="flex border-b border-gray-200 dark:border-dark-border mb-4">
        {tabButton('requests', 'Requests', requestPagination.total)}
        {tabButton('mentors', 'Mentors', mentorPagination.total)}
      </div>

      {tab === 'requests' ? (
        <>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <SearchInput
              value={search}
              onChange={(v) => { setSearch(v); setRequestPage(1) }}
              placeholder="Search by mentor or mentee name..."
              className="flex-1 max-w-sm"
            />
            <Select
              options={statusOptions}
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setRequestPage(1) }}
              className="sm:w-44"
            />
          </div>

          <div className="admin-card-surface overflow-hidden">
            {requests.length === 0 ? (
              <EmptyState
                icon={<Handshake size={40} />}
                title={statusFilter || debouncedSearch ? 'No matching requests' : 'No mentorship requests yet'}
                description={statusFilter || debouncedSearch ? 'Try adjusting your search or filters.' : 'Requests members send to mentors will appear here.'}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table w-full text-sm">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-50/50 dark:from-dark-hover dark:to-dark-hover/50 border-b-2 border-gray-100 dark:border-dark-border">
                    <tr>
                      <th className={thClass}>Mentee</th>
                      <th className={thClass}>Mentor</th>
                      <th className={thClass}>Message</th>
                      <th className={thClass}>Status</th>
                      <th className={thClass}>Requested</th>
                      <th className={thClass}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                    {requests.map((req) => {
                      const badge = STATUS_BADGE[req.status] ?? { variant: 'default' as BadgeVariant, label: req.status }
                      return (
                        <tr key={req.id} className="border-b border-gray-50 dark:border-dark-border">
                          <td className="px-5 py-3.5">
                            <p className="font-medium text-gray-900 dark:text-gray-100">{req.mentee?.fullName ?? 'Unknown member'}</p>
                            {req.mentee?.email && <p className="text-xs text-gray-500 dark:text-gray-400">{req.mentee.email}</p>}
                          </td>
                          <td className="px-5 py-3.5">
                            <p className="font-medium text-gray-900 dark:text-gray-100">{req.mentor?.fullName ?? 'Unknown member'}</p>
                            {req.mentor?.occupation && <p className="text-xs text-gray-500 dark:text-gray-400">{req.mentor.occupation}</p>}
                          </td>
                          <td className="px-5 py-3.5 max-w-xs">
                            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{req.message || <span className="italic text-gray-400">No message</span>}</p>
                          </td>
                          <td className="px-5 py-3.5"><Badge variant={badge.variant} label={badge.label} /></td>
                          <td className="px-5 py-3.5 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{formatDate(req.createdAt)}</td>
                          <td className="px-5 py-3.5">
                            <RoleGate permission="mentorship:delete">
                              <button
                                onClick={() => setDeleteTarget(req)}
                                title="Delete request"
                                className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 transition-all duration-150"
                              >
                                <Trash2 size={15} />
                              </button>
                            </RoleGate>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <div className="px-4 border-t border-gray-100 dark:border-dark-border">
              <Pagination currentPage={requestPage} totalPages={requestPagination.totalPages} totalItems={requestPagination.total} itemsPerPage={PAGE_SIZE} onPageChange={setRequestPage} />
            </div>
          </div>
        </>
      ) : (
        <div className="admin-card-surface overflow-hidden">
          {mentors.length === 0 ? (
            <EmptyState icon={<Users size={40} />} title="No mentors yet" description="Active members who offer mentorship will appear here." />
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table w-full text-sm">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-50/50 dark:from-dark-hover dark:to-dark-hover/50 border-b-2 border-gray-100 dark:border-dark-border">
                  <tr>
                    <th className={thClass}>Mentor</th>
                    <th className={thClass}>Work</th>
                    <th className={thClass}>Expertise</th>
                    <th className={thClass}>Year Group</th>
                    <th className={thClass}>Requests</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {mentors.map((m) => (
                    <tr key={m.id} className="border-b border-gray-50 dark:border-dark-border">
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-gray-900 dark:text-gray-100">{m.fullName}</p>
                        {m.email && <p className="text-xs text-gray-500 dark:text-gray-400">{m.email}</p>}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-600 dark:text-gray-400">
                        {[m.occupation, m.organization].filter(Boolean).join(' · ') || '—'}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-600 dark:text-gray-400 max-w-xs">
                        {m.areaOfExpertise?.length ? m.areaOfExpertise.join(', ') : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-600 dark:text-gray-400">{m.yearGroup ?? '—'}</td>
                      <td className="px-5 py-3.5 text-gray-700 dark:text-gray-300">{m._count?.mentorRequests ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="px-4 border-t border-gray-100 dark:border-dark-border">
            <Pagination currentPage={mentorPage} totalPages={mentorPagination.totalPages} totalItems={mentorPagination.total} itemsPerPage={PAGE_SIZE} onPageChange={setMentorPage} />
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Mentorship Request"
        message={`Delete the request from ${deleteTarget?.mentee?.fullName ?? 'this member'} to ${deleteTarget?.mentor?.fullName ?? 'their mentor'}? This cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  )
}
