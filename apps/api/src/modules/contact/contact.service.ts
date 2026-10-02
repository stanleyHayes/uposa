import { escapeRegex } from '../../utils/search.utils';
import { getRepos } from '../../repositories';
import { getPaginationParams, buildPaginationMeta } from '../../utils/pagination.utils';
import { sendEmail, escapeHtml } from '../../utils/email.utils';
import { env } from '../../config/env';
import { notify } from '../../utils/notify';
import { CreateContactMessageInput } from './contact.validation';

export async function submitContactMessage(data: CreateContactMessageInput) {
  const { contactMessages } = getRepos();

  const doc = await contactMessages.create({
    name: data.name,
    email: data.email,
    subject: data.subject,
    message: data.message,
    isRead: false,
    repliedAt: null,
  });

  try {
    await sendEmail({
      to: env.FROM_EMAIL,
      subject: `[UPOSA Contact] ${data.subject}`,
      html: `
        <h3>New Contact Message</h3>
        <p><strong>From:</strong> ${escapeHtml(data.name)} (${escapeHtml(data.email)})</p>
        <p><strong>Subject:</strong> ${escapeHtml(data.subject)}</p>
        <p><strong>Message:</strong></p>
        <p>${escapeHtml(data.message).replace(/\n/g, '<br>')}</p>
      `,
    });
  } catch (err) {
    console.error('Failed to send contact notification:', err);
  }

  notify('NEW_CONTACT_MESSAGE', 'New Contact Message', `${data.name} sent a message: "${data.subject}"`, '/contact-messages');

  return doc;
}

export async function adminListMessages(query: Record<string, string | undefined>) {
  const { page, limit, skip } = getPaginationParams(query);
  const { isRead, search, archived } = query;
  const { contactMessages } = getRepos();

  // Archived messages are hidden unless ?archived=true (legacy rows lack the field).
  const where: Record<string, unknown> = {
    isArchived: archived === 'true' ? true : { $ne: true },
  };
  if (isRead !== undefined) where.isRead = isRead === 'true';
  if (search) {
    where.$or = [
      { name: { $regex: escapeRegex(search), $options: 'i' } },
      { email: { $regex: escapeRegex(search), $options: 'i' } },
      { subject: { $regex: escapeRegex(search), $options: 'i' } },
    ];
  }

  const [rawData, total] = await Promise.all([
    contactMessages.findMany(where, { sort: { createdAt: -1 }, skip, limit }),
    contactMessages.count(where),
  ]);

  return { data: rawData.map(withInboxState), meta: buildPaginationMeta(page, limit, total) };
}

/** Always expose the inbox flags (null when unset) so clients don't special-case old rows. */
function withInboxState<T extends { isRead?: boolean; isArchived?: boolean; archivedAt?: Date | null; repliedAt?: Date | null }>(m: T) {
  return { ...m, isRead: !!m.isRead, isArchived: !!m.isArchived, archivedAt: m.archivedAt ?? null, repliedAt: m.repliedAt ?? null };
}

export async function setMessageArchived(id: string, archived: boolean) {
  const updated = await getRepos().contactMessages.updateById(id, {
    isArchived: archived,
    archivedAt: archived ? new Date() : null,
  });
  if (!updated) throw Object.assign(new Error('Message not found'), { statusCode: 404 });
  return withInboxState(updated);
}

export async function markMessageReplied(id: string) {
  const updated = await getRepos().contactMessages.updateById(id, { repliedAt: new Date(), isRead: true });
  if (!updated) throw Object.assign(new Error('Message not found'), { statusCode: 404 });
  return withInboxState(updated);
}

export async function markMessageAsRead(id: string) {
  const { contactMessages } = getRepos();

  const message = await contactMessages.findById(id);
  if (!message) throw Object.assign(new Error('Message not found'), { statusCode: 404 });

  const updated = await contactMessages.updateById(id, { isRead: true });
  return updated;
}

export async function deleteMessage(id: string) {
  const { contactMessages } = getRepos();

  const message = await contactMessages.findById(id);
  if (!message) throw Object.assign(new Error('Message not found'), { statusCode: 404 });
  await contactMessages.deleteById(id);
  return { message: 'Message deleted' };
}
