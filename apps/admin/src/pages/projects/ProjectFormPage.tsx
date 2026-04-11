import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, Controller, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, PlusCircle, Trash2 } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import MarkdownEditor from '../../components/ui/MarkdownEditor'
import Select from '../../components/ui/Select'
import { useProjectsStore } from '../../stores/projects.store'
import { useActivityStore } from '../../stores/activity.store'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import type { Project, ProjectStatus } from '../../types'

const milestoneSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  date: z.string().optional(),
  completed: z.boolean(),
})

const projectSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  slug: z.string().min(3, 'Slug is required'),
  description: z.string().min(10, 'Description is required'),
  content: z.string().optional(),
  imageUrl: z.string().optional(),
  gallery: z.string().optional(),
  milestones: z.array(milestoneSchema).optional(),
  goalAmount: z.coerce.number().min(0).optional(),
  raisedAmount: z.coerce.number().min(0).optional(),
  status: z.enum(['ONGOING', 'COMPLETED', 'PAUSED']),
  isFeatured: z.boolean(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

type ProjectForm = z.infer<typeof projectSchema>

const statusOptions: { value: ProjectStatus; label: string }[] = [
  { value: 'ONGOING', label: 'Ongoing' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'PAUSED', label: 'Paused' },
]

function toFormValues(project?: Project): ProjectForm {
  if (!project) return { title: '', slug: '', description: '', content: '', imageUrl: '', gallery: '', milestones: [], goalAmount: 0, raisedAmount: 0, status: 'ONGOING', isFeatured: false, startDate: '', endDate: '' }
  return {
    title: project.title,
    slug: project.slug,
    description: project.description,
    content: project.content ?? '',
    imageUrl: project.imageUrl ?? '',
    gallery: (project.gallery || []).join('\n'),
    milestones: (project.milestones || []).map((m) => ({ title: m.title, description: m.description ?? '', date: m.date ?? '', completed: m.completed })),
    goalAmount: project.goalAmount,
    raisedAmount: project.raisedAmount,
    status: project.status,
    isFeatured: project.isFeatured,
    startDate: project.startDate ?? '',
    endDate: project.endDate ?? '',
  }
}

export default function ProjectFormPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)

  const { projects, fetchProjects, addProject, updateProject } = useProjectsStore()
  const { addActivity } = useActivityStore()
  const { currentUser } = useAuth()
  const { toast } = useToast()

  const editingProject = isEdit ? projects.find((p) => p.id === id) : undefined

  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } = useForm<ProjectForm>({
    resolver: zodResolver(projectSchema),
    defaultValues: toFormValues(),
  })

  const { fields: milestoneFields, append: addMilestone, remove: removeMilestone } = useFieldArray({
    control,
    name: 'milestones',
  })

  // Fetch projects if store is empty (direct navigation to edit page)
  useEffect(() => {
    if (projects.length === 0) {
      fetchProjects()
    }
  }, [projects.length, fetchProjects])

  // Populate form when editing project is found
  useEffect(() => {
    if (isEdit && editingProject) {
      reset(toFormValues(editingProject))
    }
  }, [isEdit, editingProject, reset])

  const onSubmit = async (data: ProjectForm) => {
    if (!currentUser) return
    try {
      const fd = new FormData()
      fd.append('title', data.title)
      fd.append('slug', data.slug)
      fd.append('description', data.description)
      if (data.content) fd.append('content', data.content)
      if (data.imageUrl) fd.append('imageUrl', data.imageUrl)
      if (data.startDate) fd.append('startDate', data.startDate)
      if (data.endDate) fd.append('endDate', data.endDate)
      fd.append('status', data.status)
      fd.append('isFeatured', String(data.isFeatured))
      fd.append('goalAmount', String(data.goalAmount ?? 0))
      fd.append('raisedAmount', String(data.raisedAmount ?? 0))

      const gallery = (data.gallery || '').split('\n').map((u) => u.trim()).filter(Boolean)
      fd.append('gallery', JSON.stringify(gallery))

      const milestones = (data.milestones || []).map((m) => ({ ...m, completed: m.completed || false }))
      fd.append('milestones', JSON.stringify(milestones))

      if (isEdit && id) {
        await updateProject(id, fd)
        addActivity({ action: 'updated project', targetType: data.title, targetId: id, performedBy: currentUser.id, performedByName: currentUser.name })
        toast.success('Project updated')
      } else {
        const project = await addProject(fd)
        addActivity({ action: 'created project', targetType: data.title, targetId: project.id, performedBy: currentUser.id, performedByName: currentUser.name })
        toast.success('Project created')
      }
      navigate('/projects')
    } catch {
      toast.error('Failed to save project')
    }
  }

  return (
    <div className="page-enter">
      <button
        onClick={() => navigate('/projects')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-600 transition-colors mb-4"
      >
        <ArrowLeft size={16} /> Back to projects
      </button>

      <PageHeader
        title={isEdit ? 'Edit Project' : 'New Project'}
        description={isEdit ? `Editing "${editingProject?.title || ''}"` : 'Create a new project'}
      />

      <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-dark-border shadow-sm p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Title" error={errors.title?.message} {...register('title')} />
          <Input label="Slug" helperText="URL-friendly identifier" error={errors.slug?.message} {...register('slug')} />
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <MarkdownEditor
                label="Description"
                value={field.value || ''}
                onChange={field.onChange}
                height={250}
                helperText="Supports Markdown formatting"
              />
            )}
          />
          {errors.description && <p className="text-red-500 text-xs -mt-3">{errors.description.message}</p>}
          <Controller
            name="content"
            control={control}
            render={({ field }) => (
              <MarkdownEditor
                label="Full Content (Markdown)"
                value={field.value || ''}
                onChange={field.onChange}
                height={300}
                helperText="Detailed project write-up. Supports Markdown."
              />
            )}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Date" type="date" {...register('startDate')} />
            <Input label="End Date" type="date" {...register('endDate')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Goal Amount (GHS)" type="number" placeholder="0" {...register('goalAmount')} />
            <Input label="Raised Amount (GHS)" type="number" placeholder="0" {...register('raisedAmount')} />
          </div>
          <Input label="Image URL" placeholder="https://..." {...register('imageUrl')} />
          <Controller
            name="gallery"
            control={control}
            render={({ field }) => (
              <Textarea
                label="Gallery URLs"
                value={field.value || ''}
                onChange={field.onChange}
                placeholder="One image URL per line&#10;https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
                helperText="One URL per line. These appear in the project gallery."
              />
            )}
          />

          {/* Milestones */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Milestones</label>
              <button
                type="button"
                onClick={() => addMilestone({ title: '', description: '', date: '', completed: false })}
                className="text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400 font-medium flex items-center gap-1"
              >
                <PlusCircle size={14} /> Add Milestone
              </button>
            </div>
            {milestoneFields.length === 0 && (
              <p className="text-xs text-gray-400 dark:text-gray-500 italic">No milestones yet. Add milestones to track project progress.</p>
            )}
            {milestoneFields.map((field, idx) => (
              <div key={field.id} className="bg-gray-50 dark:bg-dark-hover rounded-xl p-3 space-y-2 border border-gray-200 dark:border-dark-border">
                <div className="flex items-start gap-2">
                  <Input
                    label=""
                    placeholder="Milestone title"
                    {...register(`milestones.${idx}.title`)}
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => removeMilestone(idx)}
                    className="mt-1 p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <Input
                  label=""
                  placeholder="Description (optional)"
                  {...register(`milestones.${idx}.description`)}
                />
                <div className="flex items-center gap-3">
                  <Input
                    label=""
                    type="date"
                    {...register(`milestones.${idx}.date`)}
                    className="flex-1"
                  />
                  <label className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                    <input type="checkbox" {...register(`milestones.${idx}.completed`)} className="rounded border-gray-300" />
                    Completed
                  </label>
                </div>
              </div>
            ))}
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
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input type="checkbox" {...register('isFeatured')} className="rounded border-gray-300" />
            Featured Project
          </label>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-dark-border">
            <Button variant="secondary" onClick={() => navigate('/projects')} type="button">
              Cancel
            </Button>
            <Button loading={isSubmitting} type="submit">
              {isEdit ? 'Save Changes' : 'Create Project'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
