import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Plus, X } from 'lucide-react'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import Select from '../../components/ui/Select'
import client from '../../api/client'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import type { Poll, PollStatus } from '../../types'

const pollSchema = z.object({
  question: z.string().min(5, 'Question is required'),
  description: z.string().min(5, 'Description is required'),
  options: z
    .array(z.object({ text: z.string().min(1, 'Option text is required') }))
    .min(2, 'At least 2 options are required'),
  status: z.enum(['ACTIVE', 'CLOSED']),
  endsAt: z.string().min(1, 'End date is required'),
  allowMultiple: z.enum(['true', 'false']),
})

type PollForm = z.infer<typeof pollSchema>

function toFormValues(poll?: Poll): PollForm {
  if (!poll)
    return {
      question: '',
      description: '',
      options: [{ text: '' }, { text: '' }],
      status: 'ACTIVE',
      endsAt: '',
      allowMultiple: 'false',
    }
  return {
    question: poll.question,
    description: poll.description,
    options: poll.options.map((o) => ({ text: o.text })),
    status: poll.status as PollForm['status'],
    endsAt: poll.endsAt ? poll.endsAt.substring(0, 16) : '',
    allowMultiple: poll.allowMultiple ? 'true' : 'false',
  }
}

const statusOptions: { value: PollStatus; label: string }[] = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'CLOSED', label: 'Closed' },
]

const allowMultipleOptions = [
  { value: 'false', label: 'Single choice' },
  { value: 'true', label: 'Multiple choice' },
]

export default function PollFormPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEditing = Boolean(id)

  const { currentUser } = useAuth()
  const { toast } = useToast()
  const [existingPoll, setExistingPoll] = useState<Poll | null>(null)
  const [loading, setLoading] = useState(isEditing)

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<PollForm>({
    resolver: zodResolver(pollSchema),
    defaultValues: toFormValues(),
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'options' })

  // Fetch existing poll for editing
  useEffect(() => {
    if (!isEditing || !id) { setLoading(false); return }
    client.get(`/admin/polls/${id}`)
      .then((res) => {
        const poll = res.data.data
        if (poll) {
          setExistingPoll(poll)
          reset(toFormValues(poll))
        } else {
          navigate('/polls', { replace: true })
        }
      })
      .catch(() => navigate('/polls', { replace: true }))
      .finally(() => setLoading(false))
  }, [id, isEditing, navigate, reset])

  const onSubmit = async (data: PollForm) => {
    if (!currentUser) return
    const options = data.options.map((o, i) => ({
      id: existingPoll?.options?.[i]?.id ?? (Date.now() + i),
      text: o.text,
      votes: existingPoll?.options?.[i]?.votes ?? 0,
    }))
    const payload = {
      question: data.question,
      description: data.description,
      options,
      allowMultiple: data.allowMultiple === 'true',
      endsAt: data.endsAt,
      status: data.status,
    }

    try {
      if (isEditing && existingPoll) {
        await client.put(`/admin/polls/${existingPoll.id}`, payload)
        toast.success('Poll updated')
        navigate('/polls')
      } else {
        await client.post('/admin/polls', payload)
        toast.success('Poll created')
        navigate('/polls')
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save poll')
    }
  }

  if (loading) {
    return <div className="flex justify-center py-20"><div className="loading loading-spinner loading-lg text-brand-500" /></div>
  }

  return (
    <div className="page-enter">
      <button
        onClick={() => navigate('/polls')}
        className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors mb-4"
      >
        <ArrowLeft size={16} />
        Back to Polls
      </button>

      <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-dark-border shadow-sm p-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          {isEditing ? 'Edit Poll' : 'Create New Poll'}
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Question" error={errors.question?.message} {...register('question')} />
          <Textarea label="Description" rows={2} error={errors.description?.message} {...register('description')} />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Options</label>
            {typeof errors.options?.message === 'string' && (
              <p className="text-xs text-red-600">{errors.options.message}</p>
            )}
            <div className="space-y-2">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-2">
                  <input
                    {...register(`options.${index}.text`)}
                    placeholder={`Option ${index + 1}`}
                    className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-dark-hover dark:text-gray-100 dark:placeholder:text-gray-500 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  {fields.length > 2 && (
                    <button type="button" onClick={() => remove(index)} className="rounded-lg p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                      <X size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" onClick={() => append({ text: '' })} className="mt-1 flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700 transition-colors w-fit">
              <Plus size={14} />
              Add Option
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Controller name="status" control={control} render={({ field }) => (
              <Select label="Status" options={statusOptions} value={field.value} onChange={(e) => field.onChange(e.target.value)} />
            )} />
            <Controller name="allowMultiple" control={control} render={({ field }) => (
              <Select label="Choice Type" options={allowMultipleOptions} value={field.value} onChange={(e) => field.onChange(e.target.value)} />
            )} />
          </div>
          <Input label="Ends At" type="datetime-local" error={errors.endsAt?.message} {...register('endsAt')} />

          <div className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-dark-border">
            <Button type="button" variant="secondary" onClick={() => navigate('/polls')}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {isEditing ? 'Save Changes' : 'Create Poll'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
