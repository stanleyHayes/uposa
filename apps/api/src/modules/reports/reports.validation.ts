import { z } from 'zod';
import { ReportTargetType, ReportReason, ReportAction } from '../../models';

export const createReportSchema = z.object({
  body: z.object({
    targetType: z.enum(ReportTargetType),
    targetId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid target id'),
    reason: z.enum(ReportReason),
    details: z.string().trim().max(1000, 'Details must be 1000 characters or fewer').optional(),
  }),
});

export const resolveReportSchema = z.object({
  body: z.object({
    status: z.enum(['ACTIONED', 'DISMISSED']),
    action: z.enum(ReportAction).optional(),
    resolutionNote: z.string().trim().max(2000).optional(),
  }),
});

export type CreateReportInput = z.infer<typeof createReportSchema>['body'];
export type ResolveReportInput = z.infer<typeof resolveReportSchema>['body'];
