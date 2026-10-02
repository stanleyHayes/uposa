import { useState, useEffect, useCallback, useMemo } from 'react'
import { Mail, X, CheckCircle, Archive, ArchiveRestore, MailOpen, Reply } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import Pagination from '../../components/ui/Pagination'
import PageStats from '../../components/ui/PageStats'
import SearchInput from '../../components/ui/SearchInput'
import Select from '../../components/ui/Select'
import RoleGate from '../../components/auth/RoleGate'
import { PageSkeleton } from '../../components/ui/Skeleton'
import { adminContactApi } from '../../api/services'
import { useActivityStore } from '../../stores/activity.store'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { apiErrorMessage } from '../../utils/apiError'
import { formatDate } from '../../utils/formatters'
import type { ContactMessage, ContactMessageStatus } from '../../types'

type View = 'inbox' | 'archived'

// The API stores isRead / repliedAt / isArchived flags; derive the UI status from them.
function getStatus(m: ContactMessage): ContactMessageStatus {
  if (m.isArchived) return 'archived'
  if (m.repliedAt) return 'replied'
  return m.isRead ? 'read' : 'new'
}

function statusVariant(status: ContactMessageStatus): 'warning' | 'active' | 'success' | 'archived' {
  switch (status) {
    case 'new': return 'warning'
    case 'read': return 'active'
    case 'replied': return 'success'
    case 'archived': return 'archived'
  }
}

const viewOptions = [
  { value: 'inbox', label: 'Inbox' },
  { value: 'archived', label: 'Archived' },
]

const statusFilterOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'new', label: 'New' },
  { value: 'read', label: 'Read' },
  { value: 'replied', label: 'Replied' },
]

