import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Mail,
  Phone,
  CalendarDays,
  Shield,
  Clock,
  Hash,
  User,
  Crown,
  Contact,
  FileText,
  IdCard,
  CheckCircle2,
  Archive,
} from 'lucide-react'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { Skeleton } from '../../components/ui/Skeleton'
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
      <div className="page-enter space-y-5">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-36" />
          <div className="flex gap-2">
            <Skeleton variant="rectangular" className="h-9 w-20" />
            <Skeleton variant="rectangular" className="h-9 w-24" />
          </div>
        </div>
        <div className="admin-card-surface overflow-hidden">
          <div className="grid gap-0 lg:grid-cols-[340px_minmax(0,1fr)]">
            <div className="bg-brand-950 p-6 dark:bg-dark-surface">
              <Skeleton variant="rectangular" className="h-48 w-full bg-white/10" />
              <Skeleton className="mt-5 h-6 w-44 bg-white/10" />
              <Skeleton className="mt-3 h-4 w-32 bg-white/10" />
            </div>
            <div className="space-y-5 p-6">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-12 w-3/4" />
              <div className="grid gap-3 sm:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} variant="rectangular" className="h-24 w-full" />
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <Skeleton variant="rectangular" className="h-64 w-full" />
          <Skeleton variant="rectangular" className="h-64 w-full" />
        </div>
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

  const initials = executive.name.trim().split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()
  const hasContact = Boolean(executive.email || executive.phone)
  const statusLabel = executive.isActive ? 'Active' : 'Inactive'
  const statusIcon = executive.isActive ? CheckCircle2 : Archive
  const StatusIcon = statusIcon

  const details = [
    { label: 'Position', value: executive.position, icon: Crown },
    { label: 'Class Of', value: executive.classOf || 'Not provided', icon: CalendarDays },
    { label: 'Display Order', value: `#${executive.order}`, icon: Hash },
  ]

  const recordDetails = [
    { label: 'Record ID', value: executive.id, icon: IdCard },
    { label: 'Created', value: formatDate(executive.createdAt), icon: Clock },
    { label: 'Last Updated', value: formatDate(executive.updatedAt), icon: Clock },
  ]

  return (
    <div className="page-enter space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          onClick={() => navigate('/executives')}
          className="flex items-center gap-1.5 text-sm font-semibold text-brand-950/55 transition-colors hover:text-brand-700 dark:text-gray-400 dark:hover:text-gray-100"
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

      <section className="admin-card-surface overflow-hidden">
        <div className="relative overflow-hidden bg-brand-950 text-cream-100 dark:bg-dark-surface">
          <div className="absolute inset-x-0 top-0 h-1.5 bg-cream-500" />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{ backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.24) 0 1px, transparent 1px 18px)' }}
          />

          <div className="relative grid gap-0 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="p-5 sm:p-6 lg:p-8">
              <div className="inline-flex items-center gap-3 border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-cream-100/70">
                <StatusIcon size={15} className={executive.isActive ? 'text-green-400' : 'text-gray-400'} />
                {statusLabel} executive
              </div>

              <div className="mt-7 max-w-3xl">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-cream-200/45">Council profile</p>
                <h1 className="mt-3 max-w-4xl text-4xl font-black leading-[1.05] tracking-tight text-white md:text-5xl">
                  {executive.name}
                </h1>
                <p className="mt-5 max-w-2xl text-base font-semibold leading-8 text-cream-100/64">
                  {executive.bio
                    ? executive.bio.split('\n')[0]
                    : 'This council profile is ready for public display once a biography is added.'}
                </p>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {details.map((item) => {
                  const Icon = item.icon
                  return (
                    <div key={item.label} className="min-h-32 border border-white/10 bg-white/[0.045] p-4">
                      <Icon size={21} className="mb-5 text-cream-200" />
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cream-100/40">{item.label}</p>
                      <p className="mt-2 truncate text-lg font-black text-white">{item.value}</p>
                    </div>
                  )
                })}
              </div>
            </div>

            <aside className="border-t border-white/10 bg-white/[0.045] p-5 sm:p-6 lg:border-l lg:border-t-0">
              <div className="flex h-full flex-col justify-between gap-5">
                <div>
                  {executive.photoUrl ? (
                    <img
                      src={executive.photoUrl}
                      alt={executive.name}
                      className="h-52 w-full border border-white/10 object-cover"
                    />
                  ) : (
                    <div className="grid h-52 w-full place-items-center border border-white/10 bg-white/[0.06]">
                      <span className="text-5xl font-black leading-none text-cream-200">{initials}</span>
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-between gap-3 border border-white/10 bg-brand-950/30 p-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-cream-100/40">Public profile</p>
                      <p className="mt-1 truncate text-sm font-black text-white">{executive.position}</p>
                    </div>
                    <Badge variant={executive.isActive ? 'active' : 'archived'} label={statusLabel} />
                  </div>
                </div>

                <div className="grid gap-2">
                  <div className="border border-white/10 bg-brand-950/30 p-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-cream-100/40">Last updated</p>
                    <p className="mt-1 text-sm font-black text-white">{formatDate(executive.updatedAt)}</p>
                  </div>
                  <div className="border border-white/10 bg-brand-950/30 p-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-cream-100/40">Record</p>
                    <p className="mt-1 truncate text-sm font-black text-white">{executive.id}</p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <section className="admin-card-surface overflow-hidden">
          <div className="flex items-center justify-between border-b border-brand-950/10 bg-cream-100/60 px-5 py-4 dark:border-dark-border dark:bg-white/[0.03]">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center border border-cream-500/35 bg-cream-500/20 text-brand-950 dark:border-white/10 dark:bg-white/[0.04] dark:text-cream-100">
                <FileText size={19} />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-[0.16em] text-brand-950 dark:text-gray-100">Biography</h3>
                <p className="text-xs font-semibold text-brand-950/45 dark:text-gray-500">Public-facing executive profile copy.</p>
              </div>
            </div>
          </div>

          {executive.bio ? (
            <div className="p-6">
              <div className="border-l-4 border-cream-500 bg-brand-950/[0.025] p-5 text-sm leading-7 text-brand-950/68 dark:bg-white/[0.03] dark:text-gray-300 whitespace-pre-wrap">
                {executive.bio}
              </div>
            </div>
          ) : (
            <div className="p-6">
              <div className="flex flex-col items-center justify-center border border-brand-950/10 bg-brand-950/[0.03] px-6 py-14 text-center dark:border-white/10 dark:bg-white/[0.03]">
                <div className="grid h-14 w-14 place-items-center border border-cream-500/35 bg-cream-500/20 text-brand-950 dark:border-white/10 dark:bg-white/[0.04] dark:text-cream-100">
                  <User size={24} />
                </div>
                <h3 className="mt-4 text-lg font-black text-brand-950 dark:text-gray-100">No biography yet</h3>
                <p className="mt-2 max-w-md text-sm leading-6 text-brand-950/55 dark:text-gray-400">
                  Add a short public profile so visitors understand this executive's role and contribution.
                </p>
                <RoleGate permission="executives:edit">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="mt-4"
                    leftIcon={<Pencil size={13} />}
                    onClick={() => navigate(`/executives/${executive.id}/edit`)}
                  >
                    Add Bio
                  </Button>
                </RoleGate>
              </div>
            </div>
          )}
        </section>

        <aside className="space-y-5 lg:sticky lg:top-24">
          <section className="admin-card-surface overflow-hidden">
            <div className="border-b border-brand-950/10 bg-cream-100/60 px-5 py-4 dark:border-dark-border dark:bg-white/[0.03]">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center border border-cream-500/35 bg-cream-500/20 text-brand-950 dark:border-white/10 dark:bg-white/[0.04] dark:text-cream-100">
                  <Contact size={18} />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-950/45 dark:text-gray-500">Contact rails</p>
                  <h3 className="text-base font-black text-brand-950 dark:text-gray-100">Reach details</h3>
                </div>
              </div>
            </div>

            <div className="space-y-3 p-5">
              {executive.email && (
                <a
                  href={`mailto:${executive.email}`}
                  className="group flex items-start gap-3 border border-brand-950/10 bg-brand-950/[0.03] p-3 transition-colors hover:border-brand-950/20 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-white/20"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center border border-brand-950/10 bg-cream-500/20 text-brand-950 dark:border-white/10 dark:bg-white/[0.04] dark:text-cream-100">
                    <Mail size={17} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-black uppercase tracking-[0.14em] text-brand-950/40 dark:text-gray-500">Email</span>
                    <span className="mt-1 block truncate text-sm font-bold text-brand-950 transition-colors group-hover:text-brand-700 dark:text-gray-200 dark:group-hover:text-cream-200">
                      {executive.email}
                    </span>
                  </span>
                </a>
              )}

              {executive.phone && (
                <a
                  href={`tel:${executive.phone}`}
                  className="group flex items-start gap-3 border border-brand-950/10 bg-brand-950/[0.03] p-3 transition-colors hover:border-brand-950/20 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-white/20"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center border border-brand-950/10 bg-cream-500/20 text-brand-950 dark:border-white/10 dark:bg-white/[0.04] dark:text-cream-100">
                    <Phone size={17} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-black uppercase tracking-[0.14em] text-brand-950/40 dark:text-gray-500">Phone</span>
                    <span className="mt-1 block truncate text-sm font-bold text-brand-950 transition-colors group-hover:text-brand-700 dark:text-gray-200 dark:group-hover:text-cream-200">
                      {executive.phone}
                    </span>
                  </span>
                </a>
              )}

              {!hasContact && (
                <div className="border border-brand-950/10 bg-brand-950/[0.03] p-4 text-sm leading-6 text-brand-950/55 dark:border-white/10 dark:bg-white/[0.03] dark:text-gray-400">
                  No email or phone has been added for this executive.
                </div>
              )}
            </div>
          </section>

          <section className="admin-card-surface p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center border border-cream-500/35 bg-cream-500/20 text-brand-950 dark:border-white/10 dark:bg-white/[0.04] dark:text-cream-100">
                <Shield size={18} />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-950/45 dark:text-gray-500">Admin metadata</p>
                <h3 className="text-base font-black text-brand-950 dark:text-gray-100">Record details</h3>
              </div>
            </div>

            <dl className="space-y-3">
              {recordDetails.map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.label} className="border border-brand-950/10 bg-brand-950/[0.03] p-3 dark:border-white/10 dark:bg-white/[0.03]">
                    <dt className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-brand-950/40 dark:text-gray-500">
                      <Icon size={13} />
                      {item.label}
                    </dt>
                    <dd className="mt-1 truncate text-sm font-bold text-brand-950 dark:text-gray-200">{item.value}</dd>
                  </div>
                )
              })}
            </dl>
          </section>

          <section className="admin-card-surface p-5">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-950/45 dark:text-gray-500">Profile readiness</p>
            <div className="mt-4 grid gap-2">
              {[
                { label: 'Photo', complete: Boolean(executive.photoUrl) },
                { label: 'Contact', complete: hasContact },
                { label: 'Biography', complete: Boolean(executive.bio) },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between border border-brand-950/10 bg-brand-950/[0.03] px-3 py-2 dark:border-white/10 dark:bg-white/[0.03]">
                  <span className="text-sm font-semibold text-brand-950/60 dark:text-gray-400">{item.label}</span>
                  <span className={item.complete ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}>
                    {item.complete ? <CheckCircle2 size={16} /> : <Archive size={16} />}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="admin-card-surface p-5">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-950/45 dark:text-gray-500">Management</p>
            <div className="mt-4 grid gap-2">
              <RoleGate permission="executives:edit">
                <Button className="w-full justify-center" variant="secondary" leftIcon={<Pencil size={14} />} onClick={() => navigate(`/executives/${executive.id}/edit`)}>
                  Edit Executive
                </Button>
              </RoleGate>
              <RoleGate permission="executives:delete">
                <Button className="w-full justify-center" variant="danger" leftIcon={<Trash2 size={14} />} onClick={() => setShowDeleteConfirm(true)}>
                  Delete Executive
                </Button>
              </RoleGate>
            </div>
          </section>
        </aside>
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
