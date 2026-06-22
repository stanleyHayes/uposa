import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft } from 'lucide-react'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import Select from '../../components/ui/Select'
import { useElectionsStore } from '../../stores/elections.store'
import { useActivityStore } from '../../stores/activity.store'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import type { Election, ElectionStatus } from '../../types'

const electionSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  description: z.string().min(10, 'Description is required'),
  position: z.string().min(2, 'Position is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  status: z.enum(['UPCOMING', 'ACTIVE', 'COMPLETED', 'CANCELLED']),
})

type ElectionForm = z.infer<typeof electionSchema>

function toElectionForm(election?: Election): ElectionForm {
  if (!election)
    return { title: '', description: '', position: '', startDate: '', endDate: '', status: 'UPCOMING' }
  return {
    title: election.title,
    description: election.description,
    position: election.position,
    startDate: election.startDate,
    endDate: election.endDate,
    status: election.status,
  }
}

const statusOptions: { value: ElectionStatus; label: string }[] = [
  { value: 'UPCOMING', label: 'Upcoming' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
]

export default function ElectionFormPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEditing = Boolean(id)

  const { elections, addElection, updateElection } = useElectionsStore()
  const { addActivity } = useActivityStore()
  const { currentUser } = useAuth()
  const { toast } = useToast()

  const existingElection = isEditing ? elections.find((e) => e.id === id) : undefined

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ElectionForm>({
    resolver: zodResolver(electionSchema),
    defaultValues: toElectionForm(existingElection),
  })

  useEffect(() => {
    if (isEditing && existingElection) {
      reset(toElectionForm(existingElection))
    }
  }, [isEditing, existingElection, reset])

  useEffect(() => {
    if (isEditing && !existingElection) {
      navigate('/elections', { replace: true })
    }
  }, [isEditing, existingElection, navigate])

  const onSubmit = async (data: ElectionForm) => {
    if (!currentUser) return

    if (isEditing && existingElection) {
      updateElection(existingElection.id, data)
      addActivity({
        action: 'updated election',
        targetType: data.title,
        targetId: existingElection.id,
        performedBy: currentUser.id,
        performedByName: currentUser.name,
      })
      toast.success('Election updated')
      navigate(`/elections/${existingElection.id}`)
    } else {
      const election = addElection({ ...data, candidates: [] })
      addActivity({
        action: 'created election',
        targetType: data.title,
        targetId: election.id,
        performedBy: currentUser.id,
        performedByName: currentUser.name,
      })
      toast.success('Election created')
      navigate('/elections')
    }
  }

  return (
    <div className="page-enter">
      <button
        onClick={() => navigate('/elections')}
        className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors mb-4"
      >
        <ArrowLeft size={16} />
        Back to Elections
      </button>

      <div className="admin-card-surface p-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          {isEditing ? 'Edit Election' : 'New Election'}
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Title" error={errors.title?.message} {...register('title')} />
          <Textarea label="Description" rows={3} error={errors.description?.message} {...register('description')} />
          <Input label="Position" error={errors.position?.message} {...register('position')} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Date" type="date" error={errors.startDate?.message} {...register('startDate')} />
            <Input label="End Date" type="date" error={errors.endDate?.message} {...register('endDate')} />
          </div>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select
                label="Status"
                options={statusOptions}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
              />
            )}
          />

          <div className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-dark-border">
            <Button type="button" variant="secondary" onClick={() => navigate('/elections')}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {isEditing ? 'Save Changes' : 'Create Election'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
