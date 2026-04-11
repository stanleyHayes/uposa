import { Request, Response } from 'express';
import { createContactMessageSchema } from './contact.validation';
import {
  submitContactMessage,
  adminListMessages,
  markMessageAsRead,
  deleteMessage,
} from './contact.service';
import { successResponse } from '../../utils/response.utils';

export async function submitContactMessageHandler(req: Request, res: Response): Promise<void> {
  const parsed = createContactMessageSchema.parse({ body: req.body });
  const message = await submitContactMessage(parsed.body);
  successResponse(res, 'Message sent successfully', message, 201);
}

export async function adminListMessagesHandler(req: Request, res: Response): Promise<void> {
  const result = await adminListMessages(req.query as Record<string, string | undefined>);
  successResponse(res, 'Messages retrieved', result.data, 200, result.meta);
}

export async function markMessageAsReadHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const message = await markMessageAsRead(id);
  successResponse(res, 'Message marked as read', message);
}

export async function deleteMessageHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const result = await deleteMessage(id);
  successResponse(res, result.message);
}
