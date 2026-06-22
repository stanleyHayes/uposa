// @ts-nocheck
import { useState, useMemo, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusCircle, Pencil, Trash2, Newspaper, CheckCircle, Archive } from 'lucide-react'
import { FileEdit } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Select from '../../components/ui/Select'
import SearchInput from '../../components/ui/SearchInput'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'
import Pagination from '../../components/ui/Pagination'
import ViewToggle, { type ViewMode } from '../../components/ui/ViewToggle'
import PageStats from '../../components/ui/PageStats'
import RoleGate from '../../components/auth/RoleGate'
import { adminNewsApi } from '../../api/services'
import { useActivityStore } from '../../stores/activity.store'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { formatDate } from '../../utils/formatters'
import type { News } from '../../types'

export default function NewsPage() {
  const navigate = useNavigate()
  const { addActivity } = useActivityStore()
  const { currentUser } = useAuth()
  const { toast } = useToast()

  const [articles, setArticles] = useState<News[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [deleteTarget, setDeleteTarget] = useState<News | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewMode, setViewMode] = useState<ViewMode>('table')

  const fetchArticles = useCallback(async () => {
    try {
      setLoading(true)
      const res = await adminNewsApi.list({ limit: 100 })
      setArticles(res.data.data || [])
    } catch {
      toast.error('Failed to load articles')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchArticles()
  }, [fetchArticles])

  const stats = useMemo(() => ({
    total: articles.length,
    published: articles.filter((a) => a.isPublished).length,
    drafts: articles.filter((a) => !a.isPublished).length,
    featured: articles.filter((a) => a.isFeatured).length,
  }), [articles])

  const filteredArticles = useMemo(() => {
    let result = articles
    if (search) {
      const q = search.toLowerCase()
      result = result.filter((a) => a.title.toLowerCase().includes(q) || a.excerpt.toLowerCase().includes(q) || a.authorName.toLowerCase().includes(q))
    }
    if (statusFilter === 'published') {
      result = result.filter((a) => a.isPublished)
    } else if (statusFilter === 'draft') {
      result = result.filter((a) => !a.isPublished)
    }
    return result
  }, [articles, search, statusFilter])

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setCurrentPage(1)
  }

  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value)
    setCurrentPage(1)
  }

  const filterStatusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'published', label: 'Published' },
    { value: 'draft', label: 'Draft' },
  ]

  const handleDelete = async () => {
    if (!deleteTarget || !currentUser) return
    try {
      await adminNewsApi.delete(deleteTarget.id)
      addActivity({ action: 'deleted news article', targetType: deleteTarget.title, targetId: deleteTarget.id, performedBy: currentUser.id, performedByName: currentUser.name })
      toast.success('Article deleted')
      setDeleteTarget(null)
      fetchArticles()
    } catch {
      toast.error('Failed to delete article')
    }
  }

  return (
    <div className="page-enter">
      <PageHeader
        title="News & Announcements"
        description={`${articles.length} articles`}
        actions={
          <RoleGate permission="news:create">
            <Button leftIcon={<PlusCircle size={16} />} onClick={() => navigate('/news/new')}>
              New Article
            </Button>
          </RoleGate>
        }
      />

      <PageStats
        stats={[
          { label: 'Total Articles', value: stats.total, icon: Newspaper, color: 'text-brand-600', bg: 'bg-brand-50', border: 'border-brand-100' },
          { label: 'Published', value: stats.published, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
          { label: 'Drafts', value: stats.drafts, icon: FileEdit, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
          { label: 'Featured', value: stats.featured, icon: Archive, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' },
        ]}
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <SearchInput value={search} onChange={handleSearchChange} placeholder="Search articles..." className="flex-1" />
        <Select
          options={filterStatusOptions}
          value={statusFilter}
          onChange={handleStatusFilterChange}
          className="sm:w-44"
        />
        <ViewToggle view={viewMode} onChange={(v) => { setViewMode(v); setCurrentPage(1) }} />
      </div>

      <div className="admin-card-surface overflow-hidden">
        {loading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="grid gap-3 border-b border-brand-950/10 pb-3 last:border-b-0 md:grid-cols-[1.4fr_0.8fr_0.7fr_0.6fr]">
                <div className="space-y-2">
                  <div className="h-4 w-56 animate-pulse bg-brand-950/10 dark:bg-dark-hover" />
                  <div className="h-3 w-72 max-w-full animate-pulse bg-brand-950/5 dark:bg-dark-hover" />
                </div>
                <div className="h-4 w-28 animate-pulse bg-brand-950/10 dark:bg-dark-hover" />
                <div className="h-4 w-20 animate-pulse bg-brand-950/10 dark:bg-dark-hover" />
                <div className="h-4 w-16 animate-pulse bg-brand-950/10 dark:bg-dark-hover" />
              </div>
            ))}
          </div>
        ) : filteredArticles.length === 0 ? (
          <EmptyState
            icon={<Newspaper size={40} />}
            title={search || statusFilter !== 'all' ? 'No matching results' : 'No articles yet'}
            description={search || statusFilter !== 'all' ? 'Try adjusting your search or filters.' : 'Publish your first news article.'}
            action={
              !(search || statusFilter !== 'all') ? (
                <RoleGate permission="news:create">
                  <Button leftIcon={<PlusCircle size={16} />} onClick={() => navigate('/news/new')}>
                    New Article
                  </Button>
                </RoleGate>
              ) : undefined
            }
          />
        ) : viewMode === 'table' ? (
          <div className="overflow-x-auto">
            <table className="data-table w-full text-sm">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-50/50 dark:from-dark-hover dark:to-dark-hover/50 border-b-2 border-gray-100 dark:border-dark-border">
                <tr>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Article</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Author</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Published</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {filteredArticles.slice((currentPage - 1) * 10, currentPage * 10).map((article) => (
                  <tr key={article.id} className="border-b border-gray-50 dark:border-dark-border cursor-pointer hover:bg-gray-50/80 dark:hover:bg-dark-hover/50 hover:-translate-y-px transition-all" onClick={() => navigate(`/news/${article.id}`)}>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-gray-900 dark:text-gray-100 line-clamp-1">{article.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">{article.excerpt}</p>
                    </td>
                    <td className="px-5 py-3.5 text-gray-700 dark:text-gray-300 text-xs">{article.authorName}</td>
                    <td className="px-5 py-3.5">
                      <Badge variant={article.category.toLowerCase() as any} label={article.category.replace('_', ' ')} />
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge
                        variant={article.isPublished ? 'published' : 'draft'}
                        label={article.isPublished ? 'Published' : 'Draft'}
                      />
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400 text-xs">
                      {article.publishedAt ? formatDate(article.publishedAt) : <span className="text-gray-300 dark:text-gray-600">--</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <RoleGate permission="news:edit">
                          <button
                            onClick={() => navigate(`/news/${article.id}/edit`)}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-brand-50 dark:hover:bg-brand-900/30 hover:text-brand-600 transition-all duration-150"
                          >
                            <Pencil size={15} />
                          </button>
                        </RoleGate>
                        <RoleGate permission="news:delete">
                          <button
                            onClick={() => setDeleteTarget(article)}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 transition-all duration-150"
                          >
                            <Trash2 size={15} />
                          </button>
                        </RoleGate>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {filteredArticles.slice((currentPage - 1) * 9, currentPage * 9).map((article) => (
              <div key={article.id} className="admin-card-surface overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group" onClick={() => navigate(`/news/${article.id}`)}>
                {article.imageUrl ? (
                  <img src={article.imageUrl} alt={article.title} className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-40 bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-900/30 dark:to-brand-800/20 flex items-center justify-center">
                    <Newspaper size={32} className="text-brand-300" />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant={article.isPublished ? 'active' : 'draft'} label={article.isPublished ? 'Published' : 'Draft'} />
                    <span className="text-xs text-gray-400">{article.category}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 line-clamp-1">{article.title}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">{article.excerpt || article.content?.slice(0, 120)}</p>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{article.authorName || 'Unknown'}</span>
                    <span>{article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : '—'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="px-4 border-t border-gray-100 dark:border-dark-border">
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(filteredArticles.length / (viewMode === 'table' ? 10 : 9))}
            totalItems={filteredArticles.length}
            itemsPerPage={viewMode === 'table' ? 10 : 9}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Article"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  )
}
