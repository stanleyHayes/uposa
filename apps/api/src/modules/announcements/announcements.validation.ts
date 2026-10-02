import { z } from 'zod';

const typeEnum = z.enum(['INFO', 'WARNING', 'URGENT', 'SUCCESS']);
const statusEnum = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']);
const audienceEnum = z.enum(['ALL', 'MEMBERS', 'EXECUTIVES']);

// ISO date string; '' (or null) means "no expiry" and clears it on update.
const expiresAtField = z
  .union([z.literal(''), z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid expiresAt date')])
  .nullable()
  .optional();

export const createAnnouncementSchema = z.object({
  body: z.object({
    title: z.string().trim().min(3, 'Title must be at least 3 characters'),
    body: z.string().min(1, 'Body is required'),
    type: typeEnum.optional(),
    status: statusEnum.optional(),
    audience: audienceEnum.optional(),
    expiresAt: expiresAtField,
  }),
});

export const updateAnnouncementSchema = z.object({
  body: z.object({
    title: z.string().trim().min(3, 'Title must be at least 3 characters').optional(),
    body: z.string().min(1, 'Body is required').optional(),
    type: typeEnum.optional(),
    status: statusEnum.optional(),
    audience: audienceEnum.optional(),
    expiresAt: expiresAtField,
  }),
});

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>['body'];
export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>['body'];
