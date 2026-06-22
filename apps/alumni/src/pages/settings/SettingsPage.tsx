import { useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  CheckCircle2,
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
  UserCircle,
  type LucideIcon,
} from 'lucide-react'
import { motion } from 'framer-motion'
import PageTransition from '../../components/common/PageTransition'
import ScrollReveal from '../../components/common/ScrollReveal'
import { useAuthStore } from '../../stores/auth.store'
import { useTheme } from '../../hooks/useTheme'
import { useToast } from '../../hooks/useToast'
import { authApi } from '../../api/services'

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
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
  { key: 'privacy', label: 'Privacy', helper: 'Directory visibility', icon: Shield },
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

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user)
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

  const [privacy, setPrivacy] = useState({
    showEmail: false,
    showPhone: false,
    showInDirectory: true,
    showYearGroup: true,
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  })

  const enabledNotifications = Object.values(notifications).filter(Boolean).length
  const visiblePrivacyItems = Object.values(privacy).filter(Boolean).length

  const onPasswordSubmit = async (data: PasswordForm) => {
    setPasswordSaving(true)
    try {
      await authApi.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      })
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

  const handleSavePrivacy = () => {
    toast.success('Privacy settings saved!')
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
              <StatTile icon={Shield} label="Privacy" value={`${visiblePrivacyItems}/4`} detail="Visible profile fields" tone="bg-success/12 text-success" />
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
                        placeholder="At least 6 characters"
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
                          <li>Use at least 6 characters.</li>
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
              <div className="overflow-hidden border border-primary/10 bg-base-100/92 shadow-[0_18px_50px_rgba(0,27,80,0.08)] rounded-[28px_6px_28px_6px]">
                <div className="h-1 bg-secondary" />
                <div className="flex min-h-[34rem] flex-col p-5 sm:p-6">
                  <PanelHeader
                    icon={Shield}
                    eyebrow="Privacy"
                    title="Directory visibility"
                    description="Control what other alumni can see when they view your member profile."
                  />

                  <div className="mt-6 grid gap-3 md:grid-cols-2">
                    {[
                      { key: 'showInDirectory', label: 'Show in alumni directory', desc: 'Allow members to find you in directory search' },
                      { key: 'showEmail', label: 'Show email address', desc: 'Display your email on your public profile' },
                      { key: 'showPhone', label: 'Show phone number', desc: 'Display your phone number on your public profile' },
                      { key: 'showYearGroup', label: 'Show year group', desc: 'Display your year group on your profile' },
                    ].map((item) => (
                      <ToggleRow
                        key={item.key}
                        label={item.label}
                        description={item.desc}
                        checked={privacy[item.key as keyof typeof privacy]}
                        onChange={(checked) => setPrivacy((prev) => ({ ...prev, [item.key]: checked }))}
                      />
                    ))}
                  </div>

                  <div className="mt-5 border border-error/20 bg-error/8 p-4 rounded-[22px_4px_22px_4px]">
                    <div className="flex items-start gap-3">
                      <span className="grid h-11 w-11 shrink-0 place-items-center bg-error/12 text-error rounded-[15px_3px_15px_3px]">
                        <AlertTriangle className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-error">Deactivate account</p>
                        <p className="mt-1 text-xs leading-relaxed text-base-content/58">
                          This hides your profile and disables your account. Reactivation requires admin support.
                        </p>
                      </div>
                      <button type="button" className="btn btn-outline btn-error btn-sm min-h-10 shrink-0">Deactivate</button>
                    </div>
                  </div>

                  <div className="mt-auto flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs font-semibold leading-relaxed text-base-content/42">
                      {visiblePrivacyItems} of 4 profile visibility options are enabled.
                    </p>
                    <button type="button" className="btn btn-primary min-h-11 gap-2 sm:min-w-48" onClick={handleSavePrivacy}>
                      Save privacy
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          )}
        </section>
      </div>
    </PageTransition>
  )
}
