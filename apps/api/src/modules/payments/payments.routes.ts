import { Router } from 'express';
import {
  initializePaymentHandler,
  verifyPaymentHandler,
  getPaymentStatusHandler,
  getPlatformFeePreviewHandler,
  paystackWebhookHandler,
  stripeWebhookHandler,
  cryptoWebhookHandler,
  adminListPaymentsHandler,
} from './payments.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { adminMiddleware } from '../../middleware/admin.middleware';
import { paymentLimiter, webhookLimiter } from '../../middleware/ratelimit.middleware';

const router = Router();

// Initialize a payment (optional auth — guests can pay for donations)
router.post('/initialize', paymentLimiter, initializePaymentHandler);

// Verify payment after callback
router.get('/verify/:reference', paymentLimiter, verifyPaymentHandler);

// Get payment status
router.get('/status/:reference', paymentLimiter, getPaymentStatusHandler);

// Platform fee preview (no auth needed)
router.get('/platform-fee', paymentLimiter, getPlatformFeePreviewHandler);

// Webhooks (no auth — validated by provider signatures).
// Rate limit runs after the global body parsers, so the Stripe raw-body
// middleware mounted in app.ts still attaches the raw payload before signature
// verification inside the controller.
router.post('/webhooks/paystack', webhookLimiter, paystackWebhookHandler);
router.post('/webhooks/stripe', webhookLimiter, stripeWebhookHandler);
router.post('/webhooks/crypto', webhookLimiter, cryptoWebhookHandler);

// Admin
router.get('/admin', adminMiddleware, adminListPaymentsHandler);

export default router;
