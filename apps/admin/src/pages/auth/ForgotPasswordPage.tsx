import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Send, CheckCircle2 } from 'lucide-react'
import AuthLayout from '../../components/layout/AuthLayout'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'

const forgotSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

type ForgotForm = z.infer<typeof forgotSchema>

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotForm>({ resolver: zodResolver(forgotSchema) })

  const onSubmit = async (data: ForgotForm) => {
    // TODO: call API to send password reset email
    // await api.post('/auth/admin/forgot-password', { email: data.email })
    setSubmittedEmail(data.email)
    setSubmitted(true)
  }

  return (
    <AuthLayout
      title={submitted ? undefined : 'Reset your password'}
      subtitle={submitted ? undefined : "Enter your email and we'll send you a reset link"}
    >
      {submitted ? (
        <div className="text-center py-4">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-green-50 dark:bg-green-950/30 flex items-center justify-center mb-5">
            <CheckCircle2 size={28} className="text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-2">
            Check your email
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-xs mx-auto">
            We sent a password reset link to{' '}
            <span className="font-medium text-gray-700 dark:text-gray-300">{submittedEmail}</span>
          </p>

          <div className="mt-8 space-y-3">
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => setSubmitted(false)}
            >
              Try a different email
            </Button>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-1.5 text-sm font-medium text-brand-500 hover:text-brand-600 dark:text-brand-300 dark:hover:text-brand-200 transition-colors"
            >
              <ArrowLeft size={14} />
              Back to sign in
            </Link>
          </div>
        </div>
      ) : (
        <>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Email Address"
              type="email"
              placeholder="admin@uposa.org"
              error={errors.email?.message}
              autoComplete="email"
              {...register('email')}
            />

            <Button
              type="submit"
              className="w-full"
              size="lg"
              loading={isSubmitting}
              rightIcon={<Send size={16} />}
            >
              Send Reset Link
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
        </>
      )}
    </AuthLayout>
  )
}
