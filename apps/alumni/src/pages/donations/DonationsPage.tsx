import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Gift,
  Heart,
  Landmark,
  ReceiptText,
  Smartphone,
  Sparkles,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import PageTransition from '../../components/common/PageTransition'
import Modal from '../../components/ui/Modal'
import StatusBadge from '../../components/ui/StatusBadge'
import { donationsApi, paymentsApi } from '../../api/services'
import { useAuthStore } from '../../stores/auth.store'
import { useSiteConfig } from '../../hooks/useSiteConfig'
import { usePaymentMethods } from '../../hooks/usePaymentMethods'
import { useToast } from '../../hooks/useToast'
import { formatCurrency, formatDate, formatEnum, timeAgo } from '../../utils/formatters'
import type { Donation, DonationChannel } from '../../types'

const schema = z.object({
  amount: z.string().transform((value) => Number(value)).pipe(z.number().min(1, 'Amount must be at least 1')),
  channel: z.enum(['MOMO', 'BANK', 'PAYPAL', 'PAYSTACK', 'STRIPE', 'CRYPTO', 'CASH', 'OTHER']),
  currency: z.string().default('GHS'),
  purpose: z.string().optional(),
  transactionRef: z.string().optional(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const presetAmounts = [50, 100, 200, 500, 1000]
const manualChannels: DonationChannel[] = ['MOMO', 'BANK', 'CASH', 'OTHER']

const channelIcons: Record<string, LucideIcon> = {
  MOMO: Smartphone,
  BANK: Landmark,
  CASH: Wallet,
  PAYSTACK: CreditCard,
  STRIPE: CreditCard,
  CRYPTO: Wallet,
  PAYPAL: Wallet,
  OTHER: Wallet,
}

function StatTile({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: ReactNode }) {
  return (
    <div className="border border-primary-content/10 bg-primary-content/[0.06] p-4 rounded-[18px_4px_18px_4px]">
      <span className="grid h-10 w-10 place-items-center bg-secondary text-primary rounded-[14px_3px_14px_3px]">
        <Icon className="h-4 w-4" />
      </span>
      <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.16em] text-primary-content/42">{label}</p>
      <p className="mt-2 truncate text-2xl font-bold text-secondary">{value}</p>
    </div>
  )
}

function RailCard({
  icon: Icon,
  eyebrow,
  title,
  children,
  action,
}: {
  icon: LucideIcon
  eyebrow: string
  title: string
  children: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="flex h-full flex-col border border-primary/10 bg-base-100/90 p-5 shadow-[0_14px_38px_rgba(0,27,80,0.06)] rounded-[24px_4px_24px_4px]">
      <div className="flex items-start justify-between gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center bg-primary/8 text-primary rounded-[16px_3px_16px_3px]">
          <Icon className="h-5 w-5" />
        </span>
        {action}
      </div>
      <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.18em] text-secondary">{eyebrow}</p>
      <h2 className="mt-2 text-xl font-bold leading-tight text-base-content">{title}</h2>
      <div className="mt-4 flex-1 space-y-2 text-sm leading-relaxed text-base-content/58">{children}</div>
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

function HistorySkeleton() {
  return (
    <div className="grid gap-3">
      {[0, 1, 2, 3].map((item) => (
        <div key={item} className="grid gap-4 border border-primary/8 bg-base-100/82 p-4 sm:grid-cols-[48px_minmax(0,1fr)_120px] sm:items-center rounded-[22px_4px_22px_4px]">
          <div className="h-12 w-12 animate-pulse bg-base-300/45 rounded-[16px_3px_16px_3px]" />
          <div className="space-y-2">
            <div className="h-4 w-36 animate-pulse bg-base-300/55" />
            <div className="h-3 w-64 max-w-full animate-pulse bg-base-300/35" />
          </div>
          <div className="h-8 w-24 animate-pulse bg-base-300/35" />
        </div>
      ))}
    </div>
  )
}

function EmptyHistory({ onDonate }: { onDonate: () => void }) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center border border-primary/10 bg-base-100/86 px-6 py-12 text-center shadow-[0_12px_34px_rgba(0,27,80,0.06)] rounded-[24px_4px_24px_4px]">
      <span className="grid h-16 w-16 place-items-center bg-primary/8 text-primary rounded-[18px_4px_18px_4px]">
        <Heart className="h-7 w-7" />
      </span>
      <h2 className="mt-5 text-xl font-bold">No donations yet</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-base-content/55">
        Your generous contributions will appear here once you submit a donation.
      </p>
      <button type="button" className="btn btn-primary mt-6" onClick={onDonate}>
        <Heart className="h-4 w-4" />
        Make your first donation
      </button>
    </div>
  )
}

function DonationRow({ donation }: { donation: Donation }) {
  const ChannelIcon = channelIcons[donation.channel] || Wallet

  return (
    <div className="grid gap-4 border border-primary/10 bg-base-100/86 p-4 shadow-[0_10px_28px_rgba(0,27,80,0.04)] sm:grid-cols-[52px_minmax(0,1fr)_auto] sm:items-center rounded-[22px_4px_22px_4px]">
      <span className={`grid h-12 w-12 place-items-center rounded-[16px_3px_16px_3px] ${
        donation.status === 'CONFIRMED' ? 'bg-success/12 text-success' : donation.status === 'PENDING' ? 'bg-secondary/16 text-primary' : 'bg-error/10 text-error'
      }`}>
        <ChannelIcon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-lg font-bold text-base-content">{formatCurrency(donation.amount, donation.currency)}</p>
          <StatusBadge status={donation.status} />
        </div>
        <p className="mt-1 text-sm leading-relaxed text-base-content/52">
          {donation.purpose || formatEnum(donation.channel)} · {formatDate(donation.createdAt)}
        </p>
        {donation.transactionRef && (
          <p className="mt-1 truncate text-xs font-semibold text-base-content/38">Ref: {donation.transactionRef}</p>
        )}
      </div>
      <div className="flex items-center gap-2 text-sm font-bold text-base-content/45">
        {donation.status === 'CONFIRMED' && <CheckCircle2 className="h-5 w-5 text-success" />}
        {timeAgo(donation.createdAt)}
      </div>
    </div>
  )
}

export default function DonationsPage() {
  const user = useAuthStore((state) => state.user)
  const [donations, setDonations] = useState<Donation[]>([])
  const [loading, setLoading] = useState(true)
  const { config, loading: configLoading } = useSiteConfig()
  const { methods: paymentMethods, loading: methodsLoading } = usePaymentMethods()
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [feePreview, setFeePreview] = useState<{ amount: number; platformFee: number; totalAmount: number; percent: number; fixed: number; enabled: boolean } | null>(null)
  const [feeLoading, setFeeLoading] = useState(false)
  const toast = useToast()

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: { channel: 'MOMO', currency: 'GHS' },
  })

  const selectedChannel = watch('channel')
  const amountValue = watch('amount')
  const isOnlineProvider = ['PAYSTACK', 'STRIPE', 'CRYPTO'].includes(selectedChannel)

  useEffect(() => {
    const amount = Number(amountValue)
    if (!isOnlineProvider || !amount || amount <= 0) {
      setFeePreview(null)
      return
    }
    setFeeLoading(true)
    paymentsApi.platformFeePreview(amount)
      .then((res) => setFeePreview(res.data.data ?? null))
      .catch(() => setFeePreview(null))
      .finally(() => setFeeLoading(false))
  }, [amountValue, isOnlineProvider])

  useEffect(() => {
    donationsApi.my()
      .then((res) => setDonations(res.data.data || []))
      .catch(() => setDonations([]))
      .finally(() => setLoading(false))
  }, [])

  const onSubmit = async (data: FormData) => {
    setSubmitting(true)
    try {
      if (['PAYSTACK', 'STRIPE', 'CRYPTO'].includes(data.channel)) {
        const donationRes = await donationsApi.create({
          ...data,
          donorName: user?.fullName || '',
          donorEmail: user?.email || '',
          memberId: user?.id,
        })
        const donation = donationRes.data.data
        if (!donation?.id) {
          toast.error('Donation record was not created')
          return
        }

        const paymentRes = await paymentsApi.initialize({
          provider: data.channel,
          purpose: 'DONATION',
          amount: data.amount,
          currency: data.currency || 'GHS',
          email: user?.email || '',
          name: user?.fullName,
          donationId: donation?.id,
        })

        const paymentData = paymentRes.data.data
        if (paymentData?.authorizationUrl) {
          toast.success('Redirecting to payment...')
          window.location.href = paymentData.authorizationUrl
          return
        }
        toast.error('Payment provider did not return a checkout link')
        return
      } else {
        await donationsApi.create({
          ...data,
          donorName: user?.fullName || '',
          donorEmail: user?.email || '',
          memberId: user?.id,
        })
      }

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

  const totalDonated = donations.filter((donation) => donation.status === 'CONFIRMED').reduce((sum, donation) => sum + donation.amount, 0)
  const pendingTotal = donations.filter((donation) => donation.status === 'PENDING').reduce((sum, donation) => sum + donation.amount, 0)
  const confirmedCount = donations.filter((donation) => donation.status === 'CONFIRMED').length
  const lastDonation = donations[0] || null

  const onlineProviderChannels = paymentMethods.map((method) => method.provider)
  const allChannels = useMemo(() => Array.from(new Set<DonationChannel>([...manualChannels, ...onlineProviderChannels])), [onlineProviderChannels])
  const openDonationModal = () => {
    const firstOnlineProvider = paymentMethods[0]
    if (firstOnlineProvider) {
      setValue('channel', firstOnlineProvider.provider)
      setValue('currency', firstOnlineProvider.supportedCurrencies?.find((currency) => currency === 'GHS') || firstOnlineProvider.supportedCurrencies?.[0] || 'GHS')
    }
    setModalOpen(true)
  }

  const getChannelLabel = (channel: string) => {
    const provider = paymentMethods.find((method) => method.provider === channel)
    if (provider) return `${provider.displayName} (Pay Online)`
    return formatEnum(channel)
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
                Giving desk
              </div>
              <h1 className="max-w-3xl text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
                Turn alumni goodwill into visible school support.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-primary-content/62 sm:text-base">
                Give through manual MoMo, bank rails, or any enabled online provider. Your contribution history stays attached to your member account.
              </p>
              <button type="button" className="btn btn-secondary mt-6 min-h-12 px-5 text-primary" onClick={openDonationModal}>
                <Heart className="h-4 w-4" />
                Make a donation
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <StatTile icon={TrendingUp} label="Confirmed" value={formatCurrency(totalDonated)} />
              <StatTile icon={Gift} label="Contributions" value={confirmedCount} />
              <StatTile icon={ReceiptText} label="Pending" value={formatCurrency(pendingTotal)} />
              <StatTile icon={Sparkles} label="Last gift" value={lastDonation ? timeAgo(lastDonation.createdAt) : 'N/A'} />
            </div>
          </div>
        </section>

        <section className="relative z-10 space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-secondary">Payment rails</p>
              <h2 className="mt-1 text-2xl font-bold">Choose the rail that works for you</h2>
            </div>
            <p className="max-w-xl text-sm leading-relaxed text-base-content/52">Manual rails are verified by the team. Online providers redirect securely after you submit.</p>
          </div>

          {configLoading || methodsLoading ? (
            <MethodsSkeleton />
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <RailCard
                icon={Smartphone}
                eyebrow="MTN, Vodafone, or AirtelTigo"
                title="Mobile Money"
                action={<span className="border border-primary/10 bg-base-200/65 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-base-content/42">Manual</span>}
              >
                <p>MTN MoMo: <span className="font-bold text-base-content">{config?.payment?.momo?.number || '0598987137'}</span></p>
                <p>MoMo Pay ID: <span className="font-bold text-base-content">{config?.payment?.momo?.payId || '159025'}</span></p>
                <p>Account: <span className="font-bold text-base-content">{config?.payment?.momo?.accountName || 'UPOSA National'}</span></p>
              </RailCard>

              <RailCard
                icon={Landmark}
                eyebrow={config?.payment?.bank?.bank || 'GCB Bank'}
                title="Bank Transfer"
                action={<span className="border border-primary/10 bg-base-200/65 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-base-content/42">Manual</span>}
              >
                <p>{config?.payment?.bank?.bank || 'GCB Bank'} - {config?.payment?.bank?.branch || 'UCC Branch'}</p>
                <p>Account No: <span className="font-bold text-base-content">{config?.payment?.bank?.accountNo || '3021440000835'}</span></p>
                <p>Account: <span className="font-bold text-base-content">{config?.payment?.bank?.accountName || 'UPOSA PROJECT ACCOUNT'}</span></p>
              </RailCard>

              {paymentMethods.map((method) => (
                <RailCard
                  key={method.id}
                  icon={ExternalLink}
                  eyebrow="Online provider"
                  title={method.displayName}
                  action={<span className="border border-secondary/25 bg-secondary/12 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-primary">Online</span>}
                >
                  <p>{method.description || 'Continue through this provider for secure digital payment.'}</p>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-base-content/36">{method.supportedCurrencies.join(', ')}</p>
                </RailCard>
              ))}
            </div>
          )}
        </section>

        <section className="relative z-10 space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-secondary">Giving history</p>
              <h2 className="mt-1 text-2xl font-bold">Your donations</h2>
            </div>
            <button type="button" className="btn btn-primary min-h-11 px-5" onClick={openDonationModal}>
              <Heart className="h-4 w-4" />
              New donation
            </button>
          </div>

          {loading ? (
            <HistorySkeleton />
          ) : donations.length === 0 ? (
            <EmptyHistory onDonate={openDonationModal} />
          ) : (
            <div className="grid gap-3">
              {donations.map((donation) => (
                <DonationRow key={donation.id} donation={donation} />
              ))}
            </div>
          )}
        </section>

        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Make a Donation">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="rounded-[18px_4px_18px_4px] border border-primary/10 bg-base-200/45 p-4">
              <p className="text-sm font-bold text-base-content">Choose a quick amount or enter your own.</p>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
                {presetAmounts.map((amount) => (
                  <motion.button
                    key={amount}
                    type="button"
                    className="border border-primary/10 bg-base-100 px-3 py-3 text-sm font-bold text-primary transition-colors hover:border-primary/20 hover:bg-primary/5"
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setValue('amount', String(amount) as never)}
                  >
                    GHS {amount.toLocaleString()}
                  </motion.button>
                ))}
              </div>
            </div>

            <label className="form-control">
              <span className="label pb-2"><span className="text-xs font-bold uppercase tracking-[0.14em] text-base-content/50">Custom amount</span></span>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-base-content/40">GHS</span>
                <input
                  type="number"
                  step="0.01"
                  className={`input input-bordered h-12 w-full border-primary/10 bg-base-100 pl-14 text-base focus:border-primary ${errors.amount ? 'input-error' : ''}`}
                  placeholder="0.00"
                  {...register('amount')}
                />
              </div>
              {errors.amount && <span className="mt-2 text-xs font-semibold text-error">{errors.amount.message}</span>}
            </label>

            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-base-content/50">Payment channel</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {allChannels.map((channel) => {
                  const Icon = channelIcons[channel] || Wallet
                  const isSelected = selectedChannel === channel
                  return (
                    <label
                      key={channel}
                      className={`flex cursor-pointer items-center gap-3 border p-3 transition-all rounded-[18px_4px_18px_4px] ${
                        isSelected ? 'border-primary bg-primary/7 shadow-[0_10px_24px_rgba(0,27,80,0.08)]' : 'border-primary/10 bg-base-100 hover:border-primary/20'
                      }`}
                    >
                      <input type="radio" className="hidden" value={channel} {...register('channel')} />
                      <span className={`grid h-10 w-10 place-items-center rounded-[14px_3px_14px_3px] ${isSelected ? 'bg-primary text-primary-content' : 'bg-primary/8 text-primary'}`}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 text-sm font-bold leading-tight">
                        {getChannelLabel(channel)}
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>

            <AnimatePresence mode="wait">
              {isOnlineProvider ? (
                <motion.div
                  key="online"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="space-y-3 overflow-hidden"
                >
                  {feeLoading ? (
                    <div className="rounded-[18px_4px_18px_4px] border border-primary/10 bg-base-100 p-4">
                      <div className="h-4 w-32 animate-pulse bg-base-300/50" />
                      <div className="mt-3 h-3 w-full animate-pulse bg-base-300/35" />
                      <div className="mt-2 h-3 w-2/3 animate-pulse bg-base-300/35" />
                    </div>
                  ) : feePreview && feePreview.enabled && feePreview.platformFee > 0 ? (
                    <div className="rounded-[18px_4px_18px_4px] border border-primary/10 bg-base-100 p-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-base-content/60">Donation</span>
                        <span className="font-bold">{formatCurrency(feePreview.amount)}</span>
                      </div>
                      <div className="mt-2 flex justify-between gap-4 text-sm">
                        <span className="text-base-content/60">Platform fee ({feePreview.percent}%{(feePreview.fixed ?? 0) > 0 ? ` + ${formatCurrency(feePreview.fixed)}` : ''})</span>
                        <span className="font-bold">{formatCurrency(feePreview.platformFee)}</span>
                      </div>
                      <div className="mt-3 flex justify-between border-t border-primary/10 pt-3 text-sm font-bold">
                        <span>Total to pay</span>
                        <span className="text-primary">{formatCurrency(feePreview.totalAmount)}</span>
                      </div>
                    </div>
                  ) : null}
                  <div className="flex items-center gap-3 rounded-[18px_4px_18px_4px] bg-secondary/12 p-4 text-sm font-semibold leading-relaxed text-primary">
                    <ArrowRight className="h-4 w-4 shrink-0" />
                    <span>You will be redirected to {getChannelLabel(selectedChannel).replace(' (Pay Online)', '')} to complete payment securely.</span>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="manual"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="space-y-4 overflow-hidden"
                >
                  <label className="form-control">
                    <span className="label pb-2"><span className="text-xs font-bold uppercase tracking-[0.14em] text-base-content/50">Purpose</span></span>
                    <input type="text" className="input input-bordered h-12 border-primary/10 bg-base-100 focus:border-primary" placeholder="e.g. NSMQ Support Fund" {...register('purpose')} />
                  </label>
                  <label className="form-control">
                    <span className="label pb-2"><span className="text-xs font-bold uppercase tracking-[0.14em] text-base-content/50">Transaction reference</span></span>
                    <input type="text" className="input input-bordered h-12 border-primary/10 bg-base-100 focus:border-primary" placeholder="MoMo or bank reference" {...register('transactionRef')} />
                  </label>
                  <label className="form-control">
                    <span className="label pb-2"><span className="text-xs font-bold uppercase tracking-[0.14em] text-base-content/50">Notes</span></span>
                    <textarea className="textarea textarea-bordered min-h-24 border-primary/10 bg-base-100 focus:border-primary" {...register('notes')} />
                  </label>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              className="btn btn-primary min-h-12 w-full gap-2 text-base"
              disabled={submitting}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
            >
              {submitting ? (
                <span className="h-4 w-32 animate-pulse bg-primary-content/35" />
              ) : isOnlineProvider ? (
                <>
                  Proceed to payment
                  <ArrowRight className="h-4 w-4" />
                </>
              ) : (
                <>
                  Submit donation
                  <Heart className="h-4 w-4" />
                </>
              )}
            </motion.button>
          </form>
        </Modal>
      </div>
    </PageTransition>
  )
}
