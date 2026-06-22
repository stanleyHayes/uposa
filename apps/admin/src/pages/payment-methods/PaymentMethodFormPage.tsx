import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, ShieldCheck, Eye, EyeOff } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Spinner from '../../components/ui/Spinner'
import { adminPaymentMethodsApi } from '../../api/services'
import { useToast } from '../../hooks/useToast'
import type { PaymentMethod } from '../../types/donation.types'

const providerCredentialFields: Record<string, { key: string; label: string; placeholder: string }[]> = {
  PAYSTACK: [
    { key: 'secretKey', label: 'Secret Key', placeholder: 'sk_live_...' },
    { key: 'publicKey', label: 'Public Key', placeholder: 'pk_live_...' },
    { key: 'webhookSecret', label: 'Webhook Secret', placeholder: 'whsec_...' },
  ],
  STRIPE: [
    { key: 'secretKey', label: 'Secret Key', placeholder: 'sk_live_...' },
    { key: 'publicKey', label: 'Public Key', placeholder: 'pk_live_...' },
    { key: 'webhookSecret', label: 'Webhook Secret', placeholder: 'whsec_...' },
  ],
  CRYPTO: [
    { key: 'apiKey', label: 'API Key', placeholder: 'Coinbase Commerce API key' },
    { key: 'webhookSecret', label: 'Webhook Secret', placeholder: 'Webhook shared secret' },
  ],
}

export default function PaymentMethodFormPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { toast } = useToast()

  const [method, setMethod] = useState<PaymentMethod | null>(null)
  const [loading, setLoading] = useState(true)
  const [credentials, setCredentials] = useState<Record<string, string>>({})
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)

  const fetchMethod = useCallback(async () => {
    if (!id) return
    try {
      const res = await adminPaymentMethodsApi.getById(id)
      setMethod(res.data.data as PaymentMethod)
    } catch {
      toast.error('Payment method not found')
      navigate('/payment-methods')
    } finally {
      setLoading(false)
    }
  }, [id, navigate, toast])

  useEffect(() => { fetchMethod() }, [fetchMethod])

  const handleSave = async () => {
    if (!id) return
    setSaving(true)
    try {
      const creds: Record<string, string> = {}
      for (const [key, val] of Object.entries(credentials)) {
        if (val.trim()) creds[key] = val.trim()
      }
      if (Object.keys(creds).length === 0) {
        toast.error('Please enter at least one credential')
        setSaving(false)
        return
      }
      await adminPaymentMethodsApi.update(id, { credentials: creds })
      toast.success('Credentials saved and encrypted')
      navigate('/payment-methods')
    } catch {
      toast.error('Failed to save credentials')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="page-enter flex items-center justify-center py-32">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!method) {
    return (
      <div className="page-enter">
        <button
          onClick={() => navigate('/payment-methods')}
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          Back to Payment Methods
        </button>
        <div className="text-center py-16 text-gray-500">Payment method not found.</div>
      </div>
    )
  }

  const fields = providerCredentialFields[method.provider] || []

  return (
    <div className="page-enter">
      <div className="mb-6">
        <button
          onClick={() => navigate('/payment-methods')}
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          Back to Payment Methods
        </button>

        <PageHeader
          title={`${method.displayName} — API Credentials`}
          description={method.hasCredentials ? 'Update existing API credentials' : 'Configure API credentials for this provider'}
        />
      </div>

      <div className="admin-card-surface p-6">
        <div className="space-y-5">
          {/* Security notice */}
          <div className="flex items-start gap-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 p-4">
            <ShieldCheck size={18} className="text-blue-500 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <p className="font-medium">Encrypted storage</p>
              <p className="mt-0.5 text-blue-600/80 dark:text-blue-400/80">
                Credentials are encrypted before being stored.
                {method.hasCredentials && ' Leave fields empty to keep existing values.'}
              </p>
            </div>
          </div>

          {/* Credential fields */}
          <div className="space-y-4">
            {fields.map((field) => (
              <div key={field.key} className="relative">
                <Input
                  label={field.label}
                  type={showSecrets[field.key] ? 'text' : 'password'}
                  placeholder={method.hasCredentials ? '••••••• (unchanged)' : field.placeholder}
                  value={credentials[field.key] || ''}
                  onChange={(e) => setCredentials((prev) => ({ ...prev, [field.key]: e.target.value }))}
                />
                <button
                  type="button"
                  onClick={() => setShowSecrets((prev) => ({ ...prev, [field.key]: !prev[field.key] }))}
                  className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  title={showSecrets[field.key] ? 'Hide' : 'Show'}
                >
                  {showSecrets[field.key] ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-dark-border">
            <Button
              loading={saving}
              leftIcon={<Save size={15} />}
              onClick={handleSave}
            >
              Save Credentials
            </Button>
            <Button variant="secondary" onClick={() => navigate('/payment-methods')}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
