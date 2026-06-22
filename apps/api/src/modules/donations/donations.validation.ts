import { z } from 'zod';

export const createDonationSchema = z.object({
  body: z.object({
    donorName: z.string().min(2, 'Donor name is required').max(120),
    donorEmail: z.string().email('Invalid email').max(254),
    amount: z.coerce.number().positive('Amount must be positive').max(100_000_000),
    currency: z.string().max(10).optional(),
    channel: z.enum(['MOMO', 'BANK', 'PAYPAL', 'PAYSTACK', 'STRIPE', 'CRYPTO', 'CASH', 'OTHER']).optional(),
    purpose: z.string().max(200).optional(),
    transactionRef: z.string().max(200).optional(),
    projectId: z.string().max(64).optional(),
    notes: z.string().max(2000).optional(),
  }),
});

export const confirmDonationSchema = z.object({
  body: z.object({
    transactionRef: z.string().max(200).optional(),
    notes: z.string().max(2000).optional(),
  }),
});

export type CreateDonationInput = z.infer<typeof createDonationSchema>['body'];
export type ConfirmDonationInput = z.infer<typeof confirmDonationSchema>['body'];
