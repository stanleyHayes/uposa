import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, Eye, CheckCircle, XCircle, Users, UserCheck, Clock, UserX } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import SearchInput from '../../components/ui/SearchInput'
import Select from '../../components/ui/Select'
import Pagination from '../../components/ui/Pagination'
import Modal from '../../components/ui/Modal'
import Textarea from '../../components/ui/Textarea'
import EmptyState from '../../components/ui/EmptyState'
import PageStats from '../../components/ui/PageStats'
import RoleGate from '../../components/auth/RoleGate'
import { useAlumniStore } from '../../stores/alumni.store'
import { useActivityStore } from '../../stores/activity.store'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { formatDate } from '../../utils/formatters'
import { exportToCSV } from '../../utils/export'
import type { RegistrationStatus, Programme, House } from '../../types'

const ITEMS_PER_PAGE = 10

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
]

const programmeOptions = [
  { value: '', label: 'All Programmes' },
  { value: 'GENERAL_ARTS', label: 'General Arts' },
  { value: 'BUSINESS', label: 'Business' },
  { value: 'HOME_ECONOMICS', label: 'Home Economics' },
  { value: 'VISUAL_ARTS', label: 'Visual Arts' },
  { value: 'SCIENCE', label: 'Science' },
]

const houseOptions = [
  { value: '', label: 'All Houses' },
  { value: 'ACKAH', label: 'Ackah' },
  { value: 'DENSU', label: 'Densu' },
  { value: 'TANO', label: 'Tano' },
  { value: 'NKRUMAH', label: 'Nkrumah' },
  { value: 'PRA', label: 'Pra' },
  { value: 'VOLTA', label: 'Volta' },
]

/** Format UPPER_SNAKE enum values as Title Case for display */
function formatEnum(value: string): string {
  return value
    .split('_')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ')
}

