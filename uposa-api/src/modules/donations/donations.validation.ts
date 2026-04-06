import { z } from 'zod';

export const createDonationSchema = z.object({
  body: z.object({
    donorName: z.string().min(2, 'Donor name is required'),
    donorEmail: z.string().email('Invalid email'),
    amount: z.coerce.number().positive('Amount must be positive'),
    currency: z.string().optional(),
    channel: z.enum(['MOMO', 'BANK', 'PAYPAL', 'CASH', 'OTHER']).optional(),
    purpose: z.string().optional(),
    transactionRef: z.string().optional(),
    projectId: z.string().optional(),
    notes: z.string().optional(),
  }),
});

export const confirmDonationSchema = z.object({
  body: z.object({
    transactionRef: z.string().optional(),
    notes: z.string().optional(),
  }),
});

export type CreateDonationInput = z.infer<typeof createDonationSchema>['body'];
export type ConfirmDonationInput = z.infer<typeof confirmDonationSchema>['body'];
