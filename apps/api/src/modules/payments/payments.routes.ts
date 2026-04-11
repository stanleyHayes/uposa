import { Router } from 'express';
import {
  initializePaymentHandler,
  verifyPaymentHandler,
  getPaymentStatusHandler,
  paystackWebhookHandler,
  stripeWebhookHandler,
  cryptoWebhookHandler,
  adminListPaymentsHandler,
} from './payments.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { adminMiddleware } from '../../middleware/admin.middleware';

const router = Router();

// Initialize a payment (optional auth — guests can pay for donations)
router.post('/initialize', initializePaymentHandler);

// Verify payment after callback
router.get('/verify/:reference', verifyPaymentHandler);

// Get payment status
router.get('/status/:reference', getPaymentStatusHandler);

// Webhooks (no auth — validated by provider signatures)
router.post('/webhooks/paystack', paystackWebhookHandler);
router.post('/webhooks/stripe', stripeWebhookHandler);
router.post('/webhooks/crypto', cryptoWebhookHandler);

// Admin
router.get('/admin', adminMiddleware, adminListPaymentsHandler);

export default router;
