import { useState, useEffect } from 'react'
import { CreditCard, AlertTriangle, ExternalLink } from 'lucide-react'
import PageTransition from '../../components/common/PageTransition'
import PageHeader from '../../components/ui/PageHeader'
import ScrollReveal from '../../components/common/ScrollReveal'
import StatusBadge from '../../components/ui/StatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import Modal from '../../components/ui/Modal'
import { duesApi, paymentsApi } from '../../api/services'
import { useAuthStore } from '../../stores/auth.store'
import { useSiteConfig } from '../../hooks/useSiteConfig'
import { usePaymentMethods } from '../../hooks/usePaymentMethods'
import { useToast } from '../../hooks/useToast'
import { formatCurrency, formatDate } from '../../utils/formatters'
import type { Due } from '../../types'

export default function DuesPage() {
  const user = useAuthStore((s) => s.user)
  const [dues, setDues] = useState<Due[]>([])
  const [loading, setLoading] = useState(true)
  const { config, loading: configLoading } = useSiteConfig()
  const { methods: paymentMethods, loading: methodsLoading } = usePaymentMethods()
  const toast = useToast()

  // Pay modal state
  const [payModalOpen, setPayModalOpen] = useState(false)
  const [selectedDue, setSelectedDue] = useState<Due | null>(null)
  const [payMethod, setPayMethod] = useState<'manual' | string>('manual')
  const [transactionRef, setTransactionRef] = useState('')
  const [payNotes, setPayNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    duesApi.my()
      .then((res) => {
        const data = res.data.data
        setDues(data || [])
      })
      .catch(() => setDues([]))
      .finally(() => setLoading(false))
  }, [])

  const openPayModal = (due: Due) => {
    setSelectedDue(due)
    setPayMethod('manual')
    setTransactionRef('')
    setPayNotes('')
    setPayModalOpen(true)
  }

  const handlePay = async () => {
    if (!selectedDue) return
    setSubmitting(true)
    try {
      // Online payment provider
      if (payMethod !== 'manual') {
        const res = await paymentsApi.initialize({
          provider: payMethod,
          purpose: 'DUES',
          amount: selectedDue.amount,
          currency: config?.dues?.currency || 'GHS',
          email: user?.email || '',
          name: user?.fullName,
          dueId: selectedDue.id,
        })
        const data = res.data.data
        if (data?.authorizationUrl) {
          toast.success('Redirecting to payment...')
          window.location.href = data.authorizationUrl
          return
        }
      }

      // Manual payment
      if (!transactionRef.trim()) {
        toast.error('Transaction reference is required for manual payment')
        setSubmitting(false)
        return
      }
      await duesApi.pay(selectedDue.id, { transactionRef, notes: payNotes || undefined })
      toast.success('Payment submitted successfully!')
      setPayModalOpen(false)
      const res = await duesApi.my()
      setDues(res.data.data || [])
    } catch {
      toast.error('Payment failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const totalOwed = dues.filter((d) => d.status !== 'PAID').reduce((sum, d) => sum + d.amount, 0)
  const totalPaid = dues.filter((d) => d.status === 'PAID').reduce((sum, d) => sum + d.amount, 0)
  const overdue = dues.filter((d) => d.status === 'OVERDUE')

  return (
    <PageTransition>
      <PageHeader title="My Dues" description="View and track your membership dues" />

      <ScrollReveal>
        <div className="stats bg-base-100 shadow-[0_2px_8px_rgba(0,27,80,0.06)] w-full mb-6">
          <div className="stat">
            <div className="stat-title">Total Paid</div>
            <div className="stat-value text-success text-2xl">{formatCurrency(totalPaid)}</div>
          </div>
          <div className="stat">
            <div className="stat-title">Outstanding</div>
            <div className="stat-value text-warning text-2xl">{formatCurrency(totalOwed)}</div>
          </div>
          <div className="stat">
            <div className="stat-title">Overdue</div>
            <div className="stat-value text-error text-2xl">{overdue.length}</div>
          </div>
        </div>
      </ScrollReveal>

      {overdue.length > 0 && (
        <ScrollReveal>
          <div className="alert alert-warning mb-6">
            <AlertTriangle className="w-5 h-5" />
            <span>You have {overdue.length} overdue dues totaling {formatCurrency(overdue.reduce((s, d) => s + d.amount, 0))}. Please make payment promptly.</span>
          </div>
        </ScrollReveal>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : dues.length === 0 ? (
        <EmptyState icon={CreditCard} title="No dues assigned" description="Your annual dues will appear here when assigned by the admin." />
      ) : (
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr><th>Year</th><th>Amount</th><th>Status</th><th>Paid At</th><th>Reference</th><th></th></tr>
            </thead>
            <tbody>
              {dues.sort((a, b) => b.year - a.year).map((due) => (
                <tr key={due.id}>
                  <td className="font-medium">{due.year}</td>
                  <td>{formatCurrency(due.amount)}</td>
                  <td><StatusBadge status={due.status} /></td>
                  <td className="text-sm">{due.paidAt ? formatDate(due.paidAt) : '-'}</td>
                  <td className="text-sm text-base-content/60">{due.transactionRef || '-'}</td>
                  <td>
                    {due.status !== 'PAID' && (
                      <button className="btn btn-primary btn-xs" onClick={() => openPayModal(due)}>Pay Now</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Payment Methods Card */}
      <ScrollReveal>
        <div className="card bg-base-200 mt-8">
          <div className="card-body">
            <h3 className="font-semibold">Payment Methods</h3>
            {configLoading || methodsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="p-4 bg-base-100 rounded-lg animate-pulse">
                    <div className="h-4 bg-base-300 rounded w-24 mb-2" />
                    <div className="h-3 bg-base-300 rounded w-32 mb-1" />
                    <div className="h-3 bg-base-300 rounded w-28 mb-1" />
                    <div className="h-3 bg-base-300 rounded w-36" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                <div className="p-4 bg-base-100 rounded-lg">
                  <p className="font-medium">Mobile Money</p>
                  <p className="text-sm text-base-content/60 mt-1">MTN MoMo: {config?.payment?.momo?.number || '0598987137'}</p>
                  <p className="text-sm text-base-content/60">MoMo Pay ID: {config?.payment?.momo?.payId || '159025'}</p>
                  <p className="text-sm text-base-content/60">Name: {config?.payment?.momo?.accountName || 'UPOSA National'}</p>
                </div>
                <div className="p-4 bg-base-100 rounded-lg">
                  <p className="font-medium">Bank Transfer</p>
                  <p className="text-sm text-base-content/60 mt-1">{config?.payment?.bank?.bank || 'GCB Bank'} - {config?.payment?.bank?.branch || 'UCC Branch'}</p>
                  <p className="text-sm text-base-content/60">Acc: {config?.payment?.bank?.accountNo || '3021440000835'}</p>
                  <p className="text-sm text-base-content/60">Name: {config?.payment?.bank?.accountName || 'UPOSA PROJECT ACCOUNT'}</p>
                </div>
                {paymentMethods.map((method) => (
                  <div key={method.id} className="p-4 bg-base-100 rounded-lg">
                    <p className="font-medium flex items-center gap-2">{method.displayName} <ExternalLink className="w-3 h-3" /></p>
                    <p className="text-sm text-base-content/60 mt-1">{method.description}</p>
                    <p className="text-xs text-base-content/40 mt-1">Currencies: {method.supportedCurrencies.join(', ')}</p>
                  </div>
                ))}
                <div className="p-4 bg-base-100 rounded-lg">
                  <p className="font-medium">Annual Dues</p>
                  <p className="text-sm text-base-content/60 mt-1">GH&#8373;{config?.dues?.annual || 120} per year</p>
                  <p className="text-sm text-base-content/60">Click "Pay Now" on any unpaid due to get started</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </ScrollReveal>

      {/* Pay Modal */}
      <Modal open={payModalOpen} onClose={() => setPayModalOpen(false)} title={`Pay Dues — ${selectedDue?.year}`}>
        <div className="space-y-4">
          <div className="bg-base-200 rounded-lg p-3 text-center">
            <p className="text-sm text-base-content/60">Amount Due</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(selectedDue?.amount || 0)}</p>
          </div>

          <div className="form-control">
            <label className="label"><span className="label-text font-medium">Choose Payment Method</span></label>
            <div className="space-y-2">
              <button
                type="button"
                className={`w-full text-left p-3 rounded-lg border transition ${payMethod === 'manual' ? 'border-primary bg-primary/10' : 'border-base-300 hover:border-primary'}`}
                onClick={() => setPayMethod('manual')}
              >
                <p className="font-medium text-sm">MoMo / Bank Transfer</p>
                <p className="text-xs text-base-content/60">Manual transfer then enter reference</p>
              </button>
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  type="button"
                  className={`w-full text-left p-3 rounded-lg border transition ${payMethod === method.provider ? 'border-primary bg-primary/10' : 'border-base-300 hover:border-primary'}`}
                  onClick={() => setPayMethod(method.provider)}
                >
                  <p className="font-medium text-sm">{method.displayName}</p>
                  <p className="text-xs text-base-content/60">{method.description}</p>
                </button>
              ))}
            </div>
          </div>

          {payMethod === 'manual' && (
            <>
              <div className="form-control">
                <label className="label"><span className="label-text">Transaction Reference *</span></label>
                <input type="text" className="input input-bordered" placeholder="MoMo/Bank ref number" value={transactionRef} onChange={(e) => setTransactionRef(e.target.value)} />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Notes</span></label>
                <textarea className="textarea textarea-bordered" value={payNotes} onChange={(e) => setPayNotes(e.target.value)} />
              </div>
            </>
          )}

          {payMethod !== 'manual' && (
            <div className="alert alert-info text-sm py-2">
              <span>You'll be redirected to complete payment securely.</span>
            </div>
          )}

          <button
            className={`btn btn-primary w-full ${submitting ? 'loading' : ''}`}
            disabled={submitting}
            onClick={handlePay}
          >
            {submitting ? 'Processing...' : payMethod !== 'manual' ? 'Proceed to Payment' : 'Submit Payment'}
          </button>
        </div>
      </Modal>
    </PageTransition>
  )
}
