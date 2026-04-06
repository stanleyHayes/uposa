import { z } from 'zod';

export const createElectionSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    description: z.string().optional(),
    position: z.string().min(2, 'Position is required'),
    candidates: z.array(z.object({
      id: z.string(),
      name: z.string().min(2),
      memberId: z.string().optional(),
      bio: z.string().optional(),
      photoUrl: z.string().optional(),
    })).min(2, 'At least 2 candidates are required'),
    startDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid start date'),
    endDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid end date'),
  }),
});

export const changeElectionStatusSchema = z.object({
  body: z.object({
    status: z.enum(['UPCOMING', 'ACTIVE', 'COMPLETED', 'CANCELLED']),
  }),
});

export const castElectionVoteSchema = z.object({
  body: z.object({
    candidateId: z.string().min(1, 'Candidate ID is required'),
  }),
});

export const updateElectionSchema = z.object({
  body: z.object({
    title: z.string().min(3).optional(),
    description: z.string().optional(),
    startDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid start date').optional(),
    endDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid end date').optional(),
  }),
});

export type CreateElectionInput = z.infer<typeof createElectionSchema>['body'];
export type ChangeElectionStatusInput = z.infer<typeof changeElectionStatusSchema>['body'];
export type CastElectionVoteInput = z.infer<typeof castElectionVoteSchema>['body'];
export type UpdateElectionInput = z.infer<typeof updateElectionSchema>['body'];
