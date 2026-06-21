import { useState, useEffect } from 'react'
import {
  Globe, Phone, CreditCard, GraduationCap, BarChart3, BookOpen,
  Save, AtSign, Camera, MessageCircle, History, School,
  PlusCircle, Trash2, Heart,
} from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Textarea from '../../components/ui/Textarea'
import Card from '../../components/ui/Card'
import { Skeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../hooks/useToast'
import client from '../../api/client'

type TabKey = 'contact' | 'social' | 'payment' | 'dues' | 'mission' | 'stats' | 'history' | 'school' | 'stories'

export default function SiteConfigPage() {
  const { toast } = useToast()
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
  const [mission, setMission] = useState({ mission: '', vision: '' })
  const [stats, setStats] = useState({ members: 0, years: 0, projects: 0, events: 0 })
  const [donationAllocation, setDonationAllocation] = useState<Array<{ title: string; percentage: number; description: string }>>([])

  // New config state
  const [history, setHistory] = useState<{ paragraphs: string[] }>({ paragraphs: [''] })
  const [schoolInfo, setSchoolInfo] = useState<{
    name: string; abbreviation: string; founded: number; location: string; slogan: string;
    studentPopulation: number; teachingStaff: number;
    programs: Array<{ name: string; description: string }>;
    achievements: Array<{ year: string; description: string }>;
    notableAlumni: Array<{ name: string; achievement: string; yearGroup: string }>;
  }>({
    name: '', abbreviation: '', founded: 1960, location: '', slogan: '',
    studentPopulation: 0, teachingStaff: 0,
    programs: [], achievements: [], notableAlumni: [],
  })
  const [impactStories, setImpactStories] = useState<Array<{ name: string; quote: string; year: string }>>([])

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
        if (configs.mission) setMission(configs.mission)
        if (configs.stats) setStats(configs.stats)
        if (configs.donationAllocation) setDonationAllocation(configs.donationAllocation)
        if (configs.history) setHistory(configs.history)
        if (configs.schoolInfo) setSchoolInfo((prev) => ({ ...prev, ...configs.schoolInfo }))
        if (configs.impactStories) setImpactStories(configs.impactStories)
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
    } catch {
      toast.error('Failed to save')
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
    } catch {
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: 'contact', label: 'Contact', icon: Phone },
    { key: 'social', label: 'Social', icon: Globe },
    { key: 'payment', label: 'Payment', icon: CreditCard },
    { key: 'dues', label: 'Dues', icon: GraduationCap },
    { key: 'mission', label: 'Mission', icon: BookOpen },
    { key: 'stats', label: 'Stats', icon: BarChart3 },
    { key: 'history', label: 'History', icon: History },
    { key: 'school', label: 'School', icon: School },
    { key: 'stories', label: 'Stories', icon: Heart },
  ]

  if (loading) {
    return (
      <div className="page-enter">
        <PageHeader title="Site Configuration" description="Manage public website content and settings" />
        <div className="max-w-4xl">
          <div className="flex gap-4 border-b border-gray-200 dark:border-dark-border mb-6 pb-3">
            {Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} className="w-16 h-4" />)}
          </div>
          <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-200/80 dark:border-dark-border p-6 space-y-5">
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
      <PageHeader title="Site Configuration" description="Manage public website content and settings" />

      <div className="max-w-4xl">
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
                <Button loading={saving} onClick={() => saveConfig('contact', contact)}><Save size={14} className="mr-1" /> Save Contact Info</Button>
              </div>
            </div>
          </Card>
        )}

        {/* Social Tab */}
        {activeTab === 'social' && (
          <Card title="Social Media Links">
            <div className="space-y-4">
              <div className="flex items-center gap-3"><AtSign size={18} className="text-blue-600 shrink-0" /><Input label="Facebook URL" value={social.facebook} onChange={(e) => setSocial({ ...social, facebook: e.target.value })} /></div>
              <div className="flex items-center gap-3"><Camera size={18} className="text-pink-500 shrink-0" /><Input label="Instagram URL" value={social.instagram} onChange={(e) => setSocial({ ...social, instagram: e.target.value })} /></div>
              <div className="flex items-center gap-3"><MessageCircle size={18} className="text-green-500 shrink-0" /><Input label="WhatsApp Channel URL" value={social.whatsapp} onChange={(e) => setSocial({ ...social, whatsapp: e.target.value })} /></div>
              <div className="flex justify-end pt-2">
                <Button loading={saving} onClick={() => saveConfig('social', social)}><Save size={14} className="mr-1" /> Save Social Links</Button>
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
              <Button loading={saving} onClick={() => saveConfig('payment', payment)}><Save size={14} className="mr-1" /> Save Payment Info</Button>
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
                <Button loading={saving} onClick={savePlatformFee}><Save size={14} className="mr-1" /> Save Fee</Button>
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
                <Button loading={saving} onClick={() => saveConfig('dues', dues)}><Save size={14} className="mr-1" /> Save Dues</Button>
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
                <Button loading={saving} onClick={() => saveConfig('donationAllocation', donationAllocation)}><Save size={14} className="mr-1" /> Save Allocations</Button>
              </div>
            </Card>
          </div>
        )}

        {/* Mission & Vision Tab */}
        {activeTab === 'mission' && (
          <Card title="Mission & Vision">
            <div className="space-y-4">
              <Textarea label="Mission Statement" rows={4} value={mission.mission} onChange={(e) => setMission({ ...mission, mission: e.target.value })} />
              <Textarea label="Vision Statement" rows={4} value={mission.vision} onChange={(e) => setMission({ ...mission, vision: e.target.value })} />
              <div className="flex justify-end pt-2">
                <Button loading={saving} onClick={() => saveConfig('mission', mission)}><Save size={14} className="mr-1" /> Save Mission & Vision</Button>
              </div>
            </div>
          </Card>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <Card title="Homepage Statistics">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">These numbers appear on the public homepage as animated counters.</p>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Total Alumni Members" type="number" value={String(stats.members)} onChange={(e) => setStats({ ...stats, members: Number(e.target.value) })} />
              <Input label="Years of Legacy" type="number" value={String(stats.years)} onChange={(e) => setStats({ ...stats, years: Number(e.target.value) })} />
              <Input label="Projects Completed" type="number" value={String(stats.projects)} onChange={(e) => setStats({ ...stats, projects: Number(e.target.value) })} />
              <Input label="Events Organized" type="number" value={String(stats.events)} onChange={(e) => setStats({ ...stats, events: Number(e.target.value) })} />
            </div>
            <div className="flex justify-end pt-4">
              <Button loading={saving} onClick={() => saveConfig('stats', stats)}><Save size={14} className="mr-1" /> Save Stats</Button>
            </div>
          </Card>
        )}

        {/* History Tab (NEW) */}
        {activeTab === 'history' && (
          <Card title="Organization History">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Each paragraph appears as a timeline entry on the About page.</p>
            <div className="space-y-3">
              {history.paragraphs.map((p, idx) => (
                <div key={idx} className="flex gap-3 items-start">
                  <span className="text-xs font-bold text-gray-400 dark:text-gray-500 mt-3 shrink-0 w-6 text-center">{idx + 1}</span>
                  <Textarea rows={3} value={p} onChange={(e) => { const u = [...history.paragraphs]; u[idx] = e.target.value; setHistory({ paragraphs: u }) }} />
                  <button onClick={() => setHistory({ paragraphs: history.paragraphs.filter((_, i) => i !== idx) })} className="text-red-500 hover:text-red-700 p-2 mt-1 shrink-0"><Trash2 size={14} /></button>
                </div>
              ))}
              <Button variant="ghost" onClick={() => setHistory({ paragraphs: [...history.paragraphs, ''] })}><PlusCircle size={14} className="mr-1" /> Add Paragraph</Button>
            </div>
            <div className="flex justify-end pt-4">
              <Button loading={saving} onClick={() => saveConfig('history', history)}><Save size={14} className="mr-1" /> Save History</Button>
            </div>
          </Card>
        )}

        {/* School Info Tab (NEW) */}
        {activeTab === 'school' && (
          <div className="space-y-6">
            <Card title="School Details">
              <div className="grid grid-cols-2 gap-4">
                <Input label="School Name" value={schoolInfo.name} onChange={(e) => setSchoolInfo({ ...schoolInfo, name: e.target.value })} />
                <Input label="Abbreviation" value={schoolInfo.abbreviation} onChange={(e) => setSchoolInfo({ ...schoolInfo, abbreviation: e.target.value })} />
                <Input label="Founded" type="number" value={String(schoolInfo.founded)} onChange={(e) => setSchoolInfo({ ...schoolInfo, founded: Number(e.target.value) })} />
                <Input label="Location" value={schoolInfo.location} onChange={(e) => setSchoolInfo({ ...schoolInfo, location: e.target.value })} />
                <Input label="Slogan" value={schoolInfo.slogan} onChange={(e) => setSchoolInfo({ ...schoolInfo, slogan: e.target.value })} />
                <Input label="Student Population" type="number" value={String(schoolInfo.studentPopulation)} onChange={(e) => setSchoolInfo({ ...schoolInfo, studentPopulation: Number(e.target.value) })} />
                <Input label="Teaching Staff" type="number" value={String(schoolInfo.teachingStaff)} onChange={(e) => setSchoolInfo({ ...schoolInfo, teachingStaff: Number(e.target.value) })} />
              </div>
            </Card>

            <Card title="Academic Programs">
              <div className="space-y-3">
                {schoolInfo.programs.map((p, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-3 items-end">
                    <div className="col-span-4"><Input label="Program Name" value={p.name} onChange={(e) => { const u = [...schoolInfo.programs]; u[idx] = { ...p, name: e.target.value }; setSchoolInfo({ ...schoolInfo, programs: u }) }} /></div>
                    <div className="col-span-7"><Input label="Description" value={p.description} onChange={(e) => { const u = [...schoolInfo.programs]; u[idx] = { ...p, description: e.target.value }; setSchoolInfo({ ...schoolInfo, programs: u }) }} /></div>
                    <div className="col-span-1"><button onClick={() => setSchoolInfo({ ...schoolInfo, programs: schoolInfo.programs.filter((_, i) => i !== idx) })} className="text-red-500 hover:text-red-700 p-2"><Trash2 size={14} /></button></div>
                  </div>
                ))}
                <Button variant="ghost" onClick={() => setSchoolInfo({ ...schoolInfo, programs: [...schoolInfo.programs, { name: '', description: '' }] })}><PlusCircle size={14} className="mr-1" /> Add Program</Button>
              </div>
            </Card>

            <Card title="Achievements & Legacy">
              <div className="space-y-3">
                {schoolInfo.achievements.map((a, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-3 items-end">
                    <div className="col-span-2"><Input label="Year" value={a.year} onChange={(e) => { const u = [...schoolInfo.achievements]; u[idx] = { ...a, year: e.target.value }; setSchoolInfo({ ...schoolInfo, achievements: u }) }} /></div>
                    <div className="col-span-9"><Input label="Description" value={a.description} onChange={(e) => { const u = [...schoolInfo.achievements]; u[idx] = { ...a, description: e.target.value }; setSchoolInfo({ ...schoolInfo, achievements: u }) }} /></div>
                    <div className="col-span-1"><button onClick={() => setSchoolInfo({ ...schoolInfo, achievements: schoolInfo.achievements.filter((_, i) => i !== idx) })} className="text-red-500 hover:text-red-700 p-2"><Trash2 size={14} /></button></div>
                  </div>
                ))}
                <Button variant="ghost" onClick={() => setSchoolInfo({ ...schoolInfo, achievements: [...schoolInfo.achievements, { year: '', description: '' }] })}><PlusCircle size={14} className="mr-1" /> Add Achievement</Button>
              </div>
            </Card>

            <Card title="Notable Alumni">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Distinguished graduates displayed on the Our School page.</p>
              <div className="space-y-3">
                {schoolInfo.notableAlumni.map((a, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-3 items-end">
                    <div className="col-span-3"><Input label="Name" value={a.name} onChange={(e) => { const u = [...schoolInfo.notableAlumni]; u[idx] = { ...a, name: e.target.value }; setSchoolInfo({ ...schoolInfo, notableAlumni: u }) }} /></div>
                    <div className="col-span-5"><Input label="Achievement" value={a.achievement} onChange={(e) => { const u = [...schoolInfo.notableAlumni]; u[idx] = { ...a, achievement: e.target.value }; setSchoolInfo({ ...schoolInfo, notableAlumni: u }) }} /></div>
                    <div className="col-span-3"><Input label="Year Group" value={a.yearGroup} onChange={(e) => { const u = [...schoolInfo.notableAlumni]; u[idx] = { ...a, yearGroup: e.target.value }; setSchoolInfo({ ...schoolInfo, notableAlumni: u }) }} /></div>
                    <div className="col-span-1"><button onClick={() => setSchoolInfo({ ...schoolInfo, notableAlumni: schoolInfo.notableAlumni.filter((_, i) => i !== idx) })} className="text-red-500 hover:text-red-700 p-2"><Trash2 size={14} /></button></div>
                  </div>
                ))}
                <Button variant="ghost" onClick={() => setSchoolInfo({ ...schoolInfo, notableAlumni: [...schoolInfo.notableAlumni, { name: '', achievement: '', yearGroup: '' }] })}><PlusCircle size={14} className="mr-1" /> Add Notable Alumnus</Button>
              </div>
            </Card>

            <div className="flex justify-end">
              <Button loading={saving} onClick={() => saveConfig('schoolInfo', schoolInfo)}><Save size={14} className="mr-1" /> Save School Info</Button>
            </div>
          </div>
        )}

        {/* Impact Stories Tab (NEW) */}
        {activeTab === 'stories' && (
          <Card title="Impact Stories / Testimonials">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Testimonials displayed on the Donate page to inspire contributions.</p>
            <div className="space-y-4">
              {impactStories.map((s, idx) => (
                <div key={idx} className="bg-gray-50 dark:bg-dark-hover rounded-xl p-4 border border-gray-100 dark:border-dark-border space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Story {idx + 1}</span>
                    <button onClick={() => setImpactStories(impactStories.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={14} /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Name" value={s.name} onChange={(e) => { const u = [...impactStories]; u[idx] = { ...s, name: e.target.value }; setImpactStories(u) }} />
                    <Input label="Year / Class" value={s.year} onChange={(e) => { const u = [...impactStories]; u[idx] = { ...s, year: e.target.value }; setImpactStories(u) }} />
                  </div>
                  <Textarea label="Quote / Testimonial" rows={3} value={s.quote} onChange={(e) => { const u = [...impactStories]; u[idx] = { ...s, quote: e.target.value }; setImpactStories(u) }} />
                </div>
              ))}
              <Button variant="ghost" onClick={() => setImpactStories([...impactStories, { name: '', quote: '', year: '' }])}><PlusCircle size={14} className="mr-1" /> Add Story</Button>
            </div>
            <div className="flex justify-end pt-4">
              <Button loading={saving} onClick={() => saveConfig('impactStories', impactStories)}><Save size={14} className="mr-1" /> Save Stories</Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
