// @ts-nocheck
import { useState, useMemo, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusCircle, Pencil, Trash2, Vote, Zap, Clock, Lock } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Select from '../../components/ui/Select'
import SearchInput from '../../components/ui/SearchInput'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'
import Pagination from '../../components/ui/Pagination'
import PageStats from '../../components/ui/PageStats'
import RoleGate from '../../components/auth/RoleGate'
import { adminElectionsApi } from '../../api/services'
import { useActivityStore } from '../../stores/activity.store'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { formatDate } from '../../utils/formatters'
import type { Election } from '../../types'

export default function ElectionsPage() {
  const navigate = useNavigate()
  const { addActivity } = useActivityStore()
  const { currentUser } = useAuth()
  const { toast } = useToast()

  const [elections, setElections] = useState<Election[]>([])
  const [loading, setLoading] = useState(true)

  const fetchElections = useCallback(async () => {
    try {
      const res = await adminElectionsApi.listAll({ limit: 100 })
      setElections((res.data as any).data || [])
    } catch {
      toast.error('Failed to load elections')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { fetchElections() }, [fetchElections])

  const [currentPage, setCurrentPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [deleteElectionTarget, setDeleteElectionTarget] = useState<Election | null>(null)

  const stats = useMemo(() => ({
    total: elections.length,
    active: elections.filter((e) => e.status === 'ACTIVE').length,
    upcoming: elections.filter((e) => e.status === 'UPCOMING').length,
    completed: elections.filter((e) => e.status === 'COMPLETED').length,
  }), [elections])

  const statusFilterOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'UPCOMING', label: 'Upcoming' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'CANCELLED', label: 'Cancelled' },
  ]

  const filtered = useMemo(() => elections.filter((e) => {
    const matchesSearch = !search || e.title.toLowerCase().includes(search.toLowerCase()) || e.position.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = !statusFilter || e.status === statusFilter
    return matchesSearch && matchesStatus
  }), [elections, search, statusFilter])

  const handleDeleteElection = async () => {
    if (!deleteElectionTarget || !currentUser) return
    try {
      await adminElectionsApi.delete(deleteElectionTarget.id)
      addActivity({
        action: 'deleted election',
        targetType: deleteElectionTarget.title,
        targetId: deleteElectionTarget.id,
        performedBy: currentUser.id,
        performedByName: currentUser.name,
      })
      toast.success('Election deleted')
      setDeleteElectionTarget(null)
      fetchElections()
    } catch {
      toast.error('Failed to delete election')
    }
  }

  return (
    <div className="page-enter">
      <PageHeader
        title="Elections"
        description={`${elections.length} elections`}
        actions={
          <RoleGate permission="elections:create">
            <Button leftIcon={<PlusCircle size={16} />} onClick={() => navigate('/elections/new')}>
              New Election
            </Button>
          </RoleGate>
        }
      />
      <PageStats
        stats={[
          { label: 'Total Elections', value: stats.total, icon: Vote, color: 'text-brand-600', bg: 'bg-brand-50', border: 'border-brand-100' },
          { label: 'Active', value: stats.active, icon: Zap, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
          { label: 'Upcoming', value: stats.upcoming, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
          { label: 'Completed', value: stats.completed, icon: Lock, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' },
        ]}
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <SearchInput
          value={search}
          onChange={(v) => { setSearch(v); setCurrentPage(1) }}
          placeholder="Search elections..."
          className="flex-1 max-w-xs"
        />
        <Select
          options={statusFilterOptions}
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1) }}
          className="w-40"
        />
      </div>

      <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-dark-border shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Vote size={40} />}
            title={search || statusFilter ? 'No matching elections' : 'No elections yet'}
            description={search || statusFilter ? 'Try adjusting your search or filters.' : 'Create your first election period.'}
            action={!search && !statusFilter ? (
              <RoleGate permission="elections:create">
                <Button leftIcon={<PlusCircle size={16} />} onClick={() => navigate('/elections/new')}>
                  New Election
                </Button>
              </RoleGate>
            ) : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table w-full text-sm">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-50/50 dark:from-dark-hover dark:to-dark-hover/50 border-b-2 border-gray-100 dark:border-dark-border">
                <tr>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Election</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Position</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Dates</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Candidates</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {filtered.slice((currentPage - 1) * 10, currentPage * 10).map((election) => (
                  <tr
                    key={election.id}
                    className="border-b border-gray-50 dark:border-dark-border cursor-pointer hover:bg-gray-50/80 dark:hover:bg-dark-hover/50 transition-colors"
                    onClick={() => navigate(`/elections/${election.id}`)}
                  >
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-gray-900 dark:text-gray-100">{election.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{election.description}</p>
                    </td>
                    <td className="px-5 py-3.5 text-gray-700 dark:text-gray-300 text-xs">{election.position}</td>
                    <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400 text-xs">
                      {formatDate(election.startDate)} – {formatDate(election.endDate)}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge
                        variant={election.status.toLowerCase() as any}
                        label={election.status.charAt(0) + election.status.slice(1).toLowerCase()}
                      />
                    </td>
                    <td className="px-5 py-3.5 text-gray-700 dark:text-gray-300 text-xs">{election.candidates.length}</td>
                    <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center gap-1">
                        <RoleGate permission="elections:edit">
                          <button
                            onClick={() => navigate(`/elections/${election.id}/edit`)}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-brand-50 dark:hover:bg-brand-900/30 hover:text-brand-600 transition-all duration-150"
                          >
                            <Pencil size={15} />
                          </button>
                        </RoleGate>
                        <RoleGate permission="elections:delete">
                          <button
                            onClick={() => setDeleteElectionTarget(election)}
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
          <Pagination currentPage={currentPage} totalPages={Math.ceil(filtered.length / 10)} totalItems={filtered.length} itemsPerPage={10} onPageChange={setCurrentPage} />
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteElectionTarget}
        onClose={() => setDeleteElectionTarget(null)}
        onConfirm={handleDeleteElection}
        title="Delete Election"
        message={`Are you sure you want to delete "${deleteElectionTarget?.title}"? All candidates will also be removed.`}
        confirmLabel="Delete"
      />
    </div>
  )
}
