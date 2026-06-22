import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Landmark,
  ReceiptText,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import PageTransition from '../../components/common/PageTransition'
import Modal from '../../components/ui/Modal'
import StatusBadge from '../../components/ui/StatusBadge'
import { duesApi, paymentsApi } from '../../api/services'
import { useAuthStore } from '../../stores/auth.store'
import { useSiteConfig } from '../../hooks/useSiteConfig'
import { usePaymentMethods } from '../../hooks/usePaymentMethods'
import { useToast } from '../../hooks/useToast'
import { formatCurrency, formatDate } from '../../utils/formatters'
import type { Due } from '../../types'

type FeePreview = {
  amount: number
  platformFee: number
  totalAmount: number
  percent: number
  fixed: number
  enabled: boolean
}

const providerIcons: Record<string, LucideIcon> = {
  PAYSTACK: CreditCard,
  STRIPE: CreditCard,
  CRYPTO: Wallet,
}

function StatTile({
  icon: Icon,
  label,
  value,
  detail,
  tone = 'bg-primary-content/[0.06] text-secondary',
}: {
  icon: LucideIcon
  label: string
  value: ReactNode
  detail: string
  tone?: string
}) {
  return (
    <div className="flex h-full flex-col border border-primary-content/10 bg-primary-content/[0.055] p-4 rounded-[18px_4px_18px_4px]">
      <div className="flex items-start justify-between gap-3">
        <span className={`grid h-10 w-10 place-items-center rounded-[14px_3px_14px_3px] ${tone}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.16em] text-primary-content/42">{label}</p>
      <p className="mt-2 truncate text-2xl font-bold text-secondary">{value}</p>
      <p className="mt-auto pt-2 text-xs font-semibold text-primary-content/45">{detail}</p>
    </div>
  )
}

function RailCard({
  icon: Icon,
  eyebrow,
  title,
  children,
  badge,
}: {
  icon: LucideIcon
  eyebrow: string
  title: string
  children: ReactNode
  badge: ReactNode
}) {
  return (
    <div className="flex h-full flex-col border border-primary/10 bg-base-100/90 p-5 shadow-[0_14px_38px_rgba(0,27,80,0.06)] rounded-[24px_4px_24px_4px]">
      <div className="flex items-start justify-between gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center bg-primary/8 text-primary rounded-[16px_3px_16px_3px]">
          <Icon className="h-5 w-5" />
        </span>
        {badge}
      </div>
      <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.18em] text-secondary">{eyebrow}</p>
      <h2 className="mt-2 text-xl font-bold leading-tight text-base-content">{title}</h2>
      <div className="mt-4 flex-1 space-y-2 text-sm leading-relaxed text-base-content/58">{children}</div>
    </div>
  )
}

function DuesSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="h-32 animate-pulse bg-base-300/40 rounded-[18px_4px_18px_4px]" />
        ))}
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="border border-primary/8 bg-base-100/84 p-5 rounded-[24px_4px_24px_4px]">
            <div className="flex items-start justify-between gap-4">
              <div className="h-12 w-12 animate-pulse bg-base-300/45 rounded-[16px_3px_16px_3px]" />
              <div className="h-8 w-24 animate-pulse bg-base-300/35" />
            </div>
            <div className="mt-6 h-6 w-40 animate-pulse bg-base-300/55" />
            <div className="mt-3 h-3 w-full animate-pulse bg-base-300/35" />
            <div className="mt-2 h-3 w-2/3 animate-pulse bg-base-300/35" />
            <div className="mt-6 h-11 w-full animate-pulse bg-base-300/45" />
          </div>
        ))}
      </div>
    </div>
  )
}

function MethodsSkeleton() {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {[0, 1, 2].map((item) => (
        <div key={item} className="border border-primary/8 bg-base-100 p-5 rounded-[24px_4px_24px_4px]">
          <div className="h-12 w-12 animate-pulse bg-base-300/45 rounded-[16px_3px_16px_3px]" />
          <div className="mt-5 h-3 w-24 animate-pulse bg-base-300/45" />
          <div className="mt-3 h-5 w-36 animate-pulse bg-base-300/55" />
          <div className="mt-4 space-y-2">
            <div className="h-3 w-full animate-pulse bg-base-300/35" />
            <div className="h-3 w-4/5 animate-pulse bg-base-300/35" />
            <div className="h-3 w-2/3 animate-pulse bg-base-300/35" />
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyDues({ annualAmount }: { annualAmount: number }) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center border border-primary/10 bg-base-100/86 px-6 py-12 text-center shadow-[0_12px_34px_rgba(0,27,80,0.06)] rounded-[24px_4px_24px_4px]">
      <span className="grid h-16 w-16 place-items-center bg-primary/8 text-primary rounded-[18px_4px_18px_4px]">
        <ShieldCheck className="h-7 w-7" />
      </span>
      <h2 className="mt-5 text-xl font-bold">No dues assigned</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-base-content/55">
        Your annual dues will appear here when the association assigns them. Current annual dues are {formatCurrency(annualAmount)}.
      </p>
    </div>
  )
}

function DueCard({ due, onPay }: { due: Due; onPay: (due: Due) => void }) {
  const paid = due.status === 'PAID'
  const overdue = due.status === 'OVERDUE'
  const Icon = paid ? CheckCircle2 : overdue ? AlertTriangle : CalendarDays
  const iconTone = paid ? 'bg-success/12 text-success' : overdue ? 'bg-error/10 text-error' : 'bg-secondary/15 text-primary'

  return (
    <article className="flex h-full flex-col overflow-hidden border border-primary/10 bg-base-100/88 shadow-[0_14px_38px_rgba(0,27,80,0.06)] rounded-[24px_4px_24px_4px]">
      <div className={`h-1 ${paid ? 'bg-success' : overdue ? 'bg-error' : 'bg-secondary'}`} />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-4">
          <span className={`grid h-12 w-12 place-items-center rounded-[16px_3px_16px_3px] ${iconTone}`}>
            <Icon className="h-5 w-5" />
          </span>
          <StatusBadge status={due.status} />
        </div>

        <div className="mt-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-secondary">Membership dues</p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-2xl font-bold leading-tight text-base-content">{due.year}</h2>
            <p className="text-2xl font-bold text-primary">{formatCurrency(due.amount)}</p>
          </div>
        </div>

        <div className="mt-5 grid gap-2 border-y border-primary/8 py-4 text-sm text-base-content/56">
          <div className="flex items-center justify-between gap-4">
            <span>Created</span>
            <span className="font-semibold text-base-content/70">{formatDate(due.createdAt)}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span>Paid date</span>
            <span className="font-semibold text-base-content/70">{due.paidAt ? formatDate(due.paidAt) : 'Pending'}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span>Reference</span>
            <span className="max-w-[11rem] truncate font-semibold text-base-content/70">{due.transactionRef || 'Not submitted'}</span>
          </div>
        </div>

        <div className="mt-auto pt-5">
          {paid ? (
            <div className="flex min-h-11 items-center justify-between gap-3 bg-success/10 px-4 py-3 text-sm font-bold text-success rounded-[16px_3px_16px_3px]">
              <span>Payment recorded</span>
              <CheckCircle2 className="h-4 w-4" />
            </div>
          ) : (
            <button type="button" className="btn btn-primary min-h-11 w-full gap-2" onClick={() => onPay(due)}>
              Pay this due
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </article>
  )
}

function PaymentOption({
  active,
  icon: Icon,
  title,
  description,
  onClick,
}: {
  active: boolean
  icon: LucideIcon
  title: string
  description: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className={`flex min-h-20 w-full items-center gap-3 border p-3 text-left transition-all rounded-[18px_4px_18px_4px] ${
        active ? 'border-primary bg-primary/7 shadow-[0_10px_24px_rgba(0,27,80,0.08)]' : 'border-primary/10 bg-base-100 hover:border-primary/20'
      }`}
      onClick={onClick}
    >
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-[14px_3px_14px_3px] ${active ? 'bg-primary text-primary-content' : 'bg-primary/8 text-primary'}`}>
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-bold leading-tight">{title}</span>
        <span className="mt-1 block text-xs leading-relaxed text-base-content/50">{description}</span>
      </span>
    </button>
  )
}

