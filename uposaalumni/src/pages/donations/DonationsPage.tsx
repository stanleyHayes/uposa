import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Heart, History, Plus } from 'lucide-react'
import PageTransition from '../../components/common/PageTransition'
import PageHeader from '../../components/ui/PageHeader'
import ScrollReveal from '../../components/common/ScrollReveal'
import Modal from '../../components/ui/Modal'
import StatusBadge from '../../components/ui/StatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { donationsApi } from '../../api/services'
import { MOCK_DONATIONS } from '../../data/mock'
import { useAuthStore } from '../../stores/auth.store'
import { useToast } from '../../hooks/useToast'
import { formatCurrency, formatDate, formatEnum } from '../../utils/formatters'
import type { Donation } from '../../types'

const schema = z.object({
  amount: z.string().transform((v) => Number(v)).pipe(z.number().min(1, 'Amount must be at least 1')),
  channel: z.enum(['MOMO', 'BANK', 'PAYPAL', 'CASH', 'OTHER']),
  purpose: z.string().optional(),
  transactionRef: z.string().optional(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function DonationsPage() {
  const user = useAuthStore((s) => s.user)
  const [donations, setDonations] = useState<Donation[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const toast = useToast()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: { channel: 'MOMO' },
  })

  useEffect(() => {
    donationsApi.my()
      .then((res) => {
        const data = res.data.data
        setDonations(data?.length ? data : MOCK_DONATIONS)
      })
      .catch(() => setDonations(MOCK_DONATIONS))
      .finally(() => setLoading(false))
  }, [])

  const onSubmit = async (data: FormData) => {
    setSubmitting(true)
    try {
      await donationsApi.create({
        ...data,
        donorName: user?.fullName || '',
        donorEmail: user?.email || '',
        memberId: user?.id,
      })
      toast.success('Donation submitted! Thank you for your generosity.')
      setModalOpen(false)
      reset()
      const res = await donationsApi.my()
      setDonations(res.data.data || [])
    } catch {
      toast.error('Failed to submit donation')
    } finally {
      setSubmitting(false)
    }
  }

  const totalDonated = donations.filter((d) => d.status === 'CONFIRMED').reduce((sum, d) => sum + d.amount, 0)

  return (
    <PageTransition>
      <PageHeader
        title="Donations"
        description="Support UPOSA with your generous contributions"
        action={<button className="btn btn-primary btn-sm" onClick={() => setModalOpen(true)}><Plus className="w-4 h-4" /> Make a Donation</button>}
      />

      <ScrollReveal>
        <div className="stats bg-base-100 border border-base-300 w-full mb-6">
          <div className="stat">
            <div className="stat-title">Total Donated</div>
            <div className="stat-value text-primary text-2xl">{formatCurrency(totalDonated)}</div>
          </div>
          <div className="stat">
            <div className="stat-title">Donations Made</div>
            <div className="stat-value text-2xl">{donations.length}</div>
          </div>
        </div>
      </ScrollReveal>

      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><History className="w-5 h-5" /> Donation History</h2>

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : donations.length === 0 ? (
        <EmptyState icon={Heart} title="No donations yet" description="Your donations will appear here" action={
          <button className="btn btn-primary btn-sm" onClick={() => setModalOpen(true)}>Make Your First Donation</button>
        } />
      ) : (
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr><th>Date</th><th>Amount</th><th>Channel</th><th>Purpose</th><th>Status</th></tr>
            </thead>
            <tbody>
              {donations.map((d) => (
                <tr key={d.id}>
                  <td className="text-sm">{formatDate(d.createdAt)}</td>
                  <td className="font-medium">{formatCurrency(d.amount, d.currency)}</td>
                  <td><span className="badge badge-ghost badge-sm">{d.channel}</span></td>
                  <td className="text-sm">{d.purpose || '-'}</td>
                  <td><StatusBadge status={d.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Make a Donation">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="form-control">
            <label className="label"><span className="label-text">Amount (GHS) *</span></label>
            <input type="number" step="0.01" className={`input input-bordered ${errors.amount ? 'input-error' : ''}`} placeholder="100.00" {...register('amount')} />
            {errors.amount && <label className="label"><span className="label-text-alt text-error">{errors.amount.message}</span></label>}
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text">Payment Channel *</span></label>
            <select className="select select-bordered" {...register('channel')}>
              {['MOMO', 'BANK', 'PAYPAL', 'CASH', 'OTHER'].map((c) => (
                <option key={c} value={c}>{formatEnum(c)}</option>
              ))}
            </select>
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text">Purpose</span></label>
            <input type="text" className="input input-bordered" placeholder="e.g. NSMQ Support Fund" {...register('purpose')} />
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text">Transaction Reference</span></label>
            <input type="text" className="input input-bordered" placeholder="MoMo/Bank ref number" {...register('transactionRef')} />
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text">Notes</span></label>
            <textarea className="textarea textarea-bordered" {...register('notes')} />
          </div>
          <button type="submit" className={`btn btn-primary w-full ${submitting ? 'loading' : ''}`} disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Donation'}
          </button>
        </form>
      </Modal>
    </PageTransition>
  )
}
