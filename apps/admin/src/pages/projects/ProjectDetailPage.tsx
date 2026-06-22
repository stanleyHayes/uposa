import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, Trash2, CalendarDays, CheckCircle2, Circle } from 'lucide-react'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import RoleGate from '../../components/auth/RoleGate'
import { useProjectsStore } from '../../stores/projects.store'
import { useActivityStore } from '../../stores/activity.store'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { formatDate } from '../../utils/formatters'

export default function ProjectDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { projects, fetchProjects, deleteProject } = useProjectsStore()
  const { addActivity } = useActivityStore()
  const { currentUser } = useAuth()
  const { toast } = useToast()

  const [deleteTarget, setDeleteTarget] = useState(false)

  // Fetch projects if store is empty (direct navigation)
  useEffect(() => {
    if (projects.length === 0) {
      fetchProjects()
    }
  }, [projects.length, fetchProjects])

  const project = projects.find((p) => p.id === id)

  const handleDelete = async () => {
    if (!project || !currentUser) return
    try {
      await deleteProject(project.id)
      addActivity({ action: 'deleted project', targetType: project.title, targetId: project.id, performedBy: currentUser.id, performedByName: currentUser.name })
      toast.success('Project deleted')
      navigate('/projects')
    } catch {
      toast.error('Failed to delete project')
    }
  }

  if (!project) {
    return (
      <div className="page-enter">
        <button
          onClick={() => navigate('/projects')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-600 transition-colors mb-4"
        >
          <ArrowLeft size={16} /> Back to projects
        </button>
        <div className="admin-card-surface p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">Project not found.</p>
        </div>
      </div>
    )
  }

  const progressPercent = project.goalAmount > 0
    ? Math.min(100, Math.round((project.raisedAmount / project.goalAmount) * 100))
    : 0

  return (
    <div className="page-enter">
      <div className="mb-6">
        <button
          onClick={() => navigate('/projects')}
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          Back to projects
        </button>

        {project.imageUrl && (
          <div className="rounded-xl overflow-hidden mb-6 border border-gray-200 dark:border-dark-border">
            <img src={project.imageUrl} alt={project.title} className="w-full h-64 object-cover" />
          </div>
        )}

        <div className="admin-card-surface p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge variant={project.status.toLowerCase() as any} label={project.status.charAt(0) + project.status.slice(1).toLowerCase()} />
                {project.isFeatured && (
                  <Badge variant="warning" label="Featured" />
                )}
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{project.title}</h1>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <RoleGate permission="projects:edit">
                <Button size="sm" variant="secondary" leftIcon={<Pencil size={14} />} onClick={() => navigate(`/projects/${project.id}/edit`)}>
                  Edit
                </Button>
              </RoleGate>
              <RoleGate permission="projects:delete">
                <Button size="sm" variant="danger" leftIcon={<Trash2 size={14} />} onClick={() => setDeleteTarget(true)}>
                  Delete
                </Button>
              </RoleGate>
            </div>
          </div>

          {project.goalAmount > 0 && (
            <div className="mb-6 p-4 bg-gray-50 dark:bg-dark-hover rounded-lg">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-400">Fundraising Progress</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">{progressPercent}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-dark-hover rounded-full h-3">
                <div
                  className="bg-brand-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                <span>GHS {project.raisedAmount.toLocaleString()} raised</span>
                <span>GHS {project.goalAmount.toLocaleString()} goal</span>
              </div>
            </div>
          )}

          {(project.startDate || project.endDate) && (
            <div className="flex items-center gap-2 mb-6 text-sm text-gray-600 dark:text-gray-400">
              <CalendarDays size={16} className="text-gray-400 shrink-0" />
              <div>
                {project.startDate && <span>{formatDate(project.startDate)}</span>}
                {project.startDate && project.endDate && <span className="text-gray-400 dark:text-gray-500"> to </span>}
                {project.endDate && <span>{formatDate(project.endDate)}</span>}
              </div>
            </div>
          )}

          <div className="bg-gray-50 dark:bg-dark-hover rounded-lg p-4 text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
            {project.description}
          </div>

          {/* Milestones */}
          {project.milestones && project.milestones.length > 0 && (
            <div className="mt-6">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Milestones</h2>
              <div className="space-y-2">
                {project.milestones.map((milestone, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-dark-hover rounded-lg border border-gray-100 dark:border-dark-border">
                    {milestone.completed ? (
                      <CheckCircle2 size={16} className="text-green-500 mt-0.5 shrink-0" />
                    ) : (
                      <Circle size={16} className="text-gray-300 dark:text-gray-600 mt-0.5 shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-medium ${milestone.completed ? 'text-gray-500 dark:text-gray-400 line-through' : 'text-gray-900 dark:text-gray-100'}`}>
                        {milestone.title}
                      </p>
                      {milestone.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{milestone.description}</p>
                      )}
                      {milestone.date && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{formatDate(milestone.date)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gallery */}
          {project.gallery && project.gallery.length > 0 && (
            <div className="mt-6">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Gallery</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {project.gallery.map((url, idx) => (
                  <div key={idx} className="rounded-lg overflow-hidden border border-gray-200 dark:border-dark-border">
                    <img src={url} alt={`${project.title} gallery ${idx + 1}`} className="w-full h-32 object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-dark-border flex items-center gap-6 text-xs text-gray-400 dark:text-gray-500">
            <span>Created: {formatDate(project.createdAt)}</span>
            <span>Updated: {formatDate(project.updatedAt)}</span>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={deleteTarget}
        onClose={() => setDeleteTarget(false)}
        onConfirm={handleDelete}
        title="Delete Project"
        message={`Are you sure you want to delete "${project.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  )
}
