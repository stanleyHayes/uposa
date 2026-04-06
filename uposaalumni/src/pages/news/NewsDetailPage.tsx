import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router'
import { ArrowLeft, Clock, User } from 'lucide-react'
import PageTransition from '../../components/common/PageTransition'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { newsApi } from '../../api/services'
import { MOCK_NEWS } from '../../data/mock'
import { formatDate, formatEnum } from '../../utils/formatters'
import type { News } from '../../types'

export default function NewsDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const [article, setArticle] = useState<News | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) return
    newsApi.getBySlug(slug)
      .then((res) => setArticle(res.data.data || MOCK_NEWS.find((n) => n.slug === slug) || null))
      .catch(() => setArticle(MOCK_NEWS.find((n) => n.slug === slug) || null))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) return <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
  if (!article) return <div className="text-center py-16"><p>Article not found</p><Link to="/news" className="btn btn-primary mt-4">Back to News</Link></div>

  return (
    <PageTransition>
      <Link to="/news" className="btn btn-ghost btn-sm mb-4"><ArrowLeft className="w-4 h-4" /> Back to News</Link>

      <article className="max-w-3xl mx-auto">
        {article.imageUrl && <img src={article.imageUrl} alt={article.title} className="w-full h-64 md:h-96 object-cover rounded-xl mb-6" />}
        <span className="badge badge-ghost">{formatEnum(article.category)}</span>
        <h1 className="text-2xl md:text-4xl font-bold mt-3 mb-4">{article.title}</h1>
        <div className="flex items-center gap-4 text-sm text-base-content/60 mb-8">
          {article.authorName && <span className="flex items-center gap-1"><User className="w-4 h-4" />{article.authorName}</span>}
          <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{formatDate(article.publishedAt || article.createdAt)}</span>
        </div>
        <div className="prose max-w-none whitespace-pre-wrap">{article.content}</div>
      </article>
    </PageTransition>
  )
}
