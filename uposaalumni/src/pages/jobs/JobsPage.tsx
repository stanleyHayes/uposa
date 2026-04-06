import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { Briefcase, MapPin, Clock, Search, Plus, Building2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import PageTransition from '../../components/common/PageTransition'
import PageHeader from '../../components/ui/PageHeader'
import ScrollReveal from '../../components/common/ScrollReveal'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { jobsApi } from '../../api/services'
import { MOCK_JOBS } from '../../data/mock'
import { useToast } from '../../hooks/useToast'
import { formatDate, formatEnum, timeAgo } from '../../utils/formatters'
import type { Job } from '../../types'

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

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const toast = useToast()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
    defaultValues: { jobType: 'FULL_TIME' },
  })

  useEffect(() => {
    jobsApi.list()
      .then((res) => {
        const data = res.data.data
        setJobs(data?.length ? data : MOCK_JOBS)
      })
      .catch(() => setJobs(MOCK_JOBS))
      .finally(() => setLoading(false))
  }, [])

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

  const filtered = jobs.filter((j) => {
    const matchSearch = j.title.toLowerCase().includes(search.toLowerCase()) || j.company.toLowerCase().includes(search.toLowerCase())
    const matchType = !typeFilter || j.jobType === typeFilter
    return matchSearch && matchType
  })

  return (
    <PageTransition>
      <PageHeader
        title="Jobs Board"
        description="Browse opportunities and post jobs for fellow alumni"
        action={<button className="btn btn-primary btn-sm" onClick={() => setModalOpen(true)}><Plus className="w-4 h-4" /> Post a Job</button>}
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/50" />
          <input type="text" className="input input-sm input-bordered w-full pl-9" placeholder="Search jobs..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="select select-sm select-bordered" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">All Types</option>
          {['FULL_TIME', 'PART_TIME', 'CONTRACT', 'VOLUNTEER', 'INTERNSHIP'].map((t) => (
            <option key={t} value={t}>{formatEnum(t)}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Briefcase} title="No jobs found" description={search ? 'Try adjusting your search' : 'Be the first to post a job!'} />
      ) : (
        <div className="space-y-4">
          {filtered.map((job, i) => (
            <ScrollReveal key={job.id} delay={i * 0.03}>
              <Link to={`/jobs/${job.id}`} className="card bg-base-100 border border-base-300 hover:shadow-md transition-shadow">
                <div className="card-body p-5 flex-row items-start gap-4">
                  <div className="bg-primary/10 text-primary rounded-lg p-3 hidden sm:flex">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold">{job.title}</h3>
                        <p className="text-sm text-base-content/60">{job.company}</p>
                      </div>
                      <span className="badge badge-ghost badge-sm shrink-0">{formatEnum(job.jobType)}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-base-content/50">
                      {job.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>}
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(job.createdAt)}</span>
                      {job.expiresAt && <span>Expires {formatDate(job.expiresAt)}</span>}
                    </div>
                  </div>
                </div>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Post a Job">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="form-control">
            <label className="label"><span className="label-text">Job Title *</span></label>
            <input type="text" className={`input input-bordered ${errors.title ? 'input-error' : ''}`} {...register('title')} />
            {errors.title && <label className="label"><span className="label-text-alt text-error">{errors.title.message}</span></label>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label"><span className="label-text">Company *</span></label>
              <input type="text" className={`input input-bordered ${errors.company ? 'input-error' : ''}`} {...register('company')} />
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text">Location</span></label>
              <input type="text" className="input input-bordered" placeholder="e.g. Accra, Ghana" {...register('location')} />
            </div>
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text">Job Type *</span></label>
            <select className="select select-bordered" {...register('jobType')}>
              {['FULL_TIME', 'PART_TIME', 'CONTRACT', 'VOLUNTEER', 'INTERNSHIP'].map((t) => (
                <option key={t} value={t}>{formatEnum(t)}</option>
              ))}
            </select>
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text">Description *</span></label>
            <textarea className={`textarea textarea-bordered h-32 ${errors.description ? 'textarea-error' : ''}`} {...register('description')} />
            {errors.description && <label className="label"><span className="label-text-alt text-error">{errors.description.message}</span></label>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label"><span className="label-text">Contact Email</span></label>
              <input type="email" className="input input-bordered" {...register('contactEmail')} />
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text">External URL</span></label>
              <input type="url" className="input input-bordered" {...register('externalUrl')} />
            </div>
          </div>
          <p className="text-xs text-base-content/50">Jobs require admin approval before they become visible.</p>
          <button type="submit" className={`btn btn-primary w-full ${submitting ? 'loading' : ''}`} disabled={submitting}>
            {submitting ? 'Posting...' : 'Post Job'}
          </button>
        </form>
      </Modal>
    </PageTransition>
  )
}
