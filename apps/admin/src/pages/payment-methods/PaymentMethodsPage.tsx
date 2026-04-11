import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Wallet,
  Key,
  RefreshCw,
  CreditCard,
  Bitcoin,
  ShieldCheck,
  ShieldAlert,
  Globe,
  Coins,
  CheckCircle,
  AlertTriangle,
  XCircle,
} from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import PageStats from '../../components/ui/PageStats'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import { adminPaymentMethodsApi } from '../../api/services'
import { useToast } from '../../hooks/useToast'
import type { PaymentMethod } from '../../types/donation.types'

const providerMeta: Record<string, { icon: typeof CreditCard; color: string; bg: string; border: string; gradient: string }> = {
  PAYSTACK: {
    icon: CreditCard,
    color: 'text-teal-600',
    bg: 'bg-teal-50',
    border: 'border-teal-200',
    gradient: 'from-teal-500/10 to-teal-500/5',
  },
  STRIPE: {
    icon: CreditCard,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    gradient: 'from-indigo-500/10 to-indigo-500/5',
  },
  CRYPTO: {
    icon: Bitcoin,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    gradient: 'from-amber-500/10 to-amber-500/5',
  },
}

function getProviderMeta(provider: string) {
  return providerMeta[provider] ?? {
    icon: Wallet,
    color: 'text-gray-600',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    gradient: 'from-gray-500/10 to-gray-500/5',
  }
}

function getStatusBadge(method: PaymentMethod): { variant: 'active' | 'pending' | 'default'; label: string } {
  if (!method.isEnabled) return { variant: 'default', label: 'Disabled' }
  if (!method.hasCredentials) return { variant: 'pending', label: 'No Credentials' }
  return { variant: 'active', label: 'Active' }
}

export default function PaymentMethodsPage() {
  const navigate = useNavigate()
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchMethods = () => {
    setLoading(true)
    adminPaymentMethodsApi.list()
      .then((res) => setMethods((res.data.data as PaymentMethod[]) || []))
      .catch(() => toast.error('Failed to load payment methods'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchMethods() }, [])

  const handleToggle = async (method: PaymentMethod) => {
    setToggling(method.id)
    try {
      await adminPaymentMethodsApi.toggle(method.id, !method.isEnabled)
      setMethods((prev) => prev.map((m) => m.id === method.id ? { ...m, isEnabled: !m.isEnabled } : m))
      toast.success(`${method.displayName} ${method.isEnabled ? 'disabled' : 'enabled'}`)
    } catch {
      toast.error('Failed to toggle payment method')
    } finally {
      setToggling(null)
    }
  }

  const totalMethods = methods.length
  const activeMethods = methods.filter((m) => m.isEnabled && m.hasCredentials).length
  const needsSetup = methods.filter((m) => m.isEnabled && !m.hasCredentials).length
  const disabledMethods = methods.filter((m) => !m.isEnabled).length

  if (loading) {
    return (
      <div className="page-enter flex items-center justify-center py-32">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="page-enter">
      <PageHeader
        title="Payment Methods"
        description="Manage payment providers, toggle availability, and configure API credentials."
        actions={
          <Button variant="secondary" size="sm" leftIcon={<RefreshCw size={15} />} onClick={fetchMethods}>
            Refresh
          </Button>
        }
      />

      <PageStats
        stats={[
          { label: 'Total Providers', value: totalMethods, icon: Wallet, color: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-100' },
          { label: 'Active', value: activeMethods, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
          { label: 'Needs Setup', value: needsSetup, icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-100' },
          { label: 'Disabled', value: disabledMethods, icon: XCircle, color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-100' },
        ]}
      />

      {methods.length === 0 ? (
        <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-dark-border shadow-sm">
          <EmptyState
            icon={<Wallet size={32} />}
            title="No payment methods configured"
            description="Run the database seed to create default payment methods."
          />
        </div>
      ) : (
        <div className="grid gap-4 stagger">
          {methods.map((method) => {
            const meta = getProviderMeta(method.provider)
            const ProviderIcon = meta.icon
            const status = getStatusBadge(method)

            return (
              <div
                key={method.id}
                className={`card-enter card-lift bg-white dark:bg-dark-card rounded-2xl border shadow-[0_1px_4px_rgba(0,27,80,0.05)] hover:shadow-[0_8px_30px_rgba(0,27,80,0.07)] transition-all duration-300 ease-out overflow-hidden ${
                  !method.isEnabled ? 'opacity-70' : ''
                } border-gray-200/80 dark:border-dark-border`}
              >
                {/* Provider accent bar */}
                <div className={`h-1 bg-gradient-to-r ${meta.gradient}`} />

                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: provider info */}
                    <div className="flex items-start gap-4 min-w-0 flex-1">
                      <div className={`rounded-xl p-3 shrink-0 ${meta.bg} dark:bg-dark-hover`}>
                        <ProviderIcon size={22} className={meta.color} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                            {method.displayName}
                          </h3>
                          <Badge variant={status.variant as any} label={status.label} />
                        </div>
                        {method.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                            {method.description}
                          </p>
                        )}

                        {/* Metadata pills */}
                        <div className="flex flex-wrap items-center gap-3 mt-3">
                          <div className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-dark-hover rounded-lg px-2.5 py-1.5">
                            <Coins size={13} className="text-gray-400 shrink-0" />
                            {method.supportedCurrencies.join(', ')}
                          </div>
                          <div className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-dark-hover rounded-lg px-2.5 py-1.5">
                            <Globe size={13} className="text-gray-400 shrink-0" />
                            {method.countries.includes('*') ? 'International' : method.countries.join(', ')}
                          </div>
                          <div className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-dark-hover rounded-lg px-2.5 py-1.5">
                            {method.hasCredentials ? (
                              <>
                                <ShieldCheck size={13} className="text-green-500 shrink-0" />
                                <span className="text-green-600 dark:text-green-400">Keys configured</span>
                              </>
                            ) : (
                              <>
                                <ShieldAlert size={13} className="text-yellow-500 shrink-0" />
                                <span className="text-yellow-600 dark:text-yellow-400">Keys missing</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right: actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="secondary"
                        size="sm"
                        leftIcon={<Key size={14} />}
                        onClick={() => navigate(`/payment-methods/${method.id}/edit`)}
                      >
                        {method.hasCredentials ? 'Update Keys' : 'Add Keys'}
                      </Button>

                      {/* Toggle switch */}
                      <button
                        onClick={() => handleToggle(method)}
                        disabled={toggling === method.id}
                        className="relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
                        style={{
                          backgroundColor: method.isEnabled ? '#16a34a' : '#d1d5db',
                        }}
                        title={method.isEnabled ? 'Disable provider' : 'Enable provider'}
                      >
                        {toggling === method.id ? (
                          <span className="absolute inset-0 flex items-center justify-center">
                            <Spinner size="sm" />
                          </span>
                        ) : (
                          <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                              method.isEnabled ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
