import { Response } from 'express';
import { RouteRequest } from '../../types/request.types';
import { createDonationSchema, confirmDonationSchema } from './donations.validation';
import {
  submitDonation,
  getMyDonations,
  adminListDonations,
  confirmDonation,
  getDonationSummary,
  getDonationById,
} from './donations.service';
import { successResponse, errorResponse } from '../../utils/response.utils';

export async function submitDonationHandler(req: RouteRequest, res: Response): Promise<void> {
  const parsed = createDonationSchema.parse({ body: req.body });
  const memberId = req.user?.id;
  const donation = await submitDonation(parsed.body, memberId);
  successResponse(res, 'Donation submitted successfully', donation, 201);
}

export async function getMyDonationsHandler(req: RouteRequest, res: Response): Promise<void> {
  if (!req.user) {
    errorResponse(res, 'Unauthorized', 401);
    return;
  }
  const result = await getMyDonations(req.user.id, req.query as Record<string, string | undefined>);
  successResponse(res, 'Donations retrieved', result.data, 200, result.meta);
}

export async function adminListDonationsHandler(req: RouteRequest, res: Response): Promise<void> {
  const result = await adminListDonations(req.query as Record<string, string | undefined>);
  successResponse(res, 'Donations retrieved', result.data, 200, result.meta);
}

export async function confirmDonationHandler(req: RouteRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const parsed = confirmDonationSchema.parse({ body: req.body });
  const donation = await confirmDonation(id, parsed.body);
  successResponse(res, 'Donation confirmed', donation);
}

export async function getDonationByIdHandler(req: RouteRequest, res: Response): Promise<void> {
  const donation = await getDonationById(req.params.id);
  successResponse(res, 'Donation retrieved', donation);
}

export async function getDonationSummaryHandler(req: RouteRequest, res: Response): Promise<void> {
  const summary = await getDonationSummary();
  successResponse(res, 'Donation summary retrieved', summary);
}
