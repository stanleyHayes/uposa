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
import { adminMiddleware, requireAdminRole } from '../../middleware/admin.middleware';

const router = Router();

// Public: get enabled payment methods (for frontend checkout)
router.get('/', listEnabledPaymentMethodsHandler);

// Admin routes
router.get('/admin', adminMiddleware, adminListPaymentMethodsHandler);
router.get('/admin/:id', adminMiddleware, adminGetPaymentMethodHandler);
// Provider credentials decide where money goes: ADMIN / SUPER_ADMIN only.
router.post('/admin', adminMiddleware, requireAdminRole, adminCreatePaymentMethodHandler);
router.put('/admin/:id', adminMiddleware, requireAdminRole, adminUpdatePaymentMethodHandler);
router.patch('/admin/:id/toggle', adminMiddleware, requireAdminRole, adminTogglePaymentMethodHandler);
router.delete('/admin/:id', adminMiddleware, requireAdminRole, adminDeletePaymentMethodHandler);

export default router;
