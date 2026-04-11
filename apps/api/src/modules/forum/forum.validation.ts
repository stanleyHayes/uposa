import { z } from 'zod';

export const createPostSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    content: z.string().min(10, 'Content must be at least 10 characters'),
    category: z.enum(['GENERAL', 'ANNOUNCEMENTS', 'CAREERS', 'EDUCATION', 'WELFARE']).optional(),
  }),
});

export const updatePostSchema = z.object({
  body: z.object({
    title: z.string().min(3).optional(),
    content: z.string().min(10).optional(),
    category: z.enum(['GENERAL', 'ANNOUNCEMENTS', 'CAREERS', 'EDUCATION', 'WELFARE']).optional(),
  }),
});

export const createCommentSchema = z.object({
  body: z.object({
    content: z.string().min(1, 'Comment cannot be empty'),
    parentId: z.string().optional(),
  }),
});

export type CreatePostInput = z.infer<typeof createPostSchema>['body'];
export type UpdatePostInput = z.infer<typeof updatePostSchema>['body'];
export type CreateCommentInput = z.infer<typeof createCommentSchema>['body'];
