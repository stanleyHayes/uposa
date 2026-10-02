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

/** Latest Coinbase Commerce timeline status → verdict (NEW/PENDING/UNRESOLVED are in flight). */
export function mapCoinbaseStatus(status: string | undefined): VerifyStatus {
  const s = String(status || '').toUpperCase();
  if (s === 'COMPLETED' || s === 'RESOLVED') return 'success';
  if (s === 'EXPIRED' || s === 'CANCELED' || s === 'CANCELLED') return 'failed';
  return 'pending';
}

async function getCredentials() {
  const dbCreds = await getProviderCredentials('CRYPTO');
  return {
    apiKey: dbCreds.apiKey || env.CRYPTO_API_KEY,
    webhookSecret: dbCreds.webhookSecret || env.CRYPTO_WEBHOOK_SECRET,
  };
}

// Uses Coinbase Commerce API (https://docs.cdp.coinbase.com/commerce-onchain/docs/welcome)
export class CryptoProvider implements PaymentProviderInterface {
  name = 'CRYPTO';
  private baseUrl = 'https://api.commerce.coinbase.com';

  async initialize(input: InitializePaymentInput): Promise<InitializePaymentResult> {
    const creds = await getCredentials();

    // Convert from smallest unit back to standard for Coinbase
    const amount = input.currency === 'JPY' || input.currency === 'KRW'
      ? input.amount
      : input.amount / 100;

    const response = await fetch(`${this.baseUrl}/charges`, {
      method: 'POST',
      headers: {
        'X-CC-Api-Key': creds.apiKey,
        'X-CC-Version': '2018-03-22',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'UPOSA Payment',
        description: (input.metadata?.purpose as string) || 'Payment to UPOSA',
        pricing_type: 'fixed_price',
        local_price: {
          amount: amount.toFixed(2),
          currency: input.currency,
        },
        metadata: {
          reference: input.reference,
          customer_email: input.email,
          customer_name: input.customerName,
          ...input.metadata,
        },
        redirect_url: `${input.callbackUrl}?reference=${input.reference}&status=success`,
        cancel_url: `${input.callbackUrl}?reference=${input.reference}&status=cancelled`,
      }),
    });

    const data = await response.json() as {
      data: { id: string; code: string; hosted_url: string };
      error?: { message: string };
    };

    if (data.error) {
      throw Object.assign(new Error(data.error.message || 'Crypto payment initialization failed'), { statusCode: 502 });
    }

    return {
      authorizationUrl: data.data.hosted_url,
      reference: input.reference,
      providerRef: data.data.code,
    };
  }

  async verify(reference: string): Promise<VerifyPaymentResult> {
    const creds = await getCredentials();

    const response = await fetch(`${this.baseUrl}/charges/${encodeURIComponent(reference)}`, {
      headers: {
        'X-CC-Api-Key': creds.apiKey,
        'X-CC-Version': '2018-03-22',
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json() as {
      data: {
        id: string;
        code: string;
        timeline: Array<{ status: string; time: string }>;
        pricing: { local: { amount: string; currency: string } };
        metadata: Record<string, string>;
        payments: Array<{ status: string }>;
      };
      error?: { message: string };
    };

    if (data.error) {
      throw Object.assign(new Error(data.error.message || 'Crypto payment verification failed'), { statusCode: 502 });
    }

    const charge = data.data;
    const lastStatus = charge.timeline[charge.timeline.length - 1]?.status;
    const status = mapCoinbaseStatus(lastStatus);
    const isCompleted = status === 'success';

    const currency = charge.pricing.local.currency;
    const rawAmount = parseFloat(charge.pricing.local.amount);
    const amount = currency === 'JPY' || currency === 'KRW'
      ? Math.round(rawAmount)
      : Math.round(rawAmount * 100);

    return {
      success: isCompleted,
      status,
      reference: charge.metadata.reference || charge.code,
      providerRef: charge.code,
      amount,
      currency,
      paidAt: isCompleted ? charge.timeline[charge.timeline.length - 1].time : undefined,
      rawData: charge as unknown as Record<string, unknown>,
    };
  }

  async validateWebhook(body: unknown, signature: string): Promise<boolean> {
    // Coinbase signs the raw body (HMAC-SHA256) with the shared webhook secret
    // (env or the encrypted copy set in the admin UI).
    const creds = await getCredentials();
    return hmacHexMatches('sha256', [creds.webhookSecret], webhookPayload(body), signature);
  }

  parseWebhookEvent(body: unknown): WebhookEvent | null {
    const payload = body as {
      event: {
        type: string;
        data: {
          code: string;
          metadata: Record<string, string>;
          timeline: Array<{ status: string; time: string }>;
          pricing: { local: { amount: string; currency: string } };
        };
      };
    };

    if (!payload.event?.data) return null;

    const charge = payload.event.data;
    const isCompleted = payload.event.type === 'charge:confirmed' || payload.event.type === 'charge:resolved';

    const currency = charge.pricing.local.currency;
    const rawAmount = parseFloat(charge.pricing.local.amount);
    const amount = currency === 'JPY' || currency === 'KRW'
      ? Math.round(rawAmount)
      : Math.round(rawAmount * 100);

    return {
      event: payload.event.type,
      reference: charge.metadata.reference || charge.code,
      success: isCompleted,
      amount,
      currency,
      providerRef: charge.code,
      paidAt: isCompleted ? charge.timeline[charge.timeline.length - 1]?.time : undefined,
      rawData: charge as unknown as Record<string, unknown>,
    };
  }
}
