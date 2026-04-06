import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, LogIn, Mail, Lock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { authApi } from '../../api/services'
import { useAuthStore } from '../../stores/auth.store'
import { useToast } from '../../hooks/useToast'
import AuthSidePanel, { GraduationCapIllustration } from '../../components/auth/AuthGraphics'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const setAuth = useAuthStore((s) => s.setAuth)
  const toast = useToast()
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard'

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const DEMO_ACCOUNTS = [
    { email: 'kwame@uposa.org', name: 'Kwame Mensah', yearGroup: 2010, house: 'NKRUMAH' as const, programme: 'SCIENCE' as const },
    { email: 'abena@uposa.org', name: 'Abena Osei', yearGroup: 2015, house: 'VOLTA' as const, programme: 'BUSINESS' as const },
    { email: 'kofi@uposa.org', name: 'Kofi Asante', yearGroup: 2008, house: 'ACKAH' as const, programme: 'GENERAL_ARTS' as const },
  ]

  const handleDemoLogin = (account: typeof DEMO_ACCOUNTS[number]) => {
    setLoading(true)
    setTimeout(() => {
      const demoMember = {
        id: `demo-${account.email}`,
        fullName: account.name,
        email: account.email,
        isVerified: true,
        areaOfExpertise: [],
        isAvailableAsMentor: false,
        isWhatsAppMember: false,
        preferredContributions: [],
        membershipStatus: 'ACTIVE' as const,
        isApproved: true,
        consentGiven: true,
        yearGroup: account.yearGroup,
        house: account.house,
        programme: account.programme,
        createdAt: '2023-01-15T00:00:00Z',
        updatedAt: new Date().toISOString(),
      }
      setAuth('demo-token-' + Date.now(), demoMember)
      toast.success(`Welcome, ${account.name.split(' ')[0]}!`)
      navigate(from, { replace: true })
      setLoading(false)
    }, 800)
  }

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    // Check demo accounts first
    const demo = DEMO_ACCOUNTS.find((a) => a.email === data.email)
    if (demo && data.password === 'demo123') {
      handleDemoLogin(demo)
      return
    }
    try {
      const res = await authApi.login(data)
      setAuth(res.data.data.token, res.data.data.member)
      toast.success('Welcome back!')
      navigate(from, { replace: true })
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Invalid credentials'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full">
      <AuthSidePanel
        title="Welcome Back"
        subtitle="Connect with your fellow alumni, participate in polls, explore job opportunities, and stay updated with the latest UPOSA news."
        illustration={<GraduationCapIllustration />}
        features={[
          'Vote in elections & polls',
          'Access the alumni directory',
          'Join forum discussions',
          'Track your dues & donations',
        ]}
      />

      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12">
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary text-primary-content flex items-center justify-center">
              <span className="text-lg font-black">U</span>
            </div>
            <div>
              <h1 className="text-lg font-bold">UPOSA Alumni</h1>
              <p className="text-xs text-base-content/50">Member Portal</p>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <h2 className="text-3xl font-bold mb-1">Sign In</h2>
            <p className="text-base-content/60 mb-8">Enter your credentials to access your account</p>
          </motion.div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <motion.div
              className="form-control"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <label className="label"><span className="label-text font-medium">Email Address</span></label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
                <input
                  type="email"
                  className={`input input-bordered w-full pl-10 ${errors.email ? 'input-error' : ''}`}
                  placeholder="you@example.com"
                  {...register('email')}
                />
              </div>
              <AnimatePresence>
                {errors.email && (
                  <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-error text-xs mt-1.5">{errors.email.message}</motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            <motion.div
              className="form-control"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <label className="label">
                <span className="label-text font-medium">Password</span>
                <Link to="/forgot-password" className="label-text-alt link link-primary">Forgot password?</Link>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={`input input-bordered w-full pl-10 pr-10 ${errors.password ? 'input-error' : ''}`}
                  placeholder="Enter your password"
                  {...register('password')}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <AnimatePresence>
                {errors.password && (
                  <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-error text-xs mt-1.5">{errors.password.message}</motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            <motion.button
              type="submit"
              className={`btn btn-primary w-full h-12 text-base ${loading ? 'loading' : ''}`}
              disabled={loading}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
            >
              {!loading && <LogIn className="w-5 h-5" />}
              {loading ? 'Signing in...' : 'Sign In'}
            </motion.button>
          </form>

          {/* Demo credentials */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="mt-6"
          >
            <div className="divider text-xs text-base-content/40 my-4">DEMO ACCOUNTS</div>
            <div className="grid gap-2">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  className="flex items-center gap-3 p-3 rounded-xl border border-base-300 hover:border-primary/40 hover:bg-primary/5 transition-all text-left group"
                  onClick={() => handleDemoLogin(account)}
                  disabled={loading}
                >
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-primary">{account.name.split(' ').map(n => n[0]).join('')}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium group-hover:text-primary transition-colors">{account.name}</p>
                    <p className="text-xs text-base-content/50">{account.email} · Class of {account.yearGroup}</p>
                  </div>
                  <LogIn className="w-4 h-4 text-base-content/30 group-hover:text-primary transition-colors shrink-0" />
                </button>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <div className="divider text-xs text-base-content/40 my-6">NEW TO UPOSA?</div>
            <Link to="/register" className="btn btn-outline btn-block h-11">
              Create an Account
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
