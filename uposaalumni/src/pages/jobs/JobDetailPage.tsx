import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router'
import { ArrowLeft, MapPin, Clock, Mail, ExternalLink } from 'lucide-react'
import PageTransition from '../../components/common/PageTransition'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { jobsApi } from '../../api/services'
import { MOCK_JOBS } from '../../data/mock'
import { formatDate, formatEnum, timeAgo } from '../../utils/formatters'
import Avatar from '../../components/ui/Avatar'
import type { Job } from '../../types'

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    jobsApi.getById(id)
      .then((res) => setJob(res.data.data || MOCK_JOBS.find((j) => j.id === id) || null))
      .catch(() => setJob(MOCK_JOBS.find((j) => j.id === id) || null))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
  if (!job) return <div className="text-center py-16"><p>Job not found</p><Link to="/jobs" className="btn btn-primary mt-4">Back to Jobs</Link></div>

  return (
    <PageTransition>
      <Link to="/jobs" className="btn btn-ghost btn-sm mb-4"><ArrowLeft className="w-4 h-4" /> Back to Jobs</Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card bg-base-100 border border-base-300">
          <div className="card-body">
            <div className="flex items-center gap-2 mb-1">
              <span className="badge badge-ghost">{formatEnum(job.jobType)}</span>
            </div>
            <h1 className="text-2xl font-bold">{job.title}</h1>
            <p className="text-base-content/60">{job.company}</p>
            <div className="flex flex-wrap gap-3 mt-2 text-sm text-base-content/60">
              {job.location && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{job.location}</span>}
              <span className="flex items-center gap-1"><Clock className="w-4 h-4" />Posted {timeAgo(job.createdAt)}</span>
              {job.expiresAt && <span>Expires {formatDate(job.expiresAt)}</span>}
            </div>
            <div className="divider" />
            <div className="prose max-w-none whitespace-pre-wrap">{job.description}</div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card bg-base-100 border border-base-300">
            <div className="card-body space-y-3">
              <h3 className="font-semibold">Apply</h3>
              {job.contactEmail && (
                <a href={`mailto:${job.contactEmail}`} className="btn btn-primary w-full">
                  <Mail className="w-4 h-4" /> Email Application
                </a>
              )}
              {job.externalUrl && (
                <a href={job.externalUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline w-full">
                  <ExternalLink className="w-4 h-4" /> Apply Externally
                </a>
              )}
              {!job.contactEmail && !job.externalUrl && (
                <p className="text-sm text-base-content/60">Contact the poster for application details.</p>
              )}
            </div>
          </div>
          {job.postedBy && (
            <div className="card bg-base-100 border border-base-300">
              <div className="card-body">
                <h3 className="font-semibold mb-2">Posted By</h3>
                <div className="flex items-center gap-3">
                  <Avatar src={job.postedBy.photoUrl} name={job.postedBy.fullName} size="md" />
                  <div>
                    <p className="font-medium">{job.postedBy.fullName}</p>
                    <Link to={`/members/${job.postedBy.id}`} className="text-xs text-primary">View Profile</Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  )
}
