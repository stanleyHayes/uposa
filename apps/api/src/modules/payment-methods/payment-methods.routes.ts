import { Router } from 'express';
import {
  listEnabledPaymentMethodsHandler,
  adminListPaymentMethodsHandler,
  adminGetPaymentMethodHandler,
  adminCreatePaymentMethodHandler,
  adminUpdatePaymentMethodHandler,
  adminTogglePaymentMethodHandler,
  adminDeletePaymentMethodHandler,
} from './payment-methods.controller';
import { adminMiddleware, requirePermission } from '../../middleware/admin.middleware';

const router = Router();

// Public: get enabled payment methods (for frontend checkout)
router.get('/', listEnabledPaymentMethodsHandler);

// Admin routes
router.get('/admin', adminMiddleware, requirePermission('payment_methods:view'), adminListPaymentMethodsHandler);
router.get('/admin/:id', adminMiddleware, requirePermission('payment_methods:view'), adminGetPaymentMethodHandler);
// Provider credentials decide where money goes: payment_methods:edit (not in the MODERATOR defaults).
router.post('/admin', adminMiddleware, requirePermission('payment_methods:edit'), adminCreatePaymentMethodHandler);
router.put('/admin/:id', adminMiddleware, requirePermission('payment_methods:edit'), adminUpdatePaymentMethodHandler);
router.patch('/admin/:id/toggle', adminMiddleware, requirePermission('payment_methods:edit'), adminTogglePaymentMethodHandler);
router.delete('/admin/:id', adminMiddleware, requirePermission('payment_methods:edit'), adminDeletePaymentMethodHandler);

export default router;
