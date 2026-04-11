import { createNotification } from '../modules/notifications/notifications.service';
import type { AdminNotificationType } from '../models';

/** Fire-and-forget notification — never throws */
export function notify(type: AdminNotificationType, title: string, message: string, link?: string) {
  createNotification({ type, title, message, link }).catch((err) => {
    console.error('[notify] Failed to create notification:', err);
  });
}
