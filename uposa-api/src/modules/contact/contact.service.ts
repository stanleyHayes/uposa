import prisma from '../../config/db';
import { getPaginationParams, buildPaginationMeta } from '../../utils/pagination.utils';
import { sendEmail } from '../../utils/email.utils';
import { env } from '../../config/env';
import { CreateContactMessageInput } from './contact.validation';

export async function submitContactMessage(data: CreateContactMessageInput) {
  const message = await prisma.contactMessage.create({
    data: {
      name: data.name,
      email: data.email,
      subject: data.subject,
      message: data.message,
    },
  });

  // Notify admin
  try {
    await sendEmail({
      to: env.SMTP_USER || env.EMAIL_FROM,
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

  return message;
}

export async function adminListMessages(query: Record<string, string | undefined>) {
  const { page, limit, skip } = getPaginationParams(query);
  const { isRead, search } = query;

  const where: Record<string, unknown> = {};
  if (isRead !== undefined) where.isRead = isRead === 'true';
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { subject: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.contactMessage.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.contactMessage.count({ where }),
  ]);

  return { data, meta: buildPaginationMeta(page, limit, total) };
}

export async function markMessageAsRead(id: string) {
  const message = await prisma.contactMessage.findUnique({ where: { id } });
  if (!message) throw Object.assign(new Error('Message not found'), { statusCode: 404 });

  return prisma.contactMessage.update({
    where: { id },
    data: { isRead: true },
  });
}

export async function deleteMessage(id: string) {
  const message = await prisma.contactMessage.findUnique({ where: { id } });
  if (!message) throw Object.assign(new Error('Message not found'), { statusCode: 404 });
  await prisma.contactMessage.delete({ where: { id } });
  return { message: 'Message deleted' };
}
