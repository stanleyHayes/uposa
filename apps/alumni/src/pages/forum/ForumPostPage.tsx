import { BouncingDots } from "../../components/ui/BouncingDots";
import { useEffect, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router'
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  Lock,
  MessageSquare,
  Pin,
  Send,
  Sparkles,
  Trash2,
  UserRound,
  type LucideIcon,
} from 'lucide-react'
import PageTransition from '../../components/common/PageTransition'
import Avatar from '../../components/ui/Avatar'
import { forumApi } from '../../api/services'
import { useAuthStore } from '../../stores/auth.store'
import { useToast } from '../../hooks/useToast'
import { useSocketEvent } from '../../hooks/useSocket'
import { formatEnum, timeAgo } from '../../utils/formatters'
import type { ForumCategory, ForumComment, ForumPost } from '../../types'

const categoryTone: Record<ForumCategory, string> = {
  GENERAL: 'bg-primary/8 text-primary',
  ANNOUNCEMENTS: 'bg-secondary/15 text-primary',
  CAREERS: 'bg-accent/10 text-accent',
  EDUCATION: 'bg-success/12 text-success',
  WELFARE: 'bg-warning/14 text-warning',
}

function DetailSkeleton() {
  return (
    <PageTransition>
      <div className="relative space-y-6">
        <div className="h-10 w-36 animate-pulse bg-base-300/40" />
        <div className="h-80 animate-pulse bg-base-300/45 rounded-[28px_6px_28px_6px]" />
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="h-96 animate-pulse bg-base-300/35 rounded-[24px_4px_24px_4px]" />
          <div className="space-y-3">
            <div className="h-48 animate-pulse bg-base-300/35 rounded-[24px_4px_24px_4px]" />
            <div className="h-40 animate-pulse bg-base-300/35 rounded-[24px_4px_24px_4px]" />
          </div>
        </div>
      </div>
    </PageTransition>
  )
}

function MetaPill({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: ReactNode }) {
  return (
    <div className="border border-primary-content/10 bg-primary-content/[0.055] p-4 rounded-[18px_4px_18px_4px]">
      <span className="grid h-10 w-10 place-items-center bg-secondary/18 text-secondary rounded-[14px_3px_14px_3px]">
        <Icon className="h-4 w-4" />
      </span>
      <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.16em] text-primary-content/42">{label}</p>
      <p className="mt-2 truncate text-lg font-bold text-primary-content">{value}</p>
    </div>
  )
}

function DetailPanel({ icon: Icon, eyebrow, title, children }: { icon: LucideIcon; eyebrow: string; title: string; children: ReactNode }) {
  return (
    <section className="overflow-hidden border border-primary/10 bg-base-100/88 shadow-[0_14px_38px_rgba(0,27,80,0.06)] rounded-[24px_4px_24px_4px]">
      <div className="h-1 bg-gradient-to-r from-secondary via-primary to-secondary" />
      <div className="p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center bg-primary/8 text-primary rounded-[16px_3px_16px_3px]">
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-secondary">{eyebrow}</p>
            <h2 className="mt-1 text-xl font-bold leading-tight">{title}</h2>
          </div>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </section>
  )
}

function NotFoundState() {
  return (
    <PageTransition>
      <div className="flex min-h-96 flex-col items-center justify-center border border-primary/10 bg-base-100/86 px-6 py-12 text-center shadow-[0_12px_34px_rgba(0,27,80,0.06)] rounded-[24px_4px_24px_4px]">
        <span className="grid h-16 w-16 place-items-center bg-primary/8 text-primary rounded-[18px_4px_18px_4px]">
          <MessageSquare className="h-7 w-7" />
        </span>
        <h1 className="mt-5 text-2xl font-bold">Post not found</h1>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-base-content/55">
          This discussion may have been removed or unpublished.
        </p>
        <Link to="/forum" className="btn btn-primary mt-6 min-h-11">
          <ArrowLeft className="h-4 w-4" />
          Back to forum
        </Link>
      </div>
    </PageTransition>
  )
}

