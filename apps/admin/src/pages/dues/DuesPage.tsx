import { useState, useEffect, useCallback } from 'react'
import { Receipt, CheckCircle, Clock, AlertTriangle } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import Badge, { type BadgeVariant } from '../../components/ui/Badge'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import Select from '../../components/ui/Select'
import SearchInput from '../../components/ui/SearchInput'
import EmptyState from '../../components/ui/EmptyState'
import Pagination from '../../components/ui/Pagination'
import PageStats from '../../components/ui/PageStats'
import { PageSkeleton } from '../../components/ui/Skeleton'
import RoleGate from '../../components/auth/RoleGate'
import { adminDuesApi } from '../../api/services'
import { useActivityStore } from '../../stores/activity.store'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { apiErrorMessage } from '../../utils/apiError'
import { formatCurrency, formatDate } from '../../utils/formatters'
import type { Due, DueStatus } from '../../types'

const PAGE_SIZE = 20

const statusFilterOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'OVERDUE', label: 'Overdue' },
  { value: 'PAID', label: 'Paid' },
]

const statusBadge: Record<DueStatus, { variant: BadgeVariant; label: string }> = {
  PENDING: { variant: 'pending', label: 'Pending' },
  OVERDUE: { variant: 'rejected', label: 'Overdue' },
  PAID: { variant: 'confirmed', label: 'Paid' },
}

