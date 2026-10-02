export interface InitializePaymentInput {
  email: string;
  amount: number; // in the smallest currency unit (pesewas, kobo, cents)
  currency: string;
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
  customerName?: string;
}

export interface InitializePaymentResult {
  authorizationUrl: string;
  reference: string;
  providerRef?: string;
}

/**
 * Provider verdict: 'failed' only for a definitive failure (failed, abandoned,
 * expired, cancelled). In-flight payments (mobile money awaiting approval,
 * processing, etc.) are 'pending' and must not be marked FAILED.
 */
export type VerifyStatus = 'success' | 'pending' | 'failed';

export interface VerifyPaymentResult {
  success: boolean;
  status: VerifyStatus;
  reference: string;
  providerRef: string;
  amount: number; // in smallest unit
  currency: string;
  paidAt?: string;
  channel?: string;
  rawData: Record<string, unknown>;
}

export interface PaymentProviderInterface {
  name: string;
  initialize(input: InitializePaymentInput): Promise<InitializePaymentResult>;
  verify(reference: string): Promise<VerifyPaymentResult>;
  /** `body` is the raw request bytes when available (preferred), else the parsed JSON. */
  validateWebhook(body: unknown, signature: string): Promise<boolean>;
  parseWebhookEvent(body: unknown): WebhookEvent | null;
}

export interface WebhookEvent {
  event: string;
  reference: string;
  success: boolean;
  amount: number;
  currency: string;
  providerRef: string;
  paidAt?: string;
  rawData: Record<string, unknown>;
}
