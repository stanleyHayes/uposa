import { z } from 'zod';

export const createNewsSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    content: z.string().min(10, 'Content must be at least 10 characters'),
    excerpt: z.string().optional(),
    category: z.enum(['ANNOUNCEMENT', 'BLOG', 'REPORT', 'MEETING_SUMMARY']).optional(),
    authorName: z.string().optional(),
    isFeatured: z.boolean().optional(),
    isPublished: z.boolean().optional(),
  }),
});

export const updateNewsSchema = z.object({
  body: z.object({
    title: z.string().min(3).optional(),
    content: z.string().min(10).optional(),
    excerpt: z.string().optional(),
    category: z.enum(['ANNOUNCEMENT', 'BLOG', 'REPORT', 'MEETING_SUMMARY']).optional(),
    authorName: z.string().optional(),
    isFeatured: z.boolean().optional(),
    isPublished: z.boolean().optional(),
  }),
});

export type CreateNewsInput = z.infer<typeof createNewsSchema>['body'];
export type UpdateNewsInput = z.infer<typeof updateNewsSchema>['body'];
