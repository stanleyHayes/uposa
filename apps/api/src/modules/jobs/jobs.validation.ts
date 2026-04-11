import { z } from 'zod';

export const createJobSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    company: z.string().min(2, 'Company name is required'),
    location: z.string().optional(),
    jobType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'VOLUNTEER', 'INTERNSHIP']).optional(),
    contactEmail: z.string().email().optional(),
    externalUrl: z.string().url().optional().or(z.literal('')),
    expiresAt: z.string().optional(),
  }),
});

export const updateJobSchema = z.object({
  body: z.object({
    title: z.string().min(3).optional(),
    description: z.string().min(10).optional(),
    company: z.string().min(2).optional(),
    location: z.string().optional(),
    jobType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'VOLUNTEER', 'INTERNSHIP']).optional(),
    contactEmail: z.string().email().optional(),
    externalUrl: z.string().url().optional().or(z.literal('')),
    expiresAt: z.string().optional(),
  }),
});

export const applyToJobSchema = z.object({
  body: z.object({
    coverLetter: z.string().optional(),
    resumeUrl: z.string().url().optional().or(z.literal('')),
  }),
});

export const updateApplicationStatusSchema = z.object({
  body: z.object({
    status: z.enum(['PENDING', 'REVIEWED', 'SHORTLISTED', 'REJECTED']),
    notes: z.string().optional(),
  }),
});

export type CreateJobInput = z.infer<typeof createJobSchema>['body'];
export type UpdateJobInput = z.infer<typeof updateJobSchema>['body'];
export type ApplyToJobInput = z.infer<typeof applyToJobSchema>['body'];
export type UpdateApplicationStatusInput = z.infer<typeof updateApplicationStatusSchema>['body'];
