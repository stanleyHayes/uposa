import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, Trash2, Briefcase, MapPin, Mail, ExternalLink, User, Clock } from 'lucide-react'
import { createElement } from 'react'
import MDEditorComponent from '@uiw/react-md-editor'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import RoleGate from '../../components/auth/RoleGate'
import { useJobsStore } from '../../stores/jobs.store'
import { useActivityStore } from '../../stores/activity.store'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { formatDate } from '../../utils/formatters'

export default function JobDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { jobs, deleteJob } = useJobsStore()
  const { addActivity } = useActivityStore()
  const { currentUser } = useAuth()
  const { toast } = useToast()

  const [deleteTarget, setDeleteTarget] = useState(false)

  const job = jobs.find((j) => j.id === id)

  if (!job) {
    navigate('/jobs', { replace: true })
    return null
  }

  const handleDelete = () => {
    if (!currentUser) return
    deleteJob(job.id)
    addActivity({
      action: 'deleted job posting',
      targetType: job.title,
      targetId: job.id,
      performedBy: currentUser.id,
      performedByName: currentUser.name,
    })
    toast.success('Job deleted')
    navigate('/jobs')
  }

  return (
    <div className="page-enter">
      <div className="mb-6">
        <button
          onClick={() => navigate('/jobs')}
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          Back to Jobs
        </button>

        <div className="admin-card-surface p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge variant={job.jobType.toLowerCase() as any} label={job.jobType.replace('_', ' ')} />
                <Badge
                  variant={job.isApproved ? 'published' : 'draft'}
                  label={job.isApproved ? 'Approved' : 'Pending'}
                />
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{job.title}</h1>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <RoleGate permission="jobs:edit">
                <Button size="sm" variant="secondary" leftIcon={<Pencil size={14} />} onClick={() => navigate(`/jobs/${job.id}/edit`)}>
                  Edit
                </Button>
              </RoleGate>
              <RoleGate permission="jobs:delete">
                <Button size="sm" variant="danger" leftIcon={<Trash2 size={14} />} onClick={() => setDeleteTarget(true)}>
                  Delete
                </Button>
              </RoleGate>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-1.5">
              <Briefcase size={14} className="text-gray-400" />
              <span>{job.company}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin size={14} className="text-gray-400" />
              <span>{job.location}</span>
            </div>
            {job.postedByName && (
              <div className="flex items-center gap-1.5">
                <User size={14} className="text-gray-400" />
                <span>Posted by {job.postedByName}</span>
              </div>
            )}
            {job.expiresAt && (
              <div className="flex items-center gap-1.5">
                <Clock size={14} className="text-gray-400" />
                <span>Expires: {formatDate(job.expiresAt)}</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 mb-6">
            {job.contactEmail && (
              <a
                href={`mailto:${job.contactEmail}`}
                className="inline-flex items-center gap-1.5 text-sm text-brand-600 dark:text-brand-400 hover:underline"
              >
                <Mail size={14} />
                {job.contactEmail}
              </a>
            )}
            {job.externalUrl && (
              <a
                href={job.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-brand-600 dark:text-brand-400 hover:underline"
              >
                <ExternalLink size={14} />
                External Listing
              </a>
            )}
          </div>

          <div className="bg-gray-50 dark:bg-dark-hover rounded-lg p-4 text-sm text-gray-700 dark:text-gray-300 leading-relaxed" data-color-mode="light">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              {createElement((MDEditorComponent as any).Markdown, { source: job.description })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-dark-border flex items-center gap-6 text-xs text-gray-400 dark:text-gray-500">
            <span>Created: {formatDate(job.createdAt)}</span>
            <span>Updated: {formatDate(job.updatedAt)}</span>
          </div>
        </div>
      </div>

      {/* Applications section */}
      {job.applications && job.applications.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">
            {job.applications.length} {job.applications.length === 1 ? 'Application' : 'Applications'}
          </h2>
          <div className="admin-card-surface overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table w-full text-sm">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-50/50 dark:from-dark-hover dark:to-dark-hover/50 border-b-2 border-gray-100 dark:border-dark-border">
                  <tr>
                    <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Applicant</th>
                    <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
                    <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {job.applications.map((app) => (
                    <tr key={app.id} className="border-b border-gray-50 dark:border-dark-border">
                      <td className="px-5 py-3.5 font-medium text-gray-900 dark:text-gray-100">{app.applicantName}</td>
                      <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400 text-xs">{app.applicantEmail}</td>
                      <td className="px-5 py-3.5">
                        <Badge variant={app.status.toLowerCase() as any} label={app.status.charAt(0).toUpperCase() + app.status.slice(1).toLowerCase()} />
                      </td>
                      <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400 text-xs">{formatDate(app.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget}
        onClose={() => setDeleteTarget(false)}
        onConfirm={handleDelete}
        title="Delete Job"
        message={`Are you sure you want to delete "${job.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  )
}
