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

const CHANNELS = ['MOMO', 'BANK', 'PAYPAL', 'PAYSTACK', 'STRIPE', 'CRYPTO', 'CASH', 'OTHER'] as const;

// Offline donations recorded from the admin dashboard. `note` is accepted as an alias of `notes`.
const adminDonationFields = {
  donorName: z.string().trim().min(2, 'Donor name is required').max(120),
  donorEmail: z.string().trim().toLowerCase().email('Invalid email').max(254).optional().or(z.literal('')),
  amount: z.coerce.number().positive('Amount must be positive').max(100_000_000),
  currency: z.string().trim().toUpperCase().min(1).max(10).optional(),
  projectId: z.string().max(64).nullable().optional(),
  channel: z.enum(CHANNELS).optional(),
  purpose: z.string().max(200).optional(),
  transactionRef: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
  note: z.string().max(2000).optional(),
};

export const adminCreateDonationSchema = z.object({
  body: z.object({
    ...adminDonationFields,
    status: z.enum(['PENDING', 'CONFIRMED']).optional(),
  }),
});

export const adminUpdateDonationSchema = z.object({
  body: z.object({
    ...adminDonationFields,
    donorName: adminDonationFields.donorName.optional(),
    amount: adminDonationFields.amount.optional(),
    status: z.enum(['PENDING', 'CONFIRMED', 'FAILED']).optional(),
  }),
});

export type AdminCreateDonationInput = z.infer<typeof adminCreateDonationSchema>['body'];
export type AdminUpdateDonationInput = z.infer<typeof adminUpdateDonationSchema>['body'];
export type CreateDonationInput = z.infer<typeof createDonationSchema>['body'];
export type ConfirmDonationInput = z.infer<typeof confirmDonationSchema>['body'];
