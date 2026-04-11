import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  MessageSquare, Pin, X, Lock, Unlock, Trash2, Eye, EyeOff,
  Flag, CheckCircle, Send, ArrowLeft, AlertTriangle, ChevronRight,
} from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import Pagination from '../../components/ui/Pagination'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import PageStats from '../../components/ui/PageStats'
import SearchInput from '../../components/ui/SearchInput'
import { PageSkeleton } from '../../components/ui/Skeleton'
import RoleGate from '../../components/auth/RoleGate'
import { adminForumApi } from '../../api/services'
import { useActivityStore } from '../../stores/activity.store'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { formatDate } from '../../utils/formatters'
import { cn } from '../../utils/cn'
import type { ForumCategory, ForumThread, ForumReply, ThreadStatus, ReplyStatus } from '../../types'

const ITEMS_PER_PAGE = 10

const categoryOptions: { value: string; label: string }[] = [
  { value: '', label: 'All Categories' },
  { value: 'General', label: 'General' },
  { value: 'Announcements', label: 'Announcements' },
  { value: 'Career', label: 'Career' },
  { value: 'Alumni Stories', label: 'Alumni Stories' },
  { value: 'Feedback', label: 'Feedback' },
]

const statusOptions: { value: string; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'open', label: 'Open' },
  { value: 'pinned', label: 'Pinned' },
  { value: 'closed', label: 'Closed' },
  { value: 'deleted', label: 'Deleted' },
]

function categoryVariant(category: ForumCategory): 'active' | 'info' | 'warning' | 'success' | 'default' {
  switch (category) {
    case 'Announcements': return 'info'
    case 'Career': return 'success'
    case 'Alumni Stories': return 'warning'
    case 'Feedback': return 'active'
    default: return 'default'
  }
}

function replyStatusBadge(status: ReplyStatus) {
  switch (status) {
    case 'active': return { variant: 'success' as const, label: 'Active' }
    case 'hidden': return { variant: 'default' as const, label: 'Hidden' }
    case 'flagged': return { variant: 'warning' as const, label: 'Flagged' }
  }
}

