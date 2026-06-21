import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import Select from '../../components/ui/Select'
import { useDonationsStore } from '../../stores/donations.store'
import { useActivityStore } from '../../stores/activity.store'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import type { Donation, DonationStatus, DonationChannel } from '../../types'

const donationSchema = z.object({
  memberId: z.string().optional(),
  donorName: z.string().min(2, 'Donor name is required'),
  donorEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  amount: z.coerce.number().positive('Amount must be positive'),
  currency: z.string().min(1, 'Currency is required'),
  channel: z.enum(['MOMO', 'BANK', 'PAYPAL', 'PAYSTACK', 'STRIPE', 'CRYPTO', 'CASH', 'OTHER']),
  status: z.enum(['PENDING', 'CONFIRMED', 'FAILED']),
  purpose: z.string().optional(),
  transactionRef: z.string().optional(),
  projectId: z.string().optional(),
  notes: z.string().optional(),
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

const statusOptions: { value: DonationStatus; label: string }[] = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'FAILED', label: 'Failed' },
]

const currencyOptions = [
  { value: 'GHS', label: 'GHS - Ghana Cedis' },
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'EUR', label: 'EUR - Euro' },
]

function toFormValues(donation?: Donation): DonationFormInput {
  if (!donation) {
    return {
      memberId: '',
      donorName: '',
      donorEmail: '',
      amount: 0,
      currency: 'GHS',
      channel: 'MOMO',
      status: 'PENDING',
      purpose: '',
      transactionRef: '',
      projectId: '',
      notes: '',
    }
  }
  return {
    memberId: donation.memberId ?? '',
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
  const { donations, addDonation, updateDonation } = useDonationsStore()
  const { addActivity } = useActivityStore()
  const { currentUser } = useAuth()
  const { toast } = useToast()

  const isEditing = Boolean(id)
  const existingDonation = isEditing ? donations.find((d) => d.id === id) : undefined

  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } = useForm<DonationFormInput, unknown, DonationForm>({
    resolver: zodResolver(donationSchema),
    defaultValues: toFormValues(existingDonation),
  })

  useEffect(() => {
    if (isEditing && !existingDonation) {
      toast.error('Donation not found')
      navigate('/donations', { replace: true })
    }
  }, [isEditing, existingDonation, navigate, toast])

  useEffect(() => {
    reset(toFormValues(existingDonation))
  }, [existingDonation, reset])

  const onSubmit = async (data: DonationForm) => {
    if (!currentUser) return
    const payload = {
      ...data,
      memberId: data.memberId || '',
      donorEmail: data.donorEmail || '',
      purpose: data.purpose || '',
      transactionRef: data.transactionRef || '',
      projectId: data.projectId || '',
      notes: data.notes || '',
    }

    if (isEditing && existingDonation) {
      updateDonation(existingDonation.id, payload)
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
      const donation = addDonation(payload)
      addActivity({
        action: `recorded donation from ${data.donorName}`,
        targetType: 'Donation',
        targetId: donation.id,
        performedBy: currentUser.id,
        performedByName: currentUser.name,
      })
      toast.success('Donation recorded')
      navigate('/donations')
    }
  }

  return (
    <div className="page-enter">
      <PageHeader
        title={isEditing ? 'Edit Donation' : 'Record Donation'}
        description={isEditing ? `Editing donation from ${existingDonation?.donorName ?? ''}` : 'Record a new donation contribution'}
        actions={
          <Button variant="secondary" leftIcon={<ArrowLeft size={16} />} onClick={() => navigate(-1)}>
            Back
          </Button>
        }
      />

      <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-dark-border shadow-sm p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Donor Information */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Donor Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Donor Name"
                error={errors.donorName?.message}
                {...register('donorName')}
              />
              <Input label="Email" type="email" {...register('donorEmail')} />
            </div>
          </div>

          {/* Payment Details */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Payment Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Amount"
                type="number"
                min={0}
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
          </div>

          {/* Additional Details */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Additional Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Purpose" placeholder="e.g. Science Lab Renovation" {...register('purpose')} />
              <Input label="Transaction Reference" {...register('transactionRef')} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <Input label="Member ID" placeholder="e.g. mem-001" {...register('memberId')} />
              <Input label="Project ID" placeholder="e.g. proj-001" {...register('projectId')} />
            </div>
          </div>

          {/* Status */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Status</h3>
            <div className="max-w-xs">
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select
                    label="Status"
                    options={statusOptions}
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value as DonationStatus)}
                  />
                )}
              />
            </div>
          </div>

          {/* Notes */}
          <Textarea label="Notes" rows={3} {...register('notes')} />

          {/* Actions */}
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
