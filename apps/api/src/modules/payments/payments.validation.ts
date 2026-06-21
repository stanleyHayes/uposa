import { z } from 'zod';

export const initializePaymentSchema = z.object({
  body: z.object({
    provider: z.enum(['PAYSTACK', 'STRIPE', 'CRYPTO']),
    purpose: z.enum(['DONATION', 'DUES']),
    amount: z.coerce.number().positive('Amount must be positive'),
    currency: z.string().min(1, 'Currency is required'),
    email: z.string().email('Valid email is required'),
    name: z.string().optional(),
    // For donations
    donationId: z.string().optional(),
    // For dues
    dueId: z.string().optional(),
    // Optional callback override
    callbackUrl: z.string().url().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  }),
});

export const verifyPaymentSchema = z.object({
  params: z.object({
    reference: z.string().min(1, 'Reference is required'),
  }),
});

export type InitializePaymentInput = z.infer<typeof initializePaymentSchema>['body'];
