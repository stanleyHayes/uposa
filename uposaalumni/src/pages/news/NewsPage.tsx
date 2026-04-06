import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { Newspaper, Clock, Search } from 'lucide-react'
import PageTransition from '../../components/common/PageTransition'
import PageHeader from '../../components/ui/PageHeader'
import ScrollReveal from '../../components/common/ScrollReveal'
import EmptyState from '../../components/ui/EmptyState'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { newsApi } from '../../api/services'
import { MOCK_NEWS } from '../../data/mock'
import { formatDate, truncate, formatEnum } from '../../utils/formatters'
import type { News } from '../../types'

export default function NewsPage() {
  const [articles, setArticles] = useState<News[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')

  useEffect(() => {
    newsApi.list({ ...(category && { category }) })
      .then((res) => {
        const data = res.data.data
        setArticles(data?.length ? data : MOCK_NEWS)
      })
      .catch(() => setArticles(MOCK_NEWS))
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
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Newspaper} title="No articles found" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((article, i) => (
            <ScrollReveal key={article.id} delay={i * 0.05}>
              <Link to={`/news/${article.slug}`} className="card bg-base-100 border border-base-300 hover:shadow-lg transition-shadow h-full">
                {article.imageUrl && <figure><img src={article.imageUrl} alt={article.title} className="h-48 w-full object-cover" /></figure>}
                <div className="card-body">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="badge badge-ghost badge-sm">{formatEnum(article.category)}</span>
                    {article.isFeatured && <span className="badge badge-secondary badge-sm">Featured</span>}
                  </div>
                  <h2 className="card-title text-base mt-1">{article.title}</h2>
                  <p className="text-sm text-base-content/60">{article.excerpt || truncate(article.content)}</p>
                  <div className="mt-auto pt-3 flex items-center gap-3 text-xs text-base-content/50">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(article.publishedAt || article.createdAt)}</span>
                    {article.authorName && <span>{article.authorName}</span>}
                  </div>
                </div>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      )}
    </PageTransition>
  )
}
