import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusCircle, Pencil, Trash2, Megaphone, CheckCircle, AlertTriangle, Archive } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Select from '../../components/ui/Select'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'
import Pagination from '../../components/ui/Pagination'
import PageStats from '../../components/ui/PageStats'
import SearchInput from '../../components/ui/SearchInput'
import RoleGate from '../../components/auth/RoleGate'
import { useAnnouncementsStore } from '../../stores/announcements.store'
import { useActivityStore } from '../../stores/activity.store'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { formatDate } from '../../utils/formatters'
import type { AnnouncementType, AnnouncementStatus } from '../../types'

export default function AnnouncementsPage() {
  const navigate = useNavigate()
  const { announcements, deleteAnnouncement } = useAnnouncementsStore()
  const { addActivity } = useActivityStore()
  const { currentUser } = useAuth()
  const { toast } = useToast()

  const [currentPage, setCurrentPage] = useState(1)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  const statusFilterOpts = [
    { value: '', label: 'All Statuses' },
    { value: 'draft', label: 'Draft' },
    { value: 'published', label: 'Published' },
    { value: 'archived', label: 'Archived' },
  ]

  const typeFilterOpts = [
    { value: '', label: 'All Types' },
    { value: 'info', label: 'Info' },
    { value: 'warning', label: 'Warning' },
    { value: 'urgent', label: 'Urgent' },
    { value: 'success', label: 'Success' },
  ]

  const stats = useMemo(() => ({
    total: announcements.length,
    published: announcements.filter((a) => a.status === 'published').length,
    urgent: announcements.filter((a) => a.type === 'urgent').length,
    archived: announcements.filter((a) => a.status === 'archived').length,
  }), [announcements])

  const filtered = useMemo(() => announcements.filter((a) => {
    const matchesSearch = !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.body.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = !statusFilter || a.status === statusFilter
    const matchesType = !typeFilter || a.type === typeFilter
    return matchesSearch && matchesStatus && matchesType
  }), [announcements, search, statusFilter, typeFilter])

  const handleDelete = () => {
    if (!deleteTarget || !currentUser) return
    deleteAnnouncement(deleteTarget.id)
    addActivity({
      action: 'deleted announcement',
      targetType: deleteTarget.title,
      targetId: deleteTarget.id,
      performedBy: currentUser.id,
      performedByName: currentUser.name,
    })
    toast.success('Announcement deleted')
    setDeleteTarget(null)
  }

  return (
    <div className="page-enter">
      <PageHeader
        title="Announcements"
        description={`${announcements.length} announcements`}
        actions={
          <RoleGate permission="announcements:create">
            <Button leftIcon={<PlusCircle size={16} />} onClick={() => navigate('/announcements/new')}>
              New Announcement
            </Button>
          </RoleGate>
        }
      />

      <PageStats
        stats={[
          { label: 'Total', value: stats.total, icon: Megaphone, color: 'text-brand-600', bg: 'bg-brand-50', border: 'border-brand-100' },
          { label: 'Published', value: stats.published, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
          { label: 'Urgent', value: stats.urgent, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
          { label: 'Archived', value: stats.archived, icon: Archive, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' },
        ]}
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <SearchInput
          value={search}
          onChange={(v) => { setSearch(v); setCurrentPage(1) }}
          placeholder="Search announcements..."
          className="flex-1 max-w-xs"
        />
        <Select
          options={statusFilterOpts}
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1) }}
          className="w-40"
        />
        <Select
          options={typeFilterOpts}
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1) }}
          className="w-36"
        />
      </div>

      <div className="admin-card-surface overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Megaphone size={40} />}
            title={search || statusFilter || typeFilter ? 'No matching announcements' : 'No announcements yet'}
            description={search || statusFilter || typeFilter ? 'Try adjusting your search or filters.' : 'Create your first announcement to reach members.'}
            action={!search && !statusFilter && !typeFilter ? (
              <RoleGate permission="announcements:create">
                <Button leftIcon={<PlusCircle size={16} />} onClick={() => navigate('/announcements/new')}>
                  New Announcement
                </Button>
              </RoleGate>
            ) : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table w-full text-sm">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-50/50 dark:from-dark-hover dark:to-dark-hover/50 border-b-2 border-gray-100 dark:border-dark-border">
                <tr>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Announcement</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Audience</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Expires</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {filtered.slice((currentPage - 1) * 10, currentPage * 10).map((ann) => (
                  <tr
                    key={ann.id}
                    className="border-b border-gray-50 dark:border-dark-border cursor-pointer hover:bg-gray-50/80 dark:hover:bg-dark-hover/50 transition-colors"
                    onClick={() => navigate(`/announcements/${ann.id}`)}
                  >
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-gray-900 dark:text-gray-100 line-clamp-1">{ann.title}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">By {ann.createdBy}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge
                        variant={ann.type as AnnouncementType}
                        label={ann.type.charAt(0).toUpperCase() + ann.type.slice(1)}
                      />
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400 text-xs">{ann.targetAudience}</td>
                    <td className="px-5 py-3.5">
                      <Badge
                        variant={ann.status as AnnouncementStatus}
                        label={ann.status.charAt(0).toUpperCase() + ann.status.slice(1)}
                      />
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400 text-xs">
                      {ann.expiresAt ? formatDate(ann.expiresAt) : <span className="text-gray-300 dark:text-gray-600">&mdash;</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <RoleGate permission="announcements:edit">
                          <button
                            onClick={() => navigate(`/announcements/${ann.id}/edit`)}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-brand-50 dark:hover:bg-brand-900/30 hover:text-brand-600 transition-all duration-150"
                          >
                            <Pencil size={15} />
                          </button>
                        </RoleGate>
                        <RoleGate permission="announcements:delete">
                          <button
                            onClick={() => setDeleteTarget({ id: ann.id, title: ann.title })}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 transition-all duration-150"
                          >
                            <Trash2 size={15} />
                          </button>
                        </RoleGate>
                      </div>
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

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Announcement"
        message={`Are you sure you want to delete "${deleteTarget?.title}"?`}
        confirmLabel="Delete"
      />
    </div>
  )
}
