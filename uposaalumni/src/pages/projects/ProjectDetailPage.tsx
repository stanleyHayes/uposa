import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router'
import { ArrowLeft, Heart } from 'lucide-react'
import PageTransition from '../../components/common/PageTransition'
import StatusBadge from '../../components/ui/StatusBadge'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { projectsApi } from '../../api/services'
import { MOCK_PROJECTS } from '../../data/mock'
import { formatCurrency, formatDate } from '../../utils/formatters'
import type { Project } from '../../types'

export default function ProjectDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) return
    projectsApi.getBySlug(slug)
      .then((res) => setProject(res.data.data || MOCK_PROJECTS.find((p) => p.slug === slug) || null))
      .catch(() => setProject(MOCK_PROJECTS.find((p) => p.slug === slug) || null))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) return <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
  if (!project) return <div className="text-center py-16"><p>Project not found</p><Link to="/projects" className="btn btn-primary mt-4">Back to Projects</Link></div>

  const progress = project.goalAmount > 0 ? Math.min((project.raisedAmount / project.goalAmount) * 100, 100) : 0

  return (
    <PageTransition>
      <Link to="/projects" className="btn btn-ghost btn-sm mb-4"><ArrowLeft className="w-4 h-4" /> Back to Projects</Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {project.imageUrl && <img src={project.imageUrl} alt={project.title} className="w-full h-64 md:h-80 object-cover rounded-xl mb-6" />}
          <div className="flex items-center gap-2 mb-3">
            <StatusBadge status={project.status} />
            {project.isFeatured && <span className="badge badge-secondary badge-sm">Featured</span>}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-4">{project.title}</h1>
          <div className="prose max-w-none whitespace-pre-wrap text-base-content/80">{project.description}</div>
        </div>

        <div className="space-y-4">
          <div className="card bg-base-100 border border-base-300">
            <div className="card-body">
              <h3 className="font-semibold mb-3">Funding Progress</h3>
              {project.goalAmount > 0 ? (
                <>
                  <div className="text-center mb-3">
                    <p className="text-3xl font-bold text-primary">{formatCurrency(project.raisedAmount)}</p>
                    <p className="text-sm text-base-content/60">raised of {formatCurrency(project.goalAmount)}</p>
                  </div>
                  <progress className="progress progress-primary mb-2" value={progress} max="100" />
                  <p className="text-center text-sm text-base-content/60">{progress.toFixed(0)}% funded</p>
                </>
              ) : (
                <p className="text-center text-base-content/60">No funding goal set</p>
              )}
              <Link to="/donations" className="btn btn-primary w-full mt-4"><Heart className="w-4 h-4" /> Donate to Project</Link>
            </div>
          </div>
          <div className="card bg-base-100 border border-base-300">
            <div className="card-body text-sm space-y-2">
              {project.startDate && <div className="flex justify-between"><span className="text-base-content/60">Start Date</span><span>{formatDate(project.startDate)}</span></div>}
              {project.endDate && <div className="flex justify-between"><span className="text-base-content/60">End Date</span><span>{formatDate(project.endDate)}</span></div>}
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
