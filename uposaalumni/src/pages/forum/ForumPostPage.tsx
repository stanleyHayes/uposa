import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router'
import { ArrowLeft, MessageSquare, Eye, Pin, Lock, Send, Trash2 } from 'lucide-react'
import PageTransition from '../../components/common/PageTransition'
import Avatar from '../../components/ui/Avatar'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { forumApi } from '../../api/services'
import { MOCK_FORUM_POSTS } from '../../data/mock'
import { useAuthStore } from '../../stores/auth.store'
import { useToast } from '../../hooks/useToast'
import { timeAgo, formatEnum } from '../../utils/formatters'
import type { ForumPost } from '../../types'

export default function ForumPostPage() {
  const { slug } = useParams<{ slug: string }>()
  const user = useAuthStore((s) => s.user)
  const [post, setPost] = useState<ForumPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const toast = useToast()

  const loadPost = () => {
    if (!slug) return
    forumApi.getBySlug(slug)
      .then((res) => setPost(res.data.data || MOCK_FORUM_POSTS.find((p) => p.slug === slug) || null))
      .catch(() => setPost(MOCK_FORUM_POSTS.find((p) => p.slug === slug) || null))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadPost() }, [slug])

  const handleComment = async () => {
    if (!post || !comment.trim()) return
    setSubmitting(true)
    try {
      await forumApi.addComment(post.id, { content: comment })
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

  if (loading) return <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
  if (!post) return <div className="text-center py-16"><p>Post not found</p><Link to="/forum" className="btn btn-primary mt-4">Back to Forum</Link></div>

  return (
    <PageTransition>
      <Link to="/forum" className="btn btn-ghost btn-sm mb-4"><ArrowLeft className="w-4 h-4" /> Back to Forum</Link>

      <div className="max-w-3xl mx-auto space-y-6">
        <div className="card bg-base-100 border border-base-300">
          <div className="card-body">
            <div className="flex items-center gap-2 mb-2">
              {post.isPinned && <Pin className="w-4 h-4 text-secondary" />}
              {post.isLocked && <Lock className="w-4 h-4 text-base-content/40" />}
              <span className="badge badge-ghost badge-sm">{formatEnum(post.category)}</span>
            </div>
            <h1 className="text-2xl font-bold">{post.title}</h1>
            <div className="flex items-center gap-3 mt-2">
              <Avatar src={post.author?.photoUrl} name={post.author?.fullName || 'User'} size="sm" />
              <div className="text-sm">
                <span className="font-medium">{post.author?.fullName}</span>
                <span className="text-base-content/50 ml-2">{timeAgo(post.createdAt)}</span>
              </div>
            </div>
            <div className="divider" />
            <div className="prose max-w-none whitespace-pre-wrap">{post.content}</div>
            <div className="flex items-center gap-4 mt-4 text-sm text-base-content/50">
              <span className="flex items-center gap-1"><Eye className="w-4 h-4" />{post.viewCount} views</span>
              <span className="flex items-center gap-1"><MessageSquare className="w-4 h-4" />{post.comments?.length || 0} comments</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="font-semibold text-lg">Comments</h2>

          {!post.isLocked && (
            <div className="flex gap-3">
              <Avatar src={user?.photoUrl} name={user?.fullName || 'You'} size="sm" />
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  className="input input-bordered flex-1"
                  placeholder="Write a comment..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleComment()}
                />
                <button className={`btn btn-primary ${submitting ? 'loading' : ''}`} onClick={handleComment} disabled={!comment.trim() || submitting}>
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {post.isLocked && (
            <div className="alert">
              <Lock className="w-4 h-4" />
              <span>This discussion is locked. No new comments can be added.</span>
            </div>
          )}

          {post.comments && post.comments.length > 0 ? (
            <div className="space-y-3">
              {post.comments.map((c) => (
                <div key={c.id} className="flex gap-3">
                  <Avatar src={c.author?.photoUrl} name={c.author?.fullName || 'User'} size="sm" />
                  <div className="flex-1 bg-base-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <span className="font-medium">{c.author?.fullName}</span>
                        <span className="text-base-content/50 ml-2">{timeAgo(c.createdAt)}</span>
                      </div>
                      {c.authorId === user?.id && (
                        <button className="btn btn-ghost btn-xs text-error" onClick={() => handleDeleteComment(c.id)}>
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <p className="text-sm mt-1">{c.content}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-base-content/50 py-4">No comments yet. Be the first to comment!</p>
          )}
        </div>
      </div>
    </PageTransition>
  )
}
