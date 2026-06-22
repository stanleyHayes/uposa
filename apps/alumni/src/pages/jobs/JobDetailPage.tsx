import { useEffect, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router'
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Building2,
  CalendarDays,
  Clock,
  ExternalLink,
  Mail,
  MapPin,
  Sparkles,
  UserRound,
  type LucideIcon,
} from 'lucide-react'
import PageTransition from '../../components/common/PageTransition'
import Avatar from '../../components/ui/Avatar'
import { jobsApi } from '../../api/services'
import { formatDate, formatEnum, timeAgo } from '../../utils/formatters'
import type { Job } from '../../types'

function DetailSkeleton() {
  return (
    <PageTransition>
      <div className="relative space-y-6">
        <div className="h-10 w-32 animate-pulse bg-base-300/40" />
        <div className="h-72 animate-pulse bg-base-300/45 rounded-[28px_6px_28px_6px]" />
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="h-96 animate-pulse bg-base-300/35 rounded-[24px_4px_24px_4px]" />
          <div className="space-y-3">
            <div className="h-48 animate-pulse bg-base-300/35 rounded-[24px_4px_24px_4px]" />
            <div className="h-40 animate-pulse bg-base-300/35 rounded-[24px_4px_24px_4px]" />
          </div>
        </div>
      </div>
    </PageTransition>
  )
}

function MetaPill({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: ReactNode }) {
  return (
    <div className="border border-primary-content/10 bg-primary-content/[0.055] p-4 rounded-[18px_4px_18px_4px]">
      <span className="grid h-10 w-10 place-items-center bg-secondary/18 text-secondary rounded-[14px_3px_14px_3px]">
        <Icon className="h-4 w-4" />
      </span>
      <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.16em] text-primary-content/42">{label}</p>
      <p className="mt-2 truncate text-lg font-bold text-primary-content">{value}</p>
    </div>
  )
}

function DetailPanel({ icon: Icon, eyebrow, title, children }: { icon: LucideIcon; eyebrow: string; title: string; children: ReactNode }) {
  return (
    <section className="overflow-hidden border border-primary/10 bg-base-100/88 shadow-[0_14px_38px_rgba(0,27,80,0.06)] rounded-[24px_4px_24px_4px]">
      <div className="h-1 bg-gradient-to-r from-secondary via-primary to-secondary" />
      <div className="p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center bg-primary/8 text-primary rounded-[16px_3px_16px_3px]">
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-secondary">{eyebrow}</p>
            <h2 className="mt-1 text-xl font-bold leading-tight">{title}</h2>
          </div>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </section>
  )
}

