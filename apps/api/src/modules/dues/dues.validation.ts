import { z } from 'zod';

export const createDueSchema = z.object({
  body: z.object({
    memberId: z.string().min(1, 'Member ID is required'),
    amount: z.coerce.number().positive('Amount must be positive'),
    year: z.coerce.number().int().min(1982),
    notes: z.string().optional(),
  }),
});

export const markPaidSchema = z.object({
  body: z.object({
    transactionRef: z.string().optional(),
    notes: z.string().optional(),
  }),
});

export const bulkCreateDuesSchema = z.object({
  body: z.object({
    amount: z.coerce.number().positive('Amount must be positive'),
    year: z.coerce.number().int().min(1982),
    notes: z.string().optional(),
  }),
});

export const memberPayDueSchema = z.object({
  body: z.object({
    transactionRef: z.string().min(1, 'Transaction reference is required'),
    channel: z.enum(['MOMO', 'BANK', 'PAYPAL', 'PAYSTACK', 'STRIPE', 'CRYPTO', 'CASH', 'OTHER']).optional(),
    notes: z.string().optional(),
  }),
});

export type CreateDueInput = z.infer<typeof createDueSchema>['body'];
export type MarkPaidInput = z.infer<typeof markPaidSchema>['body'];
export type BulkCreateDuesInput = z.infer<typeof bulkCreateDuesSchema>['body'];
export type MemberPayDueInput = z.infer<typeof memberPayDueSchema>['body'];
