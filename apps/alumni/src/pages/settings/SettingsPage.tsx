import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  CheckCircle2,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  Globe2,
  KeyRound,
  Languages,
  Lock,
  Moon,
  Palette,
  Save,
  Shield,
  Sparkles,
  Sun,
  Trash2,
  UserCircle,
  type LucideIcon,
} from 'lucide-react'
import { motion } from 'framer-motion'
import PageTransition from '../../components/common/PageTransition'
import ScrollReveal from '../../components/common/ScrollReveal'
import { useAuthStore } from '../../stores/auth.store'
import { useTheme } from '../../hooks/useTheme'
import { useToast } from '../../hooks/useToast'
import { authApi, membersApi } from '../../api/services'
import { ACCOUNT_DELETION_URL, PRIVACY_URL, TERMS_URL } from '../../lib/legal'
import type { Member, MemberPreferences } from '../../types'

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

type PasswordForm = z.infer<typeof passwordSchema>
type TabKey = 'preferences' | 'password' | 'notifications' | 'privacy'

const tabs: Array<{ key: TabKey; label: string; helper: string; icon: LucideIcon }> = [
  { key: 'preferences', label: 'Preferences', helper: 'Theme and region', icon: Palette },
  { key: 'password', label: 'Password', helper: 'Account security', icon: KeyRound },
  { key: 'notifications', label: 'Notifications', helper: 'Email routing', icon: Bell },
  { key: 'privacy', label: 'Privacy & data', helper: 'Directory, data, account', icon: Shield },
]

const inputCls = 'input input-bordered min-h-12 w-full border-primary/10 bg-base-200/45 pl-10 pr-10 focus:border-primary focus:bg-base-100'
const selectCls = 'select select-bordered min-h-12 w-full border-primary/10 bg-base-200/45 focus:border-primary focus:bg-base-100'
const labelCls = 'text-xs font-bold uppercase tracking-[0.14em] text-base-content/44'

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
      <span className={`grid h-10 w-10 place-items-center rounded-[14px_3px_14px_3px] ${tone}`}>
        <Icon className="h-4 w-4" />
      </span>
      <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.16em] text-primary-content/42">{label}</p>
      <p className="mt-2 truncate text-2xl font-bold text-secondary">{value}</p>
      <p className="mt-auto pt-2 text-xs font-semibold text-primary-content/45">{detail}</p>
    </div>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: ReactNode
}) {
  return (
    <label className="form-control">
      <span className="mb-2">
        <span className={labelCls}>{label}</span>
      </span>
      {children}
      {error && <span className="mt-2 text-xs font-bold text-error">{error}</span>}
    </label>
  )
}

