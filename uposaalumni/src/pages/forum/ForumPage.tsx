import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { MessageSquare, Plus, Search, Pin, Lock, Eye } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import PageTransition from '../../components/common/PageTransition'
import PageHeader from '../../components/ui/PageHeader'
import ScrollReveal from '../../components/common/ScrollReveal'
import Modal from '../../components/ui/Modal'
import Avatar from '../../components/ui/Avatar'
import EmptyState from '../../components/ui/EmptyState'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { forumApi } from '../../api/services'
import { MOCK_FORUM_POSTS } from '../../data/mock'
import { useToast } from '../../hooks/useToast'
import { timeAgo, formatEnum } from '../../utils/formatters'
import type { ForumPost } from '../../types'

const schema = z.object({
  title: z.string().min(3, 'Title is required'),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  category: z.enum(['GENERAL', 'ANNOUNCEMENTS', 'CAREERS', 'EDUCATION', 'WELFARE']),
})

type FormData = z.infer<typeof schema>

export default function ForumPage() {
  const [posts, setPosts] = useState<ForumPost[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const toast = useToast()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { category: 'GENERAL' },
  })

  const loadPosts = () => {
    setLoading(true)
    forumApi.posts({ ...(category && { category }) })
      .then((res) => {
        const data = res.data.data
        setPosts(data?.length ? data : MOCK_FORUM_POSTS)
      })
      .catch(() => setPosts(MOCK_FORUM_POSTS))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadPosts() }, [category])

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

  const filtered = posts.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  )

  const categories = ['', 'GENERAL', 'ANNOUNCEMENTS', 'CAREERS', 'EDUCATION', 'WELFARE']

  return (
    <PageTransition>
      <PageHeader
        title="Forum"
        description="Discuss topics with fellow alumni"
        action={<button className="btn btn-primary btn-sm" onClick={() => setModalOpen(true)}><Plus className="w-4 h-4" /> New Post</button>}
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="join flex-wrap">
          {categories.map((c) => (
            <button key={c} className={`join-item btn btn-sm ${category === c ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setCategory(c)}>
              {c ? formatEnum(c) : 'All'}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/50" />
          <input type="text" className="input input-sm input-bordered w-full pl-9" placeholder="Search posts..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={MessageSquare} title="No posts found" description="Start a discussion!" action={
          <button className="btn btn-primary btn-sm" onClick={() => setModalOpen(true)}>Create First Post</button>
        } />
      ) : (
        <div className="space-y-2">
          {filtered.map((post, i) => (
            <ScrollReveal key={post.id} delay={i * 0.02}>
              <Link to={`/forum/${post.slug}`} className="card bg-base-100 border border-base-300 hover:bg-base-200/50 transition-colors">
                <div className="card-body p-4 flex-row items-center gap-4">
                  <Avatar src={post.author?.photoUrl} name={post.author?.fullName || 'User'} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {post.isPinned && <Pin className="w-3 h-3 text-secondary" />}
                      {post.isLocked && <Lock className="w-3 h-3 text-base-content/40" />}
                      <h3 className="font-semibold truncate">{post.title}</h3>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-base-content/50 mt-1">
                      <span>{post.author?.fullName}</span>
                      <span>{timeAgo(post.createdAt)}</span>
                      <span className="badge badge-ghost badge-xs">{formatEnum(post.category)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-base-content/60 shrink-0">
                    <span className="flex items-center gap-1"><MessageSquare className="w-4 h-4" />{post._count?.comments || 0}</span>
                    <span className="flex items-center gap-1"><Eye className="w-4 h-4" />{post.viewCount}</span>
                  </div>
                </div>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Discussion">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="form-control">
            <label className="label"><span className="label-text">Title *</span></label>
            <input type="text" className={`input input-bordered ${errors.title ? 'input-error' : ''}`} {...register('title')} />
            {errors.title && <label className="label"><span className="label-text-alt text-error">{errors.title.message}</span></label>}
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text">Category *</span></label>
            <select className="select select-bordered" {...register('category')}>
              {['GENERAL', 'ANNOUNCEMENTS', 'CAREERS', 'EDUCATION', 'WELFARE'].map((c) => (
                <option key={c} value={c}>{formatEnum(c)}</option>
              ))}
            </select>
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text">Content *</span></label>
            <textarea className={`textarea textarea-bordered h-32 ${errors.content ? 'textarea-error' : ''}`} {...register('content')} />
            {errors.content && <label className="label"><span className="label-text-alt text-error">{errors.content.message}</span></label>}
          </div>
          <button type="submit" className={`btn btn-primary w-full ${submitting ? 'loading' : ''}`} disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Post'}
          </button>
        </form>
      </Modal>
    </PageTransition>
  )
}
