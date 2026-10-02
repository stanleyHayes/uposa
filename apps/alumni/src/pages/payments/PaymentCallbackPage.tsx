import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { CheckCircle, Clock, Loader2, XCircle } from 'lucide-react'
import { paymentsApi } from '../../api/services'
import SEO from '../../components/common/SEO'

type Status = 'loading' | 'success' | 'pending' | 'failed'

// Landing page for online checkout redirects (the API's default callback is
// `${CLIENT_URL}/payment/callback`). Success is only shown once the server has
// verified the payment with the provider.
export default function PaymentCallbackPage() {
  const [params] = useSearchParams()
  // Paystack appends ?trxref=&reference=; Stripe and crypto append ?reference=&status=
  const reference = params.get('reference') || params.get('trxref') || ''
  const cancelled = params.get('status') === 'cancelled'
  const [status, setStatus] = useState<Status>(cancelled || !reference ? 'failed' : 'loading')
  const [purpose, setPurpose] = useState<string | undefined>()

  useEffect(() => {
    if (cancelled || !reference) return
    let active = true
    paymentsApi
      .verify(reference)
      .then((res) => {
        if (!active) return
        const payment = res.data.data as { status?: string; purpose?: string } | undefined
        setPurpose(payment?.purpose)
        setStatus(payment?.status === 'SUCCESS' ? 'success' : payment?.status === 'PENDING' ? 'pending' : 'failed')
      })
      .catch(() => {
        // Could not confirm yet (network, provider delay) — never assume success.
        if (active) setStatus('pending')
      })
    return () => {
      active = false
    }
  }, [reference, cancelled])

  const backTo = purpose === 'DONATION' ? '/donations' : purpose === 'DUES' ? '/dues' : '/dashboard'
  const backLabel = purpose === 'DONATION' ? 'Back to donations' : purpose === 'DUES' ? 'Back to dues' : 'Go to dashboard'

  const content = {
    loading: {
      icon: <Loader2 className="h-10 w-10 animate-spin text-primary" />,
      tone: 'bg-base-200',
      title: 'Confirming your payment...',
      body: 'Please wait while we verify this payment with the provider.',
    },
    success: {
      icon: <CheckCircle className="h-10 w-10 text-success" />,
      tone: 'bg-success/10',
      title: 'Payment confirmed',
      body: 'Thank you. Your payment has been verified and your records are updated.',
    },
    pending: {
      icon: <Clock className="h-10 w-10 text-warning" />,
      tone: 'bg-warning/10',
      title: 'Payment not confirmed yet',
      body: 'We could not confirm this payment yet. If you completed checkout, it will be confirmed automatically — check your records again shortly.',
    },
    failed: {
      icon: <XCircle className="h-10 w-10 text-error" />,
      tone: 'bg-error/10',
      title: cancelled ? 'Payment cancelled' : 'Payment not completed',
      body: cancelled
        ? 'Checkout was cancelled and you have not been charged. You can try again at any time.'
        : reference
          ? 'The provider did not confirm this payment. You can try again.'
          : 'This payment link is missing its reference.',
    },
  }[status]

  return (
    <>
      <SEO title="Payment" description="UPOSA payment confirmation." />
      <div className="flex min-h-screen items-center justify-center bg-base-100 p-6">
        <div className="w-full max-w-md text-center">
          <div className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full ${content.tone}`}>
            {content.icon}
          </div>
          <h1 className="mb-2 text-2xl font-bold">{content.title}</h1>
          <p className="mb-8 text-base-content/60">{content.body}</p>
          {status !== 'loading' && (
            <Link to={backTo} className="btn btn-primary h-11 w-full">
              {backLabel}
            </Link>
          )}
        </div>
      </div>
    </>
  )
}
