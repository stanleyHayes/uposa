// @ts-nocheck
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusCircle, Pencil, Trash2, Crown, CheckCircle, History, Layers } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Select from '../../components/ui/Select'
import SearchInput from '../../components/ui/SearchInput'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'
import Pagination from '../../components/ui/Pagination'
import PageStats from '../../components/ui/PageStats'
import { PageSkeleton } from '../../components/ui/Skeleton'
import RoleGate from '../../components/auth/RoleGate'
import { adminExecutivesApi } from '../../api/services'
import { useActivityStore } from '../../stores/activity.store'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import type { Executive } from '../../types'

export default function ExecutivesPage() {
  const navigate = useNavigate()
  const { addActivity } = useActivityStore()
  const { currentUser } = useAuth()
  const { toast } = useToast()

  const [executives, setExecutives] = useState<Executive[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<Executive | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const statusFilterOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ]

  const fetchExecutives = useCallback(async () => {
    try {
      const res = await adminExecutivesApi.list({ limit: 100 })
      setExecutives(res.data.data || [])
    } catch {
      toast.error('Failed to load executives')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { fetchExecutives() }, [fetchExecutives])

  const stats = {
    total: executives.length,
    active: executives.filter((e) => e.isActive).length,
    inactive: executives.filter((e) => !e.isActive).length,
    positions: new Set(executives.map((e) => e.position)).size,
  }

  const sorted = [...executives].sort((a, b) => a.order - b.order)

  const filtered = useMemo(() => sorted.filter((e) => {
    const matchesSearch = !search || e.name.toLowerCase().includes(search.toLowerCase()) || e.position.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = !statusFilter || (statusFilter === 'active' ? e.isActive : !e.isActive)
    return matchesSearch && matchesStatus
  }), [sorted, search, statusFilter])

  const handleDelete = async () => {
    if (!deleteTarget || !currentUser) return
    try {
      await adminExecutivesApi.delete(deleteTarget.id)
      addActivity({
        action: 'deleted executive',
        targetType: deleteTarget.name,
        targetId: deleteTarget.id,
        performedBy: currentUser.id,
        performedByName: currentUser.name,
      })
      toast.success('Executive deleted')
      setDeleteTarget(null)
      fetchExecutives()
    } catch {
      toast.error('Failed to delete executive')
    }
  }

  if (loading) {
    return <PageSkeleton cols={5} rows={5} />
  }

  return (
    <div className="page-enter">
      <PageHeader
        title="Council & Executives"
        description={`${executives.length} council members`}
        actions={
          <RoleGate permission="executives:create">
            <Button leftIcon={<PlusCircle size={16} />} onClick={() => navigate('/executives/new')}>
              Add Executive
            </Button>
          </RoleGate>
        }
      />

      <PageStats
        stats={[
          { label: 'Total Executives', value: stats.total, icon: Crown, color: 'text-brand-600', bg: 'bg-brand-50', border: 'border-brand-100' },
          { label: 'Active', value: stats.active, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
          { label: 'Inactive', value: stats.inactive, icon: History, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' },
          { label: 'Positions', value: stats.positions, icon: Layers, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
        ]}
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <SearchInput
          value={search}
          onChange={(v) => { setSearch(v); setCurrentPage(1) }}
          placeholder="Search executives..."
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
            icon={<Crown size={40} />}
            title={search || statusFilter ? 'No matching executives' : 'No executives yet'}
            description={search || statusFilter ? 'Try adjusting your search or filters.' : 'Add your first council member to get started.'}
            action={!search && !statusFilter ? (
              <RoleGate permission="executives:create">
                <Button leftIcon={<PlusCircle size={16} />} onClick={() => navigate('/executives/new')}>
                  Add Executive
                </Button>
              </RoleGate>
            ) : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table w-full text-sm">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-50/50 dark:from-dark-hover dark:to-dark-hover/50 border-b-2 border-gray-100 dark:border-dark-border">
                <tr>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Member</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Position</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Class Of</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {filtered.slice((currentPage - 1) * 10, currentPage * 10).map((exec) => (
                  <tr
                    key={exec.id}
                    className="border-b border-gray-50 dark:border-dark-border cursor-pointer hover:bg-gray-50/80 dark:hover:bg-dark-hover/50 transition-colors"
                    onClick={() => navigate(`/executives/${exec.id}`)}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {exec.photoUrl ? (
                          <img
                            src={exec.photoUrl}
                            alt={exec.name}
                            className="w-9 h-9 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
                            <span className="text-brand-700 font-semibold text-sm">
                              {exec.name.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{exec.name}</p>
                          {exec.email && <p className="text-xs text-gray-500 dark:text-gray-400">{exec.email}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-700 dark:text-gray-300">{exec.position}</td>
                    <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400 text-xs">{exec.classOf || '—'}</td>
                    <td className="px-5 py-3.5">
                      <Badge
                        variant={exec.isActive ? 'active' : 'archived'}
                        label={exec.isActive ? 'Active' : 'Inactive'}
                      />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <RoleGate permission="executives:edit">
                          <button
                            onClick={() => navigate(`/executives/${exec.id}/edit`)}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-brand-50 dark:hover:bg-brand-900/30 hover:text-brand-600 transition-all duration-150"
                          >
                            <Pencil size={15} />
                          </button>
                        </RoleGate>
                        <RoleGate permission="executives:delete">
                          <button
                            onClick={() => setDeleteTarget(exec)}
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
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Executive"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  )
}
