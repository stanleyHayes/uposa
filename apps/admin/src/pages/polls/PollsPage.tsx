// @ts-nocheck
import { useState, useMemo, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusCircle, Pencil, Trash2, BarChart3, Zap, TrendingUp, CheckCircle, Eye } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Select from '../../components/ui/Select'
import SearchInput from '../../components/ui/SearchInput'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'
import Pagination from '../../components/ui/Pagination'
import PageStats from '../../components/ui/PageStats'
import ViewToggle, { type ViewMode } from '../../components/ui/ViewToggle'
import RoleGate from '../../components/auth/RoleGate'
import { adminPollsApi } from '../../api/services'
import { useActivityStore } from '../../stores/activity.store'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { formatDate } from '../../utils/formatters'
import type { Poll } from '../../types'

const ITEMS_PER_PAGE = 10
const GRID_ITEMS_PER_PAGE = 9

export default function PollsPage() {
  const navigate = useNavigate()
  const { addActivity } = useActivityStore()
  const { currentUser } = useAuth()
  const { toast } = useToast()

  const [polls, setPolls] = useState<Poll[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPolls = useCallback(async () => {
    try {
      const res = await adminPollsApi.listAll({ limit: 100 })
      const raw = (res.data as any).data || []
      setPolls(raw.map((p: any) => ({
        ...p,
        totalVotes: p.totalVotes ?? (p._count?.votes ?? p.options?.reduce((s: number, o: any) => s + (o.votes || 0), 0) ?? 0),
      })))
    } catch {
      toast.error('Failed to load polls')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { fetchPolls() }, [fetchPolls])

  const [currentPage, setCurrentPage] = useState(1)
  const [deleteTarget, setDeleteTarget] = useState<Poll | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('table')

  const statusFilterOpts = [
    { value: '', label: 'All Statuses' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'CLOSED', label: 'Closed' },
  ]

  const stats = useMemo(() => ({
    total: polls.length,
    active: polls.filter((p) => p.status === 'ACTIVE').length,
    totalVotes: polls.reduce((sum, p) => sum + p.totalVotes, 0),
    closed: polls.filter((p) => p.status === 'CLOSED').length,
  }), [polls])

  const filtered = useMemo(() => polls.filter((p) => {
    const matchesSearch = !search || p.question.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = !statusFilter || p.status === statusFilter
    return matchesSearch && matchesStatus
  }), [polls, search, statusFilter])

  const handleDelete = async () => {
    if (!deleteTarget || !currentUser) return
    try {
      await adminPollsApi.delete(deleteTarget.id)
      addActivity({
        action: 'deleted poll',
        targetType: deleteTarget.question,
        targetId: deleteTarget.id,
        performedBy: currentUser.id,
        performedByName: currentUser.name,
      })
      toast.success('Poll deleted')
      setDeleteTarget(null)
      fetchPolls()
    } catch {
      toast.error('Failed to delete poll')
    }
  }

  return (
    <div className="page-enter">
      <PageHeader
        title="Polls & Surveys"
        description={`${polls.length} polls`}
        actions={
          <RoleGate permission="polls:create">
            <Button leftIcon={<PlusCircle size={16} />} onClick={() => navigate('/polls/new')}>
              Create Poll
            </Button>
          </RoleGate>
        }
      />

      <PageStats
        stats={[
          { label: 'Total Polls', value: stats.total, icon: BarChart3, color: 'text-brand-600', bg: 'bg-brand-50', border: 'border-brand-100' },
          { label: 'Active', value: stats.active, icon: Zap, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
          { label: 'Total Votes', value: stats.totalVotes, icon: TrendingUp, color: 'text-brand-600', bg: 'bg-cream-100', border: 'border-cream-300' },
          { label: 'Closed', value: stats.closed, icon: CheckCircle, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' },
        ]}
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setCurrentPage(1) }} placeholder="Search polls..." className="flex-1" />
        <Select
          options={statusFilterOpts}
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1) }}
          className="sm:w-44"
        />
        <ViewToggle view={viewMode} onChange={(v) => { setViewMode(v); setCurrentPage(1) }} />
      </div>

      {(() => {
        const perPage = viewMode === 'grid' ? GRID_ITEMS_PER_PAGE : ITEMS_PER_PAGE
        const paginatedItems = filtered.slice((currentPage - 1) * perPage, currentPage * perPage)
        const totalPages = Math.ceil(filtered.length / perPage)

        return (
          <div className="admin-card-surface overflow-hidden">
            {filtered.length === 0 ? (
              <EmptyState
                icon={<BarChart3 size={40} />}
                title="No polls found"
                description={search || statusFilter ? 'No polls match your filters. Try adjusting your search.' : 'Create your first member poll.'}
                action={!search && !statusFilter ? (
                  <RoleGate permission="polls:create">
                    <Button leftIcon={<PlusCircle size={16} />} onClick={() => navigate('/polls/new')}>Create Poll</Button>
                  </RoleGate>
                ) : undefined}
              />
            ) : viewMode === 'table' ? (
              <div className="overflow-x-auto">
                <table className="data-table w-full text-sm">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-50/50 dark:from-dark-hover dark:to-dark-hover/50 border-b-2 border-gray-100 dark:border-dark-border">
                    <tr>
                      <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Question</th>
                      <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Options</th>
                      <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ends At</th>
                      <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Votes</th>
                      <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                    {paginatedItems.map((poll) => (
                      <tr
                        key={poll.id}
                        className="border-b border-gray-50 dark:border-dark-border cursor-pointer hover:bg-gray-50/80 dark:hover:bg-dark-hover/50 transition-colors"
                        onClick={() => navigate(`/polls/${poll.id}`)}
                      >
                        <td className="px-5 py-3.5">
                          <p className="font-medium text-gray-900 dark:text-gray-100 line-clamp-1">{poll.question}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {poll.allowMultiple ? 'Multiple choice' : 'Single choice'}
                          </p>
                        </td>
                        <td className="px-5 py-3.5 text-gray-700 dark:text-gray-300">{poll.options.length}</td>
                        <td className="px-5 py-3.5">
                          <Badge
                            variant={poll.status.toLowerCase() as any}
                            label={poll.status.charAt(0).toUpperCase() + poll.status.slice(1)}
                          />
                        </td>
                        <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400 text-xs">
                          {poll.endsAt ? formatDate(poll.endsAt) : <span className="text-gray-300 dark:text-gray-600">---</span>}
                        </td>
                        <td className="px-5 py-3.5 text-gray-700 dark:text-gray-300 font-medium">{((poll as any)._count?.votes ?? (poll as any).totalVotes ?? 0).toLocaleString()}</td>
                        <td className="px-5 py-3.5">
                          <div className="inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => navigate(`/polls/${poll.id}`)}
                              title="View results"
                              className="rounded-lg p-1.5 text-gray-400 hover:bg-brand-50 dark:hover:bg-brand-900/30 hover:text-brand-600 transition-all duration-150"
                            >
                              <Eye size={15} />
                            </button>
                            <RoleGate permission="polls:edit">
                              <button
                                onClick={() => navigate(`/polls/${poll.id}/edit`)}
                                className="rounded-lg p-1.5 text-gray-400 hover:bg-brand-50 dark:hover:bg-brand-900/30 hover:text-brand-600 transition-all duration-150"
                              >
                                <Pencil size={15} />
                              </button>
                            </RoleGate>
                            <RoleGate permission="polls:delete">
                              <button
                                onClick={() => setDeleteTarget(poll)}
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
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                {paginatedItems.map((poll) => {
                  const totalVotes = poll.options.reduce((sum, o) => sum + (o.votes || 0), 0)
                  return (
                    <div key={poll.id} className="admin-card-surface overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all">
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <Badge variant={poll.status === 'ACTIVE' ? 'active' : 'archived'} label={poll.status} />
                          <span className="text-xs text-gray-400">{totalVotes} votes</span>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 line-clamp-2">{poll.question}</h3>
                        {poll.description && <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">{poll.description}</p>}
                        <div className="space-y-1.5 mt-3">
                          {poll.options.slice(0, 3).map((opt, i) => (
                            <div key={i} className="flex items-center justify-between text-xs">
                              <span className="text-gray-600 dark:text-gray-300 truncate mr-2">{opt.text}</span>
                              <span className="text-gray-400 font-medium shrink-0">{opt.votes || 0}</span>
                            </div>
                          ))}
                          {poll.options.length > 3 && <p className="text-xs text-gray-400">+{poll.options.length - 3} more</p>}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            <div className="px-4 border-t border-gray-100 dark:border-dark-border">
              <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={filtered.length} itemsPerPage={perPage} onPageChange={setCurrentPage} />
            </div>
          </div>
        )
      })()}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Poll"
        message="Are you sure you want to delete this poll? All votes will be lost."
        confirmLabel="Delete"
      />
    </div>
  )
}
