import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  ClipboardList,
  Clock,
  FileText,
  Image,
  LayoutGrid,
  List,
  Megaphone,
  Newspaper,
  PenLine,
  Search,
  Sparkles,
  User,
  type LucideIcon,
} from 'lucide-react'
import PageTransition from '../../components/common/PageTransition'
import ScrollReveal from '../../components/common/ScrollReveal'
import { newsApi } from '../../api/services'
import { formatDate, formatEnum, truncate } from '../../utils/formatters'
import type { News, NewsCategory } from '../../types'

type CategoryFilter = NewsCategory | ''
type DisplayMode = 'grid' | 'list'

const categories: Array<{ key: CategoryFilter; label: string; icon: LucideIcon }> = [
  { key: '', label: 'All', icon: Newspaper },
  { key: 'ANNOUNCEMENT', label: 'Announcements', icon: Megaphone },
  { key: 'BLOG', label: 'Stories', icon: PenLine },
  { key: 'REPORT', label: 'Reports', icon: FileText },
  { key: 'MEETING_SUMMARY', label: 'Minutes', icon: ClipboardList },
]

function CategoryPill({ category }: { category: NewsCategory }) {
  const active = categories.find((item) => item.key === category)
  const Icon = active?.icon || Newspaper

  return (
    <span className="inline-flex items-center gap-1.5 bg-secondary/14 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-primary">
      <Icon className="h-3.5 w-3.5" />
      {formatEnum(category)}
    </span>
  )
}

function MetaItem({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5 text-xs font-semibold text-base-content/48">
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{children}</span>
    </span>
  )
}

