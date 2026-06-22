import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle,
  ClipboardCheck,
  GraduationCap,
  HeartHandshake,
  Home,
  Mail,
  MapPin,
  MessageSquareText,
  Phone,
  ShieldCheck,
  UserRound,
  Users,
  XCircle,
} from 'lucide-react'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import Textarea from '../../components/ui/Textarea'
import EmptyState from '../../components/ui/EmptyState'
import PageStats from '../../components/ui/PageStats'
import { Skeleton } from '../../components/ui/Skeleton'
import RoleGate from '../../components/auth/RoleGate'
import { useAlumniStore } from '../../stores/alumni.store'
import { useActivityStore } from '../../stores/activity.store'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { formatDate, formatDateTime, formatTimeAgo } from '../../utils/formatters'
import { cn } from '../../utils/cn'
import type { RegistrationStatus } from '../../types'

function formatEnum(value?: string | null): string {
  if (!value) return ''
  return value
    .split('_')
    .filter(Boolean)
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ')
}

function emptyDisplay() {
  return <span className="text-xs italic text-brand-950/30 dark:text-gray-600">Not provided</span>
}

function statusTone(status: RegistrationStatus) {
  if (status === 'approved') return {
    strip: 'bg-emerald-500',
    panel: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    label: 'Ready for member access',
    icon: CheckCircle,
  }
  if (status === 'rejected') return {
    strip: 'bg-red-500',
    panel: 'border-red-500/25 bg-red-500/10 text-red-700 dark:text-red-300',
    label: 'Needs applicant follow-up',
    icon: XCircle,
  }
  return {
    strip: 'bg-amber-500',
    panel: 'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300',
    label: 'Awaiting review',
    icon: AlertTriangle,
  }
}

interface FieldProps {
  label: string
  value?: string | number | boolean | null | string[]
  wide?: boolean
}

function DetailField({ label, value, wide = false }: FieldProps) {
  let display: ReactNode

  if (value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
    display = emptyDisplay()
  } else if (typeof value === 'boolean') {
    display = (
      <span className={cn(
        'inline-flex items-center gap-2 text-sm font-bold',
        value ? 'text-emerald-700 dark:text-emerald-300' : 'text-brand-950/45 dark:text-gray-500',
      )}>
        <span className={cn('h-2 w-2', value ? 'bg-emerald-500' : 'bg-brand-950/20 dark:bg-gray-600')} />
        {value ? 'Yes' : 'No'}
      </span>
    )
  } else if (Array.isArray(value)) {
    display = (
      <div className="flex flex-wrap gap-1.5">
        {value.map((item) => (
          <span key={item} className="border border-brand-950/10 bg-brand-950/[0.03] px-2 py-1 text-xs font-bold text-brand-950/65 dark:border-white/10 dark:bg-white/[0.03] dark:text-gray-300">
            {item}
          </span>
        ))}
      </div>
    )
  } else {
    display = <span className="text-sm font-semibold text-brand-950 dark:text-gray-100">{value}</span>
  }

  return (
    <div className={cn('border border-brand-950/10 bg-brand-950/[0.025] p-4 dark:border-white/10 dark:bg-white/[0.03]', wide && 'md:col-span-2')}>
      <dt className="mb-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-brand-950/40 dark:text-gray-500">{label}</dt>
      <dd>{display}</dd>
    </div>
  )
}

function DetailSection({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section className="admin-card-surface overflow-hidden">
      <div className="flex items-center gap-3 border-b border-brand-950/10 bg-cream-100/60 px-5 py-4 dark:border-dark-border dark:bg-white/[0.03]">
        <div className="grid h-10 w-10 place-items-center border border-cream-500/35 bg-cream-500/20 text-brand-950 dark:border-white/10 dark:bg-white/[0.04] dark:text-cream-100">
          {icon}
        </div>
        <h2 className="text-sm font-black uppercase tracking-[0.16em] text-brand-950 dark:text-gray-100">{title}</h2>
      </div>
      <dl className="grid gap-3 p-5 md:grid-cols-2">{children}</dl>
    </section>
  )
}

function TimelineItem({ label, value, active = false }: { label: string; value?: string | null; active?: boolean }) {
  return (
    <div className="relative border-l border-brand-950/15 pb-5 pl-5 last:pb-0 dark:border-white/10">
      <span className={cn('absolute -left-[5px] top-1 h-2.5 w-2.5 border border-brand-950/15 bg-cream-50 dark:border-white/10 dark:bg-dark-card', active && 'bg-cream-500 dark:bg-cream-500')} />
      <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-950/40 dark:text-gray-500">{label}</p>
      <p className="mt-1 text-sm font-bold text-brand-950 dark:text-gray-100">{value || 'Pending'}</p>
    </div>
  )
}

