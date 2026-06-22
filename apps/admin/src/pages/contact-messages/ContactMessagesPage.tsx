// @ts-nocheck
import { useState, useEffect, useCallback, useMemo } from 'react'
import { Mail, X, CheckCircle, Archive, MailOpen, Reply } from 'lucide-react'
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
import { formatDate } from '../../utils/formatters'
import type { ContactMessage } from '../../types'

type ContactMessageStatus = ContactMessage['status']

function statusVariant(status: ContactMessageStatus): 'warning' | 'active' | 'success' | 'archived' {
  switch (status) {
    case 'new': return 'warning'
    case 'read': return 'active'
    case 'replied': return 'success'
    case 'archived': return 'archived'
  }
}

export default function ContactMessagesPage() {
  const { addActivity } = useActivityStore()
  const { currentUser } = useAuth()
  const { toast } = useToast()

  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null)

  const fetchMessages = useCallback(async () => {
    try {
      const res = await adminContactApi.list({ limit: 100 })
      setMessages((res.data.data || []) as any)
    } catch {
      toast.error('Failed to load contact messages')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { fetchMessages() }, [fetchMessages])

  const stats = useMemo(() => ({
    total: messages.length,
    unread: messages.filter((m) => m.status === 'new').length,
    replied: messages.filter((m) => m.status === 'replied').length,
    archived: messages.filter((m) => m.status === 'archived').length,
  }), [messages])

  const statusFilterOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'new', label: 'New' },
    { value: 'read', label: 'Read' },
    { value: 'replied', label: 'Replied' },
    { value: 'archived', label: 'Archived' },
  ]

  const unreadCount = stats.unread

  const filtered = useMemo(() => messages.filter((m) => {
    const matchesSearch =
      !search ||
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.subject.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = !filterStatus || m.status === filterStatus
    return matchesSearch && matchesStatus
  }), [messages, search, filterStatus])

  const openMessage = async (msg: ContactMessage) => {
    setSelectedMessage(msg)
    if (msg.status === 'new') {
      try {
        await adminContactApi.markRead(msg.id)
        addActivity({
          action: 'read contact message',
          targetType: msg.subject,
          targetId: msg.id,
          performedBy: currentUser?.id ?? '',
          performedByName: currentUser?.name ?? '',
        })
        setSelectedMessage({ ...msg, status: 'read' })
        fetchMessages()
      } catch {
        toast.error('Failed to mark message as read')
      }
    }
  }

  const closeDrawer = () => {
    setSelectedMessage(null)
  }

  const handleMarkStatus = async (status: ContactMessageStatus) => {
    if (!selectedMessage || !currentUser) return
    try {
      await adminContactApi.markRead(selectedMessage.id)
      addActivity({
        action: `marked message as ${status}`,
        targetType: selectedMessage.subject,
        targetId: selectedMessage.id,
        performedBy: currentUser.id,
        performedByName: currentUser.name,
      })
      toast.success(`Message marked as ${status}`)
      setSelectedMessage({ ...selectedMessage, status })
      fetchMessages()
    } catch {
      toast.error(`Failed to mark message as ${status}`)
    }
  }

  const handleReplyEmail = () => {
    if (!selectedMessage) return
    window.open(
      `mailto:${selectedMessage.email}?subject=Re: ${encodeURIComponent(selectedMessage.subject)}`,
      '_blank'
    )
    handleMarkStatus('replied')
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
          { label: 'Total Messages', value: stats.total, icon: Mail, color: 'text-brand-600', bg: 'bg-brand-50', border: 'border-brand-100' },
          { label: 'New', value: stats.unread, icon: MailOpen, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
          { label: 'Replied', value: stats.replied, icon: Reply, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
          { label: 'Archived', value: stats.archived, icon: Archive, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' },
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
                title={search || filterStatus ? 'No matching messages' : 'No messages found'}
                description={search || filterStatus ? 'Try adjusting your search or filters.' : 'Contact form submissions from the client website will appear here.'}
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
                          msg.status === 'new' ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''
                        } ${selectedMessage?.id === msg.id ? 'bg-brand-50 dark:bg-brand-900/20' : ''}`}
                      >
                        <td className="px-5 py-3.5">
                          <p className={`text-gray-900 dark:text-gray-100 ${msg.status === 'new' ? 'font-semibold' : 'font-medium'}`}>
                            {msg.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{msg.email}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className={`line-clamp-1 ${msg.status === 'new' ? 'font-semibold text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'}`}>
                            {msg.subject}
                          </p>
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge
                            variant={statusVariant(msg.status || (msg.isRead ? 'read' : 'new'))}
                            label={(msg.status || (msg.isRead ? 'read' : 'new')).charAt(0).toUpperCase() + (msg.status || (msg.isRead ? 'read' : 'new')).slice(1)}
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
              </div>
            </div>

            {/* Actions */}
            <RoleGate permission="contact:manage">
              <div className="px-5 py-4 border-t border-gray-100 dark:border-dark-border space-y-2 shrink-0">
                <Button
                  variant="secondary"
                  className="w-full justify-center"
                  leftIcon={<MailOpen size={14} />}
                  onClick={handleReplyEmail}
                >
                  Reply via Email
                </Button>
                {selectedMessage.status !== 'read' && (
                  <Button
                    variant="secondary"
                    className="w-full justify-center"
                    leftIcon={<CheckCircle size={14} />}
                    onClick={() => handleMarkStatus('read')}
                  >
                    Mark as Read
                  </Button>
                )}
                {selectedMessage.status !== 'archived' && (
                  <Button
                    variant="secondary"
                    className="w-full justify-center"
                    leftIcon={<Archive size={14} />}
                    onClick={() => handleMarkStatus('archived')}
                  >
                    Archive
                  </Button>
                )}
              </div>
            </RoleGate>
          </div>
        )}
      </div>
    </div>
  )
}
