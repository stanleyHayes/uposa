import { env } from '../config/env';
import { getProviderCredentials } from '../modules/payment-methods/payment-methods.service';
import {
  PaymentProviderInterface,
  InitializePaymentInput,
  InitializePaymentResult,
  VerifyPaymentResult,
  VerifyStatus,
  WebhookEvent,
} from './payment.types';

/** Checkout Session → verdict (open/unpaid sessions are still in flight). */
export function mapStripeSession(session: { status?: string | null; payment_status?: string | null }): VerifyStatus {
  if (session.payment_status === 'paid' || session.payment_status === 'no_payment_required') return 'success';
  if (session.status === 'expired') return 'failed';
  return 'pending';
}

async function getCredentials() {
  const dbCreds = await getProviderCredentials('STRIPE');
  return {
    secretKey: dbCreds.secretKey || env.STRIPE_SECRET_KEY,
    webhookSecret: dbCreds.webhookSecret || env.STRIPE_WEBHOOK_SECRET,
  };
}

async function getStripeClient() {
  const creds = await getCredentials();
  const Stripe = require('stripe');
  return new Stripe(creds.secretKey);
}

export class StripeProvider implements PaymentProviderInterface {
  name = 'STRIPE';

  async initialize(input: InitializePaymentInput): Promise<InitializePaymentResult> {
    const stripe = await getStripeClient();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: input.email,
      client_reference_id: input.reference,
      line_items: [
        {
          price_data: {
            currency: input.currency.toLowerCase(),
            unit_amount: input.amount,
            product_data: {
              name: (input.metadata?.purpose as string) || 'UPOSA Payment',
              description: (input.metadata?.description as string) || undefined,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        reference: input.reference,
        ...(input.metadata as Record<string, string> || {}),
      },
      success_url: `${input.callbackUrl}?reference=${input.reference}&status=success`,
      cancel_url: `${input.callbackUrl}?reference=${input.reference}&status=cancelled`,
    });

    return {
      authorizationUrl: session.url,
      reference: input.reference,
      providerRef: session.id,
    };
  }

  /** `sessionId` is the Checkout Session id stored as the payment's providerRef. */
  async verify(sessionId: string): Promise<VerifyPaymentResult> {
    const stripe = await getStripeClient();

    // Fetch the session directly; scanning the latest 100 sessions missed older payments.
    let session: any;
    try {
      session = await stripe.checkout.sessions.retrieve(sessionId);
    } catch {
      throw Object.assign(new Error('Stripe session not found'), { statusCode: 404 });
    }

    const status = mapStripeSession(session);
    return {
      success: status === 'success',
      status,
      reference: session.client_reference_id || session.metadata?.reference || sessionId,
      providerRef: session.payment_intent || session.id,
      amount: session.amount_total || 0,
      currency: (session.currency || 'usd').toUpperCase(),
      paidAt: status === 'success' ? new Date().toISOString() : undefined,
      rawData: session,
    };
  }

  async validateWebhook(body: unknown, signature: string): Promise<boolean> {
    // Signing secret from the admin UI (encrypted in the DB) or env. Uses the
    // static helper: `new Stripe('')` throws, so with only DB-stored keys every
    // webhook used to be rejected.
    const { webhookSecret } = await getCredentials();
    if (!webhookSecret) return false;
    try {
      const Stripe = require('stripe');
      Stripe.webhooks.constructEvent(body as string | Buffer, signature, webhookSecret);
      return true;
    } catch {
      return false;
    }
  }

  parseWebhookEvent(body: unknown): WebhookEvent | null {
    // app.ts mounts express.raw() on this webhook (signature checks need the raw
    // bytes), so the body arrives as a Buffer, not a parsed object.
    const event = (Buffer.isBuffer(body) ? JSON.parse(body.toString('utf8')) : body) as any;

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      return {
        event: event.type,
        reference: session.client_reference_id || session.metadata?.reference || '',
        success: session.payment_status === 'paid',
        amount: session.amount_total || 0,
        currency: (session.currency || 'usd').toUpperCase(),
        providerRef: session.payment_intent || session.id,
        paidAt: new Date().toISOString(),
        rawData: session,
      };
    }

    return null;
  }
}
