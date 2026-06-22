import { z } from 'zod';

export const createTranscriptRequestSchema = z.object({
  body: z.object({
    fullName: z.string().min(2, 'Name must be at least 2 characters').max(120),
    email: z.string().email('Invalid email address').max(254),
    phone: z.string().max(40).optional(),
    yearGroup: z.string().min(4, 'Year group is required').max(20),
    notes: z.string().max(2000).optional(),
  }),
});

export type CreateTranscriptRequestInput = z.infer<typeof createTranscriptRequestSchema>['body'];