function AlumniDetailSkeleton() {
  return (
    <div className="page-enter space-y-6">
      <div className="admin-card-surface p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex gap-5">
            <Skeleton className="h-24 w-24" />
            <div className="space-y-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-9 w-72" />
              <Skeleton className="h-4 w-56" />
            </div>
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="admin-card-surface p-4">
            <Skeleton className="mb-3 h-10 w-10" />
            <Skeleton className="mb-2 h-7 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="admin-card-surface p-5">
              <Skeleton className="mb-5 h-8 w-48" />
              <div className="grid gap-3 md:grid-cols-2">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
          ))}
        </div>
        <Skeleton className="h-80 w-full" />
      </div>
    </div>
  )
}

export default function AlumniDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { registrations, loading, fetchRegistrations, approveRegistration, rejectRegistration } = useAlumniStore()
  const { addActivity } = useActivityStore()
  const { currentUser } = useAuth()
  const { toast } = useToast()

  const [rejectModal, setRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    if (registrations.length === 0) {
      fetchRegistrations()
    }
  }, [registrations.length, fetchRegistrations])

  const reg = registrations.find((registration) => registration.id === id)

  const engagementCount = useMemo(() => {
    if (!reg) return 0
    return [reg.isWhatsAppMember, reg.willingToVolunteer !== 'NO', reg.isAvailableAsMentor, reg.preferredContributions.length > 0]
      .filter(Boolean)
      .length
  }, [reg])

  if (loading && !reg) {
    return <AlumniDetailSkeleton />
  }

  if (!reg) {
    return (
      <div className="page-enter">
        <button
          onClick={() => navigate('/alumni-registrations')}
          className="mb-5 flex items-center gap-1.5 text-sm font-semibold text-brand-950/55 transition-colors hover:text-brand-700 dark:text-gray-400 dark:hover:text-gray-100"
        >
          <ArrowLeft size={16} />
          Back to Alumni Registrations
        </button>
        <EmptyState
          icon={<Users size={40} />}
          title="Registration not found"
          description="This alumni registration may have been moved, removed, or is still loading from the server."
          action={<Button leftIcon={<ArrowLeft size={16} />} onClick={() => navigate('/alumni-registrations')}>Back to Registrations</Button>}
        />
      </div>
    )
  }

  const tone = statusTone(reg.status)
  const StatusIcon = tone.icon
  const photoUrl = reg.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(reg.fullName)}&background=001B50&color=FFF8DC&size=160&font-size=0.34`

  const handleApprove = async () => {
    if (!currentUser) return
    try {
      await approveRegistration(reg.id, currentUser.id, currentUser.name)
      addActivity({ action: 'approved alumni registration for', targetType: reg.fullName, targetId: reg.id, performedBy: currentUser.id, performedByName: currentUser.name })
      toast.success('Registration approved', `${reg.fullName} has been approved.`)
    } catch {
      toast.error('Failed to approve registration')
    }
  }

  const handleRejectSubmit = async () => {
    if (!currentUser || !rejectReason.trim()) return
    try {
      await rejectRegistration(reg.id, currentUser.id, currentUser.name, rejectReason.trim())
      addActivity({ action: 'rejected alumni registration for', targetType: reg.fullName, targetId: reg.id, performedBy: currentUser.id, performedByName: currentUser.name })
      toast.success('Registration rejected', `${reg.fullName}'s registration has been rejected.`)
      setRejectModal(false)
      setRejectReason('')
    } catch {
      toast.error('Failed to reject registration')
    }
  }

  return (
    <div className="page-enter">
      <button
        onClick={() => navigate('/alumni-registrations')}
        className="mb-5 flex items-center gap-1.5 text-sm font-semibold text-brand-950/55 transition-colors hover:text-brand-700 dark:text-gray-400 dark:hover:text-gray-100"
      >
        <ArrowLeft size={16} />
        Back to Alumni Registrations
      </button>

      <section className="admin-card-surface relative mb-6 overflow-hidden">
        <div className={cn('absolute inset-x-0 top-0 h-1.5', tone.strip)} />
        <div className="absolute right-0 top-0 hidden h-full w-1/3 bg-gradient-to-l from-cream-500/20 to-transparent dark:from-white/[0.03] lg:block" />
        <div className="relative grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-end">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
            <div className="relative">
              <img
                src={photoUrl}
                alt={reg.fullName}
                className="h-28 w-28 border border-brand-950/10 object-cover shadow-sm dark:border-white/10"
              />
              <span className={cn('absolute -bottom-1 -right-1 grid h-9 w-9 place-items-center border border-brand-950/10 bg-cream-50 dark:border-white/10 dark:bg-dark-card', tone.panel)}>
                <StatusIcon size={18} />
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge variant={reg.status as RegistrationStatus} label={reg.status.charAt(0).toUpperCase() + reg.status.slice(1)} />
                <span className="border border-brand-950/10 bg-brand-950/[0.03] px-2.5 py-0.5 text-xs font-black uppercase tracking-[0.1em] text-brand-950/45 dark:border-white/10 dark:bg-white/[0.03] dark:text-gray-400">
                  Class of {reg.yearGroup || 'Unknown'}
                </span>
              </div>
              <h1 className="text-3xl font-black leading-tight tracking-tight text-brand-950 dark:text-gray-100 md:text-4xl">
                {reg.fullName}
              </h1>
              <div className="mt-3 flex flex-wrap gap-3 text-sm font-semibold text-brand-950/55 dark:text-gray-400">
                <a href={`mailto:${reg.email}`} className="inline-flex items-center gap-2 transition-colors hover:text-brand-800 dark:hover:text-gray-100">
                  <Mail size={15} className="text-cream-600 dark:text-cream-300" />
                  {reg.email}
                </a>
                <a href={`tel:${reg.mobileNumber}`} className="inline-flex items-center gap-2 transition-colors hover:text-brand-800 dark:hover:text-gray-100">
                  <Phone size={15} className="text-cream-600 dark:text-cream-300" />
                  {reg.mobileNumber || 'No phone'}
                </a>
                <span className="inline-flex items-center gap-2">
                  <MapPin size={15} className="text-cream-600 dark:text-cream-300" />
                  {[reg.city, reg.country].filter(Boolean).join(', ') || 'No location'}
                </span>
              </div>
            </div>
          </div>

          <aside className={cn('border p-5', tone.panel)}>
            <p className="text-xs font-black uppercase tracking-[0.16em] opacity-70">Review status</p>
            <h2 className="mt-2 text-xl font-black">{tone.label}</h2>
            <p className="mt-3 text-sm leading-6 opacity-80">
              Submitted {reg.submittedAt ? formatTimeAgo(reg.submittedAt) : 'recently'} with consent {reg.consentGiven ? 'confirmed' : 'not confirmed'}.
            </p>
            {reg.status === 'pending' && (
              <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <RoleGate permission="alumni:approve">
                  <Button
                    variant="accent"
                    size="sm"
                    leftIcon={<CheckCircle size={16} />}
                    onClick={handleApprove}
                    className="w-full"
                  >
                    Approve
                  </Button>
                </RoleGate>
                <RoleGate permission="alumni:reject">
                  <Button
                    variant="danger"
                    size="sm"
                    leftIcon={<XCircle size={16} />}
                    onClick={() => setRejectModal(true)}
                    className="w-full"
                  >
                    Reject
                  </Button>
                </RoleGate>
              </div>
            )}
          </aside>
        </div>
      </section>

      <PageStats
        stats={[
          { label: 'Year Group', value: reg.yearGroup || '---', icon: GraduationCap, color: 'text-brand-600', bg: 'bg-brand-50', border: 'border-brand-100' },
          { label: 'Membership', value: formatEnum(reg.membershipStatus) || 'Pending', icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
          { label: 'Engagement', value: `${engagementCount}/4`, icon: HeartHandshake, color: 'text-brand-600', bg: 'bg-cream-100', border: 'border-cream-300' },
          { label: 'Submitted', value: formatDate(reg.submittedAt), icon: CalendarDays, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
        ]}
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          <DetailSection title="Personal profile" icon={<UserRound size={19} />}>
            <DetailField label="Full name" value={reg.fullName} />
            <DetailField label="Gender" value={formatEnum(reg.gender)} />
            <DetailField label="Date of birth" value={reg.dateOfBirth ? formatDate(reg.dateOfBirth) : ''} />
            <DetailField label="Marital status" value={formatEnum(reg.maritalStatus)} />
          </DetailSection>

          <DetailSection title="Contact and location" icon={<MapPin size={19} />}>
            <DetailField label="Email" value={reg.email} />
            <DetailField label="Mobile" value={reg.mobileNumber} />
            <DetailField label="Alternative phone" value={reg.altPhoneNumber} />
            <DetailField label="City" value={reg.city} />
            <DetailField label="Country" value={reg.country} />
            <DetailField label="Residential address" value={reg.residentialAddress} wide />
          </DetailSection>

          <DetailSection title="School identity" icon={<Home size={19} />}>
            <DetailField label="Year group" value={String(reg.yearGroup || '')} />
            <DetailField label="Programme" value={formatEnum(reg.programme)} />
            <DetailField label="House" value={formatEnum(reg.house)} />
            <DetailField label="Membership status" value={formatEnum(reg.membershipStatus)} />
          </DetailSection>

          <DetailSection title="Professional profile" icon={<BriefcaseBusiness size={19} />}>
            <DetailField label="Employment type" value={formatEnum(reg.employmentType)} />
            <DetailField label="Occupation" value={reg.occupation} />
            <DetailField label="Organization" value={reg.organization} />
            <DetailField label="Areas of expertise" value={reg.areaOfExpertise} wide />
          </DetailSection>

          <DetailSection title="Emergency and next of kin" icon={<Phone size={19} />}>
            <DetailField label="Emergency contact" value={reg.emergencyContactNumber} />
            <DetailField label="Emergency relationship" value={reg.emergencyRelationship} />
            <DetailField label="Next of kin" value={reg.nextOfKinName} />
            <DetailField label="Next of kin contact" value={reg.nextOfKinContact} />
            <DetailField label="Next of kin relationship" value={reg.nextOfKinRelationship} wide />
          </DetailSection>

          <DetailSection title="Association engagement" icon={<HeartHandshake size={19} />}>
            <DetailField label="WhatsApp member" value={reg.isWhatsAppMember} />
            <DetailField label="Willing to volunteer" value={formatEnum(reg.willingToVolunteer)} />
            <DetailField label="Available as mentor" value={reg.isAvailableAsMentor} />
            <DetailField label="Preferred contributions" value={reg.preferredContributions} />
            <DetailField label="Mentor bio" value={reg.mentorBio} wide />
          </DetailSection>
        </div>

        <aside className="space-y-5">
          <section className="admin-card-surface p-5">
            <div className="mb-5 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center border border-cream-500/35 bg-cream-500/20 text-brand-950 dark:border-white/10 dark:bg-white/[0.04] dark:text-cream-100">
                <ClipboardCheck size={19} />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-950/45 dark:text-gray-500">Review trail</p>
                <h2 className="text-lg font-black text-brand-950 dark:text-gray-100">Registration audit</h2>
              </div>
            </div>

            <TimelineItem label="Submitted" value={reg.submittedAt ? formatDateTime(reg.submittedAt) : ''} active />
            <TimelineItem label="Reviewed" value={reg.reviewedAt ? formatDateTime(reg.reviewedAt) : ''} active={Boolean(reg.reviewedAt)} />
            <TimelineItem label="Approved" value={reg.approvedAt ? formatDateTime(reg.approvedAt) : ''} active={Boolean(reg.approvedAt)} />
            <TimelineItem label="Last updated" value={reg.updatedAt ? formatDateTime(reg.updatedAt) : ''} active />

            <div className="mt-5 grid gap-3">
              <DetailField label="Verified" value={reg.isVerified} />
              <DetailField label="Approved" value={reg.isApproved} />
              <DetailField label="Consent given" value={reg.consentGiven} />
            </div>
          </section>

          <section className="admin-card-surface p-5">
            <div className="mb-4 flex items-start gap-3">
              <div className="grid h-10 w-10 place-items-center border border-cream-500/35 bg-cream-500/20 text-brand-950 dark:border-white/10 dark:bg-white/[0.04] dark:text-cream-100">
                <MessageSquareText size={19} />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-950/45 dark:text-gray-500">Reviewer note</p>
                <h2 className="text-lg font-black text-brand-950 dark:text-gray-100">
                  {reg.rejectionReason ? 'Rejection reason' : 'No rejection note'}
                </h2>
              </div>
            </div>
            <div className={cn(
              'border p-4 text-sm leading-6',
              reg.rejectionReason
                ? 'border-red-500/20 bg-red-500/10 text-red-800 dark:text-red-300'
                : 'border-brand-950/10 bg-brand-950/[0.03] text-brand-950/55 dark:border-white/10 dark:bg-white/[0.03] dark:text-gray-400',
            )}>
              {reg.rejectionReason || 'Reviewer notes will appear here when an application is rejected.'}
            </div>
          </section>
        </aside>
      </div>

      <Modal
        open={rejectModal}
        onClose={() => { setRejectModal(false); setRejectReason('') }}
        title="Reject Registration"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setRejectModal(false); setRejectReason('') }}>Cancel</Button>
            <Button
              variant="danger"
              onClick={handleRejectSubmit}
              disabled={!rejectReason.trim()}
            >
              Reject
            </Button>
          </>
        }
      >
        <p className="mb-3 text-sm leading-6 text-brand-950/65 dark:text-gray-300">
          Please provide a reason for rejecting <strong>{reg.fullName}</strong>'s registration.
        </p>
        <Textarea
          label="Rejection Reason"
          value={rejectReason}
          onChange={(event) => setRejectReason(event.target.value)}
          placeholder="Explain why this registration is being rejected..."
          rows={4}
        />
      </Modal>
    </div>
  )
}
