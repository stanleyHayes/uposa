import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, Trash2, HandCoins } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import RoleGate from '../../components/auth/RoleGate'
import { PageSkeleton } from '../../components/ui/Skeleton'
import client from '../../api/client'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { formatDate } from '../../utils/formatters'

const channelLabels: Record<string, string> = {
  MOMO: 'Mobile Money (MoMo)',
  BANK: 'Bank Transfer',
  PAYPAL: 'PayPal',
  PAYSTACK: 'Paystack',
  STRIPE: 'Stripe',
  CRYPTO: 'Cryptocurrency',
  CASH: 'Cash',
  OTHER: 'Other',
}

export default function DonationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const { toast } = useToast()

  const [donation, setDonation] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    if (!id) return
    client.get(`/admin/donations/${id}`)
      .then((res) => setDonation(res.data.data || null))
      .catch(() => setDonation(null))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return <PageSkeleton cols={3} rows={4} />
  }

  if (!donation) {
    return (
      <div className="page-enter">
        <PageHeader
          title="Donation Not Found"
          actions={
            <Button variant="secondary" leftIcon={<ArrowLeft size={16} />} onClick={() => navigate('/donations')}>
              Back to Donations
            </Button>
          }
        />
        <div className="admin-card-surface p-12 text-center">
          <HandCoins size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">This donation record could not be found. It may have been deleted.</p>
        </div>
      </div>
    )
  }

  const handleDelete = async () => {
    if (!currentUser) return
    try {
      await client.delete(`/admin/donations/${donation.id}`)
      toast.success('Donation deleted')
      navigate('/donations', { replace: true })
    } catch {
      toast.error('Failed to delete donation')
    }
  }

  return (
    <div className="page-enter">
      <PageHeader
        title="Donation Details"
        description={`Donation from ${donation.donorName}`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" leftIcon={<ArrowLeft size={16} />} onClick={() => navigate('/donations')}>
              Back
            </Button>
            <RoleGate permission="donations:edit">
              <Button variant="secondary" leftIcon={<Pencil size={16} />} onClick={() => navigate(`/donations/${donation.id}/edit`)}>
                Edit
              </Button>
            </RoleGate>
            <RoleGate permission="donations:delete">
              <Button variant="danger" leftIcon={<Trash2 size={16} />} onClick={() => setShowDeleteConfirm(true)}>
                Delete
              </Button>
            </RoleGate>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Donor Information */}
          <div className="admin-card-surface p-6">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Donor Information</h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Donor Name</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100 font-medium">{donation.donorName}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {donation.donorEmail || <span className="text-gray-400 dark:text-gray-500">Not provided</span>}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Member ID</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {donation.memberId || <span className="text-gray-400 dark:text-gray-500">Not linked</span>}
                </dd>
              </div>
            </dl>
          </div>

          {/* Payment Details */}
          <div className="admin-card-surface p-6">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Payment Details</h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</dt>
                <dd className="mt-1 text-lg font-bold text-gray-900 dark:text-gray-100">
                  {donation.currency} {donation.amount.toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Channel</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{channelLabels[donation.channel] ?? donation.channel}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Transaction Reference</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100 font-mono">
                  {donation.transactionRef || <span className="text-gray-400 dark:text-gray-500 font-sans">None</span>}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Purpose</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {donation.purpose || <span className="text-gray-400 dark:text-gray-500">Not specified</span>}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Project ID</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {donation.projectId || <span className="text-gray-400 dark:text-gray-500">Not linked</span>}
                </dd>
              </div>
            </dl>
          </div>

          {/* Notes */}
          {donation.notes && (
            <div className="admin-card-surface p-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Notes</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{donation.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <div className="admin-card-surface p-6">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Status</h3>
            <Badge
              variant={donation.status.toLowerCase() as any}
              label={donation.status.charAt(0) + donation.status.slice(1).toLowerCase()}
            />
          </div>

          {/* Dates Card */}
          <div className="admin-card-surface p-6">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Timeline</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Created</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{formatDate(donation.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Last Updated</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{formatDate(donation.updatedAt)}</dd>
              </div>
            </dl>
          </div>

          {/* Quick Actions */}
          <div className="admin-card-surface p-6">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <RoleGate permission="donations:edit">
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full justify-start"
                  leftIcon={<Pencil size={14} />}
                  onClick={() => navigate(`/donations/${donation.id}/edit`)}
                >
                  Edit Donation
                </Button>
              </RoleGate>
              <RoleGate permission="donations:delete">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  leftIcon={<Trash2 size={14} />}
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Delete Donation
                </Button>
              </RoleGate>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Donation Record"
        message={`Are you sure you want to delete this donation from "${donation.donorName}"? This cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  )
}
