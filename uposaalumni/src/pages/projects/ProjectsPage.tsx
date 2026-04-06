import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { FolderOpen } from 'lucide-react'
import PageTransition from '../../components/common/PageTransition'
import PageHeader from '../../components/ui/PageHeader'
import ScrollReveal from '../../components/common/ScrollReveal'
import StatusBadge from '../../components/ui/StatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { projectsApi } from '../../api/services'
import { MOCK_PROJECTS } from '../../data/mock'
import { formatCurrency } from '../../utils/formatters'
import type { Project } from '../../types'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'ongoing' | 'completed'>('all')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        let res
        if (filter === 'ongoing') res = await projectsApi.ongoing()
        else if (filter === 'completed') res = await projectsApi.completed()
        else res = await projectsApi.list()
        const data = res.data.data
        setProjects(data?.length ? data : MOCK_PROJECTS)
      } catch {
        setProjects(filter === 'ongoing'
          ? MOCK_PROJECTS.filter((p) => p.status === 'ONGOING')
          : filter === 'completed'
            ? MOCK_PROJECTS.filter((p) => p.status === 'COMPLETED')
            : MOCK_PROJECTS)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [filter])

  return (
    <PageTransition>
      <PageHeader title="Projects" description="Support ongoing initiatives and view completed projects" />

      <div className="join mb-6">
        {(['all', 'ongoing', 'completed'] as const).map((f) => (
          <button key={f} className={`join-item btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : projects.length === 0 ? (
        <EmptyState icon={FolderOpen} title="No projects found" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, i) => {
            const progress = project.goalAmount > 0 ? Math.min((project.raisedAmount / project.goalAmount) * 100, 100) : 0
            return (
              <ScrollReveal key={project.id} delay={i * 0.05}>
                <Link to={`/projects/${project.slug}`} className="card bg-base-100 border border-base-300 hover:shadow-lg transition-shadow h-full">
                  {project.imageUrl && <figure><img src={project.imageUrl} alt={project.title} className="h-48 w-full object-cover" /></figure>}
                  <div className="card-body">
                    <div className="flex items-center justify-between">
                      <StatusBadge status={project.status} />
                      {project.isFeatured && <span className="badge badge-secondary badge-sm">Featured</span>}
                    </div>
                    <h2 className="card-title text-base mt-2">{project.title}</h2>
                    <p className="text-sm text-base-content/60 line-clamp-2">{project.description}</p>
                    {project.goalAmount > 0 && (
                      <div className="mt-auto pt-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span>{formatCurrency(project.raisedAmount)}</span>
                          <span className="text-base-content/60">of {formatCurrency(project.goalAmount)}</span>
                        </div>
                        <progress className="progress progress-primary" value={progress} max="100" />
                      </div>
                    )}
                  </div>
                </Link>
              </ScrollReveal>
            )
          })}
        </div>
      )}
    </PageTransition>
  )
}
