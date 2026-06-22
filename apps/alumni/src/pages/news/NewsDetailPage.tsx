import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { ArrowLeft, CalendarDays, Clock, FileText, Newspaper, User } from 'lucide-react'
import PageTransition from '../../components/common/PageTransition'
import { newsApi } from '../../api/services'
import { formatDate, formatEnum } from '../../utils/formatters'
import MarkdownContent from '../../components/common/MarkdownContent'
import type { News } from '../../types'

function DetailSkeleton() {
  return (
    <PageTransition>
      <div className="space-y-5">
        <div className="h-11 w-36 animate-pulse bg-base-300/45 rounded-[14px_3px_14px_3px]" />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="overflow-hidden border border-primary/8 bg-base-100 rounded-[28px_6px_28px_6px]">
            <div className="h-80 animate-pulse bg-base-300/45" />
            <div className="space-y-4 p-6">
              <div className="h-4 w-28 animate-pulse bg-base-300/45" />
              <div className="h-9 w-4/5 animate-pulse bg-base-300/55" />
              <div className="h-4 w-full animate-pulse bg-base-300/35" />
              <div className="h-4 w-5/6 animate-pulse bg-base-300/35" />
              <div className="h-4 w-2/3 animate-pulse bg-base-300/35" />
            </div>
          </div>
          <div className="h-64 animate-pulse bg-base-300/35 rounded-[24px_4px_24px_4px]" />
        </div>
      </div>
    </PageTransition>
  )
}

function MetaBlock({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 border border-primary/8 bg-base-200/45 p-4 rounded-[18px_4px_18px_4px]">
      <span className="grid h-10 w-10 shrink-0 place-items-center bg-primary/8 text-primary rounded-[14px_3px_14px_3px]">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-base-content/42">{label}</span>
        <span className="mt-1 block text-sm font-bold leading-snug text-base-content">{value}</span>
      </span>
    </div>
  )
}

export default function NewsDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const [article, setArticle] = useState<News | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    newsApi.getBySlug(slug)
      .then((res) => setArticle(res.data.data || null))
      .catch(() => setArticle(null))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) return <DetailSkeleton />

  if (!article) {
    return (
      <PageTransition>
        <div className="flex min-h-[60vh] flex-col items-center justify-center border border-primary/10 bg-base-100/88 px-6 py-14 text-center shadow-[0_16px_44px_rgba(0,27,80,0.07)] rounded-[28px_6px_28px_6px]">
          <span className="grid h-16 w-16 place-items-center bg-primary/8 text-primary rounded-[18px_4px_18px_4px]">
            <Newspaper className="h-7 w-7" />
          </span>
          <h1 className="mt-5 text-2xl font-bold">Article not found</h1>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-base-content/55">This dispatch may have moved, expired, or is not available in the alumni portal.</p>
          <Link to="/news" className="btn btn-primary mt-6">
            <ArrowLeft className="h-4 w-4" />
            Back to news
          </Link>
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div className="relative space-y-5">
        <img
          src="/logo.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none fixed right-[-8rem] top-24 z-0 hidden h-[26rem] w-[26rem] object-contain opacity-[0.025] xl:block"
        />

        <Link
          to="/news"
          className="relative z-10 inline-flex items-center gap-2 border border-primary/10 bg-base-100/82 px-3 py-2 text-sm font-bold text-base-content/68 transition-colors hover:border-primary/20 hover:text-primary rounded-[14px_3px_14px_3px]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to news
        </Link>

        <div className="relative z-10 grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <article className="overflow-hidden border border-primary/10 bg-base-100/94 shadow-[0_20px_58px_rgba(0,27,80,0.08)] rounded-[28px_6px_28px_6px]">
            <header className="relative overflow-hidden bg-primary text-primary-content">
              {article.imageUrl ? (
                <img src={article.imageUrl} alt={article.title} className="absolute inset-0 h-full w-full object-cover opacity-34" />
              ) : (
                <img src="/logo.png" alt="" aria-hidden="true" className="absolute -right-16 -top-20 h-80 w-80 object-contain opacity-[0.055]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/62" />
              <div className="relative min-h-[22rem] p-5 sm:p-7 lg:p-8">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 bg-secondary px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-primary">
                    <FileText className="h-3.5 w-3.5" />
                    {formatEnum(article.category)}
                  </span>
                  {article.isFeatured && (
                    <span className="border border-primary-content/15 bg-primary-content/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-primary-content/72">Featured</span>
                  )}
                </div>
                <div className="flex min-h-[16rem] flex-col justify-end">
                  <h1 className="max-w-4xl text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">{article.title}</h1>
                  {article.excerpt && <p className="mt-4 max-w-3xl text-sm leading-relaxed text-primary-content/66 sm:text-base">{article.excerpt}</p>}
                </div>
              </div>
            </header>

            <div className="p-5 sm:p-7 lg:p-8">
              <MarkdownContent
                content={article.content}
                className="prose-lg prose-headings:font-bold prose-headings:text-primary prose-p:leading-relaxed prose-li:leading-relaxed"
              />
            </div>
          </article>

          <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
            <div className="overflow-hidden border border-primary/10 bg-base-100/90 shadow-[0_16px_44px_rgba(0,27,80,0.07)] rounded-[24px_4px_24px_4px]">
              <div className="h-1 bg-gradient-to-r from-secondary via-primary to-secondary" />
              <div className="p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-secondary">Dispatch details</p>
                <div className="mt-5 space-y-3">
                  <MetaBlock icon={CalendarDays} label="Published" value={formatDate(article.publishedAt || article.createdAt)} />
                  <MetaBlock icon={User} label="Author" value={article.authorName || 'UPOSA Desk'} />
                  <MetaBlock icon={Clock} label="Updated" value={formatDate(article.updatedAt)} />
                </div>
              </div>
            </div>

            <div className="border border-primary/10 bg-primary p-5 text-primary-content shadow-[0_18px_48px_rgba(0,27,80,0.13)] rounded-[24px_4px_24px_4px]">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-secondary">Newsroom</p>
              <h2 className="mt-2 text-xl font-bold leading-tight">Keep reading the association archive.</h2>
              <p className="mt-3 text-sm leading-relaxed text-primary-content/58">Return to the dispatch list for minutes, reports, announcements, and member stories.</p>
              <Link to="/news" className="mt-5 inline-flex w-full items-center justify-between bg-secondary px-4 py-3 text-sm font-bold text-primary">
                Browse all news
                <ArrowLeft className="h-4 w-4 rotate-180" />
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </PageTransition>
  )
}
