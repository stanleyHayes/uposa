// @ts-nocheck
import { useState, useEffect, useCallback, useMemo } from 'react'
import { Mail, Trash2, UserX, CheckCircle, XCircle, Send } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import SearchInput from '../../components/ui/SearchInput'
import Select from '../../components/ui/Select'
import Badge from '../../components/ui/Badge'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'
import Pagination from '../../components/ui/Pagination'
import PageStats from '../../components/ui/PageStats'
import { PageSkeleton } from '../../components/ui/Skeleton'
import RoleGate from '../../components/auth/RoleGate'
import { adminNewsletterApi } from '../../api/services'
import { useToast } from '../../hooks/useToast'

interface Subscriber {
  id: string
  email: string
  isActive: boolean
  subscribedAt: string
}

export default function NewsletterPage() {
  const { toast } = useToast()

  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Subscriber | null>(null)
  const [unsubTarget, setUnsubTarget] = useState<Subscriber | null>(null)

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ]

  const fetchSubscribers = useCallback(async (page = 1) => {
    try {
      const params: Record<string, string | number> = { page, limit: 20 }
      if (statusFilter) params.status = statusFilter
      const res = await adminNewsletterApi.list(params)
      setSubscribers(res.data.data || [])
      const p = res.data.pagination
      if (p) setPagination({ page: p.page, totalPages: p.totalPages, total: p.total })
    } catch {
      toast.error('Failed to load subscribers')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, toast])

  useEffect(() => { fetchSubscribers(1) }, [fetchSubscribers])

  const stats = useMemo(() => ({
    total: pagination.total,
    active: subscribers.filter(s => s.isActive).length,
    inactive: subscribers.filter(s => !s.isActive).length,
  }), [subscribers, pagination.total])

  const filtered = useMemo(() => {
    if (!search) return subscribers
    return subscribers.filter(s => s.email.toLowerCase().includes(search.toLowerCase()))
  }, [subscribers, search])

  const handleUnsubscribe = async () => {
    if (!unsubTarget) return
    try {
      await adminNewsletterApi.unsubscribe(unsubTarget.id)
      toast.success('Subscriber deactivated')
      setUnsubTarget(null)
      fetchSubscribers(pagination.page)
    } catch {
      toast.error('Failed to unsubscribe')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await adminNewsletterApi.delete(deleteTarget.id)
      toast.success('Subscriber deleted')
      setDeleteTarget(null)
      fetchSubscribers(pagination.page)
    } catch {
      toast.error('Failed to delete subscriber')
    }
  }

  if (loading) return <PageSkeleton cols={4} rows={5} />

  return (
    <div className="page-enter">
      <PageHeader
        title="Newsletter Subscribers"
        description={`${pagination.total} subscriber${pagination.total !== 1 ? 's' : ''}`}
      />

      <PageStats
        stats={[
          { label: 'Total Subscribers', value: pagination.total, icon: Mail, color: 'text-brand-600', bg: 'bg-brand-50', border: 'border-brand-100' },
          { label: 'Active', value: stats.active, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
          { label: 'Inactive', value: stats.inactive, icon: XCircle, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' },
        ]}
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <SearchInput
          value={search}
          onChange={v => setSearch(v)}
          placeholder="Search by email..."
          className="flex-1 max-w-xs"
        />
        <Select
          options={statusOptions}
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setLoading(true) }}
          className="w-40"
        />
      </div>

      <div className="admin-card-surface overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Send size={40} />}
            title={search || statusFilter ? 'No matching subscribers' : 'No subscribers yet'}
            description={search || statusFilter ? 'Try adjusting your search or filters.' : 'Newsletter subscribers will appear here once people sign up.'}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table w-full text-sm">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-50/50 dark:from-dark-hover dark:to-dark-hover/50 border-b-2 border-gray-100 dark:border-dark-border">
                <tr>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Subscribed</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {filtered.map(sub => (
                  <tr key={sub.id} className="border-b border-gray-50 dark:border-dark-border hover:bg-gray-50/80 dark:hover:bg-dark-hover/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center shrink-0">
                          <Mail size={14} className="text-brand-600 dark:text-brand-300" />
                        </div>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{sub.email}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400 text-xs">
                      {new Date(sub.subscribedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge
                        variant={sub.isActive ? 'active' : 'archived'}
                        label={sub.isActive ? 'Active' : 'Inactive'}
                      />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="inline-flex items-center gap-1">
                        {sub.isActive && (
                          <RoleGate permission="settings:edit">
                            <button
                              onClick={() => setUnsubTarget(sub)}
                              title="Unsubscribe"
                              className="rounded-lg p-1.5 text-gray-400 hover:bg-amber-50 dark:hover:bg-amber-900/30 hover:text-amber-600 transition-all duration-150"
                            >
                              <UserX size={15} />
                            </button>
                          </RoleGate>
                        )}
                        <RoleGate permission="settings:edit">
                          <button
                            onClick={() => setDeleteTarget(sub)}
                            title="Delete"
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 transition-all duration-150"
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
        )}
        <div className="px-4 border-t border-gray-100 dark:border-dark-border">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.total}
            itemsPerPage={20}
            onPageChange={p => { setLoading(true); fetchSubscribers(p) }}
          />
        </div>
      </div>

      <ConfirmDialog
        open={!!unsubTarget}
        onClose={() => setUnsubTarget(null)}
        onConfirm={handleUnsubscribe}
        title="Unsubscribe"
        message={`Deactivate subscription for "${unsubTarget?.email}"?`}
        confirmLabel="Unsubscribe"
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Subscriber"
        message={`Permanently delete "${deleteTarget?.email}"? This cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  )
}
