import { useEffect, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router'
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  CircleDollarSign,
  Flag,
  FolderOpen,
  Heart,
  Image as ImageIcon,
  Target,
  Trophy,
  X,
  type LucideIcon,
} from 'lucide-react'
import PageTransition from '../../components/common/PageTransition'
import ScrollReveal from '../../components/common/ScrollReveal'
import StatusBadge from '../../components/ui/StatusBadge'
import MarkdownContent from '../../components/common/MarkdownContent'
import { projectsApi } from '../../api/services'
import { formatCurrency, formatDate } from '../../utils/formatters'
import type { Project } from '../../types'

function getProgress(project: Project) {
  return project.goalAmount > 0 ? Math.min((project.raisedAmount / project.goalAmount) * 100, 100) : 0
}

function DetailSkeleton() {
  return (
    <PageTransition>
      <div className="space-y-5">
        <div className="h-11 w-36 animate-pulse bg-base-300/45 rounded-[14px_3px_14px_3px]" />
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="overflow-hidden border border-primary/8 bg-base-100 rounded-[28px_6px_28px_6px]">
            <div className="h-80 animate-pulse bg-base-300/45" />
            <div className="space-y-4 p-6">
              <div className="h-4 w-28 animate-pulse bg-base-300/45" />
              <div className="h-9 w-4/5 animate-pulse bg-base-300/55" />
              <div className="h-4 w-full animate-pulse bg-base-300/35" />
              <div className="h-4 w-5/6 animate-pulse bg-base-300/35" />
            </div>
          </div>
          <div className="h-72 animate-pulse bg-base-300/35 rounded-[24px_4px_24px_4px]" />
        </div>
      </div>
    </PageTransition>
  )
}

function DetailMeta({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 border border-primary/8 bg-base-200/45 p-4 rounded-[18px_4px_18px_4px]">
      <span className="grid h-10 w-10 shrink-0 place-items-center bg-primary/8 text-primary rounded-[14px_3px_14px_3px]">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-base-content/42">{label}</span>
        <span className="mt-1 block text-sm font-bold leading-snug text-base-content">{children}</span>
      </span>
    </div>
  )
}

function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="h-3 overflow-hidden bg-base-300/55">
      <div className="h-full bg-gradient-to-r from-primary via-accent to-secondary transition-all duration-500" style={{ width: `${progress}%` }} />
    </div>
  )
}

