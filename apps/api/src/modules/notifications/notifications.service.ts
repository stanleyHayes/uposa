import { getRepos } from '../../repositories';
import { getPaginationParams, buildPaginationMeta } from '../../utils/pagination.utils';
import type { AdminNotificationType } from '../../models';

/** Create a notification (called internally by other services) */
export async function createNotification(data: {
  type: AdminNotificationType;
  title: string;
  message: string;
  link?: string;
}) {
  const { adminNotifications } = getRepos();
  return adminNotifications.create({ ...data, isRead: false });
}

/** List notifications for admin panel */
export async function listNotifications(query: Record<string, string | undefined>) {
  const { page, limit, skip } = getPaginationParams(query);
  const { adminNotifications } = getRepos();

  const where: Record<string, unknown> = {};
  if (query.unread === 'true') where.isRead = false;

  const [data, total, unreadCount] = await Promise.all([
    adminNotifications.findMany(where, { sort: { createdAt: -1 }, skip, limit }),
    adminNotifications.count(where),
    adminNotifications.count({ isRead: false }),
  ]);

  return { data, meta: buildPaginationMeta(page, limit, total), unreadCount };
}

/** Get unread count */
export async function getUnreadCount() {
  const { adminNotifications } = getRepos();
  const count = await adminNotifications.count({ isRead: false });
  return { count };
}

/** Mark one as read */
export async function markAsRead(id: string) {
  const { adminNotifications } = getRepos();
  const notification = await adminNotifications.findById(id);
  if (!notification) throw Object.assign(new Error('Notification not found'), { statusCode: 404 });
  return adminNotifications.updateById(id, { isRead: true });
}

/** Mark all as read */
export async function markAllAsRead() {
  const { adminNotifications } = getRepos();
  // Use the underlying model directly for bulk update
  const Model = (adminNotifications as any).model || (adminNotifications as any).Model;
  if (Model?.updateMany) {
    await Model.updateMany({ isRead: false }, { isRead: true });
  }
  return { message: 'All notifications marked as read' };
}
