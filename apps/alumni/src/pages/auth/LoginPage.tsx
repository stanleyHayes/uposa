import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, LogIn, Mail, Lock, ArrowRight, Vote, Users, MessageSquare, Wallet } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { authApi } from '../../api/services'
import { useAuthStore } from '../../stores/auth.store'
import { useToast } from '../../hooks/useToast'
import { GraduationCapIllustration } from '../../components/auth/AuthGraphics'
import SEO from '../../components/common/SEO'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type FormData = z.infer<typeof schema>

const features = [
  { icon: Vote, label: 'Elections & Polls' },
  { icon: Users, label: 'Alumni Directory' },
  { icon: MessageSquare, label: 'Forum' },
  { icon: Wallet, label: 'Dues & Donations' },
]

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

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const res = await authApi.login(data)
      setAuth(res.data.data.token, res.data.data.refreshToken ?? null, res.data.data.member)
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
    <>
    <SEO title="Sign In" description="Sign in to your UPOSA alumni account to access the member portal." />
    <div className="min-h-screen flex bg-base-200">
      {/* Left: Branding panel */}
      <div className="hidden lg:flex lg:w-5/12 flex-col justify-between p-12 text-primary bg-[#FFF8DC] relative">
        <div>
          <GraduationCapIllustration />
        </div>

        <div>
          <h2 className="text-4xl font-bold leading-tight mb-4">
            Welcome back,<br />Legit Elite.
          </h2>
          <p className="text-primary/60 text-lg leading-relaxed max-w-sm">
            Stay connected with your alma mater, contribute to ongoing projects, and network with fellow alumni.
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-2 gap-3">
          {features.map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#001B50]/5 border border-[#001B50]/10"
            >
              <div className="w-8 h-8 rounded-lg bg-[#001B50]/10 flex items-center justify-center shrink-0">
                <f.icon size={16} className="text-[#001B50]" />
              </div>
              <span className="text-sm font-medium text-[#001B50]/70">{f.label}</span>
            </motion.div>
          ))}
        </div>

        {/* Wavy edge divider */}
        <svg className="absolute top-0 right-0 h-full w-12 translate-x-[1px]" viewBox="0 0 48 800" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 0 C24 0, 48 50, 24 100 C0 150, 48 200, 24 250 C0 300, 48 350, 24 400 C0 450, 48 500, 24 550 C0 600, 48 650, 24 700 C0 750, 24 800, 48 800 L48 0 Z" className="fill-base-100" />
        </svg>
      </div>

      {/* Right: Form panel */}
      <div className="flex-1 flex items-center justify-center bg-base-100">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md px-6 sm:px-10"
        >
          {/* Logo on top of form */}
          <div className="flex items-center gap-3 mb-10">
            <img src="/logo.png" alt="UPOSA" className="w-11 h-11 rounded-lg" />
            <div>
              <span className="font-bold text-lg block leading-tight">UPOSA</span>
              <span className="text-xs text-base-content/40">The Legit Elites</span>
            </div>
          </div>

          <h2 className="text-3xl font-bold mb-2">Sign In</h2>
          <p className="text-base-content/50 mb-8">Enter your credentials to continue</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="form-control">
              <label className="label pb-1"><span className="label-text font-medium text-sm">Email</span></label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/30" />
                <input
                  type="email"
                  className={`input input-bordered w-full pl-11 h-12 bg-base-200/50 border-base-300 focus:border-primary focus:bg-base-100 transition-colors ${errors.email ? 'input-error' : ''}`}
                  placeholder="you@example.com"
                  {...register('email')}
                />
              </div>
              <AnimatePresence>
                {errors.email && (
                  <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-error text-xs mt-1.5">{errors.email.message}</motion.p>
                )}
              </AnimatePresence>
            </div>

            <div className="form-control">
              <label className="label pb-1">
                <span className="label-text font-medium text-sm">Password</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/30" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={`input input-bordered w-full pl-11 pr-11 h-12 bg-base-200/50 border-base-300 focus:border-primary focus:bg-base-100 transition-colors ${errors.password ? 'input-error' : ''}`}
                  placeholder="Enter your password"
                  {...register('password')}
                />
                <button
                  type="button"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-base-content/30 hover:text-base-content transition-colors"
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
            </div>

            <motion.button
              type="submit"
              className={`btn btn-primary w-full h-12 text-base gap-2 ${loading ? 'loading' : ''}`}
              disabled={loading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.97 }}
            >
              {loading ? 'Signing in...' : <>Sign In <LogIn className="w-4 h-4" /></>}
            </motion.button>

            <div className="text-center mt-3">
              <Link to="/forgot-password" className="text-xs text-base-content/40 hover:text-primary transition-colors">
                Forgot your password?
              </Link>
            </div>
          </form>

          {/* Mobile features */}
          <div className="lg:hidden grid grid-cols-2 gap-2 mt-8">
            {features.map((f) => (
              <div key={f.label} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-base-200/50 text-xs text-base-content/60">
                <f.icon size={14} className="text-primary shrink-0" />
                {f.label}
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-base-content/50 mt-8">
            Don't have an account?{' '}
            <Link to="/register" className="link link-primary font-semibold inline-flex items-center gap-1">
              Create one <ArrowRight className="w-3 h-3" />
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
    </>
  )
}
