import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, Trash2, Mail, Phone, CalendarDays, Shield, Clock, Hash, User } from 'lucide-react'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import Spinner from '../../components/ui/Spinner'
import RoleGate from '../../components/auth/RoleGate'
import { adminExecutivesApi } from '../../api/services'
import { useActivityStore } from '../../stores/activity.store'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { formatDate } from '../../utils/formatters'
import type { Executive } from '../../types'

export default function ExecutiveDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { addActivity } = useActivityStore()
  const { currentUser } = useAuth()
  const { toast } = useToast()

  const [executive, setExecutive] = useState<Executive | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const fetchExecutive = useCallback(async () => {
    if (!id) return
    try {
      const res = await adminExecutivesApi.getById(id)
      setExecutive(res.data.data as Executive)
    } catch {
      toast.error('Executive not found')
      navigate('/executives')
    } finally {
      setLoading(false)
    }
  }, [id, navigate, toast])

  useEffect(() => { fetchExecutive() }, [fetchExecutive])

  const handleDelete = async () => {
    if (!executive || !currentUser) return
    try {
      await adminExecutivesApi.delete(executive.id)
      addActivity({
        action: 'deleted executive',
        targetType: executive.name,
        targetId: executive.id,
        performedBy: currentUser.id,
        performedByName: currentUser.name,
      })
      toast.success('Executive deleted')
      navigate('/executives')
    } catch {
      toast.error('Failed to delete executive')
    }
  }

  if (loading) {
    return (
      <div className="page-enter flex items-center justify-center py-32">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!executive) {
    return (
      <div className="page-enter">
        <button
          onClick={() => navigate('/executives')}
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          Back to Executives
        </button>
        <div className="text-center py-16 text-gray-500">Executive not found.</div>
      </div>
    )
  }

  const initials = executive.name.split(' ').map(n => n[0]).join('').slice(0, 2)

  return (
    <div className="page-enter">
      {/* Back + actions bar */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/executives')}
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Executives
        </button>
        <div className="flex items-center gap-2">
          <RoleGate permission="executives:edit">
            <Button size="sm" variant="secondary" leftIcon={<Pencil size={14} />} onClick={() => navigate(`/executives/${executive.id}/edit`)}>
              Edit
            </Button>
          </RoleGate>
          <RoleGate permission="executives:delete">
            <Button size="sm" variant="danger" leftIcon={<Trash2 size={14} />} onClick={() => setShowDeleteConfirm(true)}>
              Delete
            </Button>
          </RoleGate>
        </div>
      </div>

      {/* Hero card */}
      <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-200 dark:border-dark-border shadow-sm overflow-hidden">
        {/* Cover gradient */}
        <div className="h-36 bg-gradient-to-br from-brand-500 via-brand-600 to-brand-800 relative">
          <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
          <div className="absolute -bottom-14 left-8">
            {executive.photoUrl ? (
              <img
                src={executive.photoUrl}
                alt={executive.name}
                className="w-28 h-28 rounded-2xl object-cover ring-4 ring-white dark:ring-dark-card shadow-lg"
              />
            ) : (
              <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-brand-100 to-brand-200 dark:from-brand-800 dark:to-brand-900 ring-4 ring-white dark:ring-dark-card shadow-lg flex items-center justify-center">
                <span className="text-brand-600 dark:text-brand-300 font-bold text-3xl">{initials}</span>
              </div>
            )}
          </div>
        </div>

        {/* Profile info */}
        <div className="pt-18 px-8 pb-8" style={{ paddingTop: '4.5rem' }}>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{executive.name}</h1>
              <p className="text-brand-600 dark:text-brand-400 font-medium mt-0.5">{executive.position}</p>
              <div className="flex items-center gap-2 mt-3">
                <Badge
                  variant={executive.isActive ? 'active' : 'archived'}
                  label={executive.isActive ? 'Active Member' : 'Inactive'}
                />
                {executive.classOf && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-dark-hover text-xs font-medium text-gray-600 dark:text-gray-400">
                    <CalendarDays size={12} />
                    {executive.classOf}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Left column - Contact & Details */}
        <div className="lg:col-span-1 space-y-6">
          {/* Contact info card */}
          <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-200 dark:border-dark-border shadow-sm p-6">
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <User size={15} className="text-brand-500" />
              Contact Information
            </h3>
            <div className="space-y-4">
              {executive.email ? (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                    <Mail size={16} className="text-blue-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400 dark:text-gray-500">Email</p>
                    <a href={`mailto:${executive.email}`} className="text-sm text-gray-700 dark:text-gray-300 hover:text-brand-600 transition-colors truncate block">
                      {executive.email}
                    </a>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 opacity-50">
                  <div className="w-9 h-9 rounded-xl bg-gray-50 dark:bg-dark-hover flex items-center justify-center shrink-0">
                    <Mail size={16} className="text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-400">No email provided</p>
                </div>
              )}

              {executive.phone ? (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center shrink-0">
                    <Phone size={16} className="text-green-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400 dark:text-gray-500">Phone</p>
                    <a href={`tel:${executive.phone}`} className="text-sm text-gray-700 dark:text-gray-300 hover:text-brand-600 transition-colors">
                      {executive.phone}
                    </a>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 opacity-50">
                  <div className="w-9 h-9 rounded-xl bg-gray-50 dark:bg-dark-hover flex items-center justify-center shrink-0">
                    <Phone size={16} className="text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-400">No phone provided</p>
                </div>
              )}
            </div>
          </div>

          {/* Meta card */}
          <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-200 dark:border-dark-border shadow-sm p-6">
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Shield size={15} className="text-brand-500" />
              Record Details
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-dark-border">
                <span className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <Hash size={12} />
                  Display Order
                </span>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">#{executive.order}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-dark-border">
                <span className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <Clock size={12} />
                  Created
                </span>
                <span className="text-xs text-gray-600 dark:text-gray-400">{formatDate(executive.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <Clock size={12} />
                  Last Updated
                </span>
                <span className="text-xs text-gray-600 dark:text-gray-400">{formatDate(executive.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right column - Bio */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-200 dark:border-dark-border shadow-sm p-6 h-full">
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4">Biography</h3>
            {executive.bio ? (
              <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">
                {executive.bio}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-14 h-14 rounded-full bg-gray-50 dark:bg-dark-hover flex items-center justify-center mb-3">
                  <User size={24} className="text-gray-300 dark:text-gray-600" />
                </div>
                <p className="text-sm text-gray-400 dark:text-gray-500">No biography has been added yet.</p>
                <RoleGate permission="executives:edit">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="mt-3"
                    leftIcon={<Pencil size={13} />}
                    onClick={() => navigate(`/executives/${executive.id}/edit`)}
                  >
                    Add Bio
                  </Button>
                </RoleGate>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Executive"
        message={`Are you sure you want to delete "${executive.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  )
}
