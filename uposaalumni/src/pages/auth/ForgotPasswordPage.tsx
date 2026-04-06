import { useState } from 'react'
import { Link } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Mail, Send } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { authApi } from '../../api/services'
import { useToast } from '../../hooks/useToast'
import AuthSidePanel, { MailIllustration } from '../../components/auth/AuthGraphics'

const schema = z.object({ email: z.string().email('Enter a valid email') })
type FormData = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const toast = useToast()

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      await authApi.forgotPassword(data.email)
      setSent(true)
    } catch {
      toast.error('Failed to send reset email. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full">
      <AuthSidePanel
        title="Password Recovery"
        subtitle="Don't worry, it happens to the best of us. We'll help you get back into your account in no time."
        illustration={<MailIllustration />}
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

          <Link to="/login" className="btn btn-ghost btn-sm gap-1 mb-6 -ml-2">
            <ArrowLeft className="w-4 h-4" /> Back to login
          </Link>

          <AnimatePresence mode="wait">
            {sent ? (
              <motion.div
                key="sent"
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
                    <Mail className="w-10 h-10 text-success" />
                  </motion.div>
                </motion.div>
                <h2 className="text-2xl font-bold mb-2">Check Your Email</h2>
                <p className="text-base-content/60 mb-8 leading-relaxed">
                  We've sent a password reset link to your email address. Click the link in the email to reset your password.
                </p>
                <div className="space-y-3">
                  <Link to="/login" className="btn btn-primary w-full h-11">Back to Login</Link>
                  <button className="btn btn-ghost btn-sm" onClick={() => setSent(false)}>Didn't receive it? Try again</button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 1 }} exit={{ opacity: 0, x: -30 }}>
                <div className="mb-8">
                  <h2 className="text-3xl font-bold mb-2">Forgot Password?</h2>
                  <p className="text-base-content/60">No worries. Enter your email and we'll send you a reset link.</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <motion.div
                    className="form-control"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
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
                    {errors.email && <p className="text-error text-xs mt-1.5">{errors.email.message}</p>}
                  </motion.div>

                  <motion.button
                    type="submit"
                    className={`btn btn-primary w-full h-12 text-base ${loading ? 'loading' : ''}`}
                    disabled={loading}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {!loading && <Send className="w-4 h-4" />}
                    {loading ? 'Sending...' : 'Send Reset Link'}
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