export default function ForumPage() {
  const { addActivity } = useActivityStore()
  const { currentUser } = useAuth()
  const { toast } = useToast()

  const [threads, setThreads] = useState<ForumThread[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<ForumThread | null>(null)

  // Thread detail view
  const [selectedThread, setSelectedThread] = useState<ForumThread | null>(null)
  const [adminReply, setAdminReply] = useState('')
  const [deleteReplyTarget, setDeleteReplyTarget] = useState<ForumReply | null>(null)

  const fetchPosts = useCallback(async () => {
    try {
      const res = await adminForumApi.listPosts({ limit: 100 })
      setThreads((res.data.data || []) as ForumThread[])
    } catch {
      toast.error('Failed to load forum posts')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { fetchPosts() }, [fetchPosts])

  const stats = useMemo(() => ({
    total: threads.filter((t) => t.status !== 'deleted').length,
    open: threads.filter((t) => t.status === 'open').length,
    pinned: threads.filter((t) => t.status === 'pinned').length,
    flaggedReplies: 0,
  }), [threads])

  const filtered = useMemo(() => threads.filter((t) => {
    const matchesSearch =
      !search || t.title.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = !filterCategory || t.category === filterCategory
    const matchesStatus = !filterStatus || t.status === filterStatus
    return matchesSearch && matchesCategory && matchesStatus
  }), [threads, search, filterCategory, filterStatus])

  const threadReplies = useMemo((): ForumReply[] => {
    if (!selectedThread) return []
    // Replies may be embedded on the thread object from the API
    const embedded = (selectedThread as any).replies ?? (selectedThread as any).comments ?? []
    return [...embedded].sort((a: ForumReply, b: ForumReply) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  }, [selectedThread])

  const handlePin = async (thread: ForumThread) => {
    if (!currentUser) return
    try {
      await adminForumApi.togglePin(thread.id)
      const wasPinned = thread.status === 'pinned'
      addActivity({
        action: wasPinned ? 'unpinned forum thread' : 'pinned forum thread',
        targetType: thread.title,
        targetId: thread.id,
        performedBy: currentUser.id,
        performedByName: currentUser.name,
      })
      toast.success(wasPinned ? 'Thread unpinned' : 'Thread pinned')
      fetchPosts()
    } catch {
      toast.error('Failed to toggle pin')
    }
  }

  const handleToggleClose = async (thread: ForumThread) => {
    if (!currentUser) return
    try {
      await adminForumApi.toggleLock(thread.id)
      const wasClosed = thread.status === 'closed'
      addActivity({
        action: wasClosed ? 'reopened forum thread' : 'closed forum thread',
        targetType: thread.title,
        targetId: thread.id,
        performedBy: currentUser.id,
        performedByName: currentUser.name,
      })
      toast.success(wasClosed ? 'Thread reopened' : 'Thread closed')
      fetchPosts()
    } catch {
      toast.error('Failed to toggle lock')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget || !currentUser) return
    try {
      await adminForumApi.deletePost(deleteTarget.id)
      addActivity({
        action: 'deleted forum thread',
        targetType: deleteTarget.title,
        targetId: deleteTarget.id,
        performedBy: currentUser.id,
        performedByName: currentUser.name,
      })
      toast.success('Thread deleted')
      setDeleteTarget(null)
      if (selectedThread?.id === deleteTarget.id) setSelectedThread(null)
      fetchPosts()
    } catch {
      toast.error('Failed to delete thread')
    }
  }

  const handleReplyStatusChange = (reply: ForumReply, newStatus: ReplyStatus) => {
    if (!currentUser) return
    // Reply status moderation -- not yet available in the admin API
    const actionLabel = newStatus === 'hidden' ? 'hid' : newStatus === 'active' ? 'restored' : 'flagged'
    addActivity({
      action: `${actionLabel} a reply on "${selectedThread?.title}"`,
      targetType: 'forum_reply',
      targetId: reply.id,
      performedBy: currentUser.id,
      performedByName: currentUser.name,
    })
    toast.success(`Reply ${actionLabel}`)
    fetchPosts()
  }

  const handleDeleteReply = async () => {
    if (!deleteReplyTarget || !currentUser) return
    try {
      await adminForumApi.deleteComment(deleteReplyTarget.id)
      addActivity({
        action: `deleted a reply on "${selectedThread?.title}"`,
        targetType: 'forum_reply',
        targetId: deleteReplyTarget.id,
        performedBy: currentUser.id,
        performedByName: currentUser.name,
      })
      toast.success('Reply deleted permanently')
      setDeleteReplyTarget(null)
      fetchPosts()
    } catch {
      toast.error('Failed to delete reply')
    }
  }

  const handleSendAdminReply = () => {
    if (!currentUser || !selectedThread || !adminReply.trim()) return
    // Admin reply posting -- not yet available in the admin API
    addActivity({
      action: `replied to forum thread "${selectedThread.title}"`,
      targetType: 'forum_reply',
      targetId: selectedThread.id,
      performedBy: currentUser.id,
      performedByName: currentUser.name,
    })
    setAdminReply('')
    toast.info('Admin reply endpoint not yet available')
  }

  if (loading) {
    return <PageSkeleton cols={7} rows={5} />
  }

  // Thread detail view
  if (selectedThread) {
    const freshThread = threads.find((t) => t.id === selectedThread.id) ?? selectedThread
    return (
      <div className="page-enter">
        <div className="mb-6">
          <button
            onClick={() => setSelectedThread(null)}
            className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors mb-4"
          >
            <ArrowLeft size={16} />
            Back to all threads
          </button>

          <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-dark-border shadow-sm p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <Badge variant={categoryVariant(freshThread.category)} label={freshThread.category} />
                  <Badge
                    variant={freshThread.status as ThreadStatus}
                    label={(freshThread.status || 'open').charAt(0).toUpperCase() + (freshThread.status || 'open').slice(1)}
                  />
                </div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{freshThread.title}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  by <span className="font-medium text-gray-700 dark:text-gray-300">{freshThread.authorName}</span>
                  {' · '}{freshThread.authorEmail}
                  {' · '}{formatDate(freshThread.createdAt)}
                </p>
              </div>
              <RoleGate permission="forum:moderate">
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handlePin(freshThread)}
                    title={freshThread.status === 'pinned' ? 'Unpin' : 'Pin'}
                    className="rounded-lg p-2 text-gray-400 hover:bg-brand-50 dark:hover:bg-brand-900/30 hover:text-brand-600 transition-all"
                  >
                    {freshThread.status === 'pinned' ? <X size={16} /> : <Pin size={16} />}
                  </button>
                  <button
                    onClick={() => handleToggleClose(freshThread)}
                    title={freshThread.status === 'closed' ? 'Reopen' : 'Close'}
                    className="rounded-lg p-2 text-gray-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/30 hover:text-yellow-600 transition-all"
                  >
                    {freshThread.status === 'closed' ? <Unlock size={16} /> : <Lock size={16} />}
                  </button>
                  <button
                    onClick={() => setDeleteTarget(freshThread)}
                    className="rounded-lg p-2 text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </RoleGate>
            </div>
            <div className="bg-gray-50 dark:bg-dark-hover rounded-lg p-4 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {freshThread.body}
            </div>
          </div>
        </div>

        {/* Replies section */}
        <div className="space-y-1 mb-6">
          <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">
            {threadReplies.length} {threadReplies.length === 1 ? 'Reply' : 'Replies'}
          </h2>

          {threadReplies.length === 0 ? (
            <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-dark-border shadow-sm p-8 text-center">
              <MessageSquare size={28} className="text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">No replies yet.</p>
            </div>
          ) : (
            <div className="space-y-3 stagger-fast">
              {threadReplies.map((reply) => {
                const badge = replyStatusBadge(reply.status)
                return (
                  <div
                    key={reply.id}
                    className={cn(
                      'card-enter bg-white dark:bg-dark-card rounded-xl border shadow-sm p-4 transition-all',
                      reply.status === 'flagged'
                        ? 'border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20'
                        : reply.status === 'hidden'
                        ? 'border-gray-200 dark:border-dark-border opacity-60'
                        : 'border-gray-200 dark:border-dark-border'
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {reply.authorName}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {reply.authorEmail}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            · {formatDate(reply.createdAt)}
                          </span>
                          {reply.status !== 'active' && (
                            <Badge variant={badge.variant} label={badge.label} />
                          )}
                        </div>

                        {reply.status === 'hidden' ? (
                          <p className="text-sm text-gray-400 dark:text-gray-500 italic">
                            This reply has been hidden by a moderator.
                          </p>
                        ) : (
                          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                            {reply.body}
                          </p>
                        )}

                        {reply.status === 'flagged' && (
                          <div className="flex items-center gap-1.5 mt-2 text-xs text-amber-600 dark:text-amber-400">
                            <AlertTriangle size={13} />
                            <span>This reply has been flagged for review</span>
                          </div>
                        )}
                      </div>

                      {/* Moderation actions */}
                      <RoleGate permission="forum:moderate">
                        <div className="flex items-center gap-0.5 shrink-0">
                          {reply.status === 'flagged' && (
                            <button
                              onClick={() => handleReplyStatusChange(reply, 'active')}
                              title="Approve (mark as active)"
                              className="rounded-lg p-1.5 text-gray-400 hover:bg-green-50 dark:hover:bg-green-900/30 hover:text-green-600 transition-all"
                            >
                              <CheckCircle size={15} />
                            </button>
                          )}
                          {reply.status === 'active' && (
                            <button
                              onClick={() => handleReplyStatusChange(reply, 'flagged')}
                              title="Flag for review"
                              className="rounded-lg p-1.5 text-gray-400 hover:bg-amber-50 dark:hover:bg-amber-900/30 hover:text-amber-600 transition-all"
                            >
                              <Flag size={15} />
                            </button>
                          )}
                          {reply.status !== 'hidden' ? (
                            <button
                              onClick={() => handleReplyStatusChange(reply, 'hidden')}
                              title="Hide reply"
                              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-hover hover:text-gray-600 transition-all"
                            >
                              <EyeOff size={15} />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleReplyStatusChange(reply, 'active')}
                              title="Show reply"
                              className="rounded-lg p-1.5 text-gray-400 hover:bg-green-50 dark:hover:bg-green-900/30 hover:text-green-600 transition-all"
                            >
                              <Eye size={15} />
                            </button>
                          )}
                          <button
                            onClick={() => setDeleteReplyTarget(reply)}
                            title="Delete permanently"
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 transition-all"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </RoleGate>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Admin reply box */}
        {freshThread.status !== 'closed' && freshThread.status !== 'deleted' && (
          <RoleGate permission="forum:moderate">
            <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-dark-border shadow-sm p-4">
              <label className="text-sm font-semibold text-gray-900 dark:text-gray-100 block mb-2">
                Reply as Admin
              </label>
              <textarea
                value={adminReply}
                onChange={(e) => setAdminReply(e.target.value)}
                placeholder="Write an admin response..."
                rows={3}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-dark-hover dark:text-gray-100 dark:placeholder:text-gray-500 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              />
              <div className="flex justify-end mt-2">
                <Button
                  onClick={handleSendAdminReply}
                  disabled={!adminReply.trim()}
                  leftIcon={<Send size={14} />}
                  size="sm"
                >
                  Post Reply
                </Button>
              </div>
            </div>
          </RoleGate>
        )}

        {freshThread.status === 'closed' && (
          <div className="bg-gray-50 dark:bg-dark-hover rounded-xl border border-gray-200 dark:border-dark-border p-4 text-center">
            <Lock size={18} className="text-gray-400 mx-auto mb-1" />
            <p className="text-sm text-gray-500 dark:text-gray-400">This thread has been closed. Reopen it to allow replies.</p>
          </div>
        )}

        <ConfirmDialog
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          title="Delete Thread"
          message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
          confirmLabel="Delete"
        />

        <ConfirmDialog
          open={!!deleteReplyTarget}
          onClose={() => setDeleteReplyTarget(null)}
          onConfirm={handleDeleteReply}
          title="Delete Reply"
          message={`Permanently delete this reply by "${deleteReplyTarget?.authorName}"? This cannot be undone.`}
          confirmLabel="Delete"
        />
      </div>
    )
  }

  // Thread list view
  return (
    <div className="page-enter">
      <PageHeader
        title="Forum / Discussions"
        description={`${threads.filter((t) => t.status !== 'deleted').length} active threads`}
      />

      <PageStats
        stats={[
          { label: 'Total Threads', value: stats.total, icon: MessageSquare, color: 'text-brand-600', bg: 'bg-brand-50', border: 'border-brand-100' },
          { label: 'Open', value: stats.open, icon: Unlock, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
          { label: 'Pinned', value: stats.pinned, icon: Pin, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
          { label: 'Flagged Replies', value: stats.flaggedReplies, icon: Flag, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
        ]}
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <SearchInput
          value={search}
          onChange={(v) => { setSearch(v); setCurrentPage(1) }}
          placeholder="Search threads..."
          className="flex-1 min-w-[200px] max-w-xs"
        />
        <select
          value={filterCategory}
          onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1) }}
          className="rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-dark-hover dark:text-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          {categoryOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1) }}
          className="rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-dark-hover dark:text-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-dark-border shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<MessageSquare size={40} />}
            title={search || filterCategory || filterStatus ? 'No matching threads' : 'No threads found'}
            description={search || filterCategory || filterStatus ? 'Try adjusting your search or filters.' : 'Threads submitted from the client site will appear here.'}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table w-full text-sm">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-50/50 dark:from-dark-hover dark:to-dark-hover/50 border-b-2 border-gray-100 dark:border-dark-border">
                <tr>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Thread</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Author</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Replies</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map((thread) => {
                  const threadRepliesArr: ForumReply[] = (thread as any).replies ?? (thread as any).comments ?? []
                  const threadFlaggedCount = threadRepliesArr.filter(
                    (r) => r.status === 'flagged'
                  ).length
                  return (
                    <tr
                      key={thread.id}
                      className="border-b border-gray-50 dark:border-dark-border cursor-pointer hover:bg-gray-50/80 dark:hover:bg-dark-hover/50 transition-colors"
                      onClick={() => setSelectedThread(thread)}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 dark:text-gray-100 line-clamp-1">{thread.title}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 line-clamp-1 mt-0.5">{thread.body}</p>
                          </div>
                          {threadFlaggedCount > 0 && (
                            <span className="shrink-0 flex items-center gap-1 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 text-xs font-semibold px-1.5 py-0.5 rounded-full">
                              <Flag size={10} />
                              {threadFlaggedCount}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge
                          variant={categoryVariant(thread.category)}
                          label={thread.category}
                        />
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-gray-700 dark:text-gray-300 text-xs">{thread.authorName}</p>
                        <p className="text-gray-400 dark:text-gray-500 text-xs">{thread.authorEmail}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge
                          variant={thread.status as ThreadStatus}
                          label={(thread.status || 'open').charAt(0).toUpperCase() + (thread.status || 'open').slice(1)}
                        />
                      </td>
                      <td className="px-5 py-3.5 text-gray-700 dark:text-gray-300">{thread.replyCount}</td>
                      <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400 text-xs">{formatDate(thread.createdAt)}</td>
                      <td className="px-5 py-3.5">
                        <div className="inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setSelectedThread(thread)}
                            title="View thread & replies"
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-brand-50 dark:hover:bg-brand-900/30 hover:text-brand-600 transition-all duration-150"
                          >
                            <ChevronRight size={15} />
                          </button>
                          <RoleGate permission="forum:moderate">
                            {thread.status !== 'deleted' && (
                              <>
                                <button
                                  onClick={() => handlePin(thread)}
                                  title={thread.status === 'pinned' ? 'Unpin' : 'Pin'}
                                  className="rounded-lg p-1.5 text-gray-400 hover:bg-brand-50 dark:hover:bg-brand-900/30 hover:text-brand-600 transition-all duration-150"
                                >
                                  {thread.status === 'pinned' ? <X size={15} /> : <Pin size={15} />}
                                </button>
                                <button
                                  onClick={() => handleToggleClose(thread)}
                                  title={thread.status === 'closed' ? 'Reopen' : 'Close'}
                                  className="rounded-lg p-1.5 text-gray-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/30 hover:text-yellow-600 transition-all duration-150"
                                >
                                  {thread.status === 'closed' ? <Unlock size={15} /> : <Lock size={15} />}
                                </button>
                                <button
                                  onClick={() => setDeleteTarget(thread)}
                                  className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 transition-all duration-150"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </>
                            )}
                          </RoleGate>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="px-4 border-t border-gray-100 dark:border-dark-border">
          <Pagination currentPage={currentPage} totalPages={Math.ceil(filtered.length / ITEMS_PER_PAGE)} totalItems={filtered.length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setCurrentPage} />
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Thread"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  )
}
