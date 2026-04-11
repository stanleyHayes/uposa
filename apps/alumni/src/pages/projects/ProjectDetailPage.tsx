import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router'
import {
  ArrowLeft, Heart, Calendar, MapPin, CheckCircle2, Circle,
  ChevronLeft, ChevronRight, X, Image as ImageIcon,
} from 'lucide-react'
import PageTransition from '../../components/common/PageTransition'
import ScrollReveal from '../../components/common/ScrollReveal'
import StatusBadge from '../../components/ui/StatusBadge'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import MarkdownContent from '../../components/common/MarkdownContent'
import { Card, CardBody } from '../../components/ui/Card'
import { projectsApi } from '../../api/services'
import { formatCurrency, formatDate } from '../../utils/formatters'
import type { Project } from '../../types'

export default function ProjectDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)

  useEffect(() => {
    if (!slug) return
    projectsApi.getBySlug(slug)
      .then((res) => setProject(res.data.data || null))
      .catch(() => setProject(null))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) return <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>

  if (!project) {
    return (
      <div className="text-center py-16">
        <p className="text-base-content/60">Project not found</p>
        <Link to="/projects" className="btn btn-primary mt-4">Back to Projects</Link>
      </div>
    )
  }

  const progress = project.goalAmount > 0 ? Math.min((project.raisedAmount / project.goalAmount) * 100, 100) : 0
  const allImages = [project.imageUrl, ...(project.gallery || [])].filter(Boolean) as string[]

  return (
    <PageTransition>
      <Link to="/projects" className="btn btn-ghost btn-sm mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Projects
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cover image */}
          {project.imageUrl && (
            <ScrollReveal>
              <div className="overflow-hidden rounded-2xl cursor-pointer" onClick={() => setLightboxIdx(0)}>
                <img
                  src={project.imageUrl}
                  alt={project.title}
                  className="w-full h-64 md:h-80 object-cover hover:scale-[1.02] transition-transform duration-500"
                />
              </div>
            </ScrollReveal>
          )}

          {/* Title & status */}
          <ScrollReveal>
            <div className="flex items-center gap-2 mb-3">
              <StatusBadge status={project.status} />
              {project.isFeatured && <span className="badge badge-secondary badge-sm">Featured</span>}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">{project.title}</h1>
            <p className="text-base-content/60">{project.description}</p>
          </ScrollReveal>

          {/* Markdown content */}
          {project.content && (
            <ScrollReveal delay={0.1}>
              <Card hover={false}>
                <CardBody>
                  <MarkdownContent content={project.content} />
                </CardBody>
              </Card>
            </ScrollReveal>
          )}

          {/* Milestones */}
          {project.milestones && project.milestones.length > 0 && (
            <ScrollReveal delay={0.15}>
              <Card hover={false}>
                <CardBody>
                  <h2 className="font-bold text-lg mb-4">Milestones</h2>
                  <div className="relative">
                    <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-base-300" />
                    <div className="space-y-4">
                      {project.milestones.map((milestone, i) => (
                        <div key={i} className="flex gap-3 relative">
                          <div className="shrink-0 mt-0.5 z-10">
                            {milestone.completed ? (
                              <CheckCircle2 className="w-6 h-6 text-success" />
                            ) : (
                              <Circle className="w-6 h-6 text-base-300" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-semibold text-sm ${milestone.completed ? 'text-base-content' : 'text-base-content/60'}`}>
                              {milestone.title}
                            </p>
                            {milestone.description && (
                              <p className="text-xs text-base-content/50 mt-0.5">{milestone.description}</p>
                            )}
                            {milestone.date && (
                              <p className="text-xs text-base-content/40 mt-1 flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> {formatDate(milestone.date)}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardBody>
              </Card>
            </ScrollReveal>
          )}

          {/* Gallery */}
          {allImages.length > 1 && (
            <ScrollReveal delay={0.2}>
              <Card hover={false}>
                <CardBody>
                  <div className="flex items-center gap-2 mb-4">
                    <ImageIcon className="w-5 h-5 text-primary" />
                    <h2 className="font-bold text-lg">Gallery</h2>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {allImages.map((url, idx) => (
                      <div
                        key={idx}
                        className="overflow-hidden rounded-xl cursor-pointer group"
                        onClick={() => setLightboxIdx(idx)}
                      >
                        <img
                          src={url}
                          alt={`${project.title} - ${idx + 1}`}
                          className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            </ScrollReveal>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Funding */}
          <ScrollReveal>
            <Card hover={false}>
              <CardBody>
                <h3 className="font-semibold mb-3">Funding Progress</h3>
                {project.goalAmount > 0 ? (
                  <>
                    <div className="text-center mb-3">
                      <p className="text-3xl font-bold text-primary">{formatCurrency(project.raisedAmount)}</p>
                      <p className="text-sm text-base-content/60">raised of {formatCurrency(project.goalAmount)}</p>
                    </div>
                    <div className="h-2.5 bg-base-200 rounded-full overflow-hidden mb-2">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-center text-sm text-base-content/60">{progress.toFixed(0)}% funded</p>
                  </>
                ) : (
                  <p className="text-center text-base-content/60">No funding goal set</p>
                )}
                <Link to="/donations" className="btn btn-primary w-full mt-4">
                  <Heart className="w-4 h-4" /> Donate to Project
                </Link>
              </CardBody>
            </Card>
          </ScrollReveal>

          {/* Dates */}
          {(project.startDate || project.endDate) && (
            <ScrollReveal delay={0.1}>
              <Card hover={false}>
                <CardBody className="text-sm space-y-2">
                  {project.startDate && (
                    <div className="flex justify-between">
                      <span className="text-base-content/60 flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Start Date</span>
                      <span className="font-medium">{formatDate(project.startDate)}</span>
                    </div>
                  )}
                  {project.endDate && (
                    <div className="flex justify-between">
                      <span className="text-base-content/60 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> End Date</span>
                      <span className="font-medium">{formatDate(project.endDate)}</span>
                    </div>
                  )}
                </CardBody>
              </Card>
            </ScrollReveal>
          )}

          {/* Milestone progress */}
          {project.milestones && project.milestones.length > 0 && (
            <ScrollReveal delay={0.15}>
              <Card hover={false}>
                <CardBody>
                  <h3 className="font-semibold text-sm mb-2">Milestone Progress</h3>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-base-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-success rounded-full transition-all duration-500"
                        style={{ width: `${(project.milestones.filter(m => m.completed).length / project.milestones.length) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-base-content/60 shrink-0">
                      {project.milestones.filter(m => m.completed).length}/{project.milestones.length}
                    </span>
                  </div>
                </CardBody>
              </Card>
            </ScrollReveal>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIdx !== null && allImages.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxIdx(null)}
        >
          <button
            className="absolute top-4 right-4 btn btn-ghost btn-sm btn-circle text-white"
            onClick={() => setLightboxIdx(null)}
          >
            <X className="w-5 h-5" />
          </button>
          {allImages.length > 1 && (
            <>
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 btn btn-ghost btn-sm btn-circle text-white"
                onClick={(e) => { e.stopPropagation(); setLightboxIdx((lightboxIdx - 1 + allImages.length) % allImages.length) }}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 btn btn-ghost btn-sm btn-circle text-white"
                onClick={(e) => { e.stopPropagation(); setLightboxIdx((lightboxIdx + 1) % allImages.length) }}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
          <img
            src={allImages[lightboxIdx]}
            alt={`${project.title} - ${lightboxIdx + 1}`}
            className="max-w-full max-h-[85vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          <p className="absolute bottom-4 text-white/60 text-sm">
            {lightboxIdx + 1} / {allImages.length}
          </p>
        </div>
      )}
    </PageTransition>
  )
}
