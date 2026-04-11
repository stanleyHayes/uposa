import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusCircle, Pencil, HandCoins, Download, Hash, Clock, CheckCircle } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'
import Pagination from '../../components/ui/Pagination'
import PageStats from '../../components/ui/PageStats'
import SearchInput from '../../components/ui/SearchInput'
import Select from '../../components/ui/Select'
import { PageSkeleton } from '../../components/ui/Skeleton'
import RoleGate from '../../components/auth/RoleGate'
import { adminDonationsApi } from '../../api/services'
import { useActivityStore } from '../../stores/activity.store'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { formatDate } from '../../utils/formatters'
import { exportToCSV } from '../../utils/export'
import type { Donation } from '../../types'

const statusFilterOptions = [
  { value: 'all', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'FAILED', label: 'Failed' },
]

export default function DonationsPage() {
  const { addActivity } = useActivityStore()
  const { currentUser } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [donations, setDonations] = useState<Donation[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmTarget, setConfirmTarget] = useState<Donation | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const fetchDonations = useCallback(async () => {
    try {
      const res = await adminDonationsApi.list({ limit: 100 })
      setDonations((res.data.data || []) as Donation[])
    } catch {
      toast.error('Failed to load donations')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { fetchDonations() }, [fetchDonations])

  const filtered = useMemo(() => {
    return donations.filter((d) => {
      const matchesSearch =
        !search ||
        d.donorName.toLowerCase().includes(search.toLowerCase()) ||
        (d.donorEmail ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (d.purpose ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (d.transactionRef ?? '').toLowerCase().includes(search.toLowerCase())
      const matchesStatus = statusFilter === 'all' || d.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [donations, search, statusFilter])

  const totals = useMemo(() => {
    const confirmed = donations.filter((d) => d.status === 'CONFIRMED')
    const ghsTotal = confirmed.filter((d) => d.currency === 'GHS').reduce((s, d) => s + d.amount, 0)
    const usdTotal = confirmed.filter((d) => d.currency === 'USD').reduce((s, d) => s + d.amount, 0)
    return { ghsTotal, usdTotal, count: donations.length, pending: donations.filter((d) => d.status === 'PENDING').length }
  }, [donations])

  const handleConfirm = async () => {
    if (!confirmTarget || !currentUser) return
    try {
      await adminDonationsApi.confirm(confirmTarget.id)
      addActivity({
        action: 'confirmed donation',
        targetType: 'Donation',
        targetId: confirmTarget.id,
        performedBy: currentUser.id,
        performedByName: currentUser.name,
      })
      toast.success('Donation confirmed')
      setConfirmTarget(null)
      fetchDonations()
    } catch {
      toast.error('Failed to confirm donation')
    }
  }

  const handleExport = () => {
    const rows = filtered.map((d) => ({
      'Donor Name': d.donorName,
      'Email': d.donorEmail ?? '',
      'Amount': d.amount,
      'Currency': d.currency,
      'Channel': d.channel,
      'Status': d.status,
      'Purpose': d.purpose ?? '',
      'Transaction Ref': d.transactionRef ?? '',
      'Notes': d.notes ?? '',
      'Date': formatDate(d.createdAt),
    }))
    exportToCSV(rows, 'uposa-donations')
    toast.success('Export downloaded')
  }

  if (loading) {
    return <PageSkeleton cols={7} rows={5} />
  }

  return (
    <div className="page-enter">
      <PageHeader
        title="Donations"
        description={`${donations.length} total records`}
        actions={
          <div className="flex items-center gap-2">
            <RoleGate permission="donations:export">
              <Button
                variant="secondary"
                leftIcon={<Download size={16} />}
                onClick={handleExport}
              >
                Export CSV
              </Button>
            </RoleGate>
            <RoleGate permission="donations:create">
              <Button leftIcon={<PlusCircle size={16} />} onClick={() => navigate('/donations/new')}>
                Record Donation
              </Button>
            </RoleGate>
          </div>
        }
      />

      <PageStats
        stats={[
          { label: 'Total (GHS)', value: `GHS ${totals.ghsTotal.toLocaleString()}`, icon: HandCoins, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
          { label: 'Total (USD)', value: `$${totals.usdTotal.toLocaleString()}`, icon: HandCoins, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
          { label: 'Total Records', value: totals.count, icon: Hash, color: 'text-brand-600', bg: 'bg-brand-50', border: 'border-brand-100' },
          { label: 'Pending', value: totals.pending, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-100' },
        ]}
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <SearchInput
          value={search}
          onChange={(v) => { setSearch(v); setCurrentPage(1) }}
          placeholder="Search donor, purpose, reference..."
          className="flex-1"
        />
        <Select
          options={statusFilterOptions}
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1) }}
          className="w-48"
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-dark-border shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<HandCoins size={40} />}
            title={search || statusFilter !== 'all' ? 'No matching donations' : 'No donations yet'}
            description={search || statusFilter !== 'all' ? 'Try adjusting your search or filters.' : 'Record your first donation to start tracking contributions.'}
            action={!search && statusFilter === 'all' ? (
              <RoleGate permission="donations:create">
                <Button leftIcon={<PlusCircle size={16} />} onClick={() => navigate('/donations/new')}>
                  Record Donation
                </Button>
              </RoleGate>
            ) : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table w-full text-sm">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-50/50 dark:from-dark-hover dark:to-dark-hover/50 border-b-2 border-gray-100 dark:border-dark-border">
                <tr>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Donor</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Channel</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Purpose</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {filtered.slice((currentPage - 1) * 10, currentPage * 10).map((donation) => (
                  <tr
                    key={donation.id}
                    onClick={() => navigate(`/donations/${donation.id}`)}
                    className="border-b border-gray-50 dark:border-dark-border cursor-pointer hover:bg-gray-50/80 dark:hover:bg-dark-hover/50 hover:-translate-y-px transition-all"
                  >
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-gray-900 dark:text-gray-100">{donation.donorName}</p>
                      {donation.donorEmail && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{donation.donorEmail}</p>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {donation.currency} {donation.amount.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 dark:text-gray-400 text-xs">{donation.channel}</td>
                    <td className="px-5 py-3.5 text-gray-600 dark:text-gray-400 text-xs">
                      {donation.purpose ? donation.purpose : <span className="text-gray-300 dark:text-gray-600">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400 text-xs">{formatDate(donation.createdAt)}</td>
                    <td className="px-5 py-3.5">
                      <Badge
                        variant={donation.status.toLowerCase() as any}
                        label={donation.status.charAt(0) + donation.status.slice(1).toLowerCase()}
                      />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        {donation.status === 'PENDING' && (
                          <RoleGate permission="donations:edit">
                            <button
                              onClick={() => setConfirmTarget(donation)}
                              className="rounded-lg p-1.5 text-gray-400 hover:bg-green-50 dark:hover:bg-green-900/30 hover:text-green-600 transition-all duration-150"
                              title="Confirm donation"
                            >
                              <CheckCircle size={15} />
                            </button>
                          </RoleGate>
                        )}
                        <RoleGate permission="donations:edit">
                          <button
                            onClick={() => navigate(`/donations/${donation.id}`)}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-brand-50 dark:hover:bg-brand-900/30 hover:text-brand-600 transition-all duration-150"
                            title="View details"
                          >
                            <Pencil size={15} />
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
        open={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        onConfirm={handleConfirm}
        title="Confirm Donation"
        message={`Are you sure you want to confirm this ${confirmTarget?.currency} ${confirmTarget?.amount?.toLocaleString()} donation from "${confirmTarget?.donorName}"?`}
        confirmLabel="Confirm"
      />
    </div>
  )
}
