import { z } from 'zod';

export const createContactMessageSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(120),
    email: z.string().email('Invalid email address').max(254),
    subject: z.string().min(3, 'Subject must be at least 3 characters').max(200),
    message: z.string().min(10, 'Message must be at least 10 characters').max(5000),
  }),
});

export type CreateContactMessageInput = z.infer<typeof createContactMessageSchema>['body'];
