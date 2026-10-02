import { z } from 'zod';

export const subscribeSchema = z.object({
  body: z.object({
    email: z.string().trim().toLowerCase().email('Invalid email address').max(254),
  }),
});

export const unsubscribeSchema = z.object({
  query: z.object({
    email: z.string().trim().toLowerCase().email('Invalid unsubscribe link'),
    token: z.string().min(1, 'Invalid unsubscribe link'),
  }),
});

export type SubscribeInput = z.infer<typeof subscribeSchema>['body'];
