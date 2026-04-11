import { z } from 'zod';

export const createTranscriptRequestSchema = z.object({
  body: z.object({
    fullName: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    phone: z.string().optional(),
    yearGroup: z.string().min(4, 'Year group is required'),
    notes: z.string().optional(),
  }),
});

export type CreateTranscriptRequestInput = z.infer<typeof createTranscriptRequestSchema>['body'];