function TabButton({
  active,
  icon: Icon,
  label,
  helper,
  onClick,
}: {
  active: boolean
  icon: LucideIcon
  label: string
  helper: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className={`flex min-h-20 items-center gap-3 border p-3 text-left transition-all rounded-[20px_4px_20px_4px] ${
        active ? 'border-primary bg-primary/7 shadow-[0_10px_24px_rgba(0,27,80,0.08)]' : 'border-primary/10 bg-base-100 hover:border-primary/20'
      }`}
      onClick={onClick}
    >
      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-[15px_3px_15px_3px] ${active ? 'bg-primary text-primary-content' : 'bg-primary/8 text-primary'}`}>
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-bold">{label}</span>
        <span className="mt-1 block text-xs leading-relaxed text-base-content/50">{helper}</span>
      </span>
    </button>
  )
}

function PanelHeader({
  icon: Icon,
  eyebrow,
  title,
  description,
}: {
  icon: LucideIcon
  eyebrow: string
  title: string
  description: string
}) {
  return (
    <div className="flex items-start gap-4">
      <span className="grid h-12 w-12 shrink-0 place-items-center bg-primary/8 text-primary rounded-[16px_3px_16px_3px]">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-secondary">{eyebrow}</p>
        <h2 className="mt-1 text-2xl font-bold leading-tight">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-base-content/56">{description}</p>
      </div>
    </div>
  )
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="flex min-h-20 cursor-pointer items-center justify-between gap-4 border border-primary/10 bg-base-100/86 p-4 transition-all hover:border-primary/18 hover:bg-base-100 rounded-[18px_4px_18px_4px]">
      <span className="min-w-0">
        <span className="block text-sm font-bold text-base-content">{label}</span>
        <span className="mt-1 block text-xs leading-relaxed text-base-content/50">{description}</span>
      </span>
      <input
        type="checkbox"
        className="toggle toggle-primary toggle-sm shrink-0"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  )
}

function PasswordInput({
  label,
  icon: Icon,
  visible,
  onToggle,
  error,
  ...props
}: {
  label: string
  icon: LucideIcon
  visible?: boolean
  onToggle?: () => void
  error?: string
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Field label={label} error={error}>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-base-content/38" />
        <input
          {...props}
          type={visible ? 'text' : 'password'}
          className={`${inputCls} ${error ? 'input-error' : ''}`}
        />
        {onToggle && (
          <button
            type="button"
            aria-label={visible ? 'Hide password' : 'Show password'}
            className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center text-base-content/40 transition-colors hover:text-primary"
            onClick={onToggle}
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
    </Field>
  )
}

// Error body may be a Blob when the request used responseType 'blob' (data export).
async function apiErrorMessage(err: unknown): Promise<string | undefined> {
  const data = (err as { response?: { data?: unknown } })?.response?.data
  if (data instanceof Blob) {
    try {
      return (JSON.parse(await data.text()) as { message?: string }).message
    } catch {
      return undefined
    }
  }
  return (data as { message?: string } | undefined)?.message
}

// Ghana Data Protection Act 2012 (Act 843) self-service: consent choices, a
// copy of the member's data (right of access) and account deletion (erasure).
function PrivacyDataPanel() {
  const user = useAuthStore((s) => s.user)
  const updateUser = useAuthStore((s) => s.updateUser)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const toast = useToast()
  const [savingKey, setSavingKey] = useState<keyof MemberPreferences | null>(null)
  const [exporting, setExporting] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  // Same defaults as the API for accounts that predate consent records.
  const preferences: MemberPreferences = user?.preferences ?? { marketingOptIn: false, directoryOptIn: true }

  // Sessions cached before preferences existed have none: read the current values.
  useEffect(() => {
    let active = true
    authApi.me()
      .then((res) => {
        // /auth/me wraps the member as { type, data }.
        const payload = res.data.data as unknown as (Partial<Member> & { data?: Member }) | undefined
        const fresh = payload?.data?.preferences ?? payload?.preferences
        if (active && fresh) updateUser({ preferences: fresh })
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [updateUser])

  const setPreference = async (key: keyof MemberPreferences, value: boolean) => {
    const previous = preferences
    updateUser({ preferences: { ...previous, [key]: value } })
    setSavingKey(key)
    try {
      const res = await membersApi.updatePreferences({ [key]: value })
      if (res.data.data) updateUser({ preferences: res.data.data })
      toast.success('Privacy preference saved')
    } catch (err) {
      updateUser({ preferences: previous })
      toast.error((await apiErrorMessage(err)) || 'Could not save your preference. Please try again.')
    } finally {
      setSavingKey(null)
    }
  }

  const downloadData = async () => {
    setExporting(true)
    try {
      const res = await membersApi.exportMyData()
      const disposition = String(res.headers['content-disposition'] ?? '')
      const filename = /filename="?([^";]+)"?/.exec(disposition)?.[1]
        || `uposa-my-data-${new Date().toISOString().slice(0, 10)}.json`
      const url = URL.createObjectURL(res.data)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      toast.success('Your data download has started')
    } catch (err) {
      toast.error((await apiErrorMessage(err)) || 'Could not export your data. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  const deleteAccount = async () => {
    if (!password || !confirmed) return
    setDeleting(true)
    setDeleteError('')
    try {
      await membersApi.deleteMyAccount(password)
      logout()
      toast.success('Your account has been deleted.')
      navigate('/login', { replace: true })
    } catch (err) {
      setDeleteError((await apiErrorMessage(err)) || 'Could not delete your account. Please try again.')
      setDeleting(false)
    }
  }

  const closeDelete = () => {
    setDeleteOpen(false)
    setPassword('')
    setConfirmed(false)
    setDeleteError('')
  }

  return (
    <div className="overflow-hidden border border-primary/10 bg-base-100/92 shadow-[0_18px_50px_rgba(0,27,80,0.08)] rounded-[28px_6px_28px_6px]">
      <div className="h-1 bg-secondary" />
      <div className="flex flex-col p-5 sm:p-6">
        <PanelHeader
          icon={Shield}
          eyebrow="Privacy & data"
          title="Your data, your choices"
          description="Choose who can find you and what we email you, download a copy of your data, or delete your account."
        />

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <ToggleRow
            label="Show my profile in the member directory"
            description={savingKey === 'directoryOptIn' ? 'Saving…' : 'Signed-in members can find you in directory search.'}
            checked={preferences.directoryOptIn}
            onChange={(checked) => setPreference('directoryOptIn', checked)}
          />
          <ToggleRow
            label="Email me UPOSA news and updates"
            description={savingKey === 'marketingOptIn' ? 'Saving…' : 'Newsletters and association news. Account and payment emails still arrive.'}
            checked={preferences.marketingOptIn}
            onChange={(checked) => setPreference('marketingOptIn', checked)}
          />
        </div>

        <div className="mt-5 flex flex-col gap-3 border border-primary/10 bg-base-200/40 p-4 sm:flex-row sm:items-center sm:justify-between rounded-[22px_4px_22px_4px]">
          <div className="min-w-0">
            <p className="text-sm font-bold">Download my data</p>
            <p className="mt-1 text-xs leading-relaxed text-base-content/58">
              A JSON file with your profile, consents, dues, donations, payments, event RSVPs, mentorship, jobs, forum posts and votes.
            </p>
          </div>
          <button type="button" className="btn btn-primary btn-sm min-h-10 shrink-0 gap-2" onClick={downloadData} disabled={exporting}>
            <Download className="h-4 w-4" />
            {exporting ? 'Preparing…' : 'Download my data'}
          </button>
        </div>

        <div className="mt-5 border border-error/20 bg-error/8 p-4 rounded-[22px_4px_22px_4px]">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center bg-error/12 text-error rounded-[15px_3px_15px_3px]">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1 space-y-2 text-xs leading-relaxed text-base-content/62">
              <p className="text-sm font-bold text-error">Delete account</p>
              <p>
                <span className="font-bold text-base-content/80">Deleted:</span> your profile details and photo, your sign-in, job posts and
                applications, mentorship requests, event RSVPs and newsletter subscription.
              </p>
              <p>
                <span className="font-bold text-base-content/80">Kept without your personal details:</span> dues, donation and payment records
                (the association must keep these for its accounts), anonymous poll and election participation, and your forum posts and
                comments, which will show as &quot;Deleted member&quot;.
              </p>
              <p>This cannot be undone.</p>
            </div>
            {!deleteOpen && (
              <button type="button" className="btn btn-outline btn-error btn-sm min-h-10 shrink-0 gap-2" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="h-4 w-4" />
                Delete account
              </button>
            )}
          </div>

          {deleteOpen && (
            <form
              className="mt-4 grid gap-3 border-t border-error/15 pt-4"
              onSubmit={(event) => {
                event.preventDefault()
                void deleteAccount()
              }}
            >
              <Field label="Enter your password to confirm" error={deleteError || undefined}>
                <input
                  type="password"
                  autoComplete="current-password"
                  className="input input-bordered min-h-12 w-full border-error/25 bg-base-100"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </Field>
              <label className="flex cursor-pointer items-start gap-3 text-sm">
                <input type="checkbox" className="checkbox checkbox-error checkbox-sm mt-0.5" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
                <span>I understand my account will be permanently deleted and I will be signed out.</span>
              </label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button type="submit" className="btn btn-error min-h-11 gap-2" disabled={!password || !confirmed || deleting}>
                  <Trash2 className="h-4 w-4" />
                  {deleting ? 'Deleting…' : 'Delete my account'}
                </button>
                <button type="button" className="btn btn-ghost min-h-11" onClick={closeDelete} disabled={deleting}>Cancel</button>
              </div>
            </form>
          )}
        </div>

        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold">
          {[
            { href: PRIVACY_URL, label: 'Privacy Policy' },
            { href: TERMS_URL, label: 'Terms of Use' },
            { href: ACCOUNT_DELETION_URL, label: 'Account deletion help' },
          ].map((item) => (
            <a key={item.href} href={item.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
              {item.label}
              <ExternalLink className="h-3 w-3" />
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user)
  const setAuth = useAuthStore((s) => s.setAuth)
  const { theme, setTheme } = useTheme()
  const toast = useToast()
  const [tab, setTab] = useState<TabKey>('preferences')
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false })
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  const [notifications, setNotifications] = useState({
    emailEvents: true,
    emailNews: true,
    emailForum: false,
    emailPolls: true,
    emailDues: true,
    emailMentorship: true,
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  })

  const enabledNotifications = Object.values(notifications).filter(Boolean).length
  const listedInDirectory = user?.preferences?.directoryOptIn ?? true

  const onPasswordSubmit = async (data: PasswordForm) => {
    setPasswordSaving(true)
    try {
      const res = await authApi.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      })
      // The change revokes our old refresh token: keep the new pair, exactly as
      // after login, or the next refresh would sign the member out.
      const tokens = res.data.data
      if (tokens?.token && user) setAuth(tokens.token, tokens.refreshToken ?? null, user)
      setPasswordSuccess(true)
      reset()
      toast.success('Password updated successfully!')
      setTimeout(() => setPasswordSuccess(false), 3000)
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined
      toast.error(msg || 'Failed to update password.')
    } finally {
      setPasswordSaving(false)
    }
  }

  const handleSaveNotifications = () => {
    toast.success('Notification preferences saved!')
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
                Settings desk
              </div>
              <h1 className="max-w-3xl text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
                Tune your account without digging through menus.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-primary-content/62 sm:text-base">
                Manage theme, security, notification routing, and what other alumni can see in the directory.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <StatTile icon={UserCircle} label="Account" value={user?.membershipStatus || 'Member'} detail={user?.email || 'Signed in'} />
              <StatTile icon={Palette} label="Theme" value={theme === 'dark' ? 'Dark' : 'Light'} detail="Local preference" />
              <StatTile icon={Bell} label="Alerts" value={`${enabledNotifications}/6`} detail="Email channels on" tone="bg-secondary/18 text-primary" />
              <StatTile icon={Shield} label="Directory" value={listedInDirectory ? 'Listed' : 'Hidden'} detail="Member directory visibility" tone="bg-success/12 text-success" />
            </div>
          </div>
        </section>

        <section className="relative z-10 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {tabs.map((item) => (
            <TabButton
              key={item.key}
              active={tab === item.key}
              icon={item.icon}
              label={item.label}
              helper={item.helper}
              onClick={() => setTab(item.key)}
            />
          ))}
        </section>

        <section className="relative z-10">
          {tab === 'preferences' && (
            <ScrollReveal>
              <div className="overflow-hidden border border-primary/10 bg-base-100/92 shadow-[0_18px_50px_rgba(0,27,80,0.08)] rounded-[28px_6px_28px_6px]">
                <div className="h-1 bg-secondary" />
                <div className="p-5 sm:p-6">
                  <PanelHeader
                    icon={Palette}
                    eyebrow="Preferences"
                    title="Appearance and locale"
                    description="Choose the visual mode and default regional hints for your alumni workspace."
                  />

                  <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {[
                        { value: 'light' as const, label: 'Light', icon: Sun, description: 'Bright interface for daytime work.' },
                        { value: 'dark' as const, label: 'Dark', icon: Moon, description: 'Dimmer interface for low-light use.' },
                      ].map((option) => {
                        const Icon = option.icon
                        const active = theme === option.value
                        return (
                          <button
                            key={option.value}
                            type="button"
                            className={`flex min-h-44 flex-col items-start border p-5 text-left transition-all rounded-[24px_4px_24px_4px] ${
                              active ? 'border-primary bg-primary/7 shadow-[0_12px_28px_rgba(0,27,80,0.08)]' : 'border-primary/10 bg-base-100 hover:border-primary/20'
                            }`}
                            onClick={() => setTheme(option.value)}
                          >
                            <span className={`grid h-12 w-12 place-items-center rounded-[16px_3px_16px_3px] ${active ? 'bg-primary text-primary-content' : 'bg-primary/8 text-primary'}`}>
                              <Icon className="h-5 w-5" />
                            </span>
                            <span className="mt-5 text-lg font-bold">{option.label}</span>
                            <span className="mt-2 text-sm leading-relaxed text-base-content/54">{option.description}</span>
                            <span className="mt-auto pt-5 text-xs font-bold text-primary">{active ? 'Current theme' : 'Set theme'}</span>
                          </button>
                        )
                      })}
                    </div>

                    <div className="grid gap-4">
                      <div className="border border-primary/10 bg-base-100/88 p-4 rounded-[22px_4px_22px_4px]">
                        <div className="mb-4 flex items-center gap-3">
                          <span className="grid h-10 w-10 place-items-center bg-primary/8 text-primary rounded-[14px_3px_14px_3px]">
                            <Languages className="h-4 w-4" />
                          </span>
                          <div>
                            <p className="text-sm font-bold">Language</p>
                            <p className="text-xs text-base-content/45">More languages coming soon</p>
                          </div>
                        </div>
                        <select className={selectCls} defaultValue="en">
                          <option value="en">English</option>
                          <option value="tw">Twi</option>
                          <option value="dag">Dagaare</option>
                        </select>
                      </div>

                      <div className="border border-primary/10 bg-base-100/88 p-4 rounded-[22px_4px_22px_4px]">
                        <div className="mb-4 flex items-center gap-3">
                          <span className="grid h-10 w-10 place-items-center bg-primary/8 text-primary rounded-[14px_3px_14px_3px]">
                            <Globe2 className="h-4 w-4" />
                          </span>
                          <div>
                            <p className="text-sm font-bold">Time zone</p>
                            <p className="text-xs text-base-content/45">Used for date and event context</p>
                          </div>
                        </div>
                        <select className={selectCls} defaultValue="GMT">
                          <option value="GMT">GMT (Ghana)</option>
                          <option value="GMT+1">GMT+1 (West Africa)</option>
                          <option value="GMT-5">GMT-5 (US Eastern)</option>
                          <option value="GMT+1:CET">CET (Central Europe)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          )}

          {tab === 'password' && (
            <ScrollReveal>
              <div className="overflow-hidden border border-primary/10 bg-base-100/92 shadow-[0_18px_50px_rgba(0,27,80,0.08)] rounded-[28px_6px_28px_6px]">
                <div className="h-1 bg-secondary" />
                <div className="p-5 sm:p-6">
                  <PanelHeader
                    icon={KeyRound}
                    eyebrow="Security"
                    title="Change password"
                    description="Update your password with your current credential. Keep it unique to this account."
                  />

                  {passwordSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 flex min-h-12 items-center gap-3 border border-success/15 bg-success/10 px-4 py-3 text-sm font-bold text-success rounded-[18px_4px_18px_4px]"
                    >
                      <CheckCircle2 className="h-5 w-5" />
                      Password updated successfully.
                    </motion.div>
                  )}

                  <form onSubmit={handleSubmit(onPasswordSubmit)} className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
                    <div className="grid gap-4">
                      <PasswordInput
                        label="Current password"
                        icon={Lock}
                        visible={showPasswords.current}
                        onToggle={() => setShowPasswords((prev) => ({ ...prev, current: !prev.current }))}
                        error={errors.currentPassword?.message}
                        {...register('currentPassword')}
                      />
                      <PasswordInput
                        label="New password"
                        icon={KeyRound}
                        placeholder="At least 8 characters"
                        visible={showPasswords.new}
                        onToggle={() => setShowPasswords((prev) => ({ ...prev, new: !prev.new }))}
                        error={errors.newPassword?.message}
                        {...register('newPassword')}
                      />
                      <PasswordInput
                        label="Confirm new password"
                        icon={KeyRound}
                        visible={showPasswords.confirm}
                        onToggle={() => setShowPasswords((prev) => ({ ...prev, confirm: !prev.confirm }))}
                        error={errors.confirmPassword?.message}
                        {...register('confirmPassword')}
                      />
                    </div>

                    <div className="flex flex-col justify-between gap-5 border border-primary/10 bg-base-200/45 p-5 rounded-[22px_4px_22px_4px]">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-secondary">Password guide</p>
                        <ul className="mt-4 space-y-3 text-sm font-semibold leading-relaxed text-base-content/58">
                          <li>Use at least 8 characters.</li>
                          <li>Avoid reusing old passwords.</li>
                          <li>Keep the new password private.</li>
                        </ul>
                      </div>

                      <button type="submit" className="btn btn-primary min-h-11 w-full gap-2" disabled={passwordSaving}>
                        {passwordSaving ? (
                          <span className="h-4 w-28 animate-pulse bg-primary-content/35" />
                        ) : (
                          <>
                            Update password
                            <Save className="h-4 w-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </ScrollReveal>
          )}

          {tab === 'notifications' && (
            <ScrollReveal>
              <div className="overflow-hidden border border-primary/10 bg-base-100/92 shadow-[0_18px_50px_rgba(0,27,80,0.08)] rounded-[28px_6px_28px_6px]">
                <div className="h-1 bg-secondary" />
                <div className="flex min-h-[34rem] flex-col p-5 sm:p-6">
                  <PanelHeader
                    icon={Bell}
                    eyebrow="Notifications"
                    title="Email notification routing"
                    description="Choose which association updates should reach your inbox."
                  />

                  <div className="mt-6 grid gap-3 md:grid-cols-2">
                    {[
                      { key: 'emailEvents', label: 'Events & gatherings', desc: 'Upcoming events and RSVP updates' },
                      { key: 'emailNews', label: 'News & announcements', desc: 'Latest UPOSA news and notices' },
                      { key: 'emailForum', label: 'Forum replies', desc: 'Replies to your forum posts' },
                      { key: 'emailPolls', label: 'Polls & elections', desc: 'New votes and ballot windows' },
                      { key: 'emailDues', label: 'Dues reminders', desc: 'Outstanding dues and payment prompts' },
                      { key: 'emailMentorship', label: 'Mentorship requests', desc: 'Mentorship activity and responses' },
                    ].map((item) => (
                      <ToggleRow
                        key={item.key}
                        label={item.label}
                        description={item.desc}
                        checked={notifications[item.key as keyof typeof notifications]}
                        onChange={(checked) => setNotifications((prev) => ({ ...prev, [item.key]: checked }))}
                      />
                    ))}
                  </div>

                  <div className="mt-auto flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs font-semibold leading-relaxed text-base-content/42">
                      {enabledNotifications} of 6 email channels are currently enabled.
                    </p>
                    <button type="button" className="btn btn-primary min-h-11 gap-2 sm:min-w-48" onClick={handleSaveNotifications}>
                      Save preferences
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          )}

          {tab === 'privacy' && (
            <ScrollReveal>
              <PrivacyDataPanel />
            </ScrollReveal>
          )}
        </section>
      </div>
    </PageTransition>
  )
}
