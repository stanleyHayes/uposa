import { useState, useEffect } from 'react'
import {
  Globe, Phone, CreditCard, GraduationCap,
  Save, AtSign, Camera, MessageCircle,
  PlusCircle, Trash2,
} from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Card from '../../components/ui/Card'
import { Skeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../hooks/useToast'
import { usePermission } from '../../hooks/usePermission'
import { apiErrorMessage } from '../../utils/apiError'
import client from '../../api/client'

// About-page keys (mission, history, stats, schoolInfo, impactStories, constitution) live on the About Content page (about:*).
type TabKey = 'contact' | 'social' | 'payment' | 'dues'

export default function SiteConfigPage() {
  const { toast } = useToast()
  const { can } = usePermission()
  // GET returns only the keys this admin may view; saving needs site:edit.
  const canEdit = can('site:edit')
  const [activeTab, setActiveTab] = useState<TabKey>('contact')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Existing config state
  const [contact, setContact] = useState({
    phones: ['', ''],
    emails: { general: '', secretary: '', membership: '', events: '' },
    address: '',
    officeHours: '',
  })
  const [social, setSocial] = useState({ facebook: '', instagram: '', whatsapp: '' })
  const [payment, setPayment] = useState({
    momo: { number: '', payId: '', accountName: '' },
    bank: { bank: '', accountNo: '', accountName: '', branch: '' },
  })
  const [dues, setDues] = useState({ annual: 120, lifetime: 1000, currency: 'GHS' })
  const [platformFee, setPlatformFee] = useState({ enabled: true, percent: 1, fixed: 0 })
  const [donationAllocation, setDonationAllocation] = useState<Array<{ title: string; percentage: number; description: string }>>([])


  useEffect(() => {
    let cancelled = false
    const fetchConfigs = async () => {
      setLoading(true)
      try {
        const res = await client.get('/admin/site/config')
        if (cancelled) return
        const configs = res.data.data || {}
        if (configs.contact) setContact(configs.contact)
        if (configs.social) setSocial(configs.social)
        if (configs.payment) setPayment(configs.payment)
        if (configs.dues) setDues(configs.dues)
        setPlatformFee({
          enabled: String(configs.PAYMENT_PLATFORM_FEE_ENABLED ?? 'true') === 'true',
          percent: Number(configs.PAYMENT_PLATFORM_FEE_PERCENT ?? 1),
          fixed: Number(configs.PAYMENT_PLATFORM_FEE_FIXED ?? 0),
        })
        if (configs.donationAllocation) setDonationAllocation(configs.donationAllocation)
      } catch {
        if (!cancelled) toast.error('Failed to load site config')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchConfigs()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const saveConfig = async (key: string, value: unknown) => {
    setSaving(true)
    try {
      await client.put(`/admin/site/config/${key}`, { value })
      toast.success('Saved', `${key} config updated`)
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to save'))
    } finally {
      setSaving(false)
    }
  }

  const savePlatformFee = async () => {
    setSaving(true)
    try {
      await Promise.all([
        client.put('/admin/site/config/PAYMENT_PLATFORM_FEE_ENABLED', { value: platformFee.enabled ? 'true' : 'false' }),
        client.put('/admin/site/config/PAYMENT_PLATFORM_FEE_PERCENT', { value: platformFee.percent }),
        client.put('/admin/site/config/PAYMENT_PLATFORM_FEE_FIXED', { value: platformFee.fixed }),
      ])
      toast.success('Saved', 'Platform fee updated')
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to save'))
    } finally {
      setSaving(false)
    }
  }

  const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: 'contact', label: 'Contact', icon: Phone },
    { key: 'social', label: 'Social', icon: Globe },
    { key: 'payment', label: 'Payment', icon: CreditCard },
    { key: 'dues', label: 'Dues', icon: GraduationCap },
  ]

  if (loading) {
    return (
      <div className="page-enter">
        <PageHeader title="Site Configuration" description="Manage public website content and settings" />
        <div className="max-w-4xl">
          <div className="flex gap-4 border-b border-gray-200 dark:border-dark-border mb-6 pb-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="w-16 h-4" />)}
          </div>
          <div className="admin-card-surface p-6 space-y-5">
            <Skeleton className="w-40 h-5" />
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="w-24 h-3" />
                  <Skeleton variant="rectangular" className="w-full h-10 rounded-lg" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-enter">
      <PageHeader title="Site Configuration" description="Contact details, payment details shown to donors, dues and donation allocation, and the platform fee. About-page content is under About Content." />

      <div className="max-w-4xl">
        {!canEdit && (
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">You can view site settings but don't have permission to change them.</p>
        )}
        <div className="flex gap-0 border-b border-gray-200 dark:border-dark-border mb-6 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-3 py-3 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'border-brand-500 text-brand-500 dark:text-brand-300 dark:border-brand-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Contact Tab */}
        {activeTab === 'contact' && (
          <Card title="Contact Information">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input label="Phone 1" value={contact.phones[0] || ''} onChange={(e) => setContact({ ...contact, phones: [e.target.value, contact.phones[1]] })} />
                <Input label="Phone 2" value={contact.phones[1] || ''} onChange={(e) => setContact({ ...contact, phones: [contact.phones[0], e.target.value] })} />
              </div>
              <Input label="Address" value={contact.address} onChange={(e) => setContact({ ...contact, address: e.target.value })} />
              <Input label="Office Hours" value={contact.officeHours} onChange={(e) => setContact({ ...contact, officeHours: e.target.value })} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="General Email" value={contact.emails.general} onChange={(e) => setContact({ ...contact, emails: { ...contact.emails, general: e.target.value } })} />
                <Input label="Secretary Email" value={contact.emails.secretary} onChange={(e) => setContact({ ...contact, emails: { ...contact.emails, secretary: e.target.value } })} />
                <Input label="Membership Email" value={contact.emails.membership} onChange={(e) => setContact({ ...contact, emails: { ...contact.emails, membership: e.target.value } })} />
                <Input label="Events Email" value={contact.emails.events} onChange={(e) => setContact({ ...contact, emails: { ...contact.emails, events: e.target.value } })} />
              </div>
              <div className="flex justify-end pt-2">
                <Button loading={saving} disabled={!canEdit} onClick={() => saveConfig('contact', contact)}><Save size={14} className="mr-1" /> Save Contact Info</Button>
              </div>
            </div>
          </Card>
        )}

        {/* Social Tab */}
        {activeTab === 'social' && (
          <Card title="Social Media Links">
            <div className="space-y-4">
              <div className="flex items-center gap-3"><AtSign size={18} className="text-blue-600 shrink-0" /><Input label="Facebook URL" value={social.facebook} onChange={(e) => setSocial({ ...social, facebook: e.target.value })} /></div>
              <div className="flex items-center gap-3"><Camera size={18} className="text-brand-600 shrink-0" /><Input label="Instagram URL" value={social.instagram} onChange={(e) => setSocial({ ...social, instagram: e.target.value })} /></div>
              <div className="flex items-center gap-3"><MessageCircle size={18} className="text-green-500 shrink-0" /><Input label="WhatsApp Channel URL" value={social.whatsapp} onChange={(e) => setSocial({ ...social, whatsapp: e.target.value })} /></div>
              <div className="flex justify-end pt-2">
                <Button loading={saving} disabled={!canEdit} onClick={() => saveConfig('social', social)}><Save size={14} className="mr-1" /> Save Social Links</Button>
              </div>
            </div>
          </Card>
        )}

        {/* Payment Tab */}
        {activeTab === 'payment' && (
          <div className="space-y-6">
            <Card title="Mobile Money">
              <div className="grid grid-cols-3 gap-4">
                <Input label="MoMo Number" value={payment.momo.number} onChange={(e) => setPayment({ ...payment, momo: { ...payment.momo, number: e.target.value } })} />
                <Input label="MoMo Pay ID" value={payment.momo.payId} onChange={(e) => setPayment({ ...payment, momo: { ...payment.momo, payId: e.target.value } })} />
                <Input label="Account Name" value={payment.momo.accountName} onChange={(e) => setPayment({ ...payment, momo: { ...payment.momo, accountName: e.target.value } })} />
              </div>
            </Card>
            <Card title="Bank Transfer">
              <div className="grid grid-cols-2 gap-4">
                <Input label="Bank" value={payment.bank.bank} onChange={(e) => setPayment({ ...payment, bank: { ...payment.bank, bank: e.target.value } })} />
                <Input label="Account Number" value={payment.bank.accountNo} onChange={(e) => setPayment({ ...payment, bank: { ...payment.bank, accountNo: e.target.value } })} />
                <Input label="Account Name" value={payment.bank.accountName} onChange={(e) => setPayment({ ...payment, bank: { ...payment.bank, accountName: e.target.value } })} />
                <Input label="Branch" value={payment.bank.branch} onChange={(e) => setPayment({ ...payment, bank: { ...payment.bank, branch: e.target.value } })} />
              </div>
            </Card>
            <div className="flex justify-end">
              <Button loading={saving} disabled={!canEdit} onClick={() => saveConfig('payment', payment)}><Save size={14} className="mr-1" /> Save Payment Info</Button>
            </div>

            <Card title="Online Payment Fee (Paystack)">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                A platform fee added on top of online (Paystack) payments. The payer covers this charge, so UPOSA receives the full amount.
              </p>
              <div className="grid grid-cols-3 gap-4">
                <Input label="Fee Percent (%)" type="number" step="0.1" value={String(platformFee.percent)} onChange={(e) => setPlatformFee({ ...platformFee, percent: Number(e.target.value) })} />
                <Input label="Fixed Fee (GHS)" type="number" step="0.01" value={String(platformFee.fixed)} onChange={(e) => setPlatformFee({ ...platformFee, fixed: Number(e.target.value) })} />
                <Select
                  label="Enabled"
                  value={platformFee.enabled ? 'true' : 'false'}
                  onChange={(e) => setPlatformFee({ ...platformFee, enabled: e.target.value === 'true' })}
                  options={[{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }]}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 pt-3">
                Example: a {dues.currency} 100 payment charges the payer {dues.currency}{' '}
                {platformFee.enabled ? (100 + (100 * platformFee.percent) / 100 + platformFee.fixed).toFixed(2) : '100.00'}.
              </p>
              <div className="flex justify-end pt-4">
                <Button loading={saving} disabled={!canEdit} onClick={savePlatformFee}><Save size={14} className="mr-1" /> Save Fee</Button>
              </div>
            </Card>
          </div>
        )}

        {/* Dues & Donations Tab */}
        {activeTab === 'dues' && (
          <div className="space-y-6">
            <Card title="Membership Dues">
              <div className="grid grid-cols-3 gap-4">
                <Input label="Annual Dues (GHS)" type="number" value={String(dues.annual)} onChange={(e) => setDues({ ...dues, annual: Number(e.target.value) })} />
                <Input label="Lifetime (GHS)" type="number" value={String(dues.lifetime)} onChange={(e) => setDues({ ...dues, lifetime: Number(e.target.value) })} />
                <Input label="Currency" value={dues.currency} onChange={(e) => setDues({ ...dues, currency: e.target.value })} />
              </div>
              <div className="flex justify-end pt-4">
                <Button loading={saving} disabled={!canEdit} onClick={() => saveConfig('dues', dues)}><Save size={14} className="mr-1" /> Save Dues</Button>
              </div>
            </Card>
            <Card title="Donation Allocation">
              <div className="space-y-3">
                {donationAllocation.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-3 items-end">
                    <div className="col-span-4"><Input label="Title" value={item.title} onChange={(e) => { const u = [...donationAllocation]; u[idx] = { ...item, title: e.target.value }; setDonationAllocation(u) }} /></div>
                    <div className="col-span-2"><Input label="%" type="number" value={String(item.percentage)} onChange={(e) => { const u = [...donationAllocation]; u[idx] = { ...item, percentage: Number(e.target.value) }; setDonationAllocation(u) }} /></div>
                    <div className="col-span-5"><Input label="Description" value={item.description} onChange={(e) => { const u = [...donationAllocation]; u[idx] = { ...item, description: e.target.value }; setDonationAllocation(u) }} /></div>
                    <div className="col-span-1"><button onClick={() => setDonationAllocation(donationAllocation.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-700 p-2"><Trash2 size={14} /></button></div>
                  </div>
                ))}
                <Button variant="ghost" onClick={() => setDonationAllocation([...donationAllocation, { title: '', percentage: 0, description: '' }])}><PlusCircle size={14} className="mr-1" /> Add Allocation</Button>
              </div>
              <div className="flex justify-end pt-4">
                <Button loading={saving} disabled={!canEdit} onClick={() => saveConfig('donationAllocation', donationAllocation)}><Save size={14} className="mr-1" /> Save Allocations</Button>
              </div>
            </Card>
          </div>
        )}

      </div>
    </div>
  )
}
