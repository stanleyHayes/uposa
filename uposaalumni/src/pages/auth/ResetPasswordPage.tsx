import { useState } from 'react'
import { useSearchParams, Link } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Lock, ArrowLeft, CheckCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { authApi } from '../../api/services'
import { useToast } from '../../hooks/useToast'
import AuthSidePanel, { ShieldIllustration } from '../../components/auth/AuthGraphics'

const schema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

export default function ResetPasswordPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [searchParams] = useSearchParams()
  const toast = useToast()
  const token = searchParams.get('token') || ''

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    if (!token) { toast.error('Invalid reset link'); return }
    setLoading(true)
    try {
      await authApi.resetPassword({ token, password: data.password })
      setSuccess(true)
    } catch {
      toast.error('Failed to reset password. Link may have expired.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full">
      <AuthSidePanel
        title="Secure Your Account"
        subtitle="Choose a strong password to keep your alumni account safe and protected."
        illustration={<ShieldIllustration />}
      />

      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12">
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary text-primary-content flex items-center justify-center">
              <span className="text-sm font-black">U</span>
            </div>
            <span className="font-bold">UPOSA Alumni</span>
          </div>

          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                <motion.div
                  className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.4 }}
                  >
                    <CheckCircle className="w-10 h-10 text-success" />
                  </motion.div>
                </motion.div>
                <h2 className="text-2xl font-bold mb-2">Password Reset!</h2>
                <p className="text-base-content/60 mb-8">
                  Your password has been successfully reset. You can now sign in with your new password.
                </p>
                <Link to="/login" className="btn btn-primary w-full h-11">
                  Continue to Sign In
                </Link>
              </motion.div>
            ) : (
              <motion.div key="form" exit={{ opacity: 0, x: -30 }}>
                <Link to="/login" className="btn btn-ghost btn-sm gap-1 mb-6 -ml-2">
                  <ArrowLeft className="w-4 h-4" /> Back to login
                </Link>

                <div className="mb-8">
                  <h2 className="text-3xl font-bold mb-2">Reset Password</h2>
                  <p className="text-base-content/60">Choose a new password for your account</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <motion.div
                    className="form-control"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <label className="label"><span className="label-text font-medium">New Password</span></label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className={`input input-bordered w-full pl-10 pr-10 ${errors.password ? 'input-error' : ''}`}
                        placeholder="At least 6 characters"
                        {...register('password')}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-error text-xs mt-1.5">{errors.password.message}</p>}
                  </motion.div>

                  <motion.div
                    className="form-control"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <label className="label"><span className="label-text font-medium">Confirm New Password</span></label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
                      <input
                        type="password"
                        className={`input input-bordered w-full pl-10 ${errors.confirmPassword ? 'input-error' : ''}`}
                        placeholder="Repeat your password"
                        {...register('confirmPassword')}
                      />
                    </div>
                    {errors.confirmPassword && <p className="text-error text-xs mt-1.5">{errors.confirmPassword.message}</p>}
                  </motion.div>

                  {/* Password tips */}
                  <motion.div
                    className="bg-base-200/50 rounded-xl p-4 border border-base-300"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <p className="text-xs font-medium text-base-content/70 mb-2">Password tips:</p>
                    <ul className="text-xs text-base-content/50 space-y-1">
                      <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-base-content/30" />Use at least 6 characters</li>
                      <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-base-content/30" />Mix letters, numbers & symbols</li>
                      <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-base-content/30" />Avoid common passwords</li>
                    </ul>
                  </motion.div>

                  <motion.button
                    type="submit"
                    className={`btn btn-primary w-full h-12 text-base ${loading ? 'loading' : ''}`}
                    disabled={loading}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {loading ? 'Resetting...' : 'Reset Password'}
                  </motion.button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}
