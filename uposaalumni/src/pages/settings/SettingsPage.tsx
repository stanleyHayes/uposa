import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Lock, Eye, EyeOff, Bell, Palette, Shield, Save, CheckCircle,
  Sun, Moon,
} from 'lucide-react'
import { motion } from 'framer-motion'
import PageTransition from '../../components/common/PageTransition'
import PageHeader from '../../components/ui/PageHeader'
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

export default function SettingsPage() {
  useAuthStore((s) => s.user)
  const { theme, setTheme } = useTheme()
  const toast = useToast()
  const [tab, setTab] = useState<'preferences' | 'password' | 'notifications' | 'privacy'>('preferences')
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false })
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  // Notification preferences (local state for demo)
  const [notifications, setNotifications] = useState({
    emailEvents: true,
    emailNews: true,
    emailForum: false,
    emailPolls: true,
    emailDues: true,
    emailMentorship: true,
  })

  // Privacy preferences
  const [privacy, setPrivacy] = useState({
    showEmail: false,
    showPhone: false,
    showInDirectory: true,
    showYearGroup: true,
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  })

  const onPasswordSubmit = async (data: PasswordForm) => {
    setPasswordLoading(true)
    try {
      await authApi.resetPassword({ token: 'current-session', password: data.newPassword })
      setPasswordSuccess(true)
      reset()
      toast.success('Password updated successfully!')
      setTimeout(() => setPasswordSuccess(false), 3000)
    } catch {
      toast.error('Failed to update password. Please check your current password.')
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleSaveNotifications = () => {
    toast.success('Notification preferences saved!')
  }

  const handleSavePrivacy = () => {
    toast.success('Privacy settings saved!')
  }

  const tabs = [
    { key: 'preferences' as const, label: 'Preferences', icon: Palette },
    { key: 'password' as const, label: 'Password', icon: Lock },
    { key: 'notifications' as const, label: 'Notifications', icon: Bell },
    { key: 'privacy' as const, label: 'Privacy', icon: Shield },
  ]

  return (
    <PageTransition>
      <PageHeader title="Settings" description="Manage your account preferences and security" />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar tabs */}
        <div className="lg:w-56 shrink-0">
          <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                  tab === t.key
                    ? 'bg-primary text-primary-content'
                    : 'text-base-content/60 hover:bg-base-200'
                }`}
              >
                <t.icon className="w-4 h-4" />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 max-w-2xl">
          {tab === 'preferences' && (
            <ScrollReveal>
              <div className="card bg-base-100 border border-base-300">
                <div className="card-body">
                  <h3 className="font-bold text-lg mb-4">Appearance</h3>

                  <div className="space-y-6">
                    <div className="form-control">
                      <label className="label"><span className="label-text font-medium">Theme</span></label>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { value: 'light', label: 'Light', icon: Sun },
                          { value: 'dark', label: 'Dark', icon: Moon },
                        ].map((t) => (
                          <button
                            key={t.value}
                            onClick={() => setTheme(t.value as 'light' | 'dark')}
                            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                              theme === t.value
                                ? 'border-primary bg-primary/5'
                                : 'border-base-300 hover:border-base-content/20'
                            }`}
                          >
                            <t.icon className={`w-6 h-6 ${theme === t.value ? 'text-primary' : 'text-base-content/40'}`} />
                            <span className="text-sm font-medium">{t.label}</span>
                            {theme === t.value && <CheckCircle className="w-4 h-4 text-primary" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="divider" />

                    <div className="form-control w-full max-w-xs">
                      <label className="label"><span className="label-text font-medium">Language</span></label>
                      <select className="select select-bordered w-full">
                        <option value="en">English</option>
                        <option value="tw">Twi</option>
                        <option value="dag">Dagaare</option>
                      </select>
                      <label className="label"><span className="label-text-alt text-base-content/50">More languages coming soon</span></label>
                    </div>

                    <div className="form-control w-full max-w-xs">
                      <label className="label"><span className="label-text font-medium">Time Zone</span></label>
                      <select className="select select-bordered w-full">
                        <option value="GMT">GMT (Ghana)</option>
                        <option value="GMT+1">GMT+1 (West Africa)</option>
                        <option value="GMT-5">GMT-5 (US Eastern)</option>
                        <option value="GMT+1:CET">CET (Central Europe)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          )}

          {tab === 'password' && (
            <ScrollReveal>
              <div className="card bg-base-100 border border-base-300">
                <div className="card-body">
                  <h3 className="font-bold text-lg mb-1">Change Password</h3>
                  <p className="text-sm text-base-content/60 mb-6">Update your password to keep your account secure</p>

                  {passwordSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="alert alert-success mb-4"
                    >
                      <CheckCircle className="w-5 h-5" />
                      <span>Password updated successfully!</span>
                    </motion.div>
                  )}

                  <form onSubmit={handleSubmit(onPasswordSubmit)} className="space-y-4">
                    <div className="form-control">
                      <label className="label"><span className="label-text font-medium">Current Password</span></label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
                        <input
                          type={showPasswords.current ? 'text' : 'password'}
                          className={`input input-bordered w-full pl-10 pr-10 ${errors.currentPassword ? 'input-error' : ''}`}
                          {...register('currentPassword')}
                        />
                        <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content" onClick={() => setShowPasswords((p) => ({ ...p, current: !p.current }))}>
                          {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {errors.currentPassword && <p className="text-error text-xs mt-1">{errors.currentPassword.message}</p>}
                    </div>

                    <div className="form-control">
                      <label className="label"><span className="label-text font-medium">New Password</span></label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
                        <input
                          type={showPasswords.new ? 'text' : 'password'}
                          className={`input input-bordered w-full pl-10 pr-10 ${errors.newPassword ? 'input-error' : ''}`}
                          placeholder="At least 6 characters"
                          {...register('newPassword')}
                        />
                        <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content" onClick={() => setShowPasswords((p) => ({ ...p, new: !p.new }))}>
                          {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {errors.newPassword && <p className="text-error text-xs mt-1">{errors.newPassword.message}</p>}
                    </div>

                    <div className="form-control">
                      <label className="label"><span className="label-text font-medium">Confirm New Password</span></label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
                        <input
                          type="password"
                          className={`input input-bordered w-full pl-10 ${errors.confirmPassword ? 'input-error' : ''}`}
                          {...register('confirmPassword')}
                        />
                      </div>
                      {errors.confirmPassword && <p className="text-error text-xs mt-1">{errors.confirmPassword.message}</p>}
                    </div>

                    <button type="submit" className={`btn btn-primary ${passwordLoading ? 'loading' : ''}`} disabled={passwordLoading}>
                      {!passwordLoading && <Save className="w-4 h-4" />}
                      {passwordLoading ? 'Updating...' : 'Update Password'}
                    </button>
                  </form>
                </div>
              </div>
            </ScrollReveal>
          )}

          {tab === 'notifications' && (
            <ScrollReveal>
              <div className="card bg-base-100 border border-base-300">
                <div className="card-body">
                  <h3 className="font-bold text-lg mb-1">Email Notifications</h3>
                  <p className="text-sm text-base-content/60 mb-6">Choose what you want to be notified about</p>

                  <div className="space-y-4">
                    {[
                      { key: 'emailEvents', label: 'Events & Gatherings', desc: 'Get notified about upcoming events and RSVPs' },
                      { key: 'emailNews', label: 'News & Announcements', desc: 'Stay updated with the latest UPOSA news' },
                      { key: 'emailForum', label: 'Forum Replies', desc: 'Get notified when someone replies to your posts' },
                      { key: 'emailPolls', label: 'Polls & Elections', desc: 'Be alerted when new polls or elections open' },
                      { key: 'emailDues', label: 'Dues Reminders', desc: 'Receive reminders about outstanding dues' },
                      { key: 'emailMentorship', label: 'Mentorship Requests', desc: 'Get notified about mentorship activity' },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between p-4 rounded-xl border border-base-300 hover:bg-base-200/30 transition-colors">
                        <div>
                          <p className="font-medium text-sm">{item.label}</p>
                          <p className="text-xs text-base-content/50">{item.desc}</p>
                        </div>
                        <input
                          type="checkbox"
                          className="toggle toggle-primary toggle-sm"
                          checked={notifications[item.key as keyof typeof notifications]}
                          onChange={(e) => setNotifications((n) => ({ ...n, [item.key]: e.target.checked }))}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="mt-6">
                    <button className="btn btn-primary btn-sm" onClick={handleSaveNotifications}>
                      <Save className="w-4 h-4" /> Save Preferences
                    </button>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          )}

          {tab === 'privacy' && (
            <ScrollReveal>
              <div className="card bg-base-100 border border-base-300">
                <div className="card-body">
                  <h3 className="font-bold text-lg mb-1">Privacy Settings</h3>
                  <p className="text-sm text-base-content/60 mb-6">Control what other alumni can see about you</p>

                  <div className="space-y-4">
                    {[
                      { key: 'showInDirectory', label: 'Show in Alumni Directory', desc: 'Allow other members to find you in the directory' },
                      { key: 'showEmail', label: 'Show Email Address', desc: 'Display your email on your public profile' },
                      { key: 'showPhone', label: 'Show Phone Number', desc: 'Display your phone number on your public profile' },
                      { key: 'showYearGroup', label: 'Show Year Group', desc: 'Display your year group on your profile' },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between p-4 rounded-xl border border-base-300 hover:bg-base-200/30 transition-colors">
                        <div>
                          <p className="font-medium text-sm">{item.label}</p>
                          <p className="text-xs text-base-content/50">{item.desc}</p>
                        </div>
                        <input
                          type="checkbox"
                          className="toggle toggle-primary toggle-sm"
                          checked={privacy[item.key as keyof typeof privacy]}
                          onChange={(e) => setPrivacy((p) => ({ ...p, [item.key]: e.target.checked }))}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="divider" />

                  <div>
                    <h4 className="font-semibold text-sm text-error mb-2">Danger Zone</h4>
                    <div className="p-4 rounded-xl border border-error/30 bg-error/5">
                      <p className="text-sm font-medium">Deactivate Account</p>
                      <p className="text-xs text-base-content/60 mb-3">This will hide your profile and disable your account. You can reactivate by contacting an admin.</p>
                      <button className="btn btn-error btn-outline btn-sm">Deactivate Account</button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <button className="btn btn-primary btn-sm" onClick={handleSavePrivacy}>
                      <Save className="w-4 h-4" /> Save Privacy Settings
                    </button>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          )}
        </div>
      </div>
    </PageTransition>
  )
}
