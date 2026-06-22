// @ts-nocheck
import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusCircle, Pencil, Trash2, FolderKanban, Zap, CheckCircle2, Lightbulb } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'
import Pagination from '../../components/ui/Pagination'
import PageStats from '../../components/ui/PageStats'
import SearchInput from '../../components/ui/SearchInput'
import Select from '../../components/ui/Select'
import ViewToggle, { type ViewMode } from '../../components/ui/ViewToggle'
import RoleGate from '../../components/auth/RoleGate'
import { useProjectsStore } from '../../stores/projects.store'
import { useActivityStore } from '../../stores/activity.store'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { formatDate } from '../../utils/formatters'
import type { Project, ProjectStatus } from '../../types'

const statusFilterOptions = [
  { value: 'all', label: 'All Statuses' },
  { value: 'ONGOING', label: 'Ongoing' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'PAUSED', label: 'Paused' },
]

export default function ProjectsPage() {
  const navigate = useNavigate()
  const { projects, fetchProjects, deleteProject } = useProjectsStore()
  const { addActivity } = useActivityStore()
  const { currentUser } = useAuth()
  const { toast } = useToast()

  useEffect(() => { fetchProjects() }, [fetchProjects])

  const [currentPage, setCurrentPage] = useState(1)
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewMode, setViewMode] = useState<ViewMode>('table')

  const stats = useMemo(() => ({
    total: projects.length,
    ongoing: projects.filter((p) => p.status === 'ONGOING').length,
    completed: projects.filter((p) => p.status === 'COMPLETED').length,
    paused: projects.filter((p) => p.status === 'PAUSED').length,
  }), [projects])

  const itemsPerPage = viewMode === 'grid' ? 12 : 10

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      const matchesSearch =
        !search ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [projects, search, statusFilter])

  const paginatedItems = useMemo(() => {
    return filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  }, [filtered, currentPage, itemsPerPage])

  const handleDelete = async () => {
    if (!deleteTarget || !currentUser) return
    try {
      await deleteProject(deleteTarget.id)
      addActivity({ action: 'deleted project', targetType: deleteTarget.title, targetId: deleteTarget.id, performedBy: currentUser.id, performedByName: currentUser.name })
      toast.success('Project deleted')
      setDeleteTarget(null)
    } catch {
      toast.error('Failed to delete project')
    }
  }

  return (
    <div className="page-enter">
      <PageHeader
        title="Projects"
        description={`${projects.length} projects`}
        actions={
          <RoleGate permission="projects:create">
            <Button leftIcon={<PlusCircle size={16} />} onClick={() => navigate('/projects/new')}>
              New Project
            </Button>
          </RoleGate>
        }
      />

      <PageStats
        stats={[
          { label: 'Total Projects', value: stats.total, icon: FolderKanban, color: 'text-brand-600', bg: 'bg-brand-50', border: 'border-brand-100' },
          { label: 'Ongoing', value: stats.ongoing, icon: Zap, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
          { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
          { label: 'Paused', value: stats.paused, icon: Lightbulb, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
        ]}
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <SearchInput
          value={search}
          onChange={(v) => { setSearch(v); setCurrentPage(1) }}
          placeholder="Search projects..."
          className="flex-1"
        />
        <Select
          options={statusFilterOptions}
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1) }}
        />
        <ViewToggle view={viewMode} onChange={(v) => { setViewMode(v); setCurrentPage(1) }} />
      </div>

      <div className="admin-card-surface overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<FolderKanban size={40} />}
            title={search || statusFilter !== 'all' ? 'No matching projects' : 'No projects yet'}
            description={search || statusFilter !== 'all' ? 'Try adjusting your search or filters.' : 'Create your first project to track goals and progress.'}
            action={!search && statusFilter === 'all' ? (
              <RoleGate permission="projects:create">
                <Button leftIcon={<PlusCircle size={16} />} onClick={() => navigate('/projects/new')}>
                  New Project
                </Button>
              </RoleGate>
            ) : undefined}
          />
        ) : viewMode === 'table' ? (
          <div className="overflow-x-auto">
            <table className="data-table w-full text-sm">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-50/50 dark:from-dark-hover dark:to-dark-hover/50 border-b-2 border-gray-100 dark:border-dark-border">
                <tr>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Project</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Timeline</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Progress</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {paginatedItems.map((project) => (
                  <tr key={project.id} className="border-b border-gray-50 dark:border-dark-border cursor-pointer hover:bg-gray-50/80 dark:hover:bg-dark-hover/50 hover:-translate-y-px transition-all" onClick={() => navigate(`/projects/${project.id}`)}>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-gray-900 dark:text-gray-100">{project.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">{project.description}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant={project.status.toLowerCase() as any} label={project.status.charAt(0) + project.status.slice(1).toLowerCase()} />
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 dark:text-gray-400 text-xs">
                      {project.startDate ? (
                        <>
                          <p>{formatDate(project.startDate)}</p>
                          {project.endDate && <p className="text-gray-400 dark:text-gray-500">to {formatDate(project.endDate)}</p>}
                        </>
                      ) : (
                        <span className="text-gray-300 dark:text-gray-600">--</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-gray-700 dark:text-gray-300 text-xs">
                      {project.goalAmount > 0
                        ? `GHS ${project.raisedAmount.toLocaleString()} / ${project.goalAmount.toLocaleString()}`
                        : <span className="text-gray-300 dark:text-gray-600">--</span>
                      }
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <RoleGate permission="projects:edit">
                          <button
                            onClick={() => navigate(`/projects/${project.id}/edit`)}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-brand-50 dark:hover:bg-brand-900/30 hover:text-brand-600 transition-all duration-150"
                          >
                            <Pencil size={15} />
                          </button>
                        </RoleGate>
                        <RoleGate permission="projects:delete">
                          <button
                            onClick={() => setDeleteTarget(project)}
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
            {paginatedItems.map((project) => {
              const progress = project.goalAmount > 0 ? Math.round((project.raisedAmount / project.goalAmount) * 100) : 0
              return (
                <div key={project.id} className="admin-card-surface overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group" onClick={() => navigate(`/projects/${project.id}`)}>
                  {project.imageUrl ? (
                    <img src={project.imageUrl} alt={project.title} className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-40 bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-900/30 dark:to-brand-800/20 flex items-center justify-center">
                      <FolderKanban size={32} className="text-brand-300" />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant={project.status.toLowerCase()} label={project.status} />
                      <span className="text-xs font-bold text-brand-600">{progress}%</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 line-clamp-1">{project.title}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">{project.description}</p>
                    <div className="w-full bg-gray-100 dark:bg-dark-hover rounded-full h-1.5 overflow-hidden">
                      <div className="bg-brand-500 h-full rounded-full transition-all" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-1.5">
                      <span>GH₵ {project.raisedAmount?.toLocaleString()}</span>
                      <span>GH₵ {project.goalAmount?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        <div className="px-4 border-t border-gray-100 dark:border-dark-border">
          <Pagination currentPage={currentPage} totalPages={Math.ceil(filtered.length / itemsPerPage)} totalItems={filtered.length} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} />
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Project"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  )
}
