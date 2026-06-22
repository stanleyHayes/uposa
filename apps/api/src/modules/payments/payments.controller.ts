import { Response } from 'express';
import { RouteRequest } from '../../types/request.types';
import { initializePaymentSchema } from './payments.validation';
import {
  initializePayment,
  verifyPayment,
  handleWebhookEvent,
  getPaymentByReference,
  getPlatformFeePreview,
  adminListPayments,
} from './payments.service';
import { getPaymentProvider } from '../../providers/payment.registry';
import { successResponse, errorResponse } from '../../utils/response.utils';

/**
 * The /status/:reference and /verify/:reference endpoints are unauthenticated
 * (a guest paying a donation has no token and looks up by reference). Strip the
 * raw provider payload and the payer's email so a reference cannot be used to
 * harvest PII / provider metadata. Receipt-essential fields (status, amount,
 * currency, purpose, payerName, paidAt) are retained.
 */
function toPublicPaymentView<T>(payment: T): T {
  if (!payment || typeof payment !== 'object') return payment;
  const { providerData: _pd, payerEmail: _pe, ...safe } = payment as Record<string, unknown>;
  return safe as T;
}

export async function initializePaymentHandler(req: RouteRequest, res: Response): Promise<void> {
  const parsed = initializePaymentSchema.parse({ body: req.body });
  const memberId = req.user?.id;
  const result = await initializePayment(parsed.body, memberId);
  successResponse(res, 'Payment initialized', result, 201);
}

export async function verifyPaymentHandler(req: RouteRequest, res: Response): Promise<void> {
  const { reference } = req.params;
  const payment = await verifyPayment(reference);
  successResponse(res, 'Payment verified', toPublicPaymentView(payment));
}

export async function getPaymentStatusHandler(req: RouteRequest, res: Response): Promise<void> {
  const { reference } = req.params;
  const payment = await getPaymentByReference(reference);
  successResponse(res, 'Payment status retrieved', toPublicPaymentView(payment));
}

// Paystack webhook
export async function paystackWebhookHandler(req: RouteRequest, res: Response): Promise<void> {
  const signature = req.headers['x-paystack-signature'] as string;
  if (!signature) {
    errorResponse(res, 'Missing signature', 400);
    return;
  }

  const provider = getPaymentProvider('PAYSTACK');
  if (!provider.validateWebhook(req.body, signature)) {
    errorResponse(res, 'Invalid signature', 401);
    return;
  }

  const event = provider.parseWebhookEvent(req.body);
  if (event && event.event === 'charge.success') {
    await handleWebhookEvent('PAYSTACK', event);
  }

  // Always return 200 to acknowledge receipt
  res.status(200).json({ received: true });
}

// Stripe webhook
export async function stripeWebhookHandler(req: RouteRequest, res: Response): Promise<void> {
  const signature = req.headers['stripe-signature'] as string;
  if (!signature) {
    errorResponse(res, 'Missing signature', 400);
    return;
  }

  const provider = getPaymentProvider('STRIPE');
  if (!provider.validateWebhook(req.body, signature)) {
    errorResponse(res, 'Invalid signature', 401);
    return;
  }

  const event = provider.parseWebhookEvent(req.body);
  if (event) {
    await handleWebhookEvent('STRIPE', event);
  }

  res.status(200).json({ received: true });
}

// Crypto (Coinbase Commerce) webhook
export async function cryptoWebhookHandler(req: RouteRequest, res: Response): Promise<void> {
  const signature = req.headers['x-cc-webhook-signature'] as string;
  if (!signature) {
    errorResponse(res, 'Missing signature', 400);
    return;
  }

  const provider = getPaymentProvider('CRYPTO');
  if (!provider.validateWebhook(req.body, signature)) {
    errorResponse(res, 'Invalid signature', 401);
    return;
  }

  const event = provider.parseWebhookEvent(req.body);
  if (event && event.success) {
    await handleWebhookEvent('CRYPTO', event);
  }

  res.status(200).json({ received: true });
}

// Public: get platform fee preview for an amount
export async function getPlatformFeePreviewHandler(req: RouteRequest, res: Response): Promise<void> {
  const amount = parseFloat(req.query.amount as string);
  if (isNaN(amount) || amount <= 0) {
    errorResponse(res, 'Valid positive amount is required', 400);
    return;
  }
  const preview = await getPlatformFeePreview(amount);
  successResponse(res, 'Platform fee preview', preview);
}

// Admin: list all payments
export async function adminListPaymentsHandler(req: RouteRequest, res: Response): Promise<void> {
  const result = await adminListPayments(req.query as Record<string, string | undefined>);
  successResponse(res, 'Payments retrieved', result.data, 200, result.meta);
}
