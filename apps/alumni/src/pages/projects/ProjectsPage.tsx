import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { FolderOpen, MapPin, Calendar, ArrowRight, Target } from 'lucide-react'
import PageTransition from '../../components/common/PageTransition'
import PageHeader from '../../components/ui/PageHeader'
import ScrollReveal from '../../components/common/ScrollReveal'
import StatusBadge from '../../components/ui/StatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import ViewToggle, { type ViewMode } from '../../components/ui/ViewToggle'
import { projectsApi } from '../../api/services'
import { formatCurrency, formatDate } from '../../utils/formatters'
import type { Project } from '../../types'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'ongoing' | 'completed'>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        let res
        if (filter === 'ongoing') res = await projectsApi.ongoing()
        else if (filter === 'completed') res = await projectsApi.completed()
        else res = await projectsApi.list()
        const data = res.data.data
        setProjects(data || [])
      } catch {
        setProjects([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [filter])

  return (
    <PageTransition>
      <PageHeader title="Projects" description="Support ongoing initiatives and view completed projects" />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="join">
          {(['all', 'ongoing', 'completed'] as const).map((f) => (
            <button key={f} className={`join-item btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <div className="ml-auto">
          <ViewToggle view={viewMode} onChange={setViewMode} />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : projects.length === 0 ? (
        <EmptyState icon={FolderOpen} title="No projects found" />
      ) : (
        viewMode === 'grid' ? (
          <div className="space-y-6">
            {projects.map((project, i) => {
              const progress = project.goalAmount > 0 ? Math.min((project.raisedAmount / project.goalAmount) * 100, 100) : 0
              return (
                <ScrollReveal key={project.id} delay={i * 0.05}>
                  <div className="card bg-base-100 shadow-[0_2px_8px_rgba(0,27,80,0.06)] overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="flex flex-col lg:flex-row">
                      {/* Image section */}
                      <div className="lg:w-2/5 relative">
                        {project.imageUrl ? (
                          <img
                            src={project.imageUrl}
                            alt={project.title}
                            className="w-full h-56 lg:h-full lg:min-h-[280px] object-cover"
                          />
                        ) : (
                          <div className="w-full h-56 lg:h-full lg:min-h-[280px] bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 flex items-center justify-center">
                            <FolderOpen className="w-16 h-16 text-primary/20" />
                          </div>
                        )}
                        {/* Overlay badges */}
                        <div className="absolute top-3 left-3 flex items-center gap-2">
                          <StatusBadge status={project.status} />
                          {project.isFeatured && <span className="badge badge-secondary badge-sm">Featured</span>}
                        </div>
                      </div>

                      {/* Content section */}
                      <div className="flex-1 p-5 sm:p-6 lg:p-8 flex flex-col">
                        <h2 className="text-xl sm:text-2xl font-bold mb-2">{project.title}</h2>
                        <p className="text-base-content/60 text-sm sm:text-base leading-relaxed mb-4">{project.description}</p>

                        {/* Meta info */}
                        <div className="flex flex-wrap gap-4 text-sm text-base-content/50 mb-5">
                          {project.startDate && (
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-4 h-4" />
                              <span>Started {formatDate(project.startDate)}</span>
                            </div>
                          )}
                          {project.endDate && (
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-4 h-4" />
                              <span>Target: {formatDate(project.endDate)}</span>
                            </div>
                          )}
                        </div>

                        {/* Progress section */}
                        {project.goalAmount > 0 && (
                          <div className="mt-auto">
                            <div className="flex items-end justify-between mb-2">
                              <div>
                                <p className="text-2xl font-bold text-primary">{formatCurrency(project.raisedAmount)}</p>
                                <p className="text-xs text-base-content/50">raised of {formatCurrency(project.goalAmount)} goal</p>
                              </div>
                              <div className="flex items-center gap-1.5 text-sm font-semibold">
                                <Target className="w-4 h-4 text-secondary" />
                                <span className="text-secondary">{Math.round(progress)}%</span>
                              </div>
                            </div>
                            <div className="h-3 bg-base-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* CTA */}
                        <div className="flex items-center gap-3 mt-5 pt-4 border-t border-base-300">
                          <Link to={`/projects/${project.slug}`} className="btn btn-primary btn-sm gap-1.5">
                            View Details <ArrowRight className="w-4 h-4" />
                          </Link>
                          <Link to="/donations" className="btn btn-outline btn-sm">
                            Contribute
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              )
            })}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-base-300">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Progress</th>
                  <th>Goal</th>
                  <th>Raised</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => {
                  const progress = project.goalAmount > 0 ? Math.min((project.raisedAmount / project.goalAmount) * 100, 100) : 0
                  return (
                    <tr key={project.id} className="hover">
                      <td>
                        <Link to={`/projects/${project.slug}`} className="font-medium link link-hover">
                          {project.title}
                        </Link>
                      </td>
                      <td className="min-w-[120px]">
                        <div className="flex items-center gap-2">
                          <div className="h-2 flex-1 bg-base-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-secondary">{Math.round(progress)}%</span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap">{project.goalAmount > 0 ? formatCurrency(project.goalAmount) : '--'}</td>
                      <td className="whitespace-nowrap">{formatCurrency(project.raisedAmount)}</td>
                      <td><StatusBadge status={project.status} /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )
      )}
    </PageTransition>
  )
}
