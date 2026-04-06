import { z } from 'zod';

export const sendMentorshipRequestSchema = z.object({
  body: z.object({
    mentorId: z.string().min(1, 'Mentor ID is required'),
    message: z.string().optional(),
  }),
});

export const respondToRequestSchema = z.object({
  body: z.object({
    status: z.enum(['ACCEPTED', 'DECLINED']),
    mentorResponse: z.string().optional(),
  }),
});

export const toggleMentorAvailabilitySchema = z.object({
  body: z.object({
    isAvailableAsMentor: z.boolean(),
    mentorBio: z.string().optional(),
  }),
});

export type SendMentorshipRequestInput = z.infer<typeof sendMentorshipRequestSchema>['body'];
export type RespondToRequestInput = z.infer<typeof respondToRequestSchema>['body'];
export type ToggleMentorAvailabilityInput = z.infer<typeof toggleMentorAvailabilitySchema>['body'];
