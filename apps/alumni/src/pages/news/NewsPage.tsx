import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { Newspaper, Clock, Search } from 'lucide-react'
import PageTransition from '../../components/common/PageTransition'
import PageHeader from '../../components/ui/PageHeader'
import ScrollReveal from '../../components/common/ScrollReveal'
import EmptyState from '../../components/ui/EmptyState'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { Card, CardBody, CardImage } from '../../components/ui/Card'
import ViewToggle, { type ViewMode } from '../../components/ui/ViewToggle'
import { newsApi } from '../../api/services'
import { formatDate, truncate, formatEnum } from '../../utils/formatters'
import type { News } from '../../types'

export default function NewsPage() {
  const [articles, setArticles] = useState<News[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  useEffect(() => {
    newsApi.list({ ...(category && { category }) })
      .then((res) => {
        const data = res.data.data
        setArticles(data || [])
      })
      .catch(() => setArticles([]))
      .finally(() => setLoading(false))
  }, [category])

  const filtered = articles.filter((a) =>
    a.title.toLowerCase().includes(search.toLowerCase())
  )

  const categories = ['', 'ANNOUNCEMENT', 'BLOG', 'REPORT', 'MEETING_SUMMARY']

  return (
    <PageTransition>
      <PageHeader title="News & Updates" description="Stay informed with the latest UPOSA news" />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="join">
          {categories.map((c) => (
            <button key={c} className={`join-item btn btn-sm ${category === c ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setCategory(c)}>
              {c ? formatEnum(c) : 'All'}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/50" />
          <input type="text" className="input input-sm input-bordered w-full pl-9" placeholder="Search news..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="ml-auto">
          <ViewToggle view={viewMode} onChange={setViewMode} />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Newspaper} title="No articles found" />
      ) : (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((article, i) => (
              <ScrollReveal key={article.id} delay={i * 0.05}>
                <Link to={`/news/${article.slug}`} className="block h-full">
                  <Card className="h-full" shape="slant">
                    {article.imageUrl && <CardImage src={article.imageUrl} alt={article.title} />}
                    <CardBody>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="badge badge-ghost badge-sm">{formatEnum(article.category)}</span>
                        {article.isFeatured && <span className="badge badge-secondary badge-sm">Featured</span>}
                      </div>
                      <h2 className="font-bold text-base mt-1">{article.title}</h2>
                      <p className="text-sm text-base-content/60">{article.excerpt || truncate(article.content)}</p>
                      <div className="mt-auto pt-3 flex items-center gap-3 text-xs text-base-content/50">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(article.publishedAt || article.createdAt)}</span>
                        {article.authorName && <span>{article.authorName}</span>}
                      </div>
                    </CardBody>
                  </Card>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-base-300">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Author</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((article) => (
                  <tr key={article.id} className="hover">
                    <td>
                      <Link to={`/news/${article.slug}`} className="font-medium link link-hover">
                        {article.title}
                      </Link>
                    </td>
                    <td><span className="badge badge-ghost badge-sm">{formatEnum(article.category)}</span></td>
                    <td>{article.authorName || '--'}</td>
                    <td className="whitespace-nowrap">{formatDate(article.publishedAt || article.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </PageTransition>
  )
}