function CommentRow({
  comment,
  currentUserId,
  onDelete,
}: {
  comment: ForumComment
  currentUserId?: string
  onDelete: (id: string) => void
}) {
  return (
    <article className="grid gap-3 border border-primary/10 bg-base-100/86 p-4 shadow-[0_10px_28px_rgba(0,27,80,0.04)] sm:grid-cols-[44px_minmax(0,1fr)] rounded-[20px_4px_20px_4px]">
      <Avatar src={comment.author?.photoUrl} name={comment.author?.fullName || 'User'} size="sm" />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{comment.author?.fullName || 'Unknown member'}</p>
            <p className="text-xs font-semibold text-base-content/42">{timeAgo(comment.createdAt)}</p>
          </div>
          {comment.authorId === currentUserId && (
            <button type="button" className="btn btn-ghost btn-xs min-h-8 text-error" onClick={() => onDelete(comment.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-base-content/68">{comment.content}</p>
      </div>
    </article>
  )
}

export default function ForumPostPage() {
  const { slug } = useParams<{ slug: string }>()
  const user = useAuthStore((state) => state.user)
  const [post, setPost] = useState<ForumPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const toast = useToast()

  const loadPost = () => {
    if (!slug) return
    forumApi.getBySlug(slug)
      .then((res) => setPost(res.data.data || null))
      .catch(() => setPost(null))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadPost()
  }, [slug])

  useSocketEvent('forum:newComment', (newComment: ForumComment) => {
    setPost((prev) => {
      if (!prev || newComment.postId !== prev.id) return prev
      return { ...prev, comments: [...(prev.comments || []), newComment] }
    })
  })

  const handleComment = async () => {
    if (!post || !comment.trim()) return
    setSubmitting(true)
    try {
      await forumApi.addComment(post.id, { content: comment.trim() })
      setComment('')
      toast.success('Comment added!')
      loadPost()
    } catch {
      toast.error('Failed to add comment')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    try {
      await forumApi.deleteComment(commentId)
      toast.success('Comment deleted')
      loadPost()
    } catch {
      toast.error('Failed to delete comment')
    }
  }

  if (loading) return <DetailSkeleton />
  if (!post) return <NotFoundState />

  const commentCount = post.comments?.length || 0

  return (
    <PageTransition>
      <div className="relative space-y-6">
        <img
          src="/logo.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none fixed right-[-8rem] top-24 z-0 hidden h-[26rem] w-[26rem] object-contain opacity-[0.025] xl:block"
        />

        <Link to="/forum" className="btn min-h-10 border-primary/10 bg-base-100 text-primary hover:bg-base-200 rounded-[14px_3px_14px_3px]">
          <ArrowLeft className="h-4 w-4" />
          Back to forum
        </Link>

        <section className="relative z-10 overflow-hidden bg-primary text-primary-content shadow-[0_24px_80px_rgba(0,27,80,0.18)] rounded-[28px_6px_28px_6px]">
          <img src="/logo.png" alt="" aria-hidden="true" className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 object-contain opacity-[0.055]" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-secondary/80 to-transparent" />
          <div className="relative grid gap-8 p-5 sm:p-7 lg:grid-cols-[minmax(0,1.08fr)_minmax(340px,0.92fr)] lg:p-8">
            <div className="min-w-0">
              <div className="mb-4 inline-flex items-center gap-2 border border-primary-content/15 bg-primary-content/10 px-3 py-2 text-xs font-semibold text-primary-content/70 rounded-[14px_3px_14px_3px]">
                <Sparkles className="h-4 w-4 text-secondary" />
                Discussion thread
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {post.isPinned && <Pin className="h-4 w-4 text-secondary" />}
                {post.isLocked && <Lock className="h-4 w-4 text-primary-content/50" />}
                <span className={`inline-flex items-center px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ${categoryTone[post.category]}`}>
                  {formatEnum(post.category)}
                </span>
              </div>
              <h1 className="mt-4 max-w-3xl text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">{post.title}</h1>
              <div className="mt-5 flex items-center gap-3">
                <Avatar src={post.author?.photoUrl} name={post.author?.fullName || 'User'} size="sm" />
                <div className="min-w-0 text-sm">
                  <p className="truncate font-bold text-primary-content">{post.author?.fullName || 'Unknown member'}</p>
                  <p className="text-primary-content/48">{timeAgo(post.createdAt)}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <MetaPill icon={Eye} label="Views" value={post.viewCount} />
              <MetaPill icon={MessageSquare} label="Comments" value={commentCount} />
              <MetaPill icon={Pin} label="Pinned" value={post.isPinned ? 'Yes' : 'No'} />
              <MetaPill icon={Lock} label="Status" value={post.isLocked ? 'Locked' : 'Open'} />
            </div>
          </div>
        </section>

        <div className="relative z-10 grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-4">
            <DetailPanel icon={MessageSquare} eyebrow="Original post" title="Discussion">
              <div className="prose max-w-none whitespace-pre-wrap text-base-content/72">
                {post.content}
              </div>
            </DetailPanel>

            <DetailPanel icon={Send} eyebrow="Comments" title={`${commentCount} response${commentCount === 1 ? '' : 's'}`}>
              {!post.isLocked ? (
                <div className="mb-5 grid gap-3 border border-primary/10 bg-base-200/40 p-4 sm:grid-cols-[44px_minmax(0,1fr)_auto] sm:items-start rounded-[20px_4px_20px_4px]">
                  <Avatar src={user?.photoUrl} name={user?.fullName || 'You'} size="sm" />
                  <textarea
                    className="textarea textarea-bordered min-h-20 border-primary/10 bg-base-100 focus:border-primary"
                    placeholder="Write a comment..."
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    onKeyDown={(event) => {
                      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') handleComment()
                    }}
                  />
                  <button className="btn btn-primary min-h-11 gap-2" onClick={handleComment} disabled={!comment.trim() || submitting}>
                    {submitting ? <BouncingDots /> : <Send className="h-4 w-4" />}
                  </button>
                </div>
              ) : (
                <div className="mb-5 flex items-center gap-3 border border-primary/10 bg-base-200/45 p-4 text-sm font-semibold text-base-content/58 rounded-[18px_4px_18px_4px]">
                  <Lock className="h-4 w-4 text-primary" />
                  <span>This discussion is locked. No new comments can be added.</span>
                </div>
              )}

              {commentCount > 0 ? (
                <div className="grid gap-3">
                  {post.comments?.map((item) => (
                    <CommentRow key={item.id} comment={item} currentUserId={user?.id} onDelete={handleDeleteComment} />
                  ))}
                </div>
              ) : (
                <div className="flex min-h-36 flex-col items-center justify-center border border-primary/10 bg-base-100/70 px-5 py-8 text-center rounded-[18px_4px_18px_4px]">
                  <MessageSquare className="h-8 w-8 text-base-content/25" />
                  <p className="mt-3 font-bold">No comments yet</p>
                  <p className="mt-1 text-sm text-base-content/50">Be the first to add a thoughtful response.</p>
                </div>
              )}
            </DetailPanel>
          </div>

          <aside className="space-y-4">
            <section className="overflow-hidden border border-primary/10 bg-base-100/88 shadow-[0_14px_38px_rgba(0,27,80,0.06)] rounded-[24px_4px_24px_4px]">
              <div className="h-1 bg-secondary" />
              <div className="p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-secondary">Author</p>
                <h2 className="mt-2 text-xl font-bold">Posted by</h2>
                <div className="mt-5 flex items-center gap-3 border border-primary/8 bg-base-200/35 p-3 rounded-[18px_4px_18px_4px]">
                  <Avatar src={post.author?.photoUrl} name={post.author?.fullName || 'User'} size="md" />
                  <div className="min-w-0">
                    <p className="truncate font-bold">{post.author?.fullName || 'Unknown member'}</p>
                    <p className="text-xs font-semibold text-base-content/42">{timeAgo(post.createdAt)}</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="overflow-hidden border border-primary/10 bg-base-100/88 shadow-[0_14px_38px_rgba(0,27,80,0.06)] rounded-[24px_4px_24px_4px]">
              <div className="p-5">
                <div className="flex items-start gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center bg-primary/8 text-primary rounded-[15px_3px_15px_3px]">
                    <UserRound className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-secondary">Thread state</p>
                    <h2 className="mt-1 text-lg font-bold">Conversation controls</h2>
                  </div>
                </div>
                <div className="mt-5 grid gap-2 text-sm text-base-content/58">
                  <div className="flex items-center justify-between border-b border-primary/8 py-3">
                    <span>Category</span>
                    <span className="font-bold text-base-content/76">{formatEnum(post.category)}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-primary/8 py-3">
                    <span>Pinned</span>
                    <span className="font-bold text-base-content/76">{post.isPinned ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <span>Locked</span>
                    <span className="font-bold text-base-content/76">{post.isLocked ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>
            </section>

            <section className="border border-primary/10 bg-primary p-5 text-primary-content shadow-[0_14px_38px_rgba(0,27,80,0.09)] rounded-[24px_4px_24px_4px]">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-secondary">Forum note</p>
              <p className="mt-3 text-sm leading-relaxed text-primary-content/62">
                Keep replies specific, respectful, and useful for alumni who may read the thread later.
              </p>
              <Link to="/forum" className="btn btn-secondary mt-5 min-h-11 w-full justify-between text-primary">
                Forum board
                <ArrowRight className="h-4 w-4" />
              </Link>
            </section>
          </aside>
        </div>
      </div>
    </PageTransition>
  )
}
