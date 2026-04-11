import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { authApi } from '../../api/services'
import AuthSidePanel, { ShieldIllustration } from '../../components/auth/AuthGraphics'

type Status = 'loading' | 'success' | 'error'

export default function VerifyEmailPage() {
  const { token } = useParams<{ token: string }>()
  const [status, setStatus] = useState<Status>('loading')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setErrorMessage('Invalid verification link. No token provided.')
      setStatus('error')
      return
    }

    authApi
      .verifyEmail(token)
      .then(() => setStatus('success'))
      .catch((err) => {
        setErrorMessage(
          err?.response?.data?.message ||
            'Verification failed. The link may have expired or is invalid.'
        )
        setStatus('error')
      })
  }, [token])

  return (
    <div className="flex min-h-screen w-full">
      <AuthSidePanel
        title="Email Verification"
        subtitle="We're confirming your email address to activate your alumni account."
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
            <img src="/logo.png" alt="UPOSA" className="w-10 h-10 rounded-xl" />
            <span className="font-bold">UPOSA Alumni</span>
          </div>

          <div className="text-center">
            {status === 'loading' && (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <motion.div
                  className="w-20 h-20 rounded-full bg-base-200 flex items-center justify-center mx-auto mb-6"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                >
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                </motion.div>
                <h2 className="text-2xl font-bold mb-2">Verifying your email...</h2>
                <p className="text-base-content/60">
                  Please wait while we confirm your email address.
                </p>
              </motion.div>
            )}

            {status === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
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
                <h2 className="text-2xl font-bold mb-2">Email Verified!</h2>
                <p className="text-base-content/60 mb-8">
                  Your email has been verified successfully. Your membership is now pending admin
                  approval. You'll receive an email once approved.
                </p>
                <Link to="/login" className="btn btn-primary w-full h-11">
                  Go to Login
                </Link>
              </motion.div>
            )}

            {status === 'error' && (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <motion.div
                  className="w-20 h-20 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-6"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.4 }}
                  >
                    <XCircle className="w-10 h-10 text-error" />
                  </motion.div>
                </motion.div>
                <h2 className="text-2xl font-bold mb-2">Verification Failed</h2>
                <p className="text-base-content/60 mb-8">{errorMessage}</p>
                <Link to="/login" className="btn btn-primary w-full h-11">
                  Go to Login
                </Link>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
