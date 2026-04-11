import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import Textarea from '../../components/ui/Textarea'
import RoleGate from '../../components/auth/RoleGate'
import { useAlumniStore } from '../../stores/alumni.store'
import { useActivityStore } from '../../stores/activity.store'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { formatDate, formatDateTime } from '../../utils/formatters'
import type { RegistrationStatus } from '../../types'

/** Format UPPER_SNAKE enum values as Title Case for display */
function formatEnum(value: string): string {
  return value
    .split('_')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ')
}

interface DetailFieldProps {
  label: string
  value?: string | boolean | null | string[]
}

function DetailField({ label, value }: DetailFieldProps) {
  let display: React.ReactNode
  if (value === null || value === undefined || value === '') {
    display = <span className="text-gray-300 dark:text-gray-600 italic text-xs">&mdash;</span>
  } else if (typeof value === 'boolean') {
    display = (
      <span className={`inline-flex items-center gap-1 text-xs font-medium ${value ? 'text-emerald-600' : 'text-gray-400'}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${value ? 'bg-emerald-500' : 'bg-gray-300'}`} />
        {value ? 'Yes' : 'No'}
      </span>
    )
  } else if (Array.isArray(value)) {
    display = value.length > 0
      ? <span className="flex flex-wrap gap-1">{value.map((v) => (
          <span key={v} className="bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 text-[10px] font-medium px-2 py-0.5 rounded-full">{v}</span>
        ))}</span>
      : <span className="text-gray-300 dark:text-gray-600 italic text-xs">&mdash;</span>
  } else {
    display = <span className="text-sm">{String(value)}</span>
  }
  return (
    <div>
      <dt className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5">{label}</dt>
      <dd className="text-gray-900 dark:text-gray-100">{display}</dd>
    </div>
  )
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider mb-3 pl-3 border-l-2 border-brand-500">{title}</h4>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 pl-3">{children}</dl>
    </div>
  )
}

