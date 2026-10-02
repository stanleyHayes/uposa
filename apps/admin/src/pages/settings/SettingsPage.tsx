import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  User,
  AlertTriangle,
  Building2,
  Bell,
  Shield,
  Lock,
  KeyRound,
} from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { useAuth } from '../../hooks/useAuth'
import { useActivityStore } from '../../stores/activity.store'
import { useToast } from '../../hooks/useToast'
import { formatDate } from '../../utils/formatters'
import client, { ADMIN_REFRESH_TOKEN_KEY, ADMIN_TOKEN_KEY } from '../../api/client'

type TabKey = 'profile' | 'organization' | 'notifications' | 'danger'

const accountSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email required'),
})

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type AccountForm = z.infer<typeof accountSchema>
type PasswordForm = z.infer<typeof passwordSchema>

function getNotifDefault(key: string, fallback: boolean): boolean {
  const stored = localStorage.getItem(`uposa_notif_${key}`)
  if (stored === null) return fallback
  return stored === 'true'
}

function ToggleSwitch({ label, description, checked, onChange }: {
  label: string
  description?: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-50 dark:border-dark-border last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</p>
        {description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${
          checked ? 'bg-brand-600' : 'bg-gray-200 dark:bg-dark-hover'
        }`}
        role="switch"
        aria-checked={checked}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )
}

export default function SettingsPage() {
  const { currentUser, updateCurrentUser } = useAuth()
  const { clearActivity } = useActivityStore()
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState<TabKey>('profile')
  const [clearActivityOpen, setClearActivityOpen] = useState(false)

  // Notification prefs
  const [notifRegistration, setNotifRegistration] = useState(() => getNotifDefault('registration', true))
  const [notifContact, setNotifContact] = useState(() => getNotifDefault('contact', true))
  const [notifElection, setNotifElection] = useState(() => getNotifDefault('election', false))
  const [notifDashboard, setNotifDashboard] = useState(() => getNotifDefault('dashboard', true))

  const saveNotif = (key: string, value: boolean) => {
    localStorage.setItem(`uposa_notif_${key}`, String(value))
  }

  const { register: registerAccount, handleSubmit: handleAccountSubmit, formState: { errors: accountErrors, isSubmitting: isAccountSubmitting, isDirty: isAccountDirty } } = useForm<AccountForm>({
    values: { name: currentUser?.name ?? '', email: currentUser?.email ?? '' },
    resolver: zodResolver(accountSchema),
  })

  const { register: registerPassword, handleSubmit: handlePasswordSubmit, reset: resetPassword, formState: { errors: passwordErrors, isSubmitting: isPasswordSubmitting } } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  })

  const onAccountSave = async (data: AccountForm) => {
    if (!currentUser) return
    try {
      await client.put('/admin/profile', {
        fullName: data.name,
        email: data.email,
      })
      updateCurrentUser({ name: data.name, email: data.email })
      toast.success('Account updated', 'Your profile has been saved.')
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to update profile'
      toast.error('Error', message)
    }
  }

  const onPasswordSave = async (data: PasswordForm) => {
    if (!currentUser) return
    try {
      const res = await client.put('/admin/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      })
      // The change revokes every earlier session, including this one; keep the
      // fresh tokens or the next refresh would log this admin out.
      const tokens = res.data?.data as { token?: string; refreshToken?: string } | undefined
      if (tokens?.token) localStorage.setItem(ADMIN_TOKEN_KEY, tokens.token)
      if (tokens?.refreshToken) localStorage.setItem(ADMIN_REFRESH_TOKEN_KEY, tokens.refreshToken)
      resetPassword()
      toast.success('Password changed', 'Your password has been updated.')
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to change password'
      toast.error('Error', message)
    }
  }

  const handleClearActivity = () => {
    clearActivity()
    setClearActivityOpen(false)
    toast.success('Activity log cleared')
  }

  const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: 'profile', label: 'Profile', icon: User },
    { key: 'organization', label: 'Organization', icon: Building2 },
    { key: 'notifications', label: 'Notifications', icon: Bell },
    ...(currentUser?.role === 'super_admin' ? [{ key: 'danger' as TabKey, label: 'Danger Zone', icon: Shield }] : []),
  ]

  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.name ?? 'User')}&background=001B50&color=FFF8DC&bold=true&size=128`

  return (
    <div className="page-enter">
      <PageHeader
        title="Settings"
        description="Manage your account and application settings"
        actions={
          <img
            src={avatarUrl}
            alt={currentUser?.name}
            className="w-9 h-9 rounded-full ring-2 ring-brand-100"
          />
        }
      />

      <div className="max-w-3xl">
        {/* Tab Navigation */}
        <div className="flex gap-0 border-b border-gray-200 dark:border-dark-border mb-6">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
                  isActive
                    ? 'border-brand-500 text-brand-500 dark:text-brand-300 dark:border-brand-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300'
                }`}
              >
                <Icon size={15} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Avatar & Role */}
            <div className="admin-card-surface border border-gray-200 dark:border-dark-border shadow-sm p-6">
              <div className="flex items-center gap-4 mb-6">
                <img src={avatarUrl} alt={currentUser?.name} className="w-16 h-16 rounded-full ring-2 ring-brand-100" />
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">{currentUser?.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{currentUser?.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-100 text-brand-700">
                      {currentUser?.role?.replace('_', ' ')}
                    </span>
                    {currentUser?.createdAt && (
                      <span className="text-xs text-gray-400">Member since {formatDate(currentUser.createdAt)}</span>
                    )}
                  </div>
                </div>
              </div>

              <h4 className="text-sm font-bold text-gray-700 mb-4 pl-3 border-l-2 border-brand-500">Edit Profile</h4>
              <form onSubmit={handleAccountSubmit(onAccountSave)} className="space-y-4">
                <Input label="Full Name" error={accountErrors.name?.message} {...registerAccount('name')} />
                <Input label="Email Address" type="email" error={accountErrors.email?.message} {...registerAccount('email')} />
                <div className="flex justify-end pt-2">
                  <Button type="submit" loading={isAccountSubmitting} disabled={!isAccountDirty}>
                    Save Changes
                  </Button>
                </div>
              </form>
            </div>

            {/* Change Password */}
            <div className="admin-card-surface border border-gray-200 dark:border-dark-border shadow-sm p-6">
              <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4 pl-3 border-l-2 border-brand-500 flex items-center gap-2">
                <KeyRound size={14} />
                Change Password
              </h4>
              <form onSubmit={handlePasswordSubmit(onPasswordSave)} className="space-y-4">
                <Input
                  label="Current Password"
                  type="password"
                  error={passwordErrors.currentPassword?.message}
                  {...registerPassword('currentPassword')}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="New Password"
                    type="password"
                    error={passwordErrors.newPassword?.message}
                    {...registerPassword('newPassword')}
                  />
                  <Input
                    label="Confirm Password"
                    type="password"
                    error={passwordErrors.confirmPassword?.message}
                    {...registerPassword('confirmPassword')}
                  />
                </div>
                <div className="flex justify-end pt-2">
                  <Button type="submit" loading={isPasswordSubmitting} variant="secondary">
                    <Lock size={14} className="mr-1" />
                    Update Password
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Organization Tab */}
        {activeTab === 'organization' && (
          <div className="admin-card-surface border border-gray-200 dark:border-dark-border shadow-sm p-6 space-y-6">
            <div className="flex items-center gap-4">
              <img src="/logo.png" alt="UPOSA" className="w-14 h-14 rounded-xl shrink-0" />
              <div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">UPOSA Alumni Association</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">United Past Old Students Association</p>
              </div>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed bg-gray-50 dark:bg-dark-hover rounded-lg p-4 border border-gray-100 dark:border-dark-border">
              UPOSA (United Past Old Students Association) is the official alumni association of the University Practice School.
              We connect alumni across generations, fostering community, professional networking, and giving back to our alma mater.
            </p>

            <div className="grid grid-cols-2 gap-x-8 gap-y-4 pt-2 border-t border-gray-100 dark:border-dark-border">
              {[
                { label: 'Founded', value: '1974' },
                { label: 'Country', value: 'Ghana' },
                { label: 'School', value: 'University Practice School' },
                { label: 'Tagline', value: 'Once a Practician, Always a Practician' },
                { label: 'Website', value: 'www.uposa.org', link: true },
                { label: 'Email', value: 'info@uposa.org' },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide font-medium">{item.label}</p>
                  {item.link ? (
                    <a href={`https://${item.value}`} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-600 mt-0.5 block hover:underline">
                      {item.value}
                    </a>
                  ) : (
                    <p className="text-sm text-gray-900 dark:text-gray-100 mt-0.5">{item.value}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="admin-card-surface border border-gray-200 dark:border-dark-border shadow-sm p-6">
            <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4 pl-3 border-l-2 border-brand-500">Notification Preferences</h4>
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              <ToggleSwitch
                label="Email on new registration"
                description="Receive an email when a new alumni registration is submitted"
                checked={notifRegistration}
                onChange={(v) => { setNotifRegistration(v); saveNotif('registration', v) }}
              />
              <ToggleSwitch
                label="Email on new contact message"
                description="Get notified when a visitor submits a contact form"
                checked={notifContact}
                onChange={(v) => { setNotifContact(v); saveNotif('contact', v) }}
              />
              <ToggleSwitch
                label="Email on election start"
                description="Receive notifications when an election becomes active"
                checked={notifElection}
                onChange={(v) => { setNotifElection(v); saveNotif('election', v) }}
              />
              <ToggleSwitch
                label="Dashboard alerts for pending items"
                description="Show badge alerts for pending approvals and unread messages"
                checked={notifDashboard}
                onChange={(v) => { setNotifDashboard(v); saveNotif('dashboard', v) }}
              />
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">Preferences are saved automatically to your browser.</p>
          </div>
        )}

        {/* Danger Zone Tab */}
        {activeTab === 'danger' && currentUser?.role === 'super_admin' && (
          <div className="space-y-4">
            <div className="admin-card-surface border border-red-200 dark:border-red-900/50 shadow-sm p-6">
              <div className="flex items-start gap-3 mb-5">
                <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-2 shrink-0">
                  <AlertTriangle size={20} className="text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-gray-100">Danger Zone</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    These actions cannot be undone.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-red-100 dark:border-red-900/40 bg-red-50/50 dark:bg-red-900/10">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Clear Activity Log</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Remove the recent-activity history stored in this browser</p>
                </div>
                <Button variant="danger" onClick={() => setClearActivityOpen(true)}>Clear</Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={clearActivityOpen}
        onClose={() => setClearActivityOpen(false)}
        onConfirm={handleClearActivity}
        title="Clear Activity Log"
        message="This will remove the recent-activity history stored in this browser. This cannot be undone."
        confirmLabel="Clear Log"
      />
    </div>
  )
}
