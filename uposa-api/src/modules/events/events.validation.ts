import { z } from 'zod';

export const createEventSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date'),
    endDate: z.string().optional(),
    location: z.string().optional(),
    rsvpLink: z.string().url().optional().or(z.literal('')),
    status: z.enum(['UPCOMING', 'ONGOING', 'PAST', 'CANCELLED']).optional(),
    isFeatured: z.boolean().optional(),
  }),
});

export const updateEventSchema = z.object({
  body: z.object({
    title: z.string().min(3).optional(),
    description: z.string().min(10).optional(),
    date: z.string().optional(),
    endDate: z.string().optional(),
    location: z.string().optional(),
    rsvpLink: z.string().url().optional().or(z.literal('')),
    status: z.enum(['UPCOMING', 'ONGOING', 'PAST', 'CANCELLED']).optional(),
    isFeatured: z.boolean().optional(),
  }),
});

export const rsvpSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name is required'),
    email: z.string().email('Invalid email'),
    phone: z.string().optional(),
  }),
});

export type CreateEventInput = z.infer<typeof createEventSchema>['body'];
export type UpdateEventInput = z.infer<typeof updateEventSchema>['body'];
export type RsvpInput = z.infer<typeof rsvpSchema>['body'];
