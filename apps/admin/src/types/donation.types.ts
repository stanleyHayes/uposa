export type DonationStatus = 'PENDING' | 'CONFIRMED' | 'FAILED'
export type DonationChannel = 'MOMO' | 'BANK' | 'PAYPAL' | 'PAYSTACK' | 'STRIPE' | 'CRYPTO' | 'CASH' | 'OTHER'
export type PaymentProvider = 'PAYSTACK' | 'STRIPE' | 'CRYPTO'

export interface PaymentMethod {
  id: string
  provider: PaymentProvider
  displayName: string
  description?: string
  isEnabled: boolean
  supportedCurrencies: string[]
  countries: string[]
  hasCredentials: boolean
  config?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface Payment {
  id: string
  provider: PaymentProvider
  purpose: 'DONATION' | 'DUES'
  amount: number
  currency: string
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED'
  providerRef?: string
  payerEmail: string
  payerName?: string
  donationId?: string
  dueId?: string
  memberId?: string
  createdAt: string
  updatedAt: string
}

export interface Donation {
  id: string
  memberId: string
  donorName: string
  donorEmail: string
  amount: number
  currency: string
  channel: DonationChannel
  purpose: string
  transactionRef: string
  projectId: string
  status: DonationStatus
  notes: string
  createdAt: string
  updatedAt: string
}
