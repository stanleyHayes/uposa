// @ts-nocheck
import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, ArrowLeft, CheckCircle2, AlertCircle, Lock } from 'lucide-react'
import AuthLayout from '../../components/layout/AuthLayout'
import Button from '../../components/ui/Button'

const resetSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Must contain at least one number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

type ResetForm = z.infer<typeof resetSchema>

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [resetError, setResetError] = useState('')
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetForm>({ resolver: zodResolver(resetSchema) })

  if (!token) {
    return (
      <AuthLayout>
        <div className="text-center py-4">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center mb-5">
            <AlertCircle size={28} className="text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-2">
            Invalid reset link
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
            This password reset link is invalid or has expired. Please request a new one.
          </p>
          <div className="mt-6">
            <Link
              to="/forgot-password"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-500 hover:text-brand-600 dark:text-brand-300 transition-colors"
            >
              Request new reset link
            </Link>
          </div>
        </div>
      </AuthLayout>
    )
  }

  const onSubmit = async ({ password }: ResetForm) => {
    setResetError('')
    try {
      // TODO: call API to reset password
      // await api.post('/auth/admin/reset-password', { token, password })
      setSuccess(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch {
      setResetError('Failed to reset password. The link may have expired.')
    }
  }

  if (success) {
    return (
      <AuthLayout>
        <div className="text-center py-4">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-green-50 dark:bg-green-950/30 flex items-center justify-center mb-5">
            <CheckCircle2 size={28} className="text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-2">
            Password updated
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Redirecting you to sign in...
          </p>
          <div className="mt-6">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-500 hover:text-brand-600 dark:text-brand-300 transition-colors"
            >
              <ArrowLeft size={14} />
              Go to sign in
            </Link>
          </div>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Set new password"
      subtitle="Choose a strong password for your account"
    >
      {resetError && (
        <div className="mb-6 flex items-start gap-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 px-4 py-3.5">
          <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-400">{resetError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            New Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              className={`block w-full rounded-lg border px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 dark:bg-dark-hover shadow-sm pr-10 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-shadow ${
                errors.password
                  ? 'border-red-400 focus:ring-red-400'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-red-600 dark:text-red-400">{errors.password.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Confirm Password
          </label>
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              placeholder="Re-enter your password"
              autoComplete="new-password"
              className={`block w-full rounded-lg border px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 dark:bg-dark-hover shadow-sm pr-10 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-shadow ${
                errors.confirmPassword
                  ? 'border-red-400 focus:ring-red-400'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
              {...register('confirmPassword')}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              tabIndex={-1}
            >
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-red-600 dark:text-red-400">{errors.confirmPassword.message}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full"
          size="lg"
          loading={isSubmitting}
          rightIcon={<Lock size={16} />}
        >
          Reset Password
        </Button>
      </form>

      <div className="mt-6 text-center">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
        >
          <ArrowLeft size={14} />
          Back to sign in
        </Link>
      </div>
    </AuthLayout>
  )
}
