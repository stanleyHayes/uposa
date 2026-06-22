import { useState } from 'react'
import { useNavigate, Navigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, ArrowRight, AlertCircle, LockKeyhole, Mail, ShieldCheck } from 'lucide-react'
import AuthLayout from '../../components/layout/AuthLayout'
import Button from '../../components/ui/Button'
import { useAuth } from '../../hooks/useAuth'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, isAuthenticated } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [authError, setAuthError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const onSubmit = async (data: LoginForm) => {
    setAuthError('')
    const result = await login(data.email, data.password)
    if (result.success) {
      navigate('/dashboard', { replace: true })
    } else {
      setAuthError(result.error ?? 'Login failed')
    }
  }

  const fieldBase =
    'block h-12 w-full border bg-cream-50/80 px-11 text-sm font-semibold text-gray-900 shadow-sm outline-none transition focus:border-brand-600 focus:bg-white focus:ring-2 focus:ring-brand-500/15 dark:bg-dark-hover dark:text-gray-100 dark:focus:bg-dark-surface'

  return (
    <AuthLayout
      title="Welcome back."
      subtitle="Sign in to manage the association desk."
    >
      {authError && (
        <div className="mb-5 flex items-start gap-3 border border-red-200 bg-red-50 px-4 py-3.5 dark:border-red-900/50 dark:bg-red-950/30">
          <AlertCircle size={17} className="mt-0.5 shrink-0 text-red-500" />
          <div>
            <p className="text-sm font-bold text-red-700 dark:text-red-300">Access denied</p>
            <p className="mt-0.5 text-sm text-red-700/80 dark:text-red-300/75">{authError}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="admin-email" className="text-sm font-bold text-gray-800 dark:text-gray-200">
            Email address
          </label>
          <div className="relative">
            <Mail size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-brand-950/[0.35] dark:text-cream-100/[0.35]" />
            <input
              id="admin-email"
              type="email"
              placeholder="admin@uposa.org"
              autoComplete="email"
              className={`${fieldBase} ${errors.email ? 'border-red-400 focus:border-red-500 focus:ring-red-500/15' : 'border-brand-950/[0.12] dark:border-white/10'}`}
              {...register('email')}
            />
          </div>
          {errors.email && (
            <p className="text-xs font-semibold text-red-600 dark:text-red-400">{errors.email.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="admin-password" className="text-sm font-bold text-gray-800 dark:text-gray-200">
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-xs font-bold text-brand-700 transition-colors hover:text-brand-950 dark:text-cream-300 dark:hover:text-cream-100"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <LockKeyhole size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-brand-950/[0.35] dark:text-cream-100/[0.35]" />
            <input
              id="admin-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              autoComplete="current-password"
              className={`${fieldBase} pr-12 ${errors.password ? 'border-red-400 focus:border-red-500 focus:ring-red-500/15' : 'border-brand-950/[0.12] dark:border-white/10'}`}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center text-gray-400 transition-colors hover:text-brand-800 dark:hover:text-cream-200"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs font-semibold text-red-600 dark:text-red-400">{errors.password.message}</p>
          )}
        </div>

        <div className="grid gap-3 border border-brand-950/10 bg-cream-50/70 p-3 dark:border-white/10 dark:bg-white/[0.035] sm:grid-cols-[40px_1fr]">
          <span className="grid h-10 w-10 place-items-center bg-brand-950 text-cream-100 dark:bg-cream-100 dark:text-brand-950">
            <ShieldCheck size={17} />
          </span>
          <p className="text-xs leading-5 text-gray-500 dark:text-gray-400">
            Use your assigned administrator account. Activity in this workspace may be reviewed by the secretariat.
          </p>
        </div>

        <Button
          type="submit"
          variant="accent"
          className="h-12 w-full"
          size="lg"
          disabled={isSubmitting}
          rightIcon={!isSubmitting && <ArrowRight size={18} />}
        >
          {isSubmitting ? (
            <span className="h-4 w-28 animate-pulse bg-brand-950/20" aria-label="Signing in" />
          ) : (
            'Sign in'
          )}
        </Button>
      </form>
    </AuthLayout>
  )
}
