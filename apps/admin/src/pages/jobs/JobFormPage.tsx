import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft } from 'lucide-react'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Spinner from '../../components/ui/Spinner'
import MarkdownEditor from '../../components/ui/MarkdownEditor'
import { adminJobsApi, findAdminJob, type AdminJobInput } from '../../api/services'
import { useActivityStore } from '../../stores/activity.store'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { apiErrorMessage } from '../../utils/apiError'
import { toDateTimeLocal } from '../../utils/formatters'
import type { ApiJob, JobType } from '../../types'

// Mirrors the API's job validation (location/expiry optional, description >= 10 chars).
const jobSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  company: z.string().min(2, 'Company is required'),
  location: z.string(),
  jobType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'VOLUNTEER', 'INTERNSHIP']),
  description: z.string().min(10, 'Description is required'),
  contactEmail: z.string().email('Must be a valid email').or(z.literal('')),
  externalUrl: z.string().url('Must be a valid URL').or(z.literal('')),
  expiresAt: z.string(),
})

type JobForm = z.infer<typeof jobSchema>

function toFormValues(job?: ApiJob): JobForm {
  if (!job)
    return { title: '', company: '', location: '', jobType: 'FULL_TIME', description: '', contactEmail: '', externalUrl: '', expiresAt: '' }
  return {
    title: job.title,
    company: job.company,
    location: job.location ?? '',
    jobType: job.jobType,
    description: job.description,
    contactEmail: job.contactEmail ?? '',
    externalUrl: job.externalUrl ?? '',
    expiresAt: toDateTimeLocal(job.expiresAt),
  }
}

function toPayload(data: JobForm): AdminJobInput {
  return {
    title: data.title,
    company: data.company,
    location: data.location,
    jobType: data.jobType,
    description: data.description,
    // '' clears a contact email, external URL or expiry the admin removed.
    externalUrl: data.externalUrl,
    contactEmail: data.contactEmail,
    expiresAt: data.expiresAt ? new Date(data.expiresAt).toISOString() : '',
  }
}

const typeOptions: { value: JobType; label: string }[] = [
  { value: 'FULL_TIME', label: 'Full Time' },
  { value: 'PART_TIME', label: 'Part Time' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'INTERNSHIP', label: 'Internship' },
  { value: 'VOLUNTEER', label: 'Volunteer' },
]

export default function JobFormPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEditing = Boolean(id)

  const { addActivity } = useActivityStore()
  const { currentUser } = useAuth()
  const { toast } = useToast()

  const [existingJob, setExistingJob] = useState<ApiJob | null>(null)
  const [loading, setLoading] = useState(isEditing)

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<JobForm>({
    resolver: zodResolver(jobSchema),
    defaultValues: toFormValues(),
  })

  useEffect(() => {
    if (!id) return
    let cancelled = false
    findAdminJob(id)
      .then((job) => {
        if (cancelled) return
        if (!job) throw new Error('not found')
        setExistingJob(job)
        reset(toFormValues(job))
      })
      .catch(() => {
        if (cancelled) return
        toast.error('Job not found')
        navigate('/jobs', { replace: true })
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id, reset, navigate, toast])

  const onSubmit = async (data: JobForm) => {
    if (!currentUser) return

    try {
      if (existingJob) {
        await adminJobsApi.update(existingJob.id, toPayload(data))
        addActivity({
          action: 'updated job posting',
          targetType: data.title,
          targetId: existingJob.id,
          performedBy: currentUser.id,
          performedByName: currentUser.name,
        })
        toast.success('Job updated')
        navigate(`/jobs/${existingJob.id}`)
      } else {
        const res = await adminJobsApi.create(toPayload(data))
        const created = res.data.data as ApiJob | undefined
        addActivity({
          action: 'created job posting',
          targetType: data.title,
          targetId: created?.id ?? '',
          performedBy: currentUser.id,
          performedByName: currentUser.name,
        })
        toast.success('Job posted')
        navigate(created?.id ? `/jobs/${created.id}` : '/jobs')
      }
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to save job'))
    }
  }

  if (loading) {
    return (
      <div className="page-enter flex items-center justify-center py-32">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="page-enter">
      <button
        onClick={() => navigate(existingJob ? `/jobs/${existingJob.id}` : '/jobs')}
        className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors mb-4"
      >
        <ArrowLeft size={16} />
        {existingJob ? 'Back to Job' : 'Back to Jobs'}
      </button>

      <div className="admin-card-surface p-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          {isEditing ? 'Edit Job' : 'Post New Job'}
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Job Title" error={errors.title?.message} {...register('title')} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Company" error={errors.company?.message} {...register('company')} />
            <Input label="Location" error={errors.location?.message} {...register('location')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Controller
              name="jobType"
              control={control}
              render={({ field }) => (
                <Select
                  label="Job Type"
                  options={typeOptions}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                />
              )}
            />
            <Input label="Expires At (optional)" type="datetime-local" error={errors.expiresAt?.message} {...register('expiresAt')} />
          </div>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <MarkdownEditor
                label="Description"
                value={field.value}
                onChange={field.onChange}
                height={250}
                helperText={errors.description?.message}
              />
            )}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Contact Email" error={errors.contactEmail?.message} {...register('contactEmail')} />
            <Input label="External URL" placeholder="https://..." error={errors.externalUrl?.message} {...register('externalUrl')} />
          </div>
          {!isEditing && (
            <p className="text-xs text-gray-400 dark:text-gray-500">Jobs posted by admins are approved and visible to members immediately.</p>
          )}

          <div className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-dark-border">
            <Button type="button" variant="secondary" onClick={() => navigate(existingJob ? `/jobs/${existingJob.id}` : '/jobs')}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {isEditing ? 'Save Changes' : 'Post Job'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
