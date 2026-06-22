import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, Trash2, User, CalendarDays } from 'lucide-react'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import RoleGate from '../../components/auth/RoleGate'
import { adminNewsApi } from '../../api/services'
import { useActivityStore } from '../../stores/activity.store'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { formatDate } from '../../utils/formatters'
import type { News } from '../../types'

export default function NewsDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { addActivity } = useActivityStore()
  const { currentUser } = useAuth()
  const { toast } = useToast()

  const [article, setArticle] = useState<News | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const fetchArticle = useCallback(async () => {
    if (!id) return
    try {
      const res = await adminNewsApi.getById(id)
      setArticle((res.data as any).data)
    } catch {
      toast.error('Article not found')
      navigate('/news', { replace: true })
    } finally {
      setLoading(false)
    }
  }, [id, toast, navigate])

  useEffect(() => {
    fetchArticle()
  }, [fetchArticle])

  const handleDelete = async () => {
    if (!article || !currentUser) return
    try {
      await adminNewsApi.delete(article.id)
      addActivity({ action: 'deleted news article', targetType: article.title, targetId: article.id, performedBy: currentUser.id, performedByName: currentUser.name })
      toast.success('Article deleted')
      navigate('/news', { replace: true })
    } catch {
      toast.error('Failed to delete article')
    }
  }

  if (loading) {
    return (
      <div className="page-enter space-y-4">
        <div className="h-5 w-36 animate-pulse bg-brand-950/10 dark:bg-dark-hover" />
        <div className="admin-card-surface space-y-4 p-6">
          <div className="h-8 w-2/3 animate-pulse bg-brand-950/10 dark:bg-dark-hover" />
          <div className="h-4 w-48 animate-pulse bg-brand-950/10 dark:bg-dark-hover" />
          <div className="h-32 w-full animate-pulse bg-brand-950/5 dark:bg-dark-hover" />
        </div>
      </div>
    )
  }

  if (!article) return null

  return (
    <div className="page-enter">
      <div className="mb-6">
        <button
          onClick={() => navigate('/news')}
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          Back to all articles
        </button>

        {article.imageUrl && (
          <div className="rounded-xl overflow-hidden mb-6 border border-gray-200 dark:border-dark-border">
            <img src={article.imageUrl} alt={article.title} className="w-full h-64 object-cover" />
          </div>
        )}

        <div className="admin-card-surface p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge variant={article.category.toLowerCase() as any} label={article.category.replace('_', ' ')} />
                {article.isFeatured && (
                  <Badge variant="warning" label="Featured" />
                )}
                <Badge
                  variant={article.isPublished ? 'published' : 'draft'}
                  label={article.isPublished ? 'Published' : 'Draft'}
                />
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{article.title}</h1>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <RoleGate permission="news:edit">
                <Button size="sm" variant="secondary" leftIcon={<Pencil size={14} />} onClick={() => navigate(`/news/${article.id}/edit`)}>
                  Edit
                </Button>
              </RoleGate>
              <RoleGate permission="news:delete">
                <Button size="sm" variant="danger" leftIcon={<Trash2 size={14} />} onClick={() => setShowDeleteConfirm(true)}>
                  Delete
                </Button>
              </RoleGate>
            </div>
          </div>

          <div className="flex items-center gap-4 mb-6 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-1.5">
              <User size={14} className="text-gray-400" />
              <span>{article.authorName}</span>
            </div>
            {article.publishedAt && (
              <div className="flex items-center gap-1.5">
                <CalendarDays size={14} className="text-gray-400" />
                <span>{formatDate(article.publishedAt)}</span>
              </div>
            )}
          </div>

          <div className="bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800 rounded-lg p-4 mb-6 text-sm text-gray-700 dark:text-gray-300 italic">
            {article.excerpt}
          </div>

          <div className="bg-gray-50 dark:bg-dark-hover rounded-lg p-4 text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
            {article.content}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-dark-border flex items-center gap-6 text-xs text-gray-400 dark:text-gray-500">
            <span>Created: {formatDate(article.createdAt)}</span>
            <span>Updated: {formatDate(article.updatedAt)}</span>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Article"
        message={`Are you sure you want to delete "${article.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  )
}
