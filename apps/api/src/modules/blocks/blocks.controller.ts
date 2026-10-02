import { Response } from 'express';
import { z } from 'zod';
import { RouteRequest } from '../../types/request.types';
import { blockMember, unblockMember, listBlocks } from './blocks.service';
import { successResponse, errorResponse } from '../../utils/response.utils';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid member id');
const blockSchema = z.object({ body: z.object({ memberId: objectId }) });

export async function blockMemberHandler(req: RouteRequest, res: Response): Promise<void> {
  if (!req.user) { errorResponse(res, 'Unauthorized', 401); return; }
  const parsed = blockSchema.parse({ body: req.body });
  const block = await blockMember(req.user.id, parsed.body.memberId);
  successResponse(res, 'Member blocked', block, 201);
}

export async function unblockMemberHandler(req: RouteRequest, res: Response): Promise<void> {
  if (!req.user) { errorResponse(res, 'Unauthorized', 401); return; }
  const memberId = objectId.parse(req.params.memberId);
  const result = await unblockMember(req.user.id, memberId);
  successResponse(res, result.message);
}

export async function listBlocksHandler(req: RouteRequest, res: Response): Promise<void> {
  if (!req.user) { errorResponse(res, 'Unauthorized', 401); return; }
  const blocks = await listBlocks(req.user.id);
  successResponse(res, 'Blocked members retrieved', blocks);
}
