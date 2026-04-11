import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, Trash2, Users, CalendarDays } from 'lucide-react'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import RoleGate from '../../components/auth/RoleGate'
import { useAnnouncementsStore } from '../../stores/announcements.store'
import { useActivityStore } from '../../stores/activity.store'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { formatDate } from '../../utils/formatters'
import type { AnnouncementType, AnnouncementStatus } from '../../types'

export default function AnnouncementDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { announcements, deleteAnnouncement } = useAnnouncementsStore()
  const { addActivity } = useActivityStore()
  const { currentUser } = useAuth()
  const { toast } = useToast()

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const announcement = announcements.find((a) => a.id === id)

  if (!announcement) {
    return (
      <div className="page-enter">
        <button
          onClick={() => navigate('/announcements')}
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          Back to Announcements
        </button>
        <div className="text-center py-16 text-gray-500">Announcement not found.</div>
      </div>
    )
  }

  const handleDelete = () => {
    if (!currentUser) return
    deleteAnnouncement(announcement.id)
    addActivity({
      action: 'deleted announcement',
      targetType: announcement.title,
      targetId: announcement.id,
      performedBy: currentUser.id,
      performedByName: currentUser.name,
    })
    toast.success('Announcement deleted')
    navigate('/announcements')
  }

  return (
    <div className="page-enter">
      <div className="mb-6">
        <button
          onClick={() => navigate('/announcements')}
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          Back to Announcements
        </button>

        <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-dark-border shadow-sm p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge
                  variant={announcement.type as AnnouncementType}
                  label={announcement.type.charAt(0).toUpperCase() + announcement.type.slice(1)}
                />
                <Badge
                  variant={announcement.status as AnnouncementStatus}
                  label={announcement.status.charAt(0).toUpperCase() + announcement.status.slice(1)}
                />
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{announcement.title}</h1>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <RoleGate permission="announcements:edit">
                <Button size="sm" variant="secondary" leftIcon={<Pencil size={14} />} onClick={() => navigate(`/announcements/${announcement.id}/edit`)}>
                  Edit
                </Button>
              </RoleGate>
              <RoleGate permission="announcements:delete">
                <Button size="sm" variant="danger" leftIcon={<Trash2 size={14} />} onClick={() => setShowDeleteConfirm(true)}>
                  Delete
                </Button>
              </RoleGate>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-1.5">
              <Users size={14} className="text-gray-400" />
              <span>{announcement.targetAudience}</span>
            </div>
            {announcement.publishedAt && (
              <div className="flex items-center gap-1.5">
                <CalendarDays size={14} className="text-gray-400" />
                <span>Published: {formatDate(announcement.publishedAt)}</span>
              </div>
            )}
            {announcement.expiresAt && (
              <div className="flex items-center gap-1.5">
                <CalendarDays size={14} className="text-gray-400" />
                <span>Expires: {formatDate(announcement.expiresAt)}</span>
              </div>
            )}
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">By {announcement.createdBy}</p>

          <div className="bg-gray-50 dark:bg-dark-hover rounded-lg p-4 text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
            {announcement.body}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-dark-border flex items-center gap-6 text-xs text-gray-400 dark:text-gray-500">
            <span>Created: {formatDate(announcement.createdAt)}</span>
            <span>Updated: {formatDate(announcement.updatedAt)}</span>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Announcement"
        message={`Are you sure you want to delete "${announcement.title}"?`}
        confirmLabel="Delete"
      />
    </div>
  )
}
