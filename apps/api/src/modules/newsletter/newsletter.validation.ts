import { z } from 'zod';

export const subscribeSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address').max(254),
  }),
});

export type SubscribeInput = z.infer<typeof subscribeSchema>['body'];
