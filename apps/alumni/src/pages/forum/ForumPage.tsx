import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import {
  ArrowRight,
  Bell,
  Briefcase,
  Eye,
  Filter,
  GraduationCap,
  HeartHandshake,
  Lock,
  MessageSquare,
  Pin,
  Plus,
  Search,
  Send,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import PageTransition from '../../components/common/PageTransition'
import Modal from '../../components/ui/Modal'
import Avatar from '../../components/ui/Avatar'
import { forumApi } from '../../api/services'
import { useToast } from '../../hooks/useToast'
import { useSocketEvent } from '../../hooks/useSocket'
import { formatEnum, timeAgo, truncate } from '../../utils/formatters'
import type { ForumCategory, ForumPost } from '../../types'

type CategoryFilter = 'ALL' | ForumCategory

const categories: Array<{ value: ForumCategory; label: string; icon: LucideIcon }> = [
  { value: 'GENERAL', label: 'General', icon: MessageSquare },
  { value: 'ANNOUNCEMENTS', label: 'Announcements', icon: Bell },
  { value: 'CAREERS', label: 'Careers', icon: Briefcase },
  { value: 'EDUCATION', label: 'Education', icon: GraduationCap },
  { value: 'WELFARE', label: 'Welfare', icon: HeartHandshake },
]

const schema = z.object({
  title: z.string().min(3, 'Title is required'),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  category: z.enum(['GENERAL', 'ANNOUNCEMENTS', 'CAREERS', 'EDUCATION', 'WELFARE']),
})

type FormData = z.infer<typeof schema>

const categoryTone: Record<ForumCategory, string> = {
  GENERAL: 'bg-primary/8 text-primary',
  ANNOUNCEMENTS: 'bg-secondary/15 text-primary',
  CAREERS: 'bg-accent/10 text-accent',
  EDUCATION: 'bg-success/12 text-success',
  WELFARE: 'bg-warning/14 text-warning',
}

function StatTile({
  icon: Icon,
  label,
  value,
  detail,
  tone = 'bg-primary-content/[0.06] text-secondary',
}: {
  icon: LucideIcon
  label: string
  value: ReactNode
  detail: string
  tone?: string
}) {
  return (
    <div className="flex h-full flex-col border border-primary-content/10 bg-primary-content/[0.055] p-4 rounded-[18px_4px_18px_4px]">
      <span className={`grid h-10 w-10 place-items-center rounded-[14px_3px_14px_3px] ${tone}`}>
        <Icon className="h-4 w-4" />
      </span>
      <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.16em] text-primary-content/42">{label}</p>
      <p className="mt-2 truncate text-2xl font-bold text-secondary">{value}</p>
      <p className="mt-auto pt-2 text-xs font-semibold text-primary-content/45">{detail}</p>
    </div>
  )
}

function ForumSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="h-32 animate-pulse bg-base-300/40 rounded-[18px_4px_18px_4px]" />
        ))}
      </div>
      <div className="grid gap-3">
        {[0, 1, 2, 3, 4].map((item) => (
          <div key={item} className="border border-primary/8 bg-base-100/84 p-5 rounded-[24px_4px_24px_4px]">
            <div className="flex gap-4">
              <div className="h-12 w-12 animate-pulse bg-base-300/45 rounded-[16px_3px_16px_3px]" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-4/5 animate-pulse bg-base-300/55" />
                <div className="h-3 w-3/5 animate-pulse bg-base-300/35" />
                <div className="h-12 w-full animate-pulse bg-base-300/25 rounded-[14px_3px_14px_3px]" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function EmptyForum({ hasFilters, onCreate, onClear }: { hasFilters: boolean; onCreate: () => void; onClear: () => void }) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center border border-primary/10 bg-base-100/86 px-6 py-12 text-center shadow-[0_12px_34px_rgba(0,27,80,0.06)] rounded-[24px_4px_24px_4px]">
      <span className="grid h-16 w-16 place-items-center bg-primary/8 text-primary rounded-[18px_4px_18px_4px]">
        <MessageSquare className="h-7 w-7" />
      </span>
      <h2 className="mt-5 text-xl font-bold">No discussions found</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-base-content/55">
        {hasFilters ? 'Try clearing the search or switching categories.' : 'Start the first discussion and bring the alumni desk to life.'}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <button type="button" className="btn btn-primary min-h-11" onClick={onCreate}>
          <Plus className="h-4 w-4" />
          New post
        </button>
        {hasFilters && (
          <button type="button" className="btn min-h-11 border-primary/10 bg-base-200 text-primary hover:bg-base-300" onClick={onClear}>
            Clear filters
          </button>
        )}
      </div>
    </div>
  )
}

function PostCard({ post }: { post: ForumPost }) {
  const CategoryIcon = categories.find((item) => item.value === post.category)?.icon || MessageSquare

  return (
    <Link
      to={`/forum/${post.slug}`}
      className="group block overflow-hidden border border-primary/10 bg-base-100/90 shadow-[0_14px_38px_rgba(0,27,80,0.06)] transition-all hover:-translate-y-0.5 hover:border-primary/18 hover:shadow-[0_22px_55px_rgba(0,27,80,0.11)] rounded-[24px_4px_24px_4px]"
    >
      <div className="h-1 bg-gradient-to-r from-secondary via-primary to-secondary" />
      <div className="grid gap-4 p-5 sm:grid-cols-[52px_minmax(0,1fr)_auto] sm:items-start">
        <Avatar src={post.author?.photoUrl} name={post.author?.fullName || 'User'} size="md" />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {post.isPinned && <Pin className="h-4 w-4 text-secondary" />}
            {post.isLocked && <Lock className="h-4 w-4 text-base-content/38" />}
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ${categoryTone[post.category]}`}>
              <CategoryIcon className="h-3.5 w-3.5" />
              {formatEnum(post.category)}
            </span>
          </div>
          <h2 className="mt-3 line-clamp-2 text-xl font-bold leading-tight text-base-content">{post.title}</h2>
          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-base-content/58">{truncate(post.content, 160)}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-semibold text-base-content/45">
            <span>{post.author?.fullName || 'Unknown member'}</span>
            <span>{timeAgo(post.createdAt)}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm font-bold text-base-content/45 sm:flex-col sm:items-end">
          <span className="inline-flex items-center gap-1.5">
            <MessageSquare className="h-4 w-4" />
            {post._count?.comments || 0}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Eye className="h-4 w-4" />
            {post.viewCount}
          </span>
          <span className="mt-auto hidden h-10 w-10 place-items-center bg-primary/8 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-content sm:grid rounded-[14px_3px_14px_3px]">
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  )
}

export default function ForumPage() {
  const [posts, setPosts] = useState<ForumPost[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<CategoryFilter>('ALL')
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const toast = useToast()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { category: 'GENERAL' },
  })

  const loadPosts = () => {
    setLoading(true)
    forumApi.posts(category !== 'ALL' ? { category } : undefined)
      .then((res) => setPosts(res.data.data || []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadPosts()
  }, [category])

  useSocketEvent('forum:newPost', (newPost: ForumPost) => {
    setPosts((prev) => [newPost, ...prev])
  })

  const filteredPosts = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return posts
    return posts.filter((post) =>
      post.title.toLowerCase().includes(query)
      || post.content.toLowerCase().includes(query)
      || post.author?.fullName.toLowerCase().includes(query)
    )
  }, [posts, search])

  const pinnedCount = posts.filter((post) => post.isPinned).length
  const lockedCount = posts.filter((post) => post.isLocked).length
  const totalComments = posts.reduce((sum, post) => sum + (post._count?.comments || 0), 0)
  const hasFilters = Boolean(search.trim() || category !== 'ALL')

  const clearFilters = () => {
    setSearch('')
    setCategory('ALL')
  }

  const onSubmit = async (data: FormData) => {
    setSubmitting(true)
    try {
      await forumApi.create(data)
      toast.success('Post created!')
      setModalOpen(false)
      reset()
      loadPosts()
    } catch {
      toast.error('Failed to create post')
    } finally {
      setSubmitting(false)
    }
  }

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
          <div className="relative grid gap-8 p-5 sm:p-7 lg:grid-cols-[minmax(0,1.08fr)_minmax(340px,0.92fr)] lg:p-8">
            <div className="min-w-0">
              <div className="mb-4 inline-flex items-center gap-2 border border-primary-content/15 bg-primary-content/10 px-3 py-2 text-xs font-semibold text-primary-content/70 rounded-[14px_3px_14px_3px]">
                <Sparkles className="h-4 w-4 text-secondary" />
                Alumni forum
              </div>
              <h1 className="max-w-3xl text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
                Keep alumni conversations organized and useful.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-primary-content/62 sm:text-base">
                Start discussions, follow pinned updates, and keep category threads easy to scan.
              </p>
              <button type="button" className="btn btn-secondary mt-6 min-h-12 px-5 text-primary" onClick={() => setModalOpen(true)}>
                <Plus className="h-4 w-4" />
                New post
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <StatTile icon={MessageSquare} label="Posts" value={posts.length} detail={`${filteredPosts.length} in current view`} />
              <StatTile icon={Send} label="Comments" value={totalComments} detail="Across loaded posts" tone="bg-secondary/18 text-primary" />
              <StatTile icon={Pin} label="Pinned" value={pinnedCount} detail="Priority threads" />
              <StatTile icon={Lock} label="Locked" value={lockedCount} detail="Closed discussions" />
            </div>
          </div>
        </section>

        <section className="relative z-10 border border-primary/10 bg-base-100/88 p-4 shadow-[0_12px_34px_rgba(0,27,80,0.05)] rounded-[24px_4px_24px_4px]">
          <div className="grid gap-3 lg:grid-cols-[minmax(260px,0.75fr)_minmax(0,1.25fr)_auto] lg:items-center">
            <label className="relative block">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-base-content/38" />
              <input
                type="text"
                className="input input-bordered h-12 w-full border-primary/10 bg-base-100 pl-11 text-sm focus:border-primary"
                placeholder="Search discussions..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>

            <div className="flex min-w-0 items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
              <button
                type="button"
                className={`btn btn-sm min-h-10 shrink-0 gap-2 ${category === 'ALL' ? 'btn-primary' : 'border-primary/10 bg-base-200 text-primary hover:bg-base-300'}`}
                onClick={() => setCategory('ALL')}
              >
                <Filter className="h-4 w-4" />
                All
              </button>
              {categories.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  className={`btn btn-sm min-h-10 shrink-0 ${category === item.value ? 'btn-primary' : 'border-primary/10 bg-base-200 text-primary hover:bg-base-300'}`}
                  onClick={() => setCategory(item.value)}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </button>
              ))}
            </div>

            <button type="button" className="btn btn-primary min-h-12 px-5" onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4" />
              Post
            </button>
          </div>
        </section>

        <section className="relative z-10 space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-secondary">Discussion board</p>
              <h2 className="mt-1 text-2xl font-bold">Current threads</h2>
            </div>
            <p className="max-w-xl text-sm leading-relaxed text-base-content/52">
              Pinned and locked threads stay marked so members can scan the board quickly.
            </p>
          </div>

          {loading ? (
            <ForumSkeleton />
          ) : filteredPosts.length === 0 ? (
            <EmptyForum hasFilters={hasFilters} onCreate={() => setModalOpen(true)} onClear={clearFilters} />
          ) : (
            <div className="grid gap-3">
              {filteredPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </section>

        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Discussion">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="rounded-[18px_4px_18px_4px] border border-primary/10 bg-base-200/45 p-4">
              <p className="text-sm font-bold text-base-content">Create a clear discussion thread.</p>
              <p className="mt-1 text-xs leading-relaxed text-base-content/52">Choose a category and write enough context for members to join in.</p>
            </div>

            <label className="form-control">
              <span className="label pb-2"><span className="text-xs font-bold uppercase tracking-[0.14em] text-base-content/50">Title</span></span>
              <input type="text" className={`input input-bordered h-12 border-primary/10 bg-base-100 focus:border-primary ${errors.title ? 'input-error' : ''}`} {...register('title')} />
              {errors.title && <span className="mt-2 text-xs font-semibold text-error">{errors.title.message}</span>}
            </label>

            <label className="form-control">
              <span className="label pb-2"><span className="text-xs font-bold uppercase tracking-[0.14em] text-base-content/50">Category</span></span>
              <select className="select select-bordered h-12 border-primary/10 bg-base-100 focus:border-primary" {...register('category')}>
                {categories.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </label>

            <label className="form-control">
              <span className="label pb-2"><span className="text-xs font-bold uppercase tracking-[0.14em] text-base-content/50">Content</span></span>
              <textarea className={`textarea textarea-bordered min-h-36 border-primary/10 bg-base-100 focus:border-primary ${errors.content ? 'textarea-error' : ''}`} {...register('content')} />
              {errors.content && <span className="mt-2 text-xs font-semibold text-error">{errors.content.message}</span>}
            </label>

            <button type="submit" className="btn btn-primary min-h-12 w-full gap-2 text-base" disabled={submitting}>
              {submitting ? (
                <span className="h-4 w-28 animate-pulse bg-primary-content/35" />
              ) : (
                <>
                  Create post
                  <Send className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </Modal>
      </div>
    </PageTransition>
  )
}
