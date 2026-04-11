import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft } from 'lucide-react'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import MarkdownEditor from '../../components/ui/MarkdownEditor'
import { useJobsStore } from '../../stores/jobs.store'
import { useActivityStore } from '../../stores/activity.store'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import type { Job, JobType } from '../../types'

const jobSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  company: z.string().min(2, 'Company is required'),
  location: z.string().min(2, 'Location is required'),
  jobType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'VOLUNTEER', 'INTERNSHIP']),
  description: z.string().min(20, 'Description is required'),
  contactEmail: z.string().email('Must be a valid email').or(z.string().length(0)),
  externalUrl: z.string().url('Must be a valid URL').or(z.string().length(0)),
  postedByName: z.string().optional(),
  isApproved: z.boolean(),
  expiresAt: z.string().min(1, 'Expiry date is required'),
})

type JobForm = z.infer<typeof jobSchema>

function toFormValues(job?: Job): JobForm {
  if (!job)
    return {
      title: '',
      company: '',
      location: '',
      jobType: 'FULL_TIME',
      description: '',
      contactEmail: '',
      externalUrl: '',
      postedByName: '',
      isApproved: false,
      expiresAt: '',
    }
  return {
    title: job.title,
    company: job.company,
    location: job.location,
    jobType: job.jobType,
    description: job.description,
    contactEmail: job.contactEmail,
    externalUrl: job.externalUrl,
    postedByName: job.postedByName,
    isApproved: job.isApproved,
    expiresAt: job.expiresAt.split('T')[0],
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

  const { jobs, addJob, updateJob } = useJobsStore()
  const { addActivity } = useActivityStore()
  const { currentUser } = useAuth()
  const { toast } = useToast()

  const existingJob = isEditing ? jobs.find((j) => j.id === id) : undefined

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<JobForm>({
    resolver: zodResolver(jobSchema),
    defaultValues: toFormValues(existingJob),
  })

  useEffect(() => {
    if (isEditing && existingJob) {
      reset(toFormValues(existingJob))
    }
  }, [isEditing, existingJob, reset])

  useEffect(() => {
    if (isEditing && !existingJob) {
      navigate('/jobs', { replace: true })
    }
  }, [isEditing, existingJob, navigate])

  const onSubmit = async (data: JobForm) => {
    if (!currentUser) return
    const payload = {
      ...data,
      contactEmail: data.contactEmail || '',
      externalUrl: data.externalUrl || '',
      postedByName: data.postedByName || currentUser.name,
      expiresAt: new Date(data.expiresAt).toISOString(),
      applications: [],
    }

    if (isEditing && existingJob) {
      updateJob(existingJob.id, payload)
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
      const job = addJob(payload)
      addActivity({
        action: 'created job posting',
        targetType: data.title,
        targetId: job.id,
        performedBy: currentUser.id,
        performedByName: currentUser.name,
      })
      toast.success('Job created')
      navigate('/jobs')
    }
  }

  return (
    <div className="page-enter">
      <button
        onClick={() => navigate('/jobs')}
        className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors mb-4"
      >
        <ArrowLeft size={16} />
        Back to Jobs
      </button>

      <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-dark-border shadow-sm p-6">
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
            <Input label="Expiry Date" type="date" error={errors.expiresAt?.message} {...register('expiresAt')} />
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
          <Input label="Posted By" {...register('postedByName')} />
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input type="checkbox" {...register('isApproved')} className="rounded border-gray-300" />
            Approved
          </label>

          <div className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-dark-border">
            <Button type="button" variant="secondary" onClick={() => navigate('/jobs')}>
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
