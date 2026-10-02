import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Lock } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import Select from '../../components/ui/Select'
import Spinner from '../../components/ui/Spinner'
import { adminDonationsApi, adminProjectsApi } from '../../api/services'
import { useActivityStore } from '../../stores/activity.store'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { apiErrorMessage } from '../../utils/apiError'
import type { Donation, DonationChannel, Project } from '../../types'

const donationSchema = z.object({
  donorName: z.string().min(2, 'Donor name is required'),
  donorEmail: z.string().email('Invalid email').or(z.literal('')),
  amount: z.coerce.number().positive('Amount must be positive'),
  currency: z.string().min(1, 'Currency is required'),
  channel: z.enum(['MOMO', 'BANK', 'PAYPAL', 'PAYSTACK', 'STRIPE', 'CRYPTO', 'CASH', 'OTHER']),
  status: z.enum(['PENDING', 'CONFIRMED', 'FAILED']),
  purpose: z.string(),
  transactionRef: z.string(),
  projectId: z.string(),
  notes: z.string(),
})

type DonationFormInput = z.input<typeof donationSchema>
type DonationForm = z.output<typeof donationSchema>

const channelOptions: { value: DonationChannel; label: string }[] = [
  { value: 'MOMO', label: 'Mobile Money (MoMo)' },
  { value: 'BANK', label: 'Bank Transfer' },
  { value: 'PAYPAL', label: 'PayPal' },
  { value: 'PAYSTACK', label: 'Paystack' },
  { value: 'STRIPE', label: 'Stripe' },
  { value: 'CRYPTO', label: 'Cryptocurrency' },
  { value: 'CASH', label: 'Cash' },
  { value: 'OTHER', label: 'Other' },
]

const statusOptions = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed' },
]
// FAILED can be set on existing records (e.g. a bounced transfer), not when recording one.
const editStatusOptions = [...statusOptions, { value: 'FAILED', label: 'Failed' }]

const currencyOptions = [
  { value: 'GHS', label: 'GHS - Ghana Cedis' },
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'EUR', label: 'EUR - Euro' },
]

function toFormValues(donation?: Donation): DonationFormInput {
  if (!donation) {
    return { donorName: '', donorEmail: '', amount: 0, currency: 'GHS', channel: 'CASH', status: 'PENDING', purpose: '', transactionRef: '', projectId: '', notes: '' }
  }
  return {
    donorName: donation.donorName,
    donorEmail: donation.donorEmail ?? '',
    amount: donation.amount,
    currency: donation.currency,
    channel: donation.channel,
    status: donation.status,
    purpose: donation.purpose ?? '',
    transactionRef: donation.transactionRef ?? '',
    projectId: donation.projectId ?? '',
    notes: donation.notes ?? '',
  }
}

