import { Request, Response } from 'express';
import {
  createPaymentMethodSchema,
  updatePaymentMethodSchema,
  togglePaymentMethodSchema,
} from './payment-methods.validation';
import {
  listPaymentMethods,
  getPaymentMethod,
  createPaymentMethod,
  updatePaymentMethod,
  togglePaymentMethod,
  deletePaymentMethod,
} from './payment-methods.service';
import { successResponse } from '../../utils/response.utils';

// Public: list enabled payment methods
export async function listEnabledPaymentMethodsHandler(_req: Request, res: Response): Promise<void> {
  const methods = await listPaymentMethods(true);
  successResponse(res, 'Payment methods retrieved', methods);
}

// Admin: list all payment methods
export async function adminListPaymentMethodsHandler(_req: Request, res: Response): Promise<void> {
  const methods = await listPaymentMethods(false);
  successResponse(res, 'Payment methods retrieved', methods);
}

export async function adminGetPaymentMethodHandler(req: Request, res: Response): Promise<void> {
  const method = await getPaymentMethod(req.params.id);
  successResponse(res, 'Payment method retrieved', method);
}

export async function adminCreatePaymentMethodHandler(req: Request, res: Response): Promise<void> {
  const parsed = createPaymentMethodSchema.parse({ body: req.body });
  const method = await createPaymentMethod(parsed.body);
  successResponse(res, 'Payment method created', method, 201);
}

export async function adminUpdatePaymentMethodHandler(req: Request, res: Response): Promise<void> {
  const parsed = updatePaymentMethodSchema.parse({ body: req.body });
  const method = await updatePaymentMethod(req.params.id, parsed.body);
  successResponse(res, 'Payment method updated', method);
}

export async function adminTogglePaymentMethodHandler(req: Request, res: Response): Promise<void> {
  const parsed = togglePaymentMethodSchema.parse({ body: req.body });
  const method = await togglePaymentMethod(req.params.id, parsed.body.isEnabled);
  successResponse(res, `Payment method ${parsed.body.isEnabled ? 'enabled' : 'disabled'}`, method);
}

export async function adminDeletePaymentMethodHandler(req: Request, res: Response): Promise<void> {
  await deletePaymentMethod(req.params.id);
  successResponse(res, 'Payment method deleted');
}
