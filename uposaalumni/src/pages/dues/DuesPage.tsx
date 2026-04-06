import { useState, useEffect } from 'react'
import { CreditCard, AlertTriangle } from 'lucide-react'
import PageTransition from '../../components/common/PageTransition'
import PageHeader from '../../components/ui/PageHeader'
import ScrollReveal from '../../components/common/ScrollReveal'
import StatusBadge from '../../components/ui/StatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { duesApi } from '../../api/services'
import { MOCK_DUES } from '../../data/mock'
import { formatCurrency, formatDate } from '../../utils/formatters'
import type { Due } from '../../types'

export default function DuesPage() {
  const [dues, setDues] = useState<Due[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    duesApi.my()
      .then((res) => {
        const data = res.data.data
        setDues(data?.length ? data : MOCK_DUES)
      })
      .catch(() => setDues(MOCK_DUES))
      .finally(() => setLoading(false))
  }, [])

  const totalOwed = dues.filter((d) => d.status !== 'PAID').reduce((sum, d) => sum + d.amount, 0)
  const totalPaid = dues.filter((d) => d.status === 'PAID').reduce((sum, d) => sum + d.amount, 0)
  const overdue = dues.filter((d) => d.status === 'OVERDUE')

  return (
    <PageTransition>
      <PageHeader title="My Dues" description="View and track your membership dues" />

      <ScrollReveal>
        <div className="stats bg-base-100 border border-base-300 w-full mb-6">
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
            <span>You have {overdue.length} overdue dues totaling {formatCurrency(overdue.reduce((s, d) => s + d.amount, 0))}. Please contact the treasurer for payment options.</span>
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
              <tr><th>Year</th><th>Amount</th><th>Status</th><th>Paid At</th><th>Reference</th></tr>
            </thead>
            <tbody>
              {dues.sort((a, b) => b.year - a.year).map((due) => (
                <tr key={due.id}>
                  <td className="font-medium">{due.year}</td>
                  <td>{formatCurrency(due.amount)}</td>
                  <td><StatusBadge status={due.status} /></td>
                  <td className="text-sm">{due.paidAt ? formatDate(due.paidAt) : '-'}</td>
                  <td className="text-sm text-base-content/60">{due.transactionRef || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ScrollReveal>
        <div className="card bg-base-200 mt-8">
          <div className="card-body">
            <h3 className="font-semibold">Payment Methods</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
              <div className="p-4 bg-base-100 rounded-lg">
                <p className="font-medium">Mobile Money</p>
                <p className="text-sm text-base-content/60 mt-1">MTN MoMo: 0XX XXX XXXX</p>
                <p className="text-sm text-base-content/60">Name: UPOSA</p>
              </div>
              <div className="p-4 bg-base-100 rounded-lg">
                <p className="font-medium">Bank Transfer</p>
                <p className="text-sm text-base-content/60 mt-1">GCB Bank</p>
                <p className="text-sm text-base-content/60">Acc: XXXX-XXXX-XXXX</p>
              </div>
              <div className="p-4 bg-base-100 rounded-lg">
                <p className="font-medium">Online</p>
                <p className="text-sm text-base-content/60 mt-1">Pay via the Donations page and reference your dues year</p>
              </div>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </PageTransition>
  )
}