export default function DonationFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addActivity } = useActivityStore()
  const { currentUser } = useAuth()
  const { toast } = useToast()

  const isEditing = Boolean(id)
  const [existingDonation, setExistingDonation] = useState<Donation | null>(null)
  const [loading, setLoading] = useState(isEditing)
  const [projects, setProjects] = useState<Project[]>([])

  // Amount, currency and project are fixed while a donation is confirmed (the API rejects changes);
  // set the status back to Pending first to correct them.
  const isLocked = existingDonation?.status === 'CONFIRMED'

  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } = useForm<DonationFormInput, unknown, DonationForm>({
    resolver: zodResolver(donationSchema),
    defaultValues: toFormValues(),
  })

  useEffect(() => {
    adminProjectsApi.list({ limit: 100 })
      .then((res) => setProjects((res.data.data || []) as Project[]))
      .catch(() => toast.error('Failed to load projects'))
  }, [toast])

  useEffect(() => {
    if (!id) return
    let cancelled = false
    adminDonationsApi.getById(id)
      .then((res) => {
        if (cancelled) return
        const donation = res.data.data as Donation
        setExistingDonation(donation)
        reset(toFormValues(donation))
      })
      .catch(() => {
        if (cancelled) return
        toast.error('Donation not found')
        navigate('/donations', { replace: true })
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id, reset, navigate, toast])

  const onSubmit = async (data: DonationForm) => {
    if (!currentUser) return

    const payload = {
      donorName: data.donorName,
      donorEmail: data.donorEmail,
      amount: data.amount,
      currency: data.currency,
      channel: data.channel,
      status: data.status,
      projectId: data.projectId || undefined,
      purpose: data.purpose,
      transactionRef: data.transactionRef,
      notes: data.notes,
    }

    try {
      if (existingDonation) {
        const { amount: _amount, currency: _currency, projectId: _projectId, ...editable } = payload
        await adminDonationsApi.update(
          existingDonation.id,
          // '' unlinks the project; locked fields are left out entirely once confirmed.
          isLocked ? editable : { ...payload, projectId: data.projectId },
        )
        addActivity({
          action: 'updated donation record',
          targetType: 'Donation',
          targetId: existingDonation.id,
          performedBy: currentUser.id,
          performedByName: currentUser.name,
        })
        toast.success('Donation updated')
        navigate(`/donations/${existingDonation.id}`)
      } else {
        // New records can only be Pending or Confirmed.
        const res = await adminDonationsApi.create({ ...payload, status: data.status === 'CONFIRMED' ? 'CONFIRMED' : 'PENDING' })
        const created = res.data.data as Donation | undefined
        addActivity({
          action: `recorded donation from ${data.donorName}`,
          targetType: 'Donation',
          targetId: created?.id ?? '',
          performedBy: currentUser.id,
          performedByName: currentUser.name,
        })
        toast.success('Donation recorded')
        navigate(created?.id ? `/donations/${created.id}` : '/donations')
      }
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to save donation'))
    }
  }

  if (loading) {
    return (
      <div className="page-enter flex items-center justify-center py-32">
        <Spinner size="lg" />
      </div>
    )
  }

  const projectOptions = [{ value: '', label: 'No project (general fund)' }, ...projects.map((p) => ({ value: p.id, label: p.title }))]

  return (
    <div className="page-enter">
      <PageHeader
        title={isEditing ? 'Edit Donation' : 'Record Donation'}
        description={isEditing ? `Editing donation from ${existingDonation?.donorName ?? ''}` : 'Record an offline donation (cash, bank transfer, MoMo, ...)'}
        actions={
          <Button variant="secondary" leftIcon={<ArrowLeft size={16} />} onClick={() => navigate(-1)}>
            Back
          </Button>
        }
      />

      <div className="admin-card-surface p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Donor Information */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Donor Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Donor Name" error={errors.donorName?.message} {...register('donorName')} />
              <Input label="Email" type="email" error={errors.donorEmail?.message} {...register('donorEmail')} />
            </div>
          </div>

          {/* Payment Details */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Payment Details</h3>
            {isLocked && (
              <p className="mb-3 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                <Lock size={12} />
                This donation is confirmed, so its amount, currency and project are locked. Set the status back to Pending to correct them.
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Amount"
                type="number"
                min={0}
                step="0.01"
                readOnly={isLocked}
                error={errors.amount?.message}
                {...register('amount')}
              />
              <Controller
                name="currency"
                control={control}
                render={({ field }) => (
                  <Select
                    label="Currency"
                    options={currencyOptions}
                    value={field.value}
                    disabled={isLocked}
                    onChange={(e) => field.onChange(e.target.value)}
                  />
                )}
              />
              <Controller
                name="channel"
                control={control}
                render={({ field }) => (
                  <Select
                    label="Channel"
                    options={channelOptions}
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value as DonationChannel)}
                  />
                )}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <Controller
                name="projectId"
                control={control}
                render={({ field }) => (
                  <Select
                    label="Project"
                    options={projectOptions}
                    value={field.value}
                    disabled={isLocked}
                    onChange={(e) => field.onChange(e.target.value)}
                  />
                )}
              />
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select
                    label="Status"
                    options={isEditing ? editStatusOptions : statusOptions}
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                  />
                )}
              />
            </div>
          </div>

          {/* Additional Details */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Additional Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Purpose" placeholder="e.g. Science Lab Renovation" {...register('purpose')} />
              <Input label="Transaction Reference" {...register('transactionRef')} />
            </div>
          </div>

          <Textarea label="Notes" rows={3} {...register('notes')} />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-dark-border">
            <Button variant="secondary" type="button" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {isEditing ? 'Save Changes' : 'Record Donation'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
