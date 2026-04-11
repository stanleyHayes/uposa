// @ts-nocheck
import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Save, PlusCircle, Upload, X, Image as ImageIcon } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import MarkdownEditor from '../../components/ui/MarkdownEditor'
import { adminNewsApi } from '../../api/services'
import { useActivityStore } from '../../stores/activity.store'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import type { News } from '../../types'

const articleSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  excerpt: z.string().min(10, 'Excerpt is required'),
  content: z.string().min(20, 'Content is required'),
  category: z.enum(['ANNOUNCEMENT', 'BLOG', 'REPORT', 'MEETING_SUMMARY']),
  authorName: z.string().min(1, 'Author name is required'),
  isFeatured: z.boolean(),
  isPublished: z.boolean(),
})

type ArticleForm = z.infer<typeof articleSchema>

const categoryOptions = [
  { value: 'ANNOUNCEMENT', label: 'Announcement' },
  { value: 'BLOG', label: 'Blog' },
  { value: 'REPORT', label: 'Report' },
  { value: 'MEETING_SUMMARY', label: 'Meeting Summary' },
]

function toFormValues(article?: News): ArticleForm {
  if (!article) return { title: '', excerpt: '', content: '', category: 'ANNOUNCEMENT', authorName: '', isFeatured: false, isPublished: false }
  return {
    title: article.title,
    excerpt: article.excerpt,
    content: article.content,
    category: article.category,
    authorName: article.authorName,
    isFeatured: article.isFeatured,
    isPublished: article.isPublished,
  }
}

export default function NewsFormPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEditing = Boolean(id)

  const { addActivity } = useActivityStore()
  const { currentUser } = useAuth()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [article, setArticle] = useState<News | null>(null)
  const [loading, setLoading] = useState(isEditing)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')

  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } = useForm<ArticleForm>({
    resolver: zodResolver(articleSchema),
    defaultValues: toFormValues(),
  })

  const fetchArticle = useCallback(async () => {
    if (!id) return
    try {
      const res = await adminNewsApi.getById(id)
      const data = (res.data as any).data
      setArticle(data)
      reset(toFormValues(data))
      if (data.imageUrl) setImagePreview(data.imageUrl)
    } catch {
      toast.error('Article not found')
      navigate('/news', { replace: true })
    } finally {
      setLoading(false)
    }
  }, [id, reset, toast, navigate])

  useEffect(() => {
    if (isEditing) fetchArticle()
  }, [isEditing, fetchArticle])

  const handleImageSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
      toast.error('Only JPEG, PNG, GIF, WEBP allowed')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Max 5MB')
      return
    }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const removeImage = () => {
    if (imagePreview && imageFile) URL.revokeObjectURL(imagePreview)
    setImageFile(null)
    setImagePreview('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const onSubmit = async (data: ArticleForm) => {
    if (!currentUser) return

    const formData = new FormData()
    formData.append('title', data.title)
    formData.append('excerpt', data.excerpt)
    formData.append('content', data.content)
    formData.append('category', data.category)
    formData.append('authorName', data.authorName)
    formData.append('isFeatured', String(data.isFeatured))
    formData.append('isPublished', String(data.isPublished))
    if (imageFile) formData.append('image', imageFile)

    try {
      if (isEditing && article) {
        const res = await adminNewsApi.update(article.id, formData)
        const updated = (res.data as any).data
        addActivity({ action: 'updated news article', targetType: data.title, targetId: article.id, performedBy: currentUser.id, performedByName: currentUser.name })
        toast.success('Article updated')
        navigate(`/news/${updated?.id || article.id}`)
      } else {
        const res = await adminNewsApi.create(formData)
        const created = (res.data as any).data
        addActivity({ action: 'created news article', targetType: data.title, targetId: created?.id || '', performedBy: currentUser.id, performedByName: currentUser.name })
        toast.success('Article created')
        navigate(`/news/${created?.id || ''}`)
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save article')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="page-enter">
      <div className="mb-6">
        <button
          onClick={() => navigate(isEditing && article ? `/news/${article.id}` : '/news')}
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          {isEditing ? 'Back to article' : 'Back to all articles'}
        </button>
      </div>

      <PageHeader
        title={isEditing ? 'Edit Article' : 'New Article'}
        description={isEditing ? `Editing "${article?.title}"` : 'Create a new news article'}
      />

      <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-dark-border shadow-sm p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input label="Title" error={errors.title?.message} {...register('title')} />
            <Input label="Author Name" error={errors.authorName?.message} {...register('authorName')} />
          </div>

          <Input label="Excerpt" helperText="A short summary shown in listings" error={errors.excerpt?.message} {...register('excerpt')} />

          <Controller
            name="content"
            control={control}
            render={({ field }) => (
              <MarkdownEditor
                label="Content"
                value={field.value || ''}
                onChange={field.onChange}
                height={350}
                helperText="Supports Markdown: **bold**, *italic*, ## headings, - lists, [links](url), ![images](url)"
              />
            )}
          />
          {errors.content && <p className="text-red-500 text-xs -mt-3">{errors.content.message}</p>}

          {/* Image Upload */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Cover Image</label>
            {imagePreview ? (
              <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-dark-border">
                <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover" />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex flex-col items-center gap-2 p-6 border-2 border-dashed border-gray-300 dark:border-dark-border rounded-xl hover:border-brand-400 hover:bg-brand-50/50 dark:hover:bg-brand-900/10 transition-colors cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-dark-hover flex items-center justify-center">
                  <Upload size={18} className="text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Upload Cover Image</p>
                <p className="text-xs text-gray-400">JPEG, PNG, GIF, WEBP — max 5MB</p>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={handleImageSelected}
            />
          </div>

          <Controller
            name="category"
            control={control}
            render={({ field }) => (
              <Select
                label="Category"
                options={categoryOptions}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
              />
            )}
          />

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input type="checkbox" {...register('isPublished')} className="rounded border-gray-300" />
              Published
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input type="checkbox" {...register('isFeatured')} className="rounded border-gray-300" />
              Featured
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-dark-border">
            <Button variant="secondary" type="button" onClick={() => navigate(isEditing && article ? `/news/${article.id}` : '/news')}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting} leftIcon={isEditing ? <Save size={16} /> : <PlusCircle size={16} />}>
              {isEditing ? 'Save Changes' : 'Create Article'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
