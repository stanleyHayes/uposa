import { Response } from 'express';
import { RouteRequest } from '../../types/request.types';
import { createReportSchema, resolveReportSchema } from './reports.validation';
import { createReport, adminListReports, adminGetReport, resolveReport } from './reports.service';
import { successResponse, errorResponse } from '../../utils/response.utils';

export async function createReportHandler(req: RouteRequest, res: Response): Promise<void> {
  if (!req.user) { errorResponse(res, 'Unauthorized', 401); return; }
  const parsed = createReportSchema.parse({ body: req.body });
  const result = await createReport(req.user.id, parsed.body);
  // 201 for a new report; 200 when this member already has an OPEN report on the target.
  successResponse(res, result.created ? 'Report submitted' : 'Report already submitted', { id: result.id }, result.created ? 201 : 200);
}

export async function adminListReportsHandler(req: RouteRequest, res: Response): Promise<void> {
  const result = await adminListReports(req.query as Record<string, string | undefined>);
  successResponse(res, 'Reports retrieved', result.data, 200, result.meta);
}

export async function adminGetReportHandler(req: RouteRequest, res: Response): Promise<void> {
  const report = await adminGetReport(req.params.id);
  successResponse(res, 'Report retrieved', report);
}

export async function adminResolveReportHandler(req: RouteRequest, res: Response): Promise<void> {
  if (!req.admin) { errorResponse(res, 'Unauthorized', 401); return; }
  const parsed = resolveReportSchema.parse({ body: req.body });
  const report = await resolveReport(req.params.id, { id: req.admin.id, role: req.admin.role }, parsed.body);
  successResponse(res, 'Report resolved', report);
}
