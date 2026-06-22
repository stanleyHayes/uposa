import { escapeRegex } from '../../utils/search.utils';
import { getRepos } from '../../repositories';
import { getPaginationParams, buildPaginationMeta } from '../../utils/pagination.utils';
import { sendEmail } from '../../utils/email.utils';
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
        <p><strong>From:</strong> ${data.name} (${data.email})</p>
        <p><strong>Subject:</strong> ${data.subject}</p>
        <p><strong>Message:</strong></p>
        <p>${data.message.replace(/\n/g, '<br>')}</p>
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
  const { isRead, search } = query;
  const { contactMessages } = getRepos();

  const where: Record<string, unknown> = {};
  if (isRead !== undefined) where.isRead = isRead === 'true';
  if (search) {
    where.$or = [
      { name: { $regex: escapeRegex(search), $options: 'i' } },
      { email: { $regex: escapeRegex(search), $options: 'i' } },
      { subject: { $regex: escapeRegex(search), $options: 'i' } },
    ];
  }

  const [data, total] = await Promise.all([
    contactMessages.findMany(where, { sort: { createdAt: -1 }, skip, limit }),
    contactMessages.count(where),
  ]);

  return { data, meta: buildPaginationMeta(page, limit, total) };
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