export default function ContactMessagesPage() {
  const { addActivity } = useActivityStore()
  const { currentUser } = useAuth()
  const { toast } = useToast()

  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [archivedTotal, setArchivedTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [search, setSearch] = useState('')
  const [view, setView] = useState<View>('inbox')
  const [filterStatus, setFilterStatus] = useState('')
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null)
  const [busy, setBusy] = useState(false)

  const fetchMessages = useCallback(async () => {
    try {
      const [res, archivedRes] = await Promise.all([
        adminContactApi.list({ limit: 100, archived: view === 'archived' }),
        adminContactApi.list({ limit: 1, archived: true }),
      ])
      setMessages((res.data.data || []) as ContactMessage[])
      setArchivedTotal(archivedRes.data.pagination?.total ?? 0)
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to load contact messages'))
    } finally {
      setLoading(false)
    }
  }, [toast, view])

  useEffect(() => { fetchMessages() }, [fetchMessages])

  const stats = useMemo(() => ({
    total: messages.length,
    unread: messages.filter((m) => getStatus(m) === 'new').length,
    replied: messages.filter((m) => getStatus(m) === 'replied').length,
  }), [messages])

  const unreadCount = stats.unread

  const filtered = useMemo(() => messages.filter((m) => {
    const matchesSearch =
      !search ||
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.subject.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = !filterStatus || getStatus(m) === filterStatus
    return matchesSearch && matchesStatus
  }), [messages, search, filterStatus])

  const logActivity = (action: string, msg: ContactMessage) => {
    addActivity({
      action,
      targetType: msg.subject,
      targetId: msg.id,
      performedBy: currentUser?.id ?? '',
      performedByName: currentUser?.name ?? '',
    })
  }

  const openMessage = async (msg: ContactMessage) => {
    setSelectedMessage(msg)
    if (getStatus(msg) === 'new') {
      try {
        await adminContactApi.markRead(msg.id)
        logActivity('read contact message', msg)
        setSelectedMessage({ ...msg, isRead: true })
        fetchMessages()
      } catch (err) {
        toast.error(apiErrorMessage(err, 'Failed to mark message as read'))
      }
    }
  }

  const closeDrawer = () => {
    setSelectedMessage(null)
  }

  const handleMarkRead = async () => {
    if (!selectedMessage || !currentUser) return
    setBusy(true)
    try {
      await adminContactApi.markRead(selectedMessage.id)
      logActivity('marked message as read', selectedMessage)
      toast.success('Message marked as read')
      setSelectedMessage({ ...selectedMessage, isRead: true })
      fetchMessages()
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to mark message as read'))
    } finally {
      setBusy(false)
    }
  }

  const handleReplyEmail = async () => {
    if (!selectedMessage || !currentUser) return
    window.open(
      `mailto:${selectedMessage.email}?subject=Re: ${encodeURIComponent(selectedMessage.subject)}`,
      '_blank'
    )
    setBusy(true)
    try {
      await adminContactApi.markReplied(selectedMessage.id)
      logActivity('marked message as replied', selectedMessage)
      toast.success('Message marked as replied')
      setSelectedMessage({ ...selectedMessage, isRead: true, repliedAt: new Date().toISOString() })
      fetchMessages()
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to mark message as replied'))
    } finally {
      setBusy(false)
    }
  }

  const handleArchive = async (archived: boolean) => {
    if (!selectedMessage || !currentUser) return
    setBusy(true)
    try {
      await adminContactApi.setArchived(selectedMessage.id, archived)
      logActivity(archived ? 'archived message' : 'restored message', selectedMessage)
      toast.success(archived ? 'Message archived' : 'Message moved to inbox')
      // It no longer belongs in the current view.
      setSelectedMessage(null)
      fetchMessages()
    } catch (err) {
      toast.error(apiErrorMessage(err, archived ? 'Failed to archive message' : 'Failed to restore message'))
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <PageSkeleton cols={4} rows={8} />

  return (
    <div className="page-enter">
      <PageHeader
        title="Contact Messages"
        description={
          unreadCount > 0
            ? `${messages.length} messages · ${unreadCount} new`
            : `${messages.length} messages`
        }
      />

      <PageStats
        stats={[
          { label: view === 'archived' ? 'Archived Shown' : 'Inbox', value: stats.total, icon: Mail, color: 'text-brand-600', bg: 'bg-brand-50', border: 'border-brand-100' },
          { label: 'New', value: stats.unread, icon: MailOpen, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
          { label: 'Replied', value: stats.replied, icon: Reply, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
          { label: 'Archived', value: archivedTotal, icon: Archive, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' },
        ]}
      />

      <div className="flex gap-6 h-full">
        {/* Main table */}
        <div className="flex-1 min-w-0">
          {/* Filters */}
          <div className="flex gap-3 mb-4">
            <SearchInput
              value={search}
              onChange={(v) => { setSearch(v); setCurrentPage(1) }}
              placeholder="Search messages..."
              className="flex-1 max-w-xs"
            />
            <Select
              options={viewOptions}
              value={view}
              onChange={(e) => { setView(e.target.value as View); setSelectedMessage(null); setCurrentPage(1) }}
              className="w-36"
            />
            <Select
              options={statusFilterOptions}
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1) }}
              className="w-40"
            />
          </div>

          <div className="admin-card-surface overflow-hidden">
            {filtered.length === 0 ? (
              <EmptyState
                icon={<Mail size={40} />}
                title={search || filterStatus ? 'No matching messages' : view === 'archived' ? 'No archived messages' : 'No messages found'}
                description={search || filterStatus ? 'Try adjusting your search or filters.' : view === 'archived' ? 'Archived messages will appear here.' : 'Contact form submissions from the client website will appear here.'}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table w-full text-sm">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-50/50 dark:from-dark-hover dark:to-dark-hover/50 border-b-2 border-gray-100 dark:border-dark-border">
                    <tr>
                      <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Sender</th>
                      <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Subject</th>
                      <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Received</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                    {filtered.slice((currentPage - 1) * 10, currentPage * 10).map((msg) => (
                      <tr
                        key={msg.id}
                        onClick={() => openMessage(msg)}
                        className={`border-b border-gray-50 dark:border-dark-border cursor-pointer ${
                          getStatus(msg) === 'new' ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''
                        } ${selectedMessage?.id === msg.id ? 'bg-brand-50 dark:bg-brand-900/20' : ''}`}
                      >
                        <td className="px-5 py-3.5">
                          <p className={`text-gray-900 dark:text-gray-100 ${getStatus(msg) === 'new' ? 'font-semibold' : 'font-medium'}`}>
                            {msg.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{msg.email}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className={`line-clamp-1 ${getStatus(msg) === 'new' ? 'font-semibold text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'}`}>
                            {msg.subject}
                          </p>
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge
                            variant={statusVariant(getStatus(msg))}
                            label={getStatus(msg).charAt(0).toUpperCase() + getStatus(msg).slice(1)}
                          />
                        </td>
                        <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400 text-xs">
                          {formatDate(msg.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="px-4 border-t border-gray-100 dark:border-dark-border">
              <Pagination currentPage={currentPage} totalPages={Math.ceil(filtered.length / 10)} totalItems={filtered.length} itemsPerPage={10} onPageChange={setCurrentPage} />
            </div>
          </div>
        </div>

        {/* Detail Drawer */}
        {selectedMessage && (
          <div className="w-96 shrink-0 admin-card-surface flex flex-col max-h-[calc(100vh-120px)] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-dark-border shrink-0">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Message Detail</h3>
              <button
                onClick={closeDrawer}
                className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-hover transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 px-5 py-4 space-y-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">From</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{selectedMessage.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{selectedMessage.email}</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Subject</p>
                <p className="text-sm text-gray-900 dark:text-gray-100">{selectedMessage.subject}</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Message</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{selectedMessage.message}</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Received</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(selectedMessage.createdAt)}</p>
                {selectedMessage.repliedAt && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Replied {formatDate(selectedMessage.repliedAt)}</p>}
                {selectedMessage.archivedAt && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Archived {formatDate(selectedMessage.archivedAt)}</p>}
              </div>
            </div>

            {/* Actions */}
            <RoleGate permission="contact:edit">
              <div className="px-5 py-4 border-t border-gray-100 dark:border-dark-border space-y-2 shrink-0">
                <Button
                  variant="secondary"
                  className="w-full justify-center"
                  leftIcon={<MailOpen size={14} />}
                  disabled={busy}
                  onClick={handleReplyEmail}
                >
                  Reply via Email
                </Button>
                {!selectedMessage.isRead && (
                  <Button
                    variant="secondary"
                    className="w-full justify-center"
                    leftIcon={<CheckCircle size={14} />}
                    disabled={busy}
                    onClick={handleMarkRead}
                  >
                    Mark as Read
                  </Button>
                )}
                <Button
                  variant="secondary"
                  className="w-full justify-center"
                  leftIcon={selectedMessage.isArchived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
                  disabled={busy}
                  onClick={() => handleArchive(!selectedMessage.isArchived)}
                >
                  {selectedMessage.isArchived ? 'Move to Inbox' : 'Archive'}
                </Button>
              </div>
            </RoleGate>
          </div>
        )}
      </div>
    </div>
  )
}
