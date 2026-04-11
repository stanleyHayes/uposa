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

  async verify(reference: string): Promise<VerifyPaymentResult> {
    const stripe = await getStripeClient();

    const allSessions = await stripe.checkout.sessions.list({ limit: 100 });
    let session: any = null;
    for (const s of allSessions.data) {
      if (s.client_reference_id === reference || s.metadata?.reference === reference) {
        session = s;
        break;
      }
    }

    if (!session) {
      throw Object.assign(new Error('Stripe session not found'), { statusCode: 404 });
    }

    return {
      success: session.payment_status === 'paid',
      reference,
      providerRef: session.payment_intent || session.id,
      amount: session.amount_total || 0,
      currency: (session.currency || 'usd').toUpperCase(),
      paidAt: session.payment_status === 'paid' ? new Date().toISOString() : undefined,
      rawData: session,
    };
  }

  validateWebhook(body: unknown, signature: string): boolean {
    try {
      const Stripe = require('stripe');
      const stripe = new Stripe(env.STRIPE_SECRET_KEY);
      stripe.webhooks.constructEvent(
        body as string | Buffer,
        signature,
        env.STRIPE_WEBHOOK_SECRET,
      );
      return true;
    } catch {
      return false;
    }
  }

  parseWebhookEvent(body: unknown): WebhookEvent | null {
    const event = body as any;

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
