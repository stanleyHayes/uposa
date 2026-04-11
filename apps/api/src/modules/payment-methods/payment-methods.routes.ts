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
import { adminMiddleware } from '../../middleware/admin.middleware';

const router = Router();

// Public: get enabled payment methods (for frontend checkout)
router.get('/', listEnabledPaymentMethodsHandler);

// Admin routes
router.get('/admin', adminMiddleware, adminListPaymentMethodsHandler);
router.get('/admin/:id', adminMiddleware, adminGetPaymentMethodHandler);
router.post('/admin', adminMiddleware, adminCreatePaymentMethodHandler);
router.put('/admin/:id', adminMiddleware, adminUpdatePaymentMethodHandler);
router.patch('/admin/:id/toggle', adminMiddleware, adminTogglePaymentMethodHandler);
router.delete('/admin/:id', adminMiddleware, adminDeletePaymentMethodHandler);

export default router;
