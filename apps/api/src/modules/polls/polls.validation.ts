import { z } from 'zod';

export const createPollSchema = z.object({
  body: z.object({
    question: z.string().min(5, 'Question must be at least 5 characters'),
    description: z.string().optional(),
    options: z.array(z.object({
      id: z.number().int(),
      text: z.string().min(1, 'Option text is required'),
    })).min(2, 'At least 2 options are required'),
    allowMultiple: z.boolean().optional(),
    endsAt: z.string().optional(),
  }),
});

export const castVoteSchema = z.object({
  body: z.object({
    selectedOptions: z.array(z.number().int()).min(1, 'Select at least one option'),
  }),
});

export const updatePollSchema = z.object({
  body: z.object({
    question: z.string().min(5).optional(),
    description: z.string().optional(),
    endsAt: z.string().optional(),
  }),
});

export type CreatePollInput = z.infer<typeof createPollSchema>['body'];
export type CastVoteInput = z.infer<typeof castVoteSchema>['body'];
export type UpdatePollInput = z.infer<typeof updatePollSchema>['body'];
