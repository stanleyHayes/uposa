import { Response } from 'express';
import { RouteRequest } from '../../types/request.types';
import { listNotifications, getUnreadCount, markAsRead, markAllAsRead } from './notifications.service';
import { successResponse } from '../../utils/response.utils';

export async function listNotificationsHandler(req: RouteRequest, res: Response): Promise<void> {
  const result = await listNotifications(req.query as Record<string, string | undefined>);
  successResponse(res, 'Notifications retrieved', result.data, 200, result.meta);
}

export async function getUnreadCountHandler(req: RouteRequest, res: Response): Promise<void> {
  const result = await getUnreadCount();
  successResponse(res, 'Unread count', result);
}

export async function markAsReadHandler(req: RouteRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const notification = await markAsRead(id);
  successResponse(res, 'Marked as read', notification);
}

export async function markAllAsReadHandler(req: RouteRequest, res: Response): Promise<void> {
  const result = await markAllAsRead();
  successResponse(res, result.message);
}
