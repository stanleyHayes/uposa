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

export interface VerifyPaymentResult {
  success: boolean;
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
  validateWebhook(body: unknown, signature: string): boolean;
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
