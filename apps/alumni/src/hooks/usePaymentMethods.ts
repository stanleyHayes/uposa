import { useState, useEffect } from 'react'
import { paymentMethodsApi } from '../api/services'
import type { PaymentMethod } from '../types'

let cachedMethods: PaymentMethod[] | null = null

export function usePaymentMethods() {
  const [methods, setMethods] = useState<PaymentMethod[]>(cachedMethods || [])
  const [loading, setLoading] = useState(!cachedMethods)

  useEffect(() => {
    if (cachedMethods) return
    paymentMethodsApi.list()
      .then((res) => {
        cachedMethods = res.data.data || []
        setMethods(cachedMethods)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return { methods, loading }
}