function ImageFrame({ article, compact = false }: { article: News; compact?: boolean }) {
  if (article.imageUrl) {
    return (
      <img
        src={article.imageUrl}
        alt={article.title}
        className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] ${compact ? 'min-h-24' : 'min-h-52'}`}
      />
    )
  }

  return (
    <div className="grid h-full min-h-52 place-items-center bg-primary text-primary-content">
      <div className="grid h-16 w-16 place-items-center bg-primary-content/10 text-secondary rounded-[18px_4px_18px_4px]">
        <Image className="h-7 w-7" />
      </div>
    </div>
  )
}

function ArticleCard({ article, index }: { article: News; index: number }) {
  return (
    <ScrollReveal delay={index * 0.04}>
      <Link
        to={`/news/${article.slug}`}
        className="group flex h-full flex-col overflow-hidden border border-primary/10 bg-base-100/92 shadow-[0_14px_38px_rgba(0,27,80,0.07)] transition-all hover:-translate-y-0.5 hover:border-primary/18 hover:shadow-[0_22px_55px_rgba(0,27,80,0.11)] rounded-[24px_4px_24px_4px]"
      >
        <div className="relative h-56 overflow-hidden bg-base-200">
          <ImageFrame article={article} />
          {article.isFeatured && (
            <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 bg-primary px-3 py-1.5 text-xs font-bold text-primary-content">
              <Sparkles className="h-3.5 w-3.5 text-secondary" />
              Featured
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col p-5">
          <div className="flex flex-wrap items-center gap-2">
            <CategoryPill category={article.category} />
            <MetaItem icon={Clock}>{formatDate(article.publishedAt || article.createdAt)}</MetaItem>
          </div>
          <h2 className="mt-4 line-clamp-2 text-xl font-bold leading-tight text-base-content">{article.title}</h2>
          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-base-content/58">
            {article.excerpt || truncate(article.content, 132)}
          </p>
          <div className="mt-auto flex items-center justify-between gap-4 pt-5">
            <MetaItem icon={User}>{article.authorName || 'UPOSA Desk'}</MetaItem>
            <span className="grid h-10 w-10 shrink-0 place-items-center bg-primary/8 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-content rounded-[14px_3px_14px_3px]">
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>
      </Link>
    </ScrollReveal>
  )
}

function ArticleRow({ article }: { article: News }) {
  return (
    <Link
      to={`/news/${article.slug}`}
      className="group grid gap-4 border border-primary/10 bg-base-100/86 p-3 transition-all hover:border-primary/18 hover:bg-base-100 hover:shadow-[0_16px_44px_rgba(0,27,80,0.08)] sm:grid-cols-[160px_minmax(0,1fr)_auto] sm:items-center rounded-[22px_4px_22px_4px]"
    >
      <div className="h-32 overflow-hidden bg-base-200 sm:h-28 rounded-[18px_3px_18px_3px]">
        <ImageFrame article={article} compact />
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <CategoryPill category={article.category} />
          {article.isFeatured && <span className="bg-primary px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-primary-content">Featured</span>}
        </div>
        <h2 className="mt-3 line-clamp-2 text-lg font-bold leading-tight text-base-content">{article.title}</h2>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-base-content/56">{article.excerpt || truncate(article.content, 118)}</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <MetaItem icon={Clock}>{formatDate(article.publishedAt || article.createdAt)}</MetaItem>
          <MetaItem icon={User}>{article.authorName || 'UPOSA Desk'}</MetaItem>
        </div>
      </div>
      <span className="hidden h-11 w-11 place-items-center bg-primary/8 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-content sm:grid rounded-[15px_3px_15px_3px]">
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  )
}

function NewsSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <div className="h-80 animate-pulse bg-base-300/45 rounded-[28px_6px_28px_6px]" />
        <div className="grid gap-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-24 animate-pulse bg-base-300/35 rounded-[20px_4px_20px_4px]" />
          ))}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((item) => (
          <div key={item} className="overflow-hidden border border-primary/8 bg-base-100 rounded-[24px_4px_24px_4px]">
            <div className="h-44 animate-pulse bg-base-300/45" />
            <div className="space-y-3 p-5">
              <div className="h-4 w-24 animate-pulse bg-base-300/45" />
              <div className="h-5 w-4/5 animate-pulse bg-base-300/55" />
              <div className="h-3 w-full animate-pulse bg-base-300/35" />
              <div className="h-3 w-2/3 animate-pulse bg-base-300/35" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function EmptyNews({ search, category }: { search: string; category: CategoryFilter }) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center border border-primary/10 bg-base-100/86 px-6 py-12 text-center shadow-[0_12px_34px_rgba(0,27,80,0.06)] rounded-[24px_4px_24px_4px]">
      <span className="grid h-16 w-16 place-items-center bg-primary/8 text-primary rounded-[18px_4px_18px_4px]">
        <Newspaper className="h-7 w-7" />
      </span>
      <h2 className="mt-5 text-xl font-bold">No dispatches found</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-base-content/55">
        {search || category ? 'Try a different search term or switch the category filter.' : 'New stories, reports, and association notices will appear here.'}
      </p>
    </div>
  )
}

export default function NewsPage() {
  const [articles, setArticles] = useState<News[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<CategoryFilter>('')
  const [displayMode, setDisplayMode] = useState<DisplayMode>('grid')

  useEffect(() => {
    setLoading(true)
    newsApi.list({ ...(category && { category }) })
      .then((res) => setArticles(res.data.data || []))
      .catch(() => setArticles([]))
      .finally(() => setLoading(false))
  }, [category])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return articles
    return articles.filter((article) => {
      const haystack = [article.title, article.excerpt, article.content, article.authorName, article.category].filter(Boolean).join(' ').toLowerCase()
      return haystack.includes(query)
    })
  }, [articles, search])

  const featured = filtered.find((article) => article.isFeatured) || filtered[0]
  const sideStories = filtered.filter((article) => article.id !== featured?.id).slice(0, 3)
  const bodyStories = featured ? filtered.filter((article) => article.id !== featured.id) : filtered
  const totalFeatured = articles.filter((article) => article.isFeatured).length

  return (
    <PageTransition>
      <div className="relative space-y-6">
        <img
          src="/logo.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none fixed right-[-8rem] top-24 z-0 hidden h-[26rem] w-[26rem] object-contain opacity-[0.025] xl:block"
        />

        <section className="relative z-10 overflow-hidden bg-primary text-primary-content shadow-[0_24px_80px_rgba(0,27,80,0.18)] rounded-[28px_6px_28px_6px]">
          <img src="/logo.png" alt="" aria-hidden="true" className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 object-contain opacity-[0.055]" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-secondary/80 to-transparent" />
          <div className="relative grid gap-8 p-5 sm:p-7 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:p-8">
            <div className="min-w-0">
              <div className="mb-4 inline-flex items-center gap-2 border border-primary-content/15 bg-primary-content/10 px-3 py-2 text-xs font-semibold text-primary-content/70 rounded-[14px_3px_14px_3px]">
                <Sparkles className="h-4 w-4 text-secondary" />
                Newsroom
              </div>
              <h1 className="max-w-3xl text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
                Association dispatches, minutes, and member stories.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-primary-content/62 sm:text-base">
                Follow the decisions, school milestones, alumni wins, and reports that keep the UPOSA network moving together.
              </p>
            </div>
            <div className="grid content-start gap-3 self-start">
              <div className="flex items-center justify-between gap-4 border border-primary-content/10 bg-primary-content/[0.06] px-4 py-3 rounded-[18px_4px_18px_4px]">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary-content/42">Published</p>
                <p className="text-3xl font-bold leading-none text-secondary">{articles.length}</p>
              </div>
              <div className="flex items-center justify-between gap-4 border border-primary-content/10 bg-primary-content/[0.06] px-4 py-3 rounded-[18px_4px_18px_4px]">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary-content/42">Featured</p>
                <p className="text-3xl font-bold leading-none text-secondary">{totalFeatured}</p>
              </div>
              <div className="flex items-center justify-between gap-4 border border-primary-content/10 bg-primary-content/[0.06] px-4 py-3 rounded-[18px_4px_18px_4px]">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary-content/42">Showing</p>
                <p className="text-3xl font-bold leading-none text-secondary">{filtered.length}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="relative z-10 border border-primary/10 bg-base-100/90 p-3 shadow-[0_14px_38px_rgba(0,27,80,0.06)] rounded-[24px_4px_24px_4px]">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex gap-2 overflow-x-auto pb-1 xl:pb-0">
              {categories.map((item) => {
                const isActive = category === item.key
                return (
                  <button
                    key={item.key || 'all'}
                    type="button"
                    className={`flex shrink-0 items-center gap-2 px-3 py-2 text-sm font-bold transition-colors rounded-[16px_3px_16px_3px] ${
                      isActive ? 'bg-primary text-primary-content shadow-[0_10px_22px_rgba(0,27,80,0.13)]' : 'bg-base-200/55 text-base-content/62 hover:bg-base-200 hover:text-primary'
                    }`}
                    onClick={() => setCategory(item.key)}
                  >
                    <item.icon className={`h-4 w-4 ${isActive ? 'text-secondary' : ''}`} />
                    {item.label}
                  </button>
                )
              })}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label className="relative min-w-0 sm:w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-base-content/38" />
                <input
                  type="text"
                  className="input input-bordered h-11 w-full border-primary/10 bg-base-200/45 pl-9 text-sm focus:border-primary focus:bg-base-100"
                  placeholder="Search dispatches"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
              <div className="grid grid-cols-2 gap-1 border border-primary/10 bg-base-200/45 p-1 rounded-[16px_3px_16px_3px]">
                <button type="button" aria-label="Grid view" onClick={() => setDisplayMode('grid')} className={`grid h-9 w-10 place-items-center rounded-[12px_3px_12px_3px] ${displayMode === 'grid' ? 'bg-primary text-primary-content' : 'text-base-content/45 hover:text-primary'}`}>
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button type="button" aria-label="List view" onClick={() => setDisplayMode('list')} className={`grid h-9 w-10 place-items-center rounded-[12px_3px_12px_3px] ${displayMode === 'list' ? 'bg-primary text-primary-content' : 'text-base-content/45 hover:text-primary'}`}>
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {loading ? (
          <NewsSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyNews search={search} category={category} />
        ) : (
          <>
            {featured && (
              <section className="relative z-10 grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
                <Link
                  to={`/news/${featured.slug}`}
                  className="group relative min-h-[25rem] overflow-hidden bg-primary text-primary-content shadow-[0_22px_60px_rgba(0,27,80,0.16)] rounded-[28px_6px_28px_6px]"
                >
                  {featured.imageUrl ? (
                    <img src={featured.imageUrl} alt={featured.title} className="absolute inset-0 h-full w-full object-cover opacity-35 transition-transform duration-500 group-hover:scale-[1.03]" />
                  ) : (
                    <img src="/logo.png" alt="" aria-hidden="true" className="absolute -right-16 -top-16 h-80 w-80 object-contain opacity-[0.06]" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/88 to-primary/62" />
                  <div className="relative flex min-h-[25rem] flex-col justify-end p-5 sm:p-7">
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 bg-secondary px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-primary">
                        <BookOpen className="h-3.5 w-3.5" />
                        Lead story
                      </span>
                      <span className="inline-flex items-center gap-1.5 border border-primary-content/15 bg-primary-content/10 px-3 py-1.5 text-xs font-semibold text-primary-content/72">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {formatDate(featured.publishedAt || featured.createdAt)}
                      </span>
                    </div>
                    <h2 className="max-w-3xl text-3xl font-bold leading-tight sm:text-4xl">{featured.title}</h2>
                    <p className="mt-4 max-w-2xl text-sm leading-relaxed text-primary-content/68 sm:text-base">
                      {featured.excerpt || truncate(featured.content, 170)}
                    </p>
                    <span className="mt-6 inline-flex w-fit items-center gap-2 bg-secondary px-4 py-3 text-sm font-bold text-primary transition-transform group-hover:translate-x-1">
                      Read dispatch
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </Link>

                <div className="grid gap-3">
                  {sideStories.length > 0 ? sideStories.map((article) => (
                    <ArticleRow key={article.id} article={article} />
                  )) : (
                    <div className="flex min-h-full flex-col justify-center border border-primary/10 bg-base-100/80 p-5 rounded-[24px_4px_24px_4px]">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-secondary">Newsroom queue</p>
                      <p className="mt-2 text-lg font-bold">More dispatches will appear here.</p>
                      <p className="mt-2 text-sm leading-relaxed text-base-content/55">The lead story is the only matching item for this filter right now.</p>
                    </div>
                  )}
                </div>
              </section>
            )}

            <section className="relative z-10 space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-secondary">Dispatch archive</p>
                  <h2 className="mt-1 text-2xl font-bold">Latest updates</h2>
                </div>
                <p className="text-sm font-semibold text-base-content/48">{filtered.length} article{filtered.length === 1 ? '' : 's'} matched</p>
              </div>

              {displayMode === 'grid' ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {(bodyStories.length > 0 ? bodyStories : filtered).map((article, index) => (
                    <ArticleCard key={article.id} article={article} index={index} />
                  ))}
                </div>
              ) : (
                <div className="grid gap-3">
                  {filtered.map((article) => (
                    <ArticleRow key={article.id} article={article} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </PageTransition>
  )
}
