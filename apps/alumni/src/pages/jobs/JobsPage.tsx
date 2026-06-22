import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import {
  ArrowRight,
  Briefcase,
  Building2,
  CalendarDays,
  Clock,
  ExternalLink,
  Filter,
  MapPin,
  Plus,
  Search,
  Sparkles,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import PageTransition from '../../components/common/PageTransition'
import Modal from '../../components/ui/Modal'
import { jobsApi } from '../../api/services'
import { useToast } from '../../hooks/useToast'
import { formatDate, formatEnum, timeAgo, truncate } from '../../utils/formatters'
import type { Job, JobType } from '../../types'

type JobFilter = 'ALL' | JobType

const jobTypeOptions: Array<{ value: JobType; label: string }> = [
  { value: 'FULL_TIME', label: 'Full Time' },
  { value: 'PART_TIME', label: 'Part Time' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'VOLUNTEER', label: 'Volunteer' },
  { value: 'INTERNSHIP', label: 'Internship' },
]

const jobSchema = z.object({
  title: z.string().min(2, 'Title is required'),
  company: z.string().min(2, 'Company is required'),
  location: z.string().optional(),
  jobType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'VOLUNTEER', 'INTERNSHIP']),
  description: z.string().min(10, 'Description is required'),
  contactEmail: z.string().email().optional().or(z.literal('')),
  externalUrl: z.string().url().optional().or(z.literal('')),
})

type JobFormData = z.infer<typeof jobSchema>

const typeTone: Record<JobType, string> = {
  FULL_TIME: 'bg-primary/8 text-primary',
  PART_TIME: 'bg-secondary/15 text-primary',
  CONTRACT: 'bg-accent/10 text-accent',
  VOLUNTEER: 'bg-success/12 text-success',
  INTERNSHIP: 'bg-warning/14 text-warning',
}

function StatTile({
  icon: Icon,
  label,
  value,
  detail,
  tone = 'bg-primary-content/[0.06] text-secondary',
}: {
  icon: LucideIcon
  label: string
  value: ReactNode
  detail: string
  tone?: string
}) {
  return (
    <div className="flex h-full flex-col border border-primary-content/10 bg-primary-content/[0.055] p-4 rounded-[18px_4px_18px_4px]">
      <span className={`grid h-10 w-10 place-items-center rounded-[14px_3px_14px_3px] ${tone}`}>
        <Icon className="h-4 w-4" />
      </span>
      <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.16em] text-primary-content/42">{label}</p>
      <p className="mt-2 truncate text-2xl font-bold text-secondary">{value}</p>
      <p className="mt-auto pt-2 text-xs font-semibold text-primary-content/45">{detail}</p>
    </div>
  )
}

function MetaItem({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5 text-xs font-semibold text-base-content/48">
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{children}</span>
    </span>
  )
}

function JobCard({ job }: { job: Job }) {
  const typeClass = typeTone[job.jobType] || 'bg-base-300/50 text-base-content/60'

  return (
    <Link
      to={`/jobs/${job.id}`}
      className="group flex h-full flex-col overflow-hidden border border-primary/10 bg-base-100/90 shadow-[0_14px_38px_rgba(0,27,80,0.06)] transition-all hover:-translate-y-0.5 hover:border-primary/18 hover:shadow-[0_22px_55px_rgba(0,27,80,0.11)] rounded-[24px_4px_24px_4px]"
    >
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center bg-primary/8 text-primary rounded-[16px_3px_16px_3px]">
            <Building2 className="h-5 w-5" />
          </span>
          <span className={`shrink-0 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ${typeClass}`}>
            {formatEnum(job.jobType)}
          </span>
        </div>

        <div className="mt-6 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-secondary">{job.company}</p>
          <h2 className="mt-2 line-clamp-2 text-xl font-bold leading-tight text-base-content">{job.title}</h2>
          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-base-content/58">
            {truncate(job.description, 150)}
          </p>
        </div>

        <div className="mt-5 grid gap-2 border-y border-primary/8 py-4">
          {job.location && <MetaItem icon={MapPin}>{job.location}</MetaItem>}
          <MetaItem icon={Clock}>Posted {timeAgo(job.createdAt)}</MetaItem>
          <MetaItem icon={CalendarDays}>{job.expiresAt ? `Expires ${formatDate(job.expiresAt)}` : 'No expiry date listed'}</MetaItem>
        </div>

        <div className="mt-auto flex items-center justify-between gap-4 pt-5">
          <span className="text-sm font-bold text-base-content/42">
            {job.contactEmail || job.externalUrl ? 'Application route available' : 'Details inside'}
          </span>
          <span className="grid h-10 w-10 shrink-0 place-items-center bg-primary/8 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-content rounded-[14px_3px_14px_3px]">
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  )
}

function JobsSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="h-32 animate-pulse bg-base-300/40 rounded-[18px_4px_18px_4px]" />
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((item) => (
          <div key={item} className="border border-primary/8 bg-base-100/84 p-5 rounded-[24px_4px_24px_4px]">
            <div className="flex items-start justify-between gap-4">
              <div className="h-12 w-12 animate-pulse bg-base-300/45 rounded-[16px_3px_16px_3px]" />
              <div className="h-7 w-24 animate-pulse bg-base-300/35" />
            </div>
            <div className="mt-6 h-3 w-28 animate-pulse bg-base-300/45" />
            <div className="mt-3 h-6 w-4/5 animate-pulse bg-base-300/55" />
            <div className="mt-4 space-y-2">
              <div className="h-3 w-full animate-pulse bg-base-300/35" />
              <div className="h-3 w-3/4 animate-pulse bg-base-300/35" />
            </div>
            <div className="mt-6 h-11 w-full animate-pulse bg-base-300/40" />
          </div>
        ))}
      </div>
    </div>
  )
}

function EmptyJobs({ search, filter, onPost }: { search: string; filter: JobFilter; onPost: () => void }) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center border border-primary/10 bg-base-100/86 px-6 py-12 text-center shadow-[0_12px_34px_rgba(0,27,80,0.06)] rounded-[24px_4px_24px_4px]">
      <span className="grid h-16 w-16 place-items-center bg-primary/8 text-primary rounded-[18px_4px_18px_4px]">
        <Briefcase className="h-7 w-7" />
      </span>
      <h2 className="mt-5 text-xl font-bold">No jobs found</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-base-content/55">
        {search || filter !== 'ALL'
          ? 'Try clearing the search or switching the job type filter.'
          : 'Be the first to share an opportunity with the alumni network.'}
      </p>
      <button type="button" className="btn btn-primary mt-6 min-h-11" onClick={onPost}>
        <Plus className="h-4 w-4" />
        Post a job
      </button>
    </div>
  )
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<JobFilter>('ALL')
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const toast = useToast()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
    defaultValues: { jobType: 'FULL_TIME' },
  })

  useEffect(() => {
    jobsApi.list()
      .then((res) => setJobs(res.data.data || []))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false))
  }, [])

  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase()
    return jobs.filter((job) => {
      const matchSearch = !query
        || job.title.toLowerCase().includes(query)
        || job.company.toLowerCase().includes(query)
        || job.description.toLowerCase().includes(query)
        || job.location?.toLowerCase().includes(query)
      const matchType = typeFilter === 'ALL' || job.jobType === typeFilter
      return matchSearch && matchType
    })
  }, [jobs, search, typeFilter])

  const latestJob = jobs[0]
  const companies = new Set(jobs.map((job) => job.company)).size
  const remoteJobs = jobs.filter((job) => job.location?.toLowerCase().includes('remote')).length
  const typeCounts = useMemo(() => {
    return jobTypeOptions.reduce<Record<string, number>>((acc, option) => {
      acc[option.value] = jobs.filter((job) => job.jobType === option.value).length
      return acc
    }, {})
  }, [jobs])

  const onSubmit = async (data: JobFormData) => {
    setSubmitting(true)
    try {
      await jobsApi.create(data)
      toast.success('Job posted! It will be visible after admin approval.')
      setModalOpen(false)
      reset()
    } catch {
      toast.error('Failed to post job')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageTransition>
      <div className="relative space-y-6">
        <img
          src="/logo.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none fixed right-[-8rem] top-24 z-0 hidden h-[26rem] w-[26rem] object-contain opacity-[0.025] xl:block"
        />

        <section className="relative z-10 overflow-hidden bg-primary text-primary-content shadow-[0_24px_80px_rgba(0,27,80,0.18)] rounded-[28px_6px_28px_6px]">
          <img src="/logo.png" alt="" aria-hidden="true" className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 object-contain opacity-[0.055]" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-secondary/80 to-transparent" />
          <div className="relative grid gap-8 p-5 sm:p-7 lg:grid-cols-[minmax(0,1.08fr)_minmax(340px,0.92fr)] lg:p-8">
            <div className="min-w-0">
              <div className="mb-4 inline-flex items-center gap-2 border border-primary-content/15 bg-primary-content/10 px-3 py-2 text-xs font-semibold text-primary-content/70 rounded-[14px_3px_14px_3px]">
                <Sparkles className="h-4 w-4 text-secondary" />
                Alumni jobs board
              </div>
              <h1 className="max-w-3xl text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
                Find the next role through the old student network.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-primary-content/62 sm:text-base">
                Browse openings, filter by work type, and share opportunities that can help fellow alumni move forward.
              </p>
              <button type="button" className="btn btn-secondary mt-6 min-h-12 px-5 text-primary" onClick={() => setModalOpen(true)}>
                <Plus className="h-4 w-4" />
                Post a job
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <StatTile icon={Briefcase} label="Open roles" value={jobs.length} detail={`${filteredJobs.length} in current view`} />
              <StatTile icon={Building2} label="Companies" value={companies} detail="Posting employers" tone="bg-secondary/18 text-primary" />
              <StatTile icon={MapPin} label="Remote roles" value={remoteJobs} detail="Location-flexible posts" tone="bg-accent/12 text-secondary" />
              <StatTile icon={Clock} label="Latest post" value={latestJob ? timeAgo(latestJob.createdAt) : 'N/A'} detail={latestJob?.company || 'No posts yet'} />
            </div>
          </div>
        </section>

        <section className="relative z-10 border border-primary/10 bg-base-100/88 p-4 shadow-[0_12px_34px_rgba(0,27,80,0.05)] rounded-[24px_4px_24px_4px]">
          <div className="grid gap-3 lg:grid-cols-[minmax(260px,0.9fr)_minmax(0,1.4fr)_auto] lg:items-center">
            <label className="relative block">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-base-content/38" />
              <input
                type="text"
                className="input input-bordered h-12 w-full border-primary/10 bg-base-100 pl-11 text-sm focus:border-primary"
                placeholder="Search title, company, location..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>

            <div className="flex min-w-0 items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
              <button
                type="button"
                className={`btn btn-sm min-h-10 shrink-0 gap-2 ${typeFilter === 'ALL' ? 'btn-primary' : 'border-primary/10 bg-base-200 text-primary hover:bg-base-300'}`}
                onClick={() => setTypeFilter('ALL')}
              >
                <Filter className="h-4 w-4" />
                All
                <span className="text-xs opacity-60">{jobs.length}</span>
              </button>
              {jobTypeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`btn btn-sm min-h-10 shrink-0 ${typeFilter === option.value ? 'btn-primary' : 'border-primary/10 bg-base-200 text-primary hover:bg-base-300'}`}
                  onClick={() => setTypeFilter(option.value)}
                >
                  {option.label}
                  <span className="text-xs opacity-60">{typeCounts[option.value] || 0}</span>
                </button>
              ))}
            </div>

            <button type="button" className="btn btn-primary min-h-12 px-5" onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4" />
              Post
            </button>
          </div>
        </section>

        <section className="relative z-10 space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-secondary">Opportunity desk</p>
              <h2 className="mt-1 text-2xl font-bold">Current openings</h2>
            </div>
            <p className="max-w-xl text-sm leading-relaxed text-base-content/52">
              Jobs require admin approval before they appear publicly.
            </p>
          </div>

          {loading ? (
            <JobsSkeleton />
          ) : filteredJobs.length === 0 ? (
            <EmptyJobs search={search} filter={typeFilter} onPost={() => setModalOpen(true)} />
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filteredJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </section>

        <section className="relative z-10 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.38fr)]">
          <div className="overflow-hidden border border-primary/10 bg-base-100/86 p-5 shadow-[0_12px_34px_rgba(0,27,80,0.05)] rounded-[24px_4px_24px_4px]">
            <div className="flex items-start gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center bg-secondary/15 text-primary rounded-[16px_3px_16px_3px]">
                <Users className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-secondary">Posting guide</p>
                <h2 className="mt-2 text-xl font-bold">Share roles with enough detail to make referral easy.</h2>
                <p className="mt-3 max-w-3xl text-sm leading-relaxed text-base-content/55">
                  Include the company, work location, job type, application path, and a practical description. Admin review keeps the board useful and relevant.
                </p>
              </div>
            </div>
          </div>
          <button type="button" className="btn btn-secondary min-h-full w-full justify-between px-5 text-primary rounded-[24px_4px_24px_4px]" onClick={() => setModalOpen(true)}>
            <span className="text-left">
              <span className="block text-[10px] font-bold uppercase tracking-[0.18em] opacity-70">Have an opening?</span>
              <span className="mt-2 block text-lg font-bold">Post it now</span>
            </span>
            <ArrowRight className="h-5 w-5 shrink-0" />
          </button>
        </section>

        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Post a Job">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="rounded-[18px_4px_18px_4px] border border-primary/10 bg-base-200/45 p-4">
              <p className="text-sm font-bold text-base-content">Jobs go live after admin approval.</p>
              <p className="mt-1 text-xs leading-relaxed text-base-content/52">Add a clear application route so alumni can act on the opportunity quickly.</p>
            </div>

            <label className="form-control">
              <span className="label pb-2"><span className="text-xs font-bold uppercase tracking-[0.14em] text-base-content/50">Job title</span></span>
              <input type="text" className={`input input-bordered h-12 border-primary/10 bg-base-100 focus:border-primary ${errors.title ? 'input-error' : ''}`} {...register('title')} />
              {errors.title && <span className="mt-2 text-xs font-semibold text-error">{errors.title.message}</span>}
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="form-control">
                <span className="label pb-2"><span className="text-xs font-bold uppercase tracking-[0.14em] text-base-content/50">Company</span></span>
                <input type="text" className={`input input-bordered h-12 border-primary/10 bg-base-100 focus:border-primary ${errors.company ? 'input-error' : ''}`} {...register('company')} />
                {errors.company && <span className="mt-2 text-xs font-semibold text-error">{errors.company.message}</span>}
              </label>
              <label className="form-control">
                <span className="label pb-2"><span className="text-xs font-bold uppercase tracking-[0.14em] text-base-content/50">Location</span></span>
                <input type="text" className="input input-bordered h-12 border-primary/10 bg-base-100 focus:border-primary" placeholder="e.g. Accra, Remote" {...register('location')} />
              </label>
            </div>

            <label className="form-control">
              <span className="label pb-2"><span className="text-xs font-bold uppercase tracking-[0.14em] text-base-content/50">Job type</span></span>
              <select className="select select-bordered h-12 border-primary/10 bg-base-100 focus:border-primary" {...register('jobType')}>
                {jobTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <label className="form-control">
              <span className="label pb-2"><span className="text-xs font-bold uppercase tracking-[0.14em] text-base-content/50">Description</span></span>
              <textarea className={`textarea textarea-bordered min-h-32 border-primary/10 bg-base-100 focus:border-primary ${errors.description ? 'textarea-error' : ''}`} {...register('description')} />
              {errors.description && <span className="mt-2 text-xs font-semibold text-error">{errors.description.message}</span>}
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="form-control">
                <span className="label pb-2"><span className="text-xs font-bold uppercase tracking-[0.14em] text-base-content/50">Contact email</span></span>
                <input type="email" className={`input input-bordered h-12 border-primary/10 bg-base-100 focus:border-primary ${errors.contactEmail ? 'input-error' : ''}`} {...register('contactEmail')} />
                {errors.contactEmail && <span className="mt-2 text-xs font-semibold text-error">{errors.contactEmail.message}</span>}
              </label>
              <label className="form-control">
                <span className="label pb-2"><span className="text-xs font-bold uppercase tracking-[0.14em] text-base-content/50">External URL</span></span>
                <input type="url" className={`input input-bordered h-12 border-primary/10 bg-base-100 focus:border-primary ${errors.externalUrl ? 'input-error' : ''}`} {...register('externalUrl')} />
                {errors.externalUrl && <span className="mt-2 text-xs font-semibold text-error">{errors.externalUrl.message}</span>}
              </label>
            </div>

            <button type="submit" className="btn btn-primary min-h-12 w-full gap-2 text-base" disabled={submitting}>
              {submitting ? (
                <span className="h-4 w-28 animate-pulse bg-primary-content/35" />
              ) : (
                <>
                  Post job
                  <ExternalLink className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </Modal>
      </div>
    </PageTransition>
  )
}
