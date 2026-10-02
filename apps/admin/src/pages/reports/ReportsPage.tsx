import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Flag, EyeOff } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Badge from '../../components/ui/Badge'
import Select from '../../components/ui/Select'
import EmptyState from '../../components/ui/EmptyState'
import Pagination from '../../components/ui/Pagination'
import { PageSkeleton } from '../../components/ui/Skeleton'
import { adminReportsApi } from '../../api/services'
import { useReportsStore } from '../../stores/reports.store'
import { useToast } from '../../hooks/useToast'
import { apiErrorMessage } from '../../utils/apiError'
import { formatTimeAgo } from '../../utils/formatters'
import type { ContentReport } from '../../types'
import { REASON_BADGE, STATUS_BADGE, TARGET_LABELS } from './reportLabels'

const PAGE_SIZE = 20

const statusOptions = [
  { value: 'OPEN', label: 'Open' },
  { value: 'ACTIONED', label: 'Actioned' },
  { value: 'DISMISSED', label: 'Dismissed' },
  { value: 'ALL', label: 'All Statuses' },
]

const typeOptions = [
  { value: '', label: 'All Content' },
  { value: 'FORUM_POST', label: TARGET_LABELS.FORUM_POST },
  { value: 'FORUM_COMMENT', label: TARGET_LABELS.FORUM_COMMENT },
  { value: 'JOB', label: TARGET_LABELS.JOB },
  { value: 'MEMBER', label: TARGET_LABELS.MEMBER },
]

export default function ReportsPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const setOpenCount = useReportsStore((s) => s.setOpenCount)

  const [reports, setReports] = useState<ContentReport[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ totalPages: 1, total: 0 })
  const [statusFilter, setStatusFilter] = useState('OPEN')
  const [typeFilter, setTypeFilter] = useState('')

  const fetchReports = useCallback(async () => {
    try {
      const res = await adminReportsApi.list({
        page,
        limit: PAGE_SIZE,
        status: statusFilter,
        targetType: typeFilter || undefined,
      })
      setReports((res.data.data || []) as ContentReport[])
      const p = res.data.pagination
      setPagination({ totalPages: p?.totalPages ?? 1, total: p?.total ?? 0 })
      if (typeof p?.openCount === 'number') setOpenCount(p.openCount)
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to load reports'))
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, typeFilter, toast, setOpenCount])

  useEffect(() => { fetchReports() }, [fetchReports])

  if (loading) return <PageSkeleton cols={7} rows={6} />

  const filtersActive = statusFilter !== 'OPEN' || Boolean(typeFilter)

  return (
    <div className="page-enter">
      <PageHeader
        title="Reported Content"
        description="Member reports on forum posts, comments, jobs and profiles. Forum posts and comments reported by 3 or more members are hidden automatically until reviewed."
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <Select
          options={statusOptions}
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="sm:w-44"
        />
        <Select
          options={typeOptions}
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1) }}
          className="sm:w-48"
        />
      </div>

      <div className="admin-card-surface overflow-hidden">
        {reports.length === 0 ? (
          <EmptyState
            icon={<Flag size={40} />}
            title={statusFilter === 'OPEN' && !typeFilter ? 'No open reports' : 'No matching reports'}
            description={filtersActive ? 'Try adjusting the filters.' : 'Reports from members will appear here for review.'}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table w-full text-sm">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-50/50 dark:from-dark-hover dark:to-dark-hover/50 border-b-2 border-gray-100 dark:border-dark-border">
                <tr>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Content</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Reason</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Author</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Reported By</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Reports</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Reported</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {reports.map((report) => {
                  const reason = REASON_BADGE[report.reason] ?? REASON_BADGE.OTHER
                  const status = STATUS_BADGE[report.status] ?? STATUS_BADGE.OPEN
                  return (
                    <tr
                      key={report.id}
                      onClick={() => navigate(`/reports/${report.id}`)}
                      className="border-b border-gray-50 dark:border-dark-border cursor-pointer hover:bg-gray-50/80 dark:hover:bg-dark-hover/50 transition-colors"
                    >
                      <td className="px-5 py-3.5 max-w-sm">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">{TARGET_LABELS[report.targetType] ?? report.targetType}</p>
                        {report.target.title && <p className="font-medium text-gray-900 dark:text-gray-100 line-clamp-1">{report.target.title}</p>}
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                          {report.target.exists ? report.target.excerpt : <span className="italic">Content no longer exists</span>}
                        </p>
                      </td>
                      <td className="px-5 py-3.5"><Badge variant={reason.variant} label={reason.label} /></td>
                      <td className="px-5 py-3.5 text-gray-700 dark:text-gray-300 text-xs">{report.target.authorName ?? '—'}</td>
                      <td className="px-5 py-3.5 text-gray-700 dark:text-gray-300 text-xs">{report.reporter?.fullName ?? 'Unknown member'}</td>
                      <td className="px-5 py-3.5 text-gray-700 dark:text-gray-300 text-xs whitespace-nowrap">
                        {/* reportCount counts OPEN reports on the target, so it's only meaningful while open. */}
                        {report.status === 'OPEN' ? `${report.reportCount} ${report.reportCount === 1 ? 'report' : 'reports'}` : '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge variant={status.variant} label={status.label} />
                          {report.target.isHidden && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-red-600 dark:text-red-400" title="Hidden from members">
                              <EyeOff size={12} /> Hidden
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400 text-xs whitespace-nowrap">{formatTimeAgo(report.createdAt)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="px-4 border-t border-gray-100 dark:border-dark-border">
          <Pagination
            currentPage={page}
            totalPages={pagination.totalPages}
            totalItems={pagination.total}
            itemsPerPage={PAGE_SIZE}
            onPageChange={setPage}
          />
        </div>
      </div>
    </div>
  )
}