function NotFoundState() {
  return (
    <PageTransition>
      <div className="flex min-h-96 flex-col items-center justify-center border border-primary/10 bg-base-100/86 px-6 py-12 text-center shadow-[0_12px_34px_rgba(0,27,80,0.06)] rounded-[24px_4px_24px_4px]">
        <span className="grid h-16 w-16 place-items-center bg-primary/8 text-primary rounded-[18px_4px_18px_4px]">
          <Briefcase className="h-7 w-7" />
        </span>
        <h1 className="mt-5 text-2xl font-bold">Job not found</h1>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-base-content/55">
          This opportunity may have expired or may no longer be published.
        </p>
        <Link to="/jobs" className="btn btn-primary mt-6 min-h-11">
          <ArrowLeft className="h-4 w-4" />
          Back to jobs
        </Link>
      </div>
    </PageTransition>
  )
}

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    jobsApi.getById(id)
      .then((res) => setJob(res.data.data || null))
      .catch(() => setJob(null))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <DetailSkeleton />
  if (!job) return <NotFoundState />

  return (
    <PageTransition>
      <div className="relative space-y-6">
        <img
          src="/logo.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none fixed right-[-8rem] top-24 z-0 hidden h-[26rem] w-[26rem] object-contain opacity-[0.025] xl:block"
        />

        <Link to="/jobs" className="btn min-h-10 border-primary/10 bg-base-100 text-primary hover:bg-base-200 rounded-[14px_3px_14px_3px]">
          <ArrowLeft className="h-4 w-4" />
          Back to jobs
        </Link>

        <section className="relative z-10 overflow-hidden bg-primary text-primary-content shadow-[0_24px_80px_rgba(0,27,80,0.18)] rounded-[28px_6px_28px_6px]">
          <img src="/logo.png" alt="" aria-hidden="true" className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 object-contain opacity-[0.055]" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-secondary/80 to-transparent" />
          <div className="relative grid gap-8 p-5 sm:p-7 lg:grid-cols-[minmax(0,1.08fr)_minmax(340px,0.92fr)] lg:p-8">
            <div className="min-w-0">
              <div className="mb-4 inline-flex items-center gap-2 border border-primary-content/15 bg-primary-content/10 px-3 py-2 text-xs font-semibold text-primary-content/70 rounded-[14px_3px_14px_3px]">
                <Sparkles className="h-4 w-4 text-secondary" />
                Opportunity detail
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-secondary">{job.company}</p>
              <h1 className="mt-3 max-w-3xl text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">{job.title}</h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-primary-content/62 sm:text-base">
                Review the role details and choose the available application route.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <MetaPill icon={Briefcase} label="Role type" value={formatEnum(job.jobType)} />
              <MetaPill icon={Clock} label="Posted" value={timeAgo(job.createdAt)} />
              <MetaPill icon={MapPin} label="Location" value={job.location || 'Not listed'} />
              <MetaPill icon={CalendarDays} label="Expires" value={job.expiresAt ? formatDate(job.expiresAt) : 'Open'} />
            </div>
          </div>
        </section>

        <div className="relative z-10 grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-4">
            <DetailPanel icon={Building2} eyebrow="Role brief" title="Job description">
              <div className="prose max-w-none whitespace-pre-wrap text-base-content/70">
                {job.description}
              </div>
            </DetailPanel>

            <DetailPanel icon={MapPin} eyebrow="Work context" title="What is listed">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="border border-primary/8 bg-base-200/35 p-4 rounded-[18px_4px_18px_4px]">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-secondary">Company</p>
                  <p className="mt-2 font-bold">{job.company}</p>
                </div>
                <div className="border border-primary/8 bg-base-200/35 p-4 rounded-[18px_4px_18px_4px]">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-secondary">Location</p>
                  <p className="mt-2 font-bold">{job.location || 'Not listed'}</p>
                </div>
              </div>
            </DetailPanel>
          </div>

          <aside className="space-y-4">
            <section className="overflow-hidden border border-primary/10 bg-base-100/88 shadow-[0_14px_38px_rgba(0,27,80,0.06)] rounded-[24px_4px_24px_4px]">
              <div className="h-1 bg-secondary" />
              <div className="p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-secondary">Apply</p>
                <h2 className="mt-2 text-xl font-bold">Application route</h2>
                <div className="mt-5 grid gap-2">
                  {job.contactEmail && (
                    <a href={`mailto:${job.contactEmail}`} className="btn btn-primary min-h-12 w-full justify-between">
                      <span className="inline-flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email application
                      </span>
                      <ArrowRight className="h-4 w-4" />
                    </a>
                  )}
                  {job.externalUrl && (
                    <a href={job.externalUrl} target="_blank" rel="noopener noreferrer" className="btn min-h-12 w-full justify-between border-primary/10 bg-base-200 text-primary hover:bg-base-300">
                      <span className="inline-flex items-center gap-2">
                        <ExternalLink className="h-4 w-4" />
                        Apply externally
                      </span>
                      <ArrowRight className="h-4 w-4" />
                    </a>
                  )}
                  {!job.contactEmail && !job.externalUrl && (
                    <div className="rounded-[18px_4px_18px_4px] bg-base-200/55 p-4 text-sm leading-relaxed text-base-content/55">
                      Contact the poster for application details.
                    </div>
                  )}
                </div>
              </div>
            </section>

            {job.postedBy && (
              <section className="overflow-hidden border border-primary/10 bg-base-100/88 shadow-[0_14px_38px_rgba(0,27,80,0.06)] rounded-[24px_4px_24px_4px]">
                <div className="p-5">
                  <div className="flex items-start gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center bg-primary/8 text-primary rounded-[15px_3px_15px_3px]">
                      <UserRound className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-secondary">Posted by</p>
                      <h2 className="mt-1 text-lg font-bold">Alumni contact</h2>
                    </div>
                  </div>
                  <div className="mt-5 flex items-center gap-3 border border-primary/8 bg-base-200/35 p-3 rounded-[18px_4px_18px_4px]">
                    <Avatar src={job.postedBy.photoUrl} name={job.postedBy.fullName} size="md" />
                    <div className="min-w-0">
                      <p className="truncate font-bold">{job.postedBy.fullName}</p>
                      <Link to={`/members/${job.postedBy.id}`} className="text-xs font-bold text-primary">View profile</Link>
                    </div>
                  </div>
                </div>
              </section>
            )}

            <section className="border border-primary/10 bg-primary p-5 text-primary-content shadow-[0_14px_38px_rgba(0,27,80,0.09)] rounded-[24px_4px_24px_4px]">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-secondary">Network note</p>
              <p className="mt-3 text-sm leading-relaxed text-primary-content/62">
                When applying through an alumni lead, mention the role title and keep your first message direct.
              </p>
            </section>
          </aside>
        </div>
      </div>
    </PageTransition>
  )
}
