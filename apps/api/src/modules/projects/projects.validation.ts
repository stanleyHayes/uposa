import { z } from 'zod';

const milestoneSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  date: z.string().optional(),
  completed: z.boolean().optional(),
});

export const createProjectSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    content: z.string().optional(),
    imageUrl: z.string().optional(),
    gallery: z.array(z.string().url()).optional(),
    milestones: z.array(milestoneSchema).optional(),
    goalAmount: z.coerce.number().min(0).optional(),
    status: z.enum(['ONGOING', 'COMPLETED', 'PAUSED']).optional(),
    isFeatured: z.boolean().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),
});

export const updateProjectSchema = z.object({
  body: z.object({
    title: z.string().min(3).optional(),
    description: z.string().min(10).optional(),
    content: z.string().optional(),
    imageUrl: z.string().optional(),
    gallery: z.array(z.string().url()).optional(),
    milestones: z.array(milestoneSchema).optional(),
    goalAmount: z.coerce.number().min(0).optional(),
    raisedAmount: z.coerce.number().min(0).optional(),
    status: z.enum(['ONGOING', 'COMPLETED', 'PAUSED']).optional(),
    isFeatured: z.boolean().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>['body'];
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>['body'];
