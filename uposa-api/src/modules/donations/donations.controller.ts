import { Request, Response } from 'express';
import { createDonationSchema, confirmDonationSchema } from './donations.validation';
import {
  submitDonation,
  getMyDonations,
  adminListDonations,
  confirmDonation,
  getDonationSummary,
} from './donations.service';
import { successResponse, errorResponse } from '../../utils/response.utils';

export async function submitDonationHandler(req: Request, res: Response): Promise<void> {
  const parsed = createDonationSchema.parse({ body: req.body });
  const memberId = req.user?.id;
  const donation = await submitDonation(parsed.body, memberId);
  successResponse(res, 'Donation submitted successfully', donation, 201);
}

export async function getMyDonationsHandler(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    errorResponse(res, 'Unauthorized', 401);
    return;
  }
  const result = await getMyDonations(req.user.id, req.query as Record<string, string | undefined>);
  successResponse(res, 'Donations retrieved', result.data, 200, result.meta);
}

export async function adminListDonationsHandler(req: Request, res: Response): Promise<void> {
  const result = await adminListDonations(req.query as Record<string, string | undefined>);
  successResponse(res, 'Donations retrieved', result.data, 200, result.meta);
}

export async function confirmDonationHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const parsed = confirmDonationSchema.parse({ body: req.body });
  const donation = await confirmDonation(id, parsed.body);
  successResponse(res, 'Donation confirmed', donation);
}

export async function getDonationSummaryHandler(_req: Request, res: Response): Promise<void> {
  const summary = await getDonationSummary();
  successResponse(res, 'Donation summary retrieved', summary);
}
