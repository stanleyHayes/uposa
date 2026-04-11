import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusCircle, Pencil, Trash2, Briefcase, CheckCircle, Clock, XCircle } from 'lucide-react'
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
import { adminJobsApi } from '../../api/services'
import { useActivityStore } from '../../stores/activity.store'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { formatDate } from '../../utils/formatters'
import type { Job } from '../../types'

export default function JobsPage() {
  const navigate = useNavigate()
  const { addActivity } = useActivityStore()
  const { currentUser } = useAuth()
  const { toast } = useToast()

  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<Job | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filterApproved, setFilterApproved] = useState<string>('')

  const fetchJobs = useCallback(async () => {
    try {
      const res = await adminJobsApi.listAll({ limit: 100 })
      setJobs((res.data.data || []) as Job[])
    } catch {
      toast.error('Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { fetchJobs() }, [fetchJobs])

  const approvalFilterOptions = [
    { value: '', label: 'All' },
    { value: 'approved', label: 'Approved' },
    { value: 'pending', label: 'Pending Approval' },
  ]

  const stats = useMemo(() => {
    const now = new Date()
    const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    return {
      total: jobs.length,
      approved: jobs.filter((j) => j.isApproved).length,
      expiringSoon: jobs.filter((j) => j.isApproved && j.expiresAt && new Date(j.expiresAt) <= sevenDays && new Date(j.expiresAt) >= now).length,
      pending: jobs.filter((j) => !j.isApproved).length,
    }
  }, [jobs])

  const handleDelete = async () => {
    if (!deleteTarget || !currentUser) return
    try {
      await adminJobsApi.delete(deleteTarget.id)
      addActivity({
        action: 'deleted job posting',
        targetType: deleteTarget.title,
        targetId: deleteTarget.id,
        performedBy: currentUser.id,
        performedByName: currentUser.name,
      })
      toast.success('Job deleted')
      setDeleteTarget(null)
      fetchJobs()
    } catch {
      toast.error('Failed to delete job')
    }
  }

  const filtered = useMemo(() => jobs.filter((j) => {
    const matchesSearch =
      !search ||
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.company.toLowerCase().includes(search.toLowerCase())
    const matchesFilter = !filterApproved ||
      (filterApproved === 'approved' && j.isApproved) ||
      (filterApproved === 'pending' && !j.isApproved)
    return matchesSearch && matchesFilter
  }), [jobs, search, filterApproved])

  if (loading) {
    return <PageSkeleton cols={5} rows={5} />
  }

  return (
    <div className="page-enter">
      <PageHeader
        title="Job Opportunities"
        description={`${jobs.length} job postings`}
        actions={
          <RoleGate permission="jobs:create">
            <Button leftIcon={<PlusCircle size={16} />} onClick={() => navigate('/jobs/new')}>
              Post Job
            </Button>
          </RoleGate>
        }
      />

      <PageStats
        stats={[
          { label: 'Total Jobs', value: stats.total, icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
          { label: 'Approved', value: stats.approved, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
          { label: 'Expiring Soon', value: stats.expiringSoon, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
          { label: 'Pending Approval', value: stats.pending, icon: XCircle, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' },
        ]}
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setCurrentPage(1) }} placeholder="Search jobs..." className="flex-1" />
        <Select
          options={approvalFilterOptions}
          value={filterApproved}
          onChange={(e) => { setFilterApproved(e.target.value); setCurrentPage(1) }}
          className="sm:w-44"
        />
      </div>

      <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-dark-border shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Briefcase size={40} />}
            title="No jobs found"
            description={search || filterApproved ? 'No jobs match your filters. Try adjusting your search.' : 'Post your first job opportunity.'}
            action={!search && !filterApproved ? (
              <RoleGate permission="jobs:create">
                <Button leftIcon={<PlusCircle size={16} />} onClick={() => navigate('/jobs/new')}>Post Job</Button>
              </RoleGate>
            ) : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table w-full text-sm">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-50/50 dark:from-dark-hover dark:to-dark-hover/50 border-b-2 border-gray-100 dark:border-dark-border">
                <tr>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Job</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Expires</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {filtered.slice((currentPage - 1) * 10, currentPage * 10).map((job) => (
                  <tr key={job.id} className="border-b border-gray-50 dark:border-dark-border cursor-pointer hover:bg-gray-50/80 dark:hover:bg-dark-hover/50 transition-colors" onClick={() => navigate(`/jobs/${job.id}`)}>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-gray-900 dark:text-gray-100">{job.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{job.company} · {job.location}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant={job.jobType.toLowerCase() as any} label={job.jobType.replace('_', ' ')} />
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400 text-xs">
                      {job.expiresAt ? formatDate(job.expiresAt) : <span className="text-gray-300 dark:text-gray-600">--</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge
                        variant={job.isApproved ? 'published' : 'draft'}
                        label={job.isApproved ? 'Approved' : 'Pending'}
                      />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <RoleGate permission="jobs:edit">
                          <button
                            onClick={() => navigate(`/jobs/${job.id}/edit`)}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-brand-50 dark:hover:bg-brand-900/30 hover:text-brand-600 transition-all duration-150"
                          >
                            <Pencil size={15} />
                          </button>
                        </RoleGate>
                        <RoleGate permission="jobs:delete">
                          <button
                            onClick={() => setDeleteTarget(job)}
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
        title="Delete Job"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  )
}
