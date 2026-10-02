import { env } from '../config/env';
import { getProviderCredentials } from '../modules/payment-methods/payment-methods.service';
import { hmacHexMatches, webhookPayload } from '../utils/crypto.utils';
import {
  PaymentProviderInterface,
  InitializePaymentInput,
  InitializePaymentResult,
  VerifyPaymentResult,
  VerifyStatus,
  WebhookEvent,
} from './payment.types';

/** Paystack transaction status → verdict ("ongoing"/"pending"/"processing"/"queued" are in flight). */
export function mapPaystackStatus(status: string | undefined): VerifyStatus {
  if (status === 'success') return 'success';
  if (status === 'failed' || status === 'abandoned' || status === 'reversed') return 'failed';
  return 'pending';
}

async function getCredentials() {
  // DB credentials take priority, env vars are fallback
  const dbCreds = await getProviderCredentials('PAYSTACK');
  return {
    secretKey: dbCreds.secretKey || env.PAYSTACK_SECRET_KEY,
    webhookSecret: dbCreds.webhookSecret || env.PAYSTACK_WEBHOOK_SECRET,
  };
}

export class PaystackProvider implements PaymentProviderInterface {
  name = 'PAYSTACK';
  private baseUrl = 'https://api.paystack.co';

  async initialize(input: InitializePaymentInput): Promise<InitializePaymentResult> {
    const creds = await getCredentials();
    const response = await fetch(`${this.baseUrl}/transaction/initialize`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${creds.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: input.email,
        amount: input.amount,
        currency: input.currency,
        reference: input.reference,
        callback_url: input.callbackUrl,
        metadata: {
          ...input.metadata,
          customer_name: input.customerName,
        },
      }),
    });

    const data = await response.json() as {
      status: boolean;
      message: string;
      data: { authorization_url: string; reference: string; access_code: string };
    };

    if (!data.status) {
      throw Object.assign(new Error(data.message || 'Paystack initialization failed'), { statusCode: 502 });
    }

    return {
      authorizationUrl: data.data.authorization_url,
      reference: data.data.reference,
      providerRef: data.data.access_code,
    };
  }

  async verify(reference: string): Promise<VerifyPaymentResult> {
    const creds = await getCredentials();
    const response = await fetch(`${this.baseUrl}/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: {
        Authorization: `Bearer ${creds.secretKey}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json() as {
      status: boolean;
      message: string;
      data: {
        status: string;
        reference: string;
        amount: number;
        currency: string;
        paid_at: string;
        channel: string;
        id: number;
      };
    };

    if (!data.status) {
      throw Object.assign(new Error(data.message || 'Paystack verification failed'), { statusCode: 502 });
    }

    const status = mapPaystackStatus(data.data.status);
    return {
      success: status === 'success',
      status,
      reference: data.data.reference,
      providerRef: String(data.data.id),
      amount: data.data.amount,
      currency: data.data.currency,
      paidAt: data.data.paid_at,
      channel: data.data.channel,
      rawData: data.data as unknown as Record<string, unknown>,
    };
  }

  async validateWebhook(body: unknown, signature: string): Promise<boolean> {
    // Paystack signs webhooks (HMAC-SHA512 of the raw body) with the account's
    // SECRET KEY. A separately configured webhook secret is also accepted, but
    // without falling back to the secret key (env or the encrypted DB copy set
    // in the admin UI) every webhook was rejected when only the key was set.
    const creds = await getCredentials();
    return hmacHexMatches('sha512', [creds.webhookSecret, creds.secretKey], webhookPayload(body), signature);
  }

  parseWebhookEvent(body: unknown): WebhookEvent | null {
    const payload = body as {
      event: string;
      data: {
        reference: string;
        status: string;
        amount: number;
        currency: string;
        id: number;
        paid_at: string;
      };
    };

    if (!payload.event || !payload.data) return null;

    return {
      event: payload.event,
      reference: payload.data.reference,
      success: payload.data.status === 'success',
      amount: payload.data.amount,
      currency: payload.data.currency,
      providerRef: String(payload.data.id),
      paidAt: payload.data.paid_at,
      rawData: payload.data as unknown as Record<string, unknown>,
    };
  }
}
