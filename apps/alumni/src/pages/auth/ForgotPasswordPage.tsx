import { useState } from 'react'
import { Link } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Mail, Send, KeyRound } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { authApi } from '../../api/services'
import { useToast } from '../../hooks/useToast'
import SEO from '../../components/common/SEO'

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
    <>
    <SEO title="Forgot Password" description="Reset your UPOSA alumni account password." />
    <div className="min-h-screen flex bg-base-200">
      {/* Left: Branding */}
      <div className="hidden lg:flex lg:w-5/12 flex-col items-center justify-center p-12 text-primary bg-[#FFF8DC] relative">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <KeyRound size={40} className="text-primary" />
          </div>
          <h2 className="text-3xl font-bold mb-3">Password Recovery</h2>
          <p className="text-primary/50 max-w-xs leading-relaxed">
            Don't worry, it happens to the best of us. We'll help you get back into your account.
          </p>
        </motion.div>

        {/* Wavy edge */}
        <svg className="absolute top-0 right-0 h-full w-12 translate-x-[1px]" viewBox="0 0 48 800" preserveAspectRatio="none" fill="none">
          <path d="M0 0 C24 0, 48 50, 24 100 C0 150, 48 200, 24 250 C0 300, 48 350, 24 400 C0 450, 48 500, 24 550 C0 600, 48 650, 24 700 C0 750, 24 800, 48 800 L48 0 Z" className="fill-base-100" />
        </svg>
      </div>

      {/* Right: Form */}
      <div className="flex-1 flex items-center justify-center bg-base-100 p-6 sm:p-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <img src="/logo.png" alt="UPOSA" className="w-10 h-10 rounded-lg" />
            <span className="font-bold">UPOSA Alumni</span>
          </div>

          <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-base-content/40 hover:text-primary transition-colors mb-8">
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
                  <Mail className="w-10 h-10 text-success" />
                </motion.div>
                <h2 className="text-2xl font-bold mb-2">Check Your Email</h2>
                <p className="text-base-content/50 mb-8 leading-relaxed text-sm">
                  We've sent a password reset link to your email. Click the link to set a new password.
                </p>

                {/* Custom separator */}
                <div className="flex items-center gap-3 my-6">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-base-300 to-transparent" />
                  <span className="text-[10px] text-base-content/30 uppercase tracking-widest">or</span>
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-base-300 to-transparent" />
                </div>

                <div className="space-y-3">
                  <Link to="/login" className="btn btn-primary w-full h-11">Back to Login</Link>
                  <button className="btn btn-ghost btn-sm text-base-content/40" onClick={() => setSent(false)}>Didn't receive it? Try again</button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 1 }} exit={{ opacity: 0, x: -30 }}>
                <h2 className="text-3xl font-bold mb-2">Forgot Password?</h2>
                <p className="text-base-content/50 text-sm mb-8">Enter your email and we'll send you a reset link.</p>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div className="form-control">
                    <label className="label pb-1"><span className="label-text font-medium text-sm">Email Address</span></label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/30" />
                      <input
                        type="email"
                        className={`input input-bordered w-full pl-11 h-12 bg-base-200/50 border-base-300 focus:border-primary focus:bg-base-100 transition-colors ${errors.email ? 'input-error' : ''}`}
                        placeholder="you@example.com"
                        {...register('email')}
                      />
                    </div>
                    {errors.email && <p className="text-error text-xs mt-1.5">{errors.email.message}</p>}
                  </div>

                  <motion.button
                    type="submit"
                    className={`btn btn-primary w-full h-12 text-base gap-2 ${loading ? 'loading' : ''}`}
                    disabled={loading}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    {loading ? 'Sending...' : <>Send Reset Link <Send className="w-4 h-4" /></>}
                  </motion.button>
                </form>

                {/* Custom separator */}
                <div className="flex items-center gap-3 my-8">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-base-300 to-transparent" />
                  <span className="text-[10px] text-base-content/30 uppercase tracking-widest">or</span>
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-base-300 to-transparent" />
                </div>

                <p className="text-center text-sm text-base-content/40">
                  Remember your password?{' '}
                  <Link to="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
    </>
  )
}
