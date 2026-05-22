import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Heart, History, ExternalLink, TrendingUp, Gift, Sparkles,
  Smartphone, Landmark, CreditCard, Wallet, ArrowRight, CheckCircle2,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import PageTransition from '../../components/common/PageTransition'
import PageHeader from '../../components/ui/PageHeader'
import ScrollReveal from '../../components/common/ScrollReveal'
import StaggerChildren, { StaggerItem } from '../../components/common/StaggerChildren'
import Modal from '../../components/ui/Modal'
import StatusBadge from '../../components/ui/StatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { Card } from '../../components/ui/Card'
import { donationsApi, paymentsApi } from '../../api/services'
import { useAuthStore } from '../../stores/auth.store'
import { useSiteConfig } from '../../hooks/useSiteConfig'
import { usePaymentMethods } from '../../hooks/usePaymentMethods'
import { useToast } from '../../hooks/useToast'
import { formatCurrency, formatDate, formatEnum, timeAgo } from '../../utils/formatters'
import type { Donation } from '../../types'

const schema = z.object({
  amount: z.string().transform((v) => Number(v)).pipe(z.number().min(1, 'Amount must be at least 1')),
  channel: z.enum(['MOMO', 'BANK', 'PAYPAL', 'PAYSTACK', 'STRIPE', 'CRYPTO', 'CASH', 'OTHER']),
  currency: z.string().default('GHS'),
  purpose: z.string().optional(),
  transactionRef: z.string().optional(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const presetAmounts = [50, 100, 200, 500]

const channelIcons: Record<string, typeof Smartphone> = {
  MOMO: Smartphone,
  BANK: Landmark,
  CASH: Wallet,
  PAYSTACK: CreditCard,
  STRIPE: CreditCard,
  CRYPTO: Wallet,
  OTHER: Wallet,
}

export default function DonationsPage() {
  const user = useAuthStore((s) => s.user)
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
    const amt = Number(amountValue)
    if (!isOnlineProvider || !amt || amt <= 0) {
      setFeePreview(null)
      return
    }
    setFeeLoading(true)
    paymentsApi.platformFeePreview(amt)
      .then((res) => setFeePreview(res.data.data ?? null))
      .catch(() => setFeePreview(null))
      .finally(() => setFeeLoading(false))
  }, [amountValue, isOnlineProvider])

  useEffect(() => {
    donationsApi.my()
      .then((res) => {
        const data = res.data.data
        setDonations(data || [])
      })
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
      }

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
  const confirmedCount = donations.filter((d) => d.status === 'CONFIRMED').length
  const lastDonation = donations.length > 0 ? donations[0] : null

  const manualChannels = ['MOMO', 'BANK', 'CASH', 'OTHER']
  const onlineProviderChannels = paymentMethods.map((m) => m.provider)
  const allChannels = [...manualChannels, ...onlineProviderChannels]

  const getChannelLabel = (channel: string) => {
    const provider = paymentMethods.find((m) => m.provider === channel)
    if (provider) return `${provider.displayName} (Pay Online)`
    return formatEnum(channel)
  }

  return (
    <PageTransition>
      <PageHeader
        title="Donations"
        description="Support UPOSA with your generous contributions"
        action={
          <motion.button
            className="btn btn-primary btn-sm gap-2"
            onClick={() => setModalOpen(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Heart className="w-4 h-4" /> Make a Donation
          </motion.button>
        }
      />

      {/* Hero stats */}
      <ScrollReveal>
        <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-accent text-primary-content rounded-2xl p-6 md:p-8 mb-6">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-content/5 rounded-full -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-1/4 w-40 h-40 bg-secondary/10 rounded-full translate-y-1/2" />
          <div className="absolute top-6 right-16 w-3 h-3 bg-secondary/40 rounded-full" />

          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary-content/10 backdrop-blur-sm flex items-center justify-center border border-primary-content/10">
                <TrendingUp className="w-7 h-7" />
              </div>
              <div>
                <p className="text-sm text-primary-content/60">Total Donated</p>
                <p className="text-3xl font-bold">{formatCurrency(totalDonated)}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary-content/10 backdrop-blur-sm flex items-center justify-center border border-primary-content/10">
                <Gift className="w-7 h-7" />
              </div>
              <div>
                <p className="text-sm text-primary-content/60">Contributions</p>
                <p className="text-3xl font-bold">{confirmedCount}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary-content/10 backdrop-blur-sm flex items-center justify-center border border-primary-content/10">
                <Sparkles className="w-7 h-7" />
              </div>
              <div>
                <p className="text-sm text-primary-content/60">Last Donation</p>
                <p className="text-xl font-bold">{lastDonation ? timeAgo(lastDonation.createdAt) : 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* Payment methods */}
      <ScrollReveal>
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" /> Payment Methods
          </h3>
          {configLoading || methodsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[1, 2, 3].map((n) => (
                <Card key={n} hover={false}>
                  <div className="p-5 animate-pulse">
                    <div className="h-5 bg-base-300 rounded w-24 mb-3" />
                    <div className="h-3 bg-base-300 rounded w-36 mb-2" />
                    <div className="h-3 bg-base-300 rounded w-28" />
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <StaggerChildren className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <StaggerItem>
                <Card hover={false}>
                  <div className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                        <Smartphone className="w-5 h-5 text-secondary" />
                      </div>
                      <p className="font-semibold">Mobile Money</p>
                    </div>
                    <div className="space-y-1.5 text-sm text-base-content/60">
                      <p>MTN MoMo: <span className="text-base-content font-medium">{config?.payment?.momo?.number || '0598987137'}</span></p>
                      <p>MoMo Pay ID: <span className="text-base-content font-medium">{config?.payment?.momo?.payId || '159025'}</span></p>
                      <p>Account: <span className="text-base-content font-medium">{config?.payment?.momo?.accountName || 'UPOSA National'}</span></p>
                    </div>
                  </div>
                </Card>
              </StaggerItem>
              <StaggerItem>
                <Card hover={false}>
                  <div className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Landmark className="w-5 h-5 text-primary" />
                      </div>
                      <p className="font-semibold">Bank Transfer</p>
                    </div>
                    <div className="space-y-1.5 text-sm text-base-content/60">
                      <p>{config?.payment?.bank?.bank || 'GCB Bank'} - {config?.payment?.bank?.branch || 'UCC Branch'}</p>
                      <p>Account No: <span className="text-base-content font-medium">{config?.payment?.bank?.accountNo || '3021440000835'}</span></p>
                      <p>Account: <span className="text-base-content font-medium">{config?.payment?.bank?.accountName || 'UPOSA PROJECT ACCOUNT'}</span></p>
                    </div>
                  </div>
                </Card>
              </StaggerItem>
              {paymentMethods.map((method) => (
                <StaggerItem key={method.id}>
                  <Card hover={false}>
                    <div className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                          <ExternalLink className="w-5 h-5 text-accent" />
                        </div>
                        <p className="font-semibold">{method.displayName}</p>
                      </div>
                      <p className="text-sm text-base-content/60">{method.description}</p>
                      <p className="text-xs text-base-content/40 mt-2">Currencies: {method.supportedCurrencies.join(', ')}</p>
                    </div>
                  </Card>
                </StaggerItem>
              ))}
            </StaggerChildren>
          )}
        </div>
      </ScrollReveal>

      {/* Donation History */}
      <ScrollReveal>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <History className="w-5 h-5 text-primary" /> Donation History
          </h3>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
        ) : donations.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="No donations yet"
            description="Your generous contributions will appear here. Every bit counts!"
            action={
              <button className="btn btn-primary btn-sm gap-2" onClick={() => setModalOpen(true)}>
                <Heart className="w-4 h-4" /> Make Your First Donation
              </button>
            }
          />
        ) : (
          <StaggerChildren className="space-y-3">
            {donations.map((d) => {
              const ChannelIcon = channelIcons[d.channel] || Wallet
              return (
                <StaggerItem key={d.id}>
                  <Card hover={false}>
                    <div className="px-5 py-4 flex items-center gap-4">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                        d.status === 'CONFIRMED' ? 'bg-success/10' : d.status === 'PENDING' ? 'bg-secondary/10' : 'bg-error/10'
                      }`}>
                        <ChannelIcon className={`w-5 h-5 ${
                          d.status === 'CONFIRMED' ? 'text-success' : d.status === 'PENDING' ? 'text-secondary' : 'text-error'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{formatCurrency(d.amount, d.currency)}</p>
                          <StatusBadge status={d.status} />
                        </div>
                        <p className="text-sm text-base-content/50 mt-0.5">
                          {d.purpose || formatEnum(d.channel)} · {formatDate(d.createdAt)}
                        </p>
                      </div>
                      {d.status === 'CONFIRMED' && (
                        <CheckCircle2 className="w-5 h-5 text-success shrink-0 hidden sm:block" />
                      )}
                    </div>
                  </Card>
                </StaggerItem>
              )
            })}
          </StaggerChildren>
        )}
      </ScrollReveal>

      {/* Donation Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Make a Donation">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Preset amounts */}
          <div>
            <label className="label"><span className="label-text font-medium">Quick Amount</span></label>
            <div className="grid grid-cols-4 gap-2">
              {presetAmounts.map((amt) => (
                <motion.button
                  key={amt}
                  type="button"
                  className="btn btn-outline btn-sm"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setValue('amount', String(amt) as never)}
                >
                  GHS {amt}
                </motion.button>
              ))}
            </div>
          </div>

          <div className="form-control">
            <label className="label"><span className="label-text font-medium">Custom Amount *</span></label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-base-content/40">GHS</span>
              <input
                type="number"
                step="0.01"
                className={`input input-bordered w-full pl-12 ${errors.amount ? 'input-error' : ''}`}
                placeholder="0.00"
                {...register('amount')}
              />
            </div>
            {errors.amount && <p className="text-error text-xs mt-1">{errors.amount.message}</p>}
          </div>

          <div className="form-control">
            <label className="label"><span className="label-text font-medium">Payment Channel *</span></label>
            <div className="grid grid-cols-2 gap-2">
              {allChannels.map((c) => {
                const Icon = channelIcons[c] || Wallet
                const isSelected = selectedChannel === c
                return (
                  <label
                    key={c}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                        : 'border-base-300 hover:border-base-content/20'
                    }`}
                  >
                    <input type="radio" className="hidden" value={c} {...register('channel')} />
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-primary' : 'text-base-content/40'}`} />
                    <span className={`text-sm font-medium ${isSelected ? 'text-primary' : ''}`}>{getChannelLabel(c)}</span>
                  </label>
                )
              })}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {isOnlineProvider ? (
              <motion.div
                key="online"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden space-y-3"
              >
                {feeLoading && (
                  <div className="text-center py-2"><span className="loading loading-dots loading-sm text-primary"></span></div>
                )}
                {feePreview && feePreview.enabled && feePreview.platformFee > 0 && (
                  <div className="bg-base-100 rounded-xl p-3 border border-base-300 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-base-content/60">Donation</span>
                      <span className="font-medium">{formatCurrency(feePreview.amount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-base-content/60">Platform Fee ({feePreview.percent}%{(feePreview.fixed ?? 0) > 0 ? ` + ${formatCurrency(feePreview.fixed)}` : ''})</span>
                      <span className="font-medium">{formatCurrency(feePreview.platformFee)}</span>
                    </div>
                    <div className="border-t border-base-300 pt-1 flex justify-between text-sm font-semibold">
                      <span>Total to Pay</span>
                      <span className="text-primary">{formatCurrency(feePreview.totalAmount)}</span>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[#FFF8DC] text-sm shadow-sm">
                  <ArrowRight className="w-4 h-4 text-primary shrink-0" />
                  <span>You'll be redirected to {getChannelLabel(selectedChannel).replace(' (Pay Online)', '')} to complete payment securely.</span>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="manual"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden space-y-4"
              >
                <div className="form-control">
                  <label className="label"><span className="label-text font-medium">Purpose</span></label>
                  <input type="text" className="input input-bordered" placeholder="e.g. NSMQ Support Fund" {...register('purpose')} />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text font-medium">Transaction Reference</span></label>
                  <input type="text" className="input input-bordered" placeholder="MoMo/Bank ref number" {...register('transactionRef')} />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text font-medium">Notes</span></label>
                  <textarea className="textarea textarea-bordered" rows={2} {...register('notes')} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            type="submit"
            className={`btn btn-primary w-full h-12 text-base gap-2 ${submitting ? 'loading' : ''}`}
            disabled={submitting}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.97 }}
          >
            {submitting ? 'Processing...' : isOnlineProvider ? (
              <>Proceed to Payment <ArrowRight className="w-4 h-4" /></>
            ) : (
              <>Submit Donation <Heart className="w-4 h-4" /></>
            )}
          </motion.button>
        </form>
      </Modal>
    </PageTransition>
  )
}