export default function DuesPage() {
  const { addActivity } = useActivityStore()
  const { currentUser } = useAuth()
  const { toast } = useToast()

  const [dues, setDues] = useState<Due[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ totalPages: 1, total: 0 })
  const [counts, setCounts] = useState({ PENDING: 0, OVERDUE: 0, PAID: 0 })
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const [markTarget, setMarkTarget] = useState<Due | null>(null)
  const [markRef, setMarkRef] = useState('')
  const [marking, setMarking] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(t)
  }, [search])

  const fetchDues = useCallback(async () => {
    try {
      const res = await adminDuesApi.list({
        page,
        limit: PAGE_SIZE,
        status: statusFilter || undefined,
        search: debouncedSearch || undefined,
      })
      setDues((res.data.data || []) as Due[])
      const p = res.data.pagination
      setPagination({ totalPages: p?.totalPages ?? 1, total: p?.total ?? 0 })
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to load dues'))
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, debouncedSearch, toast])

  // Per-status totals for the stat cards (limit 1: only the pagination total is used).
  const fetchCounts = useCallback(async () => {
    try {
      const statuses: DueStatus[] = ['PENDING', 'OVERDUE', 'PAID']
      const results = await Promise.all(statuses.map((status) => adminDuesApi.list({ status, limit: 1 })))
      setCounts({
        PENDING: results[0].data.pagination?.total ?? 0,
        OVERDUE: results[1].data.pagination?.total ?? 0,
        PAID: results[2].data.pagination?.total ?? 0,
      })
    } catch {
      // The table's own error toast covers a failing API.
    }
  }, [])

  useEffect(() => { fetchDues() }, [fetchDues])
  useEffect(() => { fetchCounts() }, [fetchCounts])

  const openMarkPaid = (due: Due) => {
    setMarkTarget(due)
    // Keep the reference the member submitted, if any.
    setMarkRef(due.transactionRef ?? '')
  }

  const handleMarkPaid = async () => {
    if (!markTarget || !currentUser) return
    setMarking(true)
    try {
      await adminDuesApi.markPaid(markTarget.id, { transactionRef: markRef.trim() || undefined })
      addActivity({
        action: `marked ${markTarget.year} dues as paid for`,
        targetType: markTarget.member?.fullName ?? 'member',
        targetId: markTarget.id,
        performedBy: currentUser.id,
        performedByName: currentUser.name,
      })
      toast.success('Dues marked as paid')
      setMarkTarget(null)
      fetchDues()
      fetchCounts()
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to mark dues as paid'))
    } finally {
      setMarking(false)
    }
  }

  if (loading) return <PageSkeleton cols={7} rows={6} />

  const filtersActive = Boolean(statusFilter || debouncedSearch)

  return (
    <div className="page-enter">
      <PageHeader
        title="Membership Dues"
        description="Verify member payments and mark dues as paid. Self-reported payments stay pending until marked here."
      />

      <PageStats
        stats={[
          { label: 'Pending', value: counts.PENDING, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
          { label: 'Overdue', value: counts.OVERDUE, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
          { label: 'Paid', value: counts.PAID, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
        ]}
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <SearchInput
          value={search}
          onChange={(v) => { setSearch(v); setPage(1) }}
          placeholder="Search by member name or email..."
          className="flex-1 max-w-sm"
        />
        <Select
          options={statusFilterOptions}
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="sm:w-44"
        />
      </div>

      <div className="admin-card-surface overflow-hidden">
        {dues.length === 0 ? (
          <EmptyState
            icon={<Receipt size={40} />}
            title={filtersActive ? 'No matching dues' : 'No dues yet'}
            description={filtersActive ? 'Try adjusting your search or filters.' : 'Dues records for members will appear here.'}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table w-full text-sm">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-50/50 dark:from-dark-hover dark:to-dark-hover/50 border-b-2 border-gray-100 dark:border-dark-border">
                <tr>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Member</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Year Group</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Dues Year</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Reference</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {dues.map((due) => {
                  const badge = statusBadge[due.status] ?? { variant: 'default' as BadgeVariant, label: due.status }
                  return (
                    <tr key={due.id} className="border-b border-gray-50 dark:border-dark-border">
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-gray-900 dark:text-gray-100">{due.member?.fullName ?? 'Unknown member'}</p>
                        {due.member?.email && <p className="text-xs text-gray-500 dark:text-gray-400">{due.member.email}</p>}
                      </td>
                      <td className="px-5 py-3.5 text-gray-600 dark:text-gray-400 text-xs">{due.member?.yearGroup ?? '—'}</td>
                      <td className="px-5 py-3.5 text-gray-700 dark:text-gray-300">{due.year}</td>
                      <td className="px-5 py-3.5 font-medium text-gray-900 dark:text-gray-100">{formatCurrency(due.amount, 'GHS')}</td>
                      <td className="px-5 py-3.5">
                        <Badge variant={badge.variant} label={badge.label} />
                        {due.status === 'PAID' && due.paidAt && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{formatDate(due.paidAt)}</p>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-xs font-mono text-gray-600 dark:text-gray-400">{due.transactionRef || <span className="font-sans text-gray-300 dark:text-gray-600">—</span>}</td>
                      <td className="px-5 py-3.5">
                        {due.status !== 'PAID' && (
                          <RoleGate permission="donations:edit">
                            <Button size="sm" variant="secondary" leftIcon={<CheckCircle size={14} />} onClick={() => openMarkPaid(due)}>
                              Mark paid
                            </Button>
                          </RoleGate>
                        )}
                      </td>
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

      <Modal
        open={!!markTarget}
        onClose={() => { if (!marking) setMarkTarget(null) }}
        title="Mark Dues as Paid"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setMarkTarget(null)} disabled={marking}>Cancel</Button>
            <Button onClick={handleMarkPaid} loading={marking}>Mark as Paid</Button>
          </>
        }
      >
        {markTarget && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Mark <span className="font-semibold text-gray-900 dark:text-gray-100">{markTarget.member?.fullName ?? 'this member'}</span>'s {markTarget.year} dues of{' '}
              <span className="font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(markTarget.amount, 'GHS')}</span> as paid?
              Only do this after verifying the payment was received.
            </p>
            <Input
              label="Payment reference (optional)"
              placeholder="e.g. MoMo transaction ID"
              value={markRef}
              onChange={(e) => setMarkRef(e.target.value)}
              helperText={markTarget.transactionRef ? 'Pre-filled with the reference the member submitted.' : undefined}
            />
          </div>
        )}
      </Modal>
    </div>
  )
}
