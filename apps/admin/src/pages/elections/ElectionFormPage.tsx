import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, Controller, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, PlusCircle, Trash2 } from 'lucide-react'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import Select from '../../components/ui/Select'
import Spinner from '../../components/ui/Spinner'
import { adminElectionsApi } from '../../api/services'
import { useActivityStore } from '../../stores/activity.store'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { apiErrorMessage } from '../../utils/apiError'
import { toDateTimeLocal } from '../../utils/formatters'
import type { Election, ElectionStatus } from '../../types'

const candidateSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  bio: z.string(),
  photoUrl: z.string().url('Must be a valid URL').or(z.literal('')),
})

const baseSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  description: z.string(),
  position: z.string().min(2, 'Position is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  status: z.enum(['UPCOMING', 'ACTIVE', 'COMPLETED', 'CANCELLED']),
  candidates: z.array(candidateSchema),
})

const endAfterStart = (d: { startDate: string; endDate: string }) => new Date(d.endDate) > new Date(d.startDate)
const endAfterStartError = { message: 'End must be after start', path: ['endDate'] }

// The API only accepts candidates at creation time (at least 2), so they're edited here only when creating.
const createSchema = baseSchema
  .extend({ candidates: z.array(candidateSchema).min(2, 'Add at least 2 candidates') })
  .refine(endAfterStart, endAfterStartError)
const editSchema = baseSchema.refine(endAfterStart, endAfterStartError)

type ElectionForm = z.infer<typeof baseSchema>

const emptyCandidate = { name: '', bio: '', photoUrl: '' }

function toElectionForm(election?: Election): ElectionForm {
  if (!election)
    return { title: '', description: '', position: '', startDate: '', endDate: '', status: 'UPCOMING', candidates: [emptyCandidate, emptyCandidate] }
  return {
    title: election.title,
    description: election.description ?? '',
    position: election.position,
    startDate: toDateTimeLocal(election.startDate),
    endDate: toDateTimeLocal(election.endDate),
    status: election.status,
    candidates: [],
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

  const { addActivity } = useActivityStore()
  const { currentUser } = useAuth()
  const { toast } = useToast()

  const [existingElection, setExistingElection] = useState<Election | null>(null)
  const [loading, setLoading] = useState(isEditing)

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ElectionForm>({
    resolver: zodResolver(isEditing ? editSchema : createSchema),
    defaultValues: toElectionForm(),
  })

  const { fields: candidateFields, append: addCandidate, remove: removeCandidate } = useFieldArray({ control, name: 'candidates' })

  // The admin results endpoint doubles as get-by-id.
  useEffect(() => {
    if (!id) return
    let cancelled = false
    adminElectionsApi.getResults(id)
      .then((res) => {
        if (cancelled) return
        const election = res.data.data as Election
        setExistingElection(election)
        reset(toElectionForm(election))
      })
      .catch(() => {
        if (cancelled) return
        toast.error('Election not found')
        navigate('/elections', { replace: true })
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id, reset, navigate, toast])

  const onSubmit = async (data: ElectionForm) => {
    if (!currentUser) return
    const startDate = new Date(data.startDate).toISOString()
    const endDate = new Date(data.endDate).toISOString()

    try {
      if (existingElection) {
        await adminElectionsApi.update(existingElection.id, { title: data.title, description: data.description, startDate, endDate })
        if (data.status !== existingElection.status) {
          await adminElectionsApi.changeStatus(existingElection.id, data.status)
        }
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
        const stamp = Date.now().toString(36)
        const res = await adminElectionsApi.create({
          title: data.title,
          description: data.description || undefined,
          position: data.position,
          startDate,
          endDate,
          candidates: data.candidates.map((c, i) => ({
            id: `c${i + 1}-${stamp}`,
            name: c.name.trim(),
            bio: c.bio.trim() || undefined,
            photoUrl: c.photoUrl || undefined,
          })),
        })
        const created = res.data.data as Election | undefined
        addActivity({
          action: 'created election',
          targetType: data.title,
          targetId: created?.id ?? '',
          performedBy: currentUser.id,
          performedByName: currentUser.name,
        })
        toast.success('Election created')
        navigate(created?.id ? `/elections/${created.id}` : '/elections')
      }
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to save election'))
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
        onClick={() => navigate(existingElection ? `/elections/${existingElection.id}` : '/elections')}
        className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors mb-4"
      >
        <ArrowLeft size={16} />
        {existingElection ? 'Back to Election' : 'Back to Elections'}
      </button>

      <div className="admin-card-surface p-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          {isEditing ? 'Edit Election' : 'New Election'}
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Title" error={errors.title?.message} {...register('title')} />
          <Textarea label="Description" rows={3} error={errors.description?.message} {...register('description')} />
          <Input
            label="Position"
            error={errors.position?.message}
            readOnly={isEditing}
            helperText={isEditing ? 'The position cannot be changed after the election is created.' : undefined}
            {...register('position')}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Voting Opens" type="datetime-local" error={errors.startDate?.message} {...register('startDate')} />
            <Input label="Voting Closes" type="datetime-local" error={errors.endDate?.message} {...register('endDate')} />
          </div>

          {isEditing ? (
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
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Candidates</label>
                <button
                  type="button"
                  onClick={() => addCandidate(emptyCandidate)}
                  className="text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400 font-medium flex items-center gap-1"
                >
                  <PlusCircle size={14} /> Add Candidate
                </button>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                At least 2 candidates. Candidates can't be changed once the election is created; new elections start as Upcoming.
              </p>
              {errors.candidates?.root?.message && <p className="text-xs text-red-600">{errors.candidates.root.message}</p>}
              {errors.candidates?.message && <p className="text-xs text-red-600">{errors.candidates.message}</p>}
              {candidateFields.map((field, idx) => (
                <div key={field.id} className="bg-gray-50 dark:bg-dark-hover rounded-xl p-3 space-y-2 border border-gray-200 dark:border-dark-border">
                  <div className="flex items-start gap-2">
                    <Input
                      placeholder="Candidate name"
                      error={errors.candidates?.[idx]?.name?.message}
                      {...register(`candidates.${idx}.name`)}
                      className="flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => removeCandidate(idx)}
                      title="Remove candidate"
                      className="mt-1 p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <Input
                    placeholder="Photo URL (optional)"
                    error={errors.candidates?.[idx]?.photoUrl?.message}
                    {...register(`candidates.${idx}.photoUrl`)}
                  />
                  <Textarea placeholder="Manifesto / bio (optional)" rows={2} {...register(`candidates.${idx}.bio`)} />
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-dark-border">
            <Button type="button" variant="secondary" onClick={() => navigate(existingElection ? `/elections/${existingElection.id}` : '/elections')}>
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