export default function AlumniDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { registrations, fetchRegistrations, approveRegistration, rejectRegistration } = useAlumniStore()
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

  const reg = registrations.find((r) => r.id === id)

  if (!reg) {
    return (
      <div className="page-enter">
        <button
          onClick={() => navigate('/alumni-registrations')}
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          Back to Alumni Registrations
        </button>
        <div className="text-center py-16 text-gray-500">Registration not found.</div>
      </div>
    )
  }

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
        className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors mb-4"
      >
        <ArrowLeft size={16} />
        Back to Alumni Registrations
      </button>

      <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-dark-border shadow-sm overflow-hidden">
        {/* Status banner */}
        <div className={`h-1.5 ${
          reg.status === 'approved' ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' :
          reg.status === 'rejected' ? 'bg-gradient-to-r from-red-500 to-red-400' :
          'bg-gradient-to-r from-amber-500 to-amber-400'
        }`} />

        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 dark:border-dark-border">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <img
                src={reg.photoUrl ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(reg.fullName)}&background=001B50&color=FFF8DC&size=128&font-size=0.4`}
                alt={reg.fullName}
                className="w-14 h-14 rounded-2xl object-cover ring-2 ring-gray-100 dark:ring-dark-border"
              />
              <div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">{reg.fullName}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{reg.email}</p>
                <div className="mt-1.5">
                  <Badge variant={reg.status as RegistrationStatus} label={reg.status.charAt(0).toUpperCase() + reg.status.slice(1)} />
                </div>
              </div>
            </div>
            {reg.status === 'pending' && (
              <div className="flex items-center gap-2 shrink-0">
                <RoleGate permission="alumni:approve">
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<CheckCircle size={16} />}
                    onClick={handleApprove}
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
                  >
                    Reject
                  </Button>
                </RoleGate>
              </div>
            )}
          </div>
        </div>

        {/* Detail sections */}
        <div className="px-6 py-5">
          <DetailSection title="Personal Information">
            <DetailField label="Full Name" value={reg.fullName} />
            <DetailField label="Gender" value={formatEnum(reg.gender)} />
            <DetailField label="Date of Birth" value={formatDate(reg.dateOfBirth)} />
            <DetailField label="Marital Status" value={formatEnum(reg.maritalStatus)} />
          </DetailSection>
          <DetailSection title="Contact Information">
            <DetailField label="Email" value={reg.email} />
            <DetailField label="Mobile" value={reg.mobileNumber} />
            <DetailField label="Alt Phone" value={reg.altPhoneNumber} />
            <DetailField label="Address" value={reg.residentialAddress} />
            <DetailField label="City" value={reg.city} />
            <DetailField label="Country" value={reg.country} />
          </DetailSection>
          <DetailSection title="Academic Information">
            <DetailField label="Year Group" value={String(reg.yearGroup)} />
            <DetailField label="Programme" value={formatEnum(reg.programme)} />
            <DetailField label="House" value={formatEnum(reg.house)} />
          </DetailSection>
          <DetailSection title="Professional Information">
            <DetailField label="Employment Type" value={formatEnum(reg.employmentType)} />
            <DetailField label="Occupation" value={reg.occupation} />
            <DetailField label="Organization" value={reg.organization} />
            <DetailField label="Areas of Expertise" value={reg.areaOfExpertise} />
          </DetailSection>
          <DetailSection title="Emergency Contact & Next of Kin">
            <DetailField label="Emergency No." value={reg.emergencyContactNumber} />
            <DetailField label="Relationship" value={reg.emergencyRelationship} />
            <DetailField label="Next of Kin" value={reg.nextOfKinName} />
            <DetailField label="NOK Contact" value={reg.nextOfKinContact} />
            <DetailField label="NOK Relationship" value={reg.nextOfKinRelationship} />
          </DetailSection>
          <DetailSection title="Association Engagement">
            <DetailField label="WhatsApp Member" value={reg.isWhatsAppMember} />
            <DetailField label="Willing to Volunteer" value={reg.willingToVolunteer} />
            <DetailField label="Preferred Contributions" value={reg.preferredContributions} />
            <DetailField label="Available as Mentor" value={reg.isAvailableAsMentor} />
            {reg.mentorBio && (
              <div className="col-span-2">
                <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Mentor Bio</dt>
                <dd className="mt-0.5 text-sm text-gray-900 dark:text-gray-100">{reg.mentorBio}</dd>
              </div>
            )}
          </DetailSection>
          <DetailSection title="System & Review">
            <DetailField label="Membership Status" value={formatEnum(reg.membershipStatus)} />
            <DetailField label="Verified" value={reg.isVerified} />
            <DetailField label="Approved" value={reg.isApproved} />
            <DetailField label="Consent Given" value={reg.consentGiven} />
            <DetailField label="Submitted At" value={formatDateTime(reg.submittedAt)} />
            <DetailField label="Approved At" value={reg.approvedAt ? formatDateTime(reg.approvedAt) : undefined} />
            <DetailField label="Reviewed At" value={reg.reviewedAt ? formatDateTime(reg.reviewedAt) : undefined} />
            <DetailField label="Created At" value={formatDateTime(reg.createdAt)} />
            <DetailField label="Updated At" value={formatDateTime(reg.updatedAt)} />
            {reg.rejectionReason && (
              <div className="col-span-2">
                <dt className="text-xs font-medium text-red-500 uppercase tracking-wide">Rejection Reason</dt>
                <dd className="mt-0.5 text-sm text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-300 rounded-lg px-3 py-2">{reg.rejectionReason}</dd>
              </div>
            )}
          </DetailSection>
        </div>
      </div>

      {/* Reject Modal */}
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
        <p className="text-sm text-gray-700 mb-3">
          Please provide a reason for rejecting <strong>{reg.fullName}</strong>'s registration.
        </p>
        <Textarea
          label="Rejection Reason"
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Explain why this registration is being rejected..."
          rows={4}
        />
      </Modal>
    </div>
  )
}
