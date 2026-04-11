import crypto from 'crypto';
import { env } from '../config/env';
import { getProviderCredentials } from '../modules/payment-methods/payment-methods.service';
import {
  PaymentProviderInterface,
  InitializePaymentInput,
  InitializePaymentResult,
  VerifyPaymentResult,
  WebhookEvent,
} from './payment.types';

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

    return {
      success: data.data.status === 'success',
      reference: data.data.reference,
      providerRef: String(data.data.id),
      amount: data.data.amount,
      currency: data.data.currency,
      paidAt: data.data.paid_at,
      channel: data.data.channel,
      rawData: data.data as unknown as Record<string, unknown>,
    };
  }

  validateWebhook(body: unknown, signature: string): boolean {
    // Webhook validation uses env var directly since it's called synchronously
    // and DB credentials may not be loaded yet in the request lifecycle
    const secret = env.PAYSTACK_WEBHOOK_SECRET;
    if (!secret) return false;
    const hash = crypto
      .createHmac('sha512', secret)
      .update(JSON.stringify(body))
      .digest('hex');
    return hash === signature;
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