export default function DuesPage() {
  const user = useAuthStore((state) => state.user)
  const [dues, setDues] = useState<Due[]>([])
  const [loading, setLoading] = useState(true)
  const { config, loading: configLoading } = useSiteConfig()
  const { methods: paymentMethods, loading: methodsLoading } = usePaymentMethods()
  const toast = useToast()

  const [payModalOpen, setPayModalOpen] = useState(false)
  const [selectedDue, setSelectedDue] = useState<Due | null>(null)
  const [payMethod, setPayMethod] = useState<'manual' | string>('manual')
  const [transactionRef, setTransactionRef] = useState('')
  const [payNotes, setPayNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [feePreview, setFeePreview] = useState<FeePreview | null>(null)
  const [feeLoading, setFeeLoading] = useState(false)

  const loadDues = async () => {
    try {
      const res = await duesApi.my()
      setDues(res.data.data || [])
    } catch {
      setDues([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDues()
  }, [])

  useEffect(() => {
    if (!selectedDue || payMethod === 'manual') {
      setFeePreview(null)
      return
    }

    setFeeLoading(true)
    paymentsApi.platformFeePreview(selectedDue.amount)
      .then((res) => setFeePreview(res.data.data ?? null))
      .catch(() => setFeePreview(null))
      .finally(() => setFeeLoading(false))
  }, [selectedDue, payMethod])

  const sortedDues = useMemo(() => [...dues].sort((a, b) => b.year - a.year), [dues])
  const pendingDues = dues.filter((due) => due.status !== 'PAID')
  const paidDues = dues.filter((due) => due.status === 'PAID')
  const overdueDues = dues.filter((due) => due.status === 'OVERDUE')
  const totalOwed = pendingDues.reduce((sum, due) => sum + due.amount, 0)
  const totalPaid = paidDues.reduce((sum, due) => sum + due.amount, 0)
  const nextDue = pendingDues.sort((a, b) => a.year - b.year)[0]
  const annualAmount = config?.dues?.annual || 120
  const currency = config?.dues?.currency || 'GHS'
  const selectedProvider = paymentMethods.find((method) => method.provider === payMethod)
  const onlineMethodLabel = selectedProvider?.displayName || payMethod

  const openPayModal = (due: Due) => {
    setSelectedDue(due)
    setPayMethod(paymentMethods[0]?.provider || 'manual')
    setTransactionRef('')
    setPayNotes('')
    setFeePreview(null)
    setPayModalOpen(true)
  }

  const handlePay = async () => {
    if (!selectedDue) return
    setSubmitting(true)

    try {
      if (payMethod !== 'manual') {
        const res = await paymentsApi.initialize({
          provider: payMethod,
          purpose: 'DUES',
          amount: selectedDue.amount,
          currency,
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
        toast.error('Payment provider did not return a checkout link')
        return
      }

      if (!transactionRef.trim()) {
        toast.error('Transaction reference is required for manual payment')
        return
      }

      await duesApi.pay(selectedDue.id, { transactionRef, notes: payNotes || undefined })
      toast.success('Payment submitted successfully!')
      setPayModalOpen(false)
      await loadDues()
    } catch {
      toast.error('Payment failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageTransition>
      <div className="relative space-y-6">
        <img
          src="/logo.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none fixed right-[-8rem] top-24 z-0 hidden h-[26rem] w-[26rem] object-contain opacity-[0.025] xl:block"
        />

        <section className="relative z-10 overflow-hidden bg-primary text-primary-content shadow-[0_24px_80px_rgba(0,27,80,0.18)] rounded-[28px_6px_28px_6px]">
          <img src="/logo.png" alt="" aria-hidden="true" className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 object-contain opacity-[0.055]" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-secondary/80 to-transparent" />
          <div className="relative grid gap-8 p-5 sm:p-7 lg:grid-cols-[minmax(0,1.08fr)_minmax(340px,0.92fr)] lg:p-8">
            <div className="min-w-0">
              <div className="mb-4 inline-flex items-center gap-2 border border-primary-content/15 bg-primary-content/10 px-3 py-2 text-xs font-semibold text-primary-content/70 rounded-[14px_3px_14px_3px]">
                <Sparkles className="h-4 w-4 text-secondary" />
                Dues desk
              </div>
              <h1 className="max-w-3xl text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
                Keep your membership standing clean and current.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-primary-content/62 sm:text-base">
                Review assigned dues, submit manual payment references, or continue through any enabled online provider.
              </p>
              {nextDue ? (
                <button type="button" className="btn btn-secondary mt-6 min-h-12 px-5 text-primary" onClick={() => openPayModal(nextDue)}>
                  <CreditCard className="h-4 w-4" />
                  Pay {nextDue.year} dues
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <div className="mt-6 inline-flex min-h-12 items-center gap-2 bg-primary-content/10 px-4 py-3 text-sm font-bold text-primary-content/72 rounded-[16px_3px_16px_3px]">
                  <CheckCircle2 className="h-4 w-4 text-secondary" />
                  No outstanding dues
                </div>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <StatTile icon={CheckCircle2} label="Paid total" value={formatCurrency(totalPaid, currency)} detail={`${paidDues.length} settled record${paidDues.length === 1 ? '' : 's'}`} />
              <StatTile icon={ReceiptText} label="Outstanding" value={formatCurrency(totalOwed, currency)} detail={`${pendingDues.length} payment${pendingDues.length === 1 ? '' : 's'} pending`} tone="bg-secondary/18 text-primary" />
              <StatTile icon={AlertTriangle} label="Overdue" value={overdueDues.length} detail={overdueDues.length ? formatCurrency(overdueDues.reduce((sum, due) => sum + due.amount, 0), currency) : 'All clear'} tone={overdueDues.length ? 'bg-error/12 text-error' : 'bg-success/12 text-success'} />
              <StatTile icon={CalendarDays} label="Annual due" value={formatCurrency(annualAmount, currency)} detail="Configured amount" />
            </div>
          </div>
        </section>

        {overdueDues.length > 0 && (
          <section className="relative z-10 flex flex-col gap-3 border border-warning/20 bg-warning/10 p-4 text-warning-content shadow-[0_12px_34px_rgba(0,27,80,0.05)] sm:flex-row sm:items-center sm:justify-between rounded-[22px_4px_22px_4px]">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center bg-warning/20 text-warning rounded-[14px_3px_14px_3px]">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <div>
                <p className="font-bold text-base-content">{overdueDues.length} overdue due{overdueDues.length === 1 ? '' : 's'} need attention</p>
                <p className="mt-1 text-sm leading-relaxed text-base-content/58">
                  Total overdue amount: {formatCurrency(overdueDues.reduce((sum, due) => sum + due.amount, 0), currency)}.
                </p>
              </div>
            </div>
            <button type="button" className="btn btn-warning min-h-11 shrink-0" onClick={() => openPayModal(overdueDues[0])}>
              Start payment
              <ArrowRight className="h-4 w-4" />
            </button>
          </section>
        )}

        <section className="relative z-10 space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-secondary">Your records</p>
              <h2 className="mt-1 text-2xl font-bold">Assigned dues</h2>
            </div>
            <p className="max-w-xl text-sm leading-relaxed text-base-content/52">
              Each unpaid record can be settled by manual reference or online checkout.
            </p>
          </div>

          {loading ? (
            <DuesSkeleton />
          ) : sortedDues.length === 0 ? (
            <EmptyDues annualAmount={annualAmount} />
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {sortedDues.map((due) => (
                <DueCard key={due.id} due={due} onPay={openPayModal} />
              ))}
            </div>
          )}
        </section>

        <section className="relative z-10 space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-secondary">Payment rails</p>
              <h2 className="mt-1 text-2xl font-bold">How to settle dues</h2>
            </div>
            <p className="max-w-xl text-sm leading-relaxed text-base-content/52">
              Manual rails require a reference after transfer. Online providers redirect securely.
            </p>
          </div>

          {configLoading || methodsLoading ? (
            <MethodsSkeleton />
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <RailCard
                icon={Smartphone}
                eyebrow="MTN, Vodafone, or AirtelTigo"
                title="Mobile Money"
                badge={<span className="border border-primary/10 bg-base-200/65 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-base-content/42">Manual</span>}
              >
                <p>MTN MoMo: <span className="font-bold text-base-content">{config?.payment?.momo?.number || '0598987137'}</span></p>
                <p>MoMo Pay ID: <span className="font-bold text-base-content">{config?.payment?.momo?.payId || '159025'}</span></p>
                <p>Account: <span className="font-bold text-base-content">{config?.payment?.momo?.accountName || 'UPOSA National'}</span></p>
              </RailCard>

              <RailCard
                icon={Landmark}
                eyebrow={config?.payment?.bank?.bank || 'GCB Bank'}
                title="Bank Transfer"
                badge={<span className="border border-primary/10 bg-base-200/65 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-base-content/42">Manual</span>}
              >
                <p>{config?.payment?.bank?.bank || 'GCB Bank'} - {config?.payment?.bank?.branch || 'UCC Branch'}</p>
                <p>Account No: <span className="font-bold text-base-content">{config?.payment?.bank?.accountNo || '3021440000835'}</span></p>
                <p>Account: <span className="font-bold text-base-content">{config?.payment?.bank?.accountName || 'UPOSA PROJECT ACCOUNT'}</span></p>
              </RailCard>

              {paymentMethods.map((method) => {
                const MethodIcon = providerIcons[method.provider] || ExternalLink
                return (
                  <RailCard
                    key={method.id}
                    icon={MethodIcon}
                    eyebrow="Online provider"
                    title={method.displayName}
                    badge={<span className="border border-secondary/25 bg-secondary/12 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-primary">Online</span>}
                  >
                    <p>{method.description || 'Continue through this provider for secure digital payment.'}</p>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-base-content/36">{method.supportedCurrencies.join(', ')}</p>
                  </RailCard>
                )
              })}
            </div>
          )}
        </section>

        <Modal open={payModalOpen} onClose={() => setPayModalOpen(false)} title={`Pay ${selectedDue?.year || ''} Dues`}>
          <div className="space-y-5">
            <div className="overflow-hidden border border-primary/10 bg-primary text-primary-content rounded-[20px_4px_20px_4px]">
              <div className="relative p-5">
                <img src="/logo.png" alt="" aria-hidden="true" className="pointer-events-none absolute -right-12 -top-14 h-44 w-44 object-contain opacity-[0.055]" />
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary-content/45">Amount due</p>
                <div className="relative mt-2 flex flex-wrap items-end justify-between gap-3">
                  <p className="text-3xl font-bold text-secondary">{formatCurrency(selectedDue?.amount || 0, currency)}</p>
                  {selectedDue && <StatusBadge status={selectedDue.status} />}
                </div>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-base-content/50">Payment method</p>
              <div className="grid gap-2">
                <PaymentOption
                  active={payMethod === 'manual'}
                  icon={ReceiptText}
                  title="MoMo or bank transfer"
                  description="Send payment first, then submit your reference here."
                  onClick={() => setPayMethod('manual')}
                />
                {paymentMethods.map((method) => {
                  const MethodIcon = providerIcons[method.provider] || CreditCard
                  return (
                    <PaymentOption
                      key={method.id}
                      active={payMethod === method.provider}
                      icon={MethodIcon}
                      title={`${method.displayName} online checkout`}
                      description={method.description || 'Continue through this provider to complete payment.'}
                      onClick={() => setPayMethod(method.provider)}
                    />
                  )
                })}
              </div>
            </div>

            {payMethod !== 'manual' ? (
              <div className="space-y-3">
                {feeLoading ? (
                  <div className="rounded-[18px_4px_18px_4px] border border-primary/10 bg-base-100 p-4">
                    <div className="h-4 w-32 animate-pulse bg-base-300/50" />
                    <div className="mt-3 h-3 w-full animate-pulse bg-base-300/35" />
                    <div className="mt-2 h-3 w-2/3 animate-pulse bg-base-300/35" />
                  </div>
                ) : feePreview && feePreview.enabled && feePreview.platformFee > 0 ? (
                  <div className="rounded-[18px_4px_18px_4px] border border-primary/10 bg-base-100 p-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-base-content/60">Dues amount</span>
                      <span className="font-bold">{formatCurrency(feePreview.amount, currency)}</span>
                    </div>
                    <div className="mt-2 flex justify-between gap-4 text-sm">
                      <span className="text-base-content/60">Platform fee ({feePreview.percent}%{(feePreview.fixed ?? 0) > 0 ? ` + ${formatCurrency(feePreview.fixed, currency)}` : ''})</span>
                      <span className="font-bold">{formatCurrency(feePreview.platformFee, currency)}</span>
                    </div>
                    <div className="mt-3 flex justify-between border-t border-primary/10 pt-3 text-sm font-bold">
                      <span>Total to pay</span>
                      <span className="text-primary">{formatCurrency(feePreview.totalAmount, currency)}</span>
                    </div>
                  </div>
                ) : null}
                <div className="flex items-center gap-3 rounded-[18px_4px_18px_4px] bg-secondary/12 p-4 text-sm font-semibold leading-relaxed text-primary">
                  <ExternalLink className="h-4 w-4 shrink-0" />
                  <span>You will be redirected to {onlineMethodLabel} to complete payment securely.</span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <label className="form-control">
                  <span className="label pb-2"><span className="text-xs font-bold uppercase tracking-[0.14em] text-base-content/50">Transaction reference</span></span>
                  <input
                    type="text"
                    className="input input-bordered h-12 border-primary/10 bg-base-100 focus:border-primary"
                    placeholder="MoMo or bank reference"
                    value={transactionRef}
                    onChange={(event) => setTransactionRef(event.target.value)}
                  />
                </label>
                <label className="form-control">
                  <span className="label pb-2"><span className="text-xs font-bold uppercase tracking-[0.14em] text-base-content/50">Notes</span></span>
                  <textarea
                    className="textarea textarea-bordered min-h-24 border-primary/10 bg-base-100 focus:border-primary"
                    placeholder="Optional context for the finance team"
                    value={payNotes}
                    onChange={(event) => setPayNotes(event.target.value)}
                  />
                </label>
              </div>
            )}

            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <button type="button" className="btn min-h-12 border-primary/10 bg-base-200 text-primary hover:bg-base-300" onClick={() => setPayModalOpen(false)}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary min-h-12 min-w-44 gap-2" disabled={submitting} onClick={handlePay}>
                {submitting ? (
                  <span className="h-4 w-28 animate-pulse bg-primary-content/35" />
                ) : payMethod === 'manual' ? (
                  <>
                    Submit payment
                    <ArrowRight className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Continue online
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </PageTransition>
  )
}
