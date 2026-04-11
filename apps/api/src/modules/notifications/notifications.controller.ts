import { Request, Response } from 'express';
import { listNotifications, getUnreadCount, markAsRead, markAllAsRead } from './notifications.service';
import { successResponse } from '../../utils/response.utils';

export async function listNotificationsHandler(req: Request, res: Response): Promise<void> {
  const result = await listNotifications(req.query as Record<string, string | undefined>);
  successResponse(res, 'Notifications retrieved', result.data, 200, result.meta);
}

export async function getUnreadCountHandler(_req: Request, res: Response): Promise<void> {
  const result = await getUnreadCount();
  successResponse(res, 'Unread count', result);
}

export async function markAsReadHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const notification = await markAsRead(id);
  successResponse(res, 'Marked as read', notification);
}

export async function markAllAsReadHandler(_req: Request, res: Response): Promise<void> {
  const result = await markAllAsRead();
  successResponse(res, result.message);
}