export default function ProjectDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)

  useEffect(() => {
    if (!slug) {
      setLoading(false)
      return
    }
    setLoading(true)
    projectsApi.getBySlug(slug)
      .then((res) => setProject(res.data.data || null))
      .catch(() => setProject(null))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) return <DetailSkeleton />

  if (!project) {
    return (
      <PageTransition>
        <div className="flex min-h-[60vh] flex-col items-center justify-center border border-primary/10 bg-base-100/88 px-6 py-14 text-center shadow-[0_16px_44px_rgba(0,27,80,0.07)] rounded-[28px_6px_28px_6px]">
          <span className="grid h-16 w-16 place-items-center bg-primary/8 text-primary rounded-[18px_4px_18px_4px]">
            <FolderOpen className="h-7 w-7" />
          </span>
          <h1 className="mt-5 text-2xl font-bold">Project not found</h1>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-base-content/55">This project may have moved, closed, or is not available in the alumni portal.</p>
          <Link to="/projects" className="btn btn-primary mt-6">
            <ArrowLeft className="h-4 w-4" />
            Back to projects
          </Link>
        </div>
      </PageTransition>
    )
  }

  const progress = getProgress(project)
  const allImages = [project.imageUrl, ...(project.gallery || [])].filter(Boolean) as string[]
  const completedMilestones = project.milestones?.filter((milestone) => milestone.completed).length || 0
  const milestoneTotal = project.milestones?.length || 0
  const milestoneProgress = milestoneTotal > 0 ? (completedMilestones / milestoneTotal) * 100 : 0

  return (
    <PageTransition>
      <div className="relative space-y-5">
        <img
          src="/logo.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none fixed right-[-8rem] top-24 z-0 hidden h-[26rem] w-[26rem] object-contain opacity-[0.025] xl:block"
        />

        <Link
          to="/projects"
          className="relative z-10 inline-flex items-center gap-2 border border-primary/10 bg-base-100/82 px-3 py-2 text-sm font-bold text-base-content/68 transition-colors hover:border-primary/20 hover:text-primary rounded-[14px_3px_14px_3px]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to projects
        </Link>

        <div className="relative z-10 grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <article className="space-y-6">
            <section className="overflow-hidden border border-primary/10 bg-base-100/94 shadow-[0_20px_58px_rgba(0,27,80,0.08)] rounded-[28px_6px_28px_6px]">
              <header className="relative overflow-hidden bg-primary text-primary-content">
                {project.imageUrl ? (
                  <button type="button" className="absolute inset-0 text-left" onClick={() => setLightboxIdx(0)} aria-label="Open project image">
                    <img src={project.imageUrl} alt={project.title} className="h-full w-full object-cover opacity-35" />
                  </button>
                ) : (
                  <img src="/logo.png" alt="" aria-hidden="true" className="absolute -right-16 -top-20 h-80 w-80 object-contain opacity-[0.055]" />
                )}
                <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/62" />
                <div className="relative min-h-[24rem] p-5 sm:p-7 lg:p-8">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 bg-secondary px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-primary">
                      <Target className="h-3.5 w-3.5" />
                      School project
                    </span>
                    <StatusBadge status={project.status} className="border-primary-content/15 bg-primary-content/12 text-primary-content" />
                    {project.isFeatured && (
                      <span className="border border-primary-content/15 bg-primary-content/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-primary-content/72">Featured</span>
                    )}
                  </div>
                  <div className="flex min-h-[17rem] flex-col justify-end">
                    <p className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-secondary">{Math.round(progress)}% funded</p>
                    <h1 className="max-w-4xl text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">{project.title}</h1>
                    <p className="mt-4 max-w-3xl text-sm leading-relaxed text-primary-content/66 sm:text-base">{project.description}</p>
                  </div>
                </div>
              </header>

              <div className="p-5 sm:p-7 lg:p-8">
                {project.content ? (
                  <MarkdownContent
                    content={project.content}
                    className="prose-lg prose-headings:font-bold prose-headings:text-primary prose-p:leading-relaxed prose-li:leading-relaxed"
                  />
                ) : (
                  <p className="text-base leading-relaxed text-base-content/62">{project.description}</p>
                )}
              </div>
            </section>

            {project.milestones && project.milestones.length > 0 && (
              <ScrollReveal>
                <section className="overflow-hidden border border-primary/10 bg-base-100/92 shadow-[0_16px_44px_rgba(0,27,80,0.07)] rounded-[24px_4px_24px_4px]">
                  <div className="h-1 bg-gradient-to-r from-secondary via-primary to-secondary" />
                  <div className="p-5 sm:p-6">
                    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-secondary">Milestones</p>
                        <h2 className="mt-1 text-2xl font-bold">Project timeline</h2>
                      </div>
                      <p className="text-sm font-semibold text-base-content/48">{completedMilestones}/{milestoneTotal} complete</p>
                    </div>

                    <div className="relative">
                      <div className="absolute bottom-2 left-5 top-2 w-px bg-primary/12" />
                      <div className="space-y-4">
                        {project.milestones.map((milestone, index) => (
                          <div key={`${milestone.title}-${index}`} className="relative flex gap-4">
                            <span className={`z-10 grid h-10 w-10 shrink-0 place-items-center rounded-[14px_3px_14px_3px] ${milestone.completed ? 'bg-success/12 text-success' : 'bg-base-300/55 text-base-content/36'}`}>
                              {milestone.completed ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                            </span>
                            <div className="min-w-0 flex-1 border border-primary/8 bg-base-200/35 p-4 rounded-[18px_4px_18px_4px]">
                              <p className="font-bold leading-tight text-base-content">{milestone.title}</p>
                              {milestone.description && <p className="mt-2 text-sm leading-relaxed text-base-content/55">{milestone.description}</p>}
                              {milestone.date && (
                                <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-base-content/42">
                                  <CalendarDays className="h-3.5 w-3.5" />
                                  {formatDate(milestone.date)}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              </ScrollReveal>
            )}

            {allImages.length > 1 && (
              <ScrollReveal>
                <section className="overflow-hidden border border-primary/10 bg-base-100/92 shadow-[0_16px_44px_rgba(0,27,80,0.07)] rounded-[24px_4px_24px_4px]">
                  <div className="p-5 sm:p-6">
                    <div className="mb-5 flex items-center gap-3">
                      <span className="grid h-11 w-11 place-items-center bg-primary/8 text-primary rounded-[14px_3px_14px_3px]">
                        <ImageIcon className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-secondary">Gallery</p>
                        <h2 className="mt-1 text-xl font-bold">Project images</h2>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {allImages.map((url, index) => (
                        <button
                          key={`${url}-${index}`}
                          type="button"
                          className="group overflow-hidden bg-base-200 text-left rounded-[18px_3px_18px_3px]"
                          onClick={() => setLightboxIdx(index)}
                        >
                          <img
                            src={url}
                            alt={`${project.title} - ${index + 1}`}
                            className="h-32 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </section>
              </ScrollReveal>
            )}
          </article>

          <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
            <div className="overflow-hidden border border-primary/10 bg-base-100/90 shadow-[0_16px_44px_rgba(0,27,80,0.07)] rounded-[24px_4px_24px_4px]">
              <div className="h-1 bg-gradient-to-r from-secondary via-primary to-secondary" />
              <div className="p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-secondary">Funding progress</p>
                <div className="mt-5 text-center">
                  <p className="text-4xl font-bold text-primary">{formatCurrency(project.raisedAmount)}</p>
                  <p className="mt-2 text-sm font-semibold text-base-content/52">
                    {project.goalAmount > 0 ? `raised of ${formatCurrency(project.goalAmount)}` : 'raised so far'}
                  </p>
                </div>
                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between text-xs font-bold text-base-content/48">
                    <span>Progress</span>
                    <span className="text-secondary">{Math.round(progress)}%</span>
                  </div>
                  <ProgressBar progress={progress} />
                </div>
                <Link to="/donations" className="btn btn-primary mt-5 min-h-12 w-full justify-between px-5">
                  <span className="inline-flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    Donate to project
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="grid gap-3">
              <DetailMeta icon={CircleDollarSign} label="Goal">
                {project.goalAmount > 0 ? formatCurrency(project.goalAmount) : 'Open goal'}
              </DetailMeta>
              <DetailMeta icon={Flag} label="Status">
                {project.status}
              </DetailMeta>
              {project.startDate && (
                <DetailMeta icon={CalendarDays} label="Started">
                  {formatDate(project.startDate)}
                </DetailMeta>
              )}
              {project.endDate && (
                <DetailMeta icon={Trophy} label="Target date">
                  {formatDate(project.endDate)}
                </DetailMeta>
              )}
            </div>

            {milestoneTotal > 0 && (
              <div className="border border-primary/10 bg-base-100/90 p-5 shadow-[0_16px_44px_rgba(0,27,80,0.06)] rounded-[24px_4px_24px_4px]">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-secondary">Milestone progress</p>
                <div className="mt-4 flex items-end justify-between gap-4">
                  <p className="text-3xl font-bold text-primary">{completedMilestones}/{milestoneTotal}</p>
                  <p className="text-sm font-bold text-secondary">{Math.round(milestoneProgress)}%</p>
                </div>
                <div className="mt-4 h-2 overflow-hidden bg-base-300/55">
                  <div className="h-full bg-success transition-all duration-500" style={{ width: `${milestoneProgress}%` }} />
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>

      {lightboxIdx !== null && allImages.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightboxIdx(null)}
        >
          <button
            type="button"
            className="btn btn-ghost btn-sm btn-circle absolute right-4 top-4 text-white"
            onClick={() => setLightboxIdx(null)}
            aria-label="Close image preview"
          >
            <X className="h-5 w-5" />
          </button>
          {allImages.length > 1 && (
            <>
              <button
                type="button"
                className="btn btn-ghost btn-sm btn-circle absolute left-4 top-1/2 -translate-y-1/2 text-white"
                onClick={(event) => { event.stopPropagation(); setLightboxIdx((lightboxIdx - 1 + allImages.length) % allImages.length) }}
                aria-label="Previous image"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm btn-circle absolute right-4 top-1/2 -translate-y-1/2 text-white"
                onClick={(event) => { event.stopPropagation(); setLightboxIdx((lightboxIdx + 1) % allImages.length) }}
                aria-label="Next image"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
          <img
            src={allImages[lightboxIdx]}
            alt={`${project.title} - ${lightboxIdx + 1}`}
            className="max-h-[85vh] max-w-full object-contain rounded-[20px_4px_20px_4px]"
            onClick={(event) => event.stopPropagation()}
          />
          <p className="absolute bottom-4 text-sm text-white/60">
            {lightboxIdx + 1} / {allImages.length}
          </p>
        </div>
      )}
    </PageTransition>
  )
}
