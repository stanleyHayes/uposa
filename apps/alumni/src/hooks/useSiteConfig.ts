import { useState, useEffect } from 'react'
import { siteConfigApi } from '../api/services'

interface SiteConfig {
  contact?: { phones: string[]; emails: Record<string, string>; address: string; officeHours: string }
  social?: { facebook: string; instagram: string; whatsapp: string }
  payment?: { momo: { number: string; payId: string; accountName: string }; bank: { bank: string; accountNo: string; accountName: string; branch: string } }
  dues?: { annual: number; lifetime: number; currency: string }
  donationAllocation?: Array<{ title: string; percentage: number; description: string }>
}

let cachedConfig: SiteConfig | null = null

export function useSiteConfig() {
  const [config, setConfig] = useState<SiteConfig | null>(cachedConfig)
  const [loading, setLoading] = useState(!cachedConfig)

  useEffect(() => {
    if (cachedConfig) return
    siteConfigApi.getSiteData()
      .then((res) => {
        cachedConfig = res.data.data?.config || {}
        setConfig(cachedConfig)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return { config, loading }
}