export default function AlumniRegistrationsPage() {
  const navigate = useNavigate()
  const { registrations, fetchRegistrations, approveRegistration, rejectRegistration } = useAlumniStore()
  const { addActivity } = useActivityStore()
  const { currentUser } = useAuth()
  const { toast } = useToast()

  useEffect(() => { fetchRegistrations() }, [fetchRegistrations])

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [programmeFilter, setProgrammeFilter] = useState<string>('')
  const [houseFilter, setHouseFilter] = useState<string>('')
  const [page, setPage] = useState(1)
  const [rejectModal, setRejectModal] = useState<{ id: string; name: string } | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const stats = useMemo(() => ({
    total: registrations.length,
    approved: registrations.filter((r) => r.status === 'approved').length,
    pending: registrations.filter((r) => r.status === 'pending').length,
    rejected: registrations.filter((r) => r.status === 'rejected').length,
  }), [registrations])

  const filtered = useMemo(() => {
    return registrations.filter((r) => {
      const q = search.toLowerCase()
      const matchSearch = !q || r.fullName.toLowerCase().includes(q) || r.email.toLowerCase().includes(q)
      const matchStatus = !statusFilter || r.status === statusFilter
      const matchProgramme = !programmeFilter || r.programme === programmeFilter
      const matchHouse = !houseFilter || r.house === houseFilter
      return matchSearch && matchStatus && matchProgramme && matchHouse
    })
  }, [registrations, search, statusFilter, programmeFilter, houseFilter])

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  const handleApprove = async (id: string, name: string) => {
    if (!currentUser) return
    try {
      await approveRegistration(id, currentUser.id, currentUser.name)
      addActivity({ action: 'approved alumni registration for', targetType: name, targetId: id, performedBy: currentUser.id, performedByName: currentUser.name })
      toast.success('Registration approved', `${name} has been approved.`)
    } catch {
      toast.error('Failed to approve registration')
    }
  }

  const handleRejectSubmit = async () => {
    if (!rejectModal || !currentUser || !rejectReason.trim()) return
    try {
      await rejectRegistration(rejectModal.id, currentUser.id, currentUser.name, rejectReason.trim())
      addActivity({ action: 'rejected alumni registration for', targetType: rejectModal.name, targetId: rejectModal.id, performedBy: currentUser.id, performedByName: currentUser.name })
      toast.success('Registration rejected', `${rejectModal.name}'s registration has been rejected.`)
      setRejectModal(null)
      setRejectReason('')
    } catch {
      toast.error('Failed to reject registration')
    }
  }

  const handleExport = () => {
    const data = filtered.map((r) => ({
      Name: r.fullName,
      Email: r.email,
      Mobile: r.mobileNumber,
      'Year Group': r.yearGroup,
      Programme: formatEnum(r.programme),
      House: formatEnum(r.house),
      Country: r.country,
      Status: r.status,
      'Membership Status': r.membershipStatus,
      'Submitted At': formatDate(r.submittedAt),
      Employment: formatEnum(r.employmentType),
      Occupation: r.occupation ?? '',
    }))
    exportToCSV(data as unknown as Record<string, unknown>[], 'alumni-registrations')
    toast.success('Export started', 'Alumni data is being downloaded.')
  }

  return (
    <div className="page-enter">
      <PageHeader
        title="Alumni Registrations"
        description={`${registrations.filter((r) => r.status === 'pending').length} pending review`}
        actions={
          <RoleGate permission="alumni:export">
            <Button variant="secondary" leftIcon={<Download size={16} />} onClick={handleExport}>
              Export CSV
            </Button>
          </RoleGate>
        }
      />

      <PageStats
        stats={[
          { label: 'Total Registrations', value: stats.total, icon: Users, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100' },
          { label: 'Approved', value: stats.approved, icon: UserCheck, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
          { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
          { label: 'Rejected', value: stats.rejected, icon: UserX, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
        ]}
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <SearchInput
          value={search}
          onChange={(v) => { setSearch(v); setPage(1) }}
          placeholder="Search by name or email..."
          className="w-64"
        />
        <Select
          options={statusOptions}
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="w-40"
        />
        <Select
          options={programmeOptions}
          value={programmeFilter}
          onChange={(e) => { setProgrammeFilter(e.target.value as Programme | ''); setPage(1) }}
          className="w-40"
        />
        <Select
          options={houseOptions}
          value={houseFilter}
          onChange={(e) => { setHouseFilter(e.target.value as House | ''); setPage(1) }}
          className="w-36"
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-dark-border shadow-sm overflow-hidden">
        {paginated.length === 0 ? (
          <EmptyState
            icon={<Users size={40} />}
            title={search || statusFilter || programmeFilter || houseFilter ? 'No matching registrations' : 'No registrations found'}
            description={search || statusFilter || programmeFilter || houseFilter ? 'Try adjusting your search or filters.' : 'Alumni registrations from the client site will appear here.'}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table w-full text-sm">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-50/50 dark:from-dark-hover dark:to-dark-hover/50 border-b-2 border-gray-100 dark:border-dark-border">
                <tr>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Applicant</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Year</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Programme</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">House</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Country</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Submitted</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {paginated.map((reg) => (
                  <tr
                    key={reg.id}
                    className={`border-b border-gray-50 dark:border-dark-border cursor-pointer hover:bg-gray-50/80 dark:hover:bg-dark-hover/50 transition-colors border-l-3 ${
                      reg.status === 'approved' ? 'border-l-emerald-500' : reg.status === 'rejected' ? 'border-l-red-400' : 'border-l-amber-400'
                    }`}
                    onClick={() => navigate(`/alumni-registrations/${reg.id}`)}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={reg.photoUrl ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(reg.fullName)}&background=001B50&color=FFF8DC&size=128&font-size=0.4`}
                          alt={reg.fullName}
                          className="w-10 h-10 rounded-xl object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">{reg.fullName}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{reg.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-700 dark:text-gray-300">{reg.yearGroup}</td>
                    <td className="px-5 py-3.5 text-gray-700 dark:text-gray-300">{formatEnum(reg.programme)}</td>
                    <td className="px-5 py-3.5 text-gray-700 dark:text-gray-300">{formatEnum(reg.house)}</td>
                    <td className="px-5 py-3.5 text-gray-700 dark:text-gray-300">{reg.country}</td>
                    <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400 text-xs">{formatDate(reg.submittedAt)}</td>
                    <td className="px-5 py-3.5">
                      <Badge variant={reg.status as RegistrationStatus} label={reg.status.charAt(0).toUpperCase() + reg.status.slice(1)} />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => navigate(`/alumni-registrations/${reg.id}`)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-brand-50 dark:hover:bg-brand-900/30 hover:text-brand-600 transition-all duration-150"
                          title="View details"
                        >
                          <Eye size={16} />
                        </button>
                        {reg.status === 'pending' && (
                          <>
                            <RoleGate permission="alumni:approve">
                              <button
                                onClick={() => handleApprove(reg.id, reg.fullName)}
                                className="rounded-lg p-1.5 text-gray-400 hover:bg-green-50 hover:text-green-600 transition-all duration-150"
                                title="Approve"
                              >
                                <CheckCircle size={16} />
                              </button>
                            </RoleGate>
                            <RoleGate permission="alumni:reject">
                              <button
                                onClick={() => setRejectModal({ id: reg.id, name: reg.fullName })}
                                className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 transition-all duration-150"
                                title="Reject"
                              >
                                <XCircle size={16} />
                              </button>
                            </RoleGate>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="px-4 border-t border-gray-100 dark:border-dark-border">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={filtered.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setPage}
          />
        </div>
      </div>

      {/* Reject Modal */}
      <Modal
        open={!!rejectModal}
        onClose={() => { setRejectModal(null); setRejectReason('') }}
        title="Reject Registration"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setRejectModal(null); setRejectReason('') }}>Cancel</Button>
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
          Please provide a reason for rejecting <strong>{rejectModal?.name}</strong>'s registration.
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
