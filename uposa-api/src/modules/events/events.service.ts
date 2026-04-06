import prisma from '../../config/db';
import { getPaginationParams, buildPaginationMeta } from '../../utils/pagination.utils';
import { generateUniqueSlug } from '../../utils/response.utils';
import { CreateEventInput, UpdateEventInput, RsvpInput } from './events.validation';

export async function listEvents(query: Record<string, string | undefined>) {
  const { page, limit, skip } = getPaginationParams(query);
  const { status, search } = query;

  const where: Record<string, unknown> = {};
  if (status) where.status = status.toUpperCase();
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.event.findMany({
      where,
      skip,
      take: limit,
      orderBy: { date: 'desc' },
      include: { createdBy: { select: { id: true, fullName: true } } },
    }),
    prisma.event.count({ where }),
  ]);

  return { data, meta: buildPaginationMeta(page, limit, total) };
}

export async function getUpcomingEvents(query: Record<string, string | undefined>) {
  const { page, limit, skip } = getPaginationParams(query);
  const now = new Date();

  const [data, total] = await Promise.all([
    prisma.event.findMany({
      where: { status: 'UPCOMING', date: { gte: now } },
      skip,
      take: limit,
      orderBy: { date: 'asc' },
      include: { createdBy: { select: { id: true, fullName: true } } },
    }),
    prisma.event.count({ where: { status: 'UPCOMING', date: { gte: now } } }),
  ]);

  return { data, meta: buildPaginationMeta(page, limit, total) };
}

export async function getPastEvents(query: Record<string, string | undefined>) {
  const { page, limit, skip } = getPaginationParams(query);

  const [data, total] = await Promise.all([
    prisma.event.findMany({
      where: { status: 'PAST' },
      skip,
      take: limit,
      orderBy: { date: 'desc' },
      include: { createdBy: { select: { id: true, fullName: true } } },
    }),
    prisma.event.count({ where: { status: 'PAST' } }),
  ]);

  return { data, meta: buildPaginationMeta(page, limit, total) };
}

export async function getEventBySlug(slug: string) {
  const event = await prisma.event.findUnique({
    where: { slug },
    include: {
      createdBy: { select: { id: true, fullName: true } },
      _count: { select: { rsvps: true } },
    },
  });
  if (!event) throw Object.assign(new Error('Event not found'), { statusCode: 404 });
  return event;
}

export async function rsvpToEvent(eventId: string, data: RsvpInput, memberId?: string) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw Object.assign(new Error('Event not found'), { statusCode: 404 });
  if (event.status === 'PAST' || event.status === 'CANCELLED') {
    throw Object.assign(new Error('Cannot RSVP to a past or cancelled event'), { statusCode: 400 });
  }

  const rsvp = await prisma.eventRsvp.create({
    data: {
      eventId,
      memberId: memberId || null,
      name: data.name,
      email: data.email,
      phone: data.phone,
    },
  });
  return rsvp;
}

export async function createEvent(adminId: string, data: CreateEventInput, imageUrl?: string) {
  const slug = generateUniqueSlug(data.title);
  return prisma.event.create({
    data: {
      title: data.title,
      slug,
      description: data.description,
      imageUrl: imageUrl || null,
      date: new Date(data.date),
      endDate: data.endDate ? new Date(data.endDate) : null,
      location: data.location,
      rsvpLink: data.rsvpLink || null,
      status: data.status || 'UPCOMING',
      isFeatured: data.isFeatured || false,
      createdById: adminId,
    },
    include: { createdBy: { select: { id: true, fullName: true } } },
  });
}

export async function updateEvent(id: string, data: UpdateEventInput, imageUrl?: string) {
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) throw Object.assign(new Error('Event not found'), { statusCode: 404 });

  const updateData: Record<string, unknown> = { ...data };
  if (data.date) updateData.date = new Date(data.date);
  if (data.endDate) updateData.endDate = new Date(data.endDate);
  if (imageUrl) updateData.imageUrl = imageUrl;

  return prisma.event.update({
    where: { id },
    data: updateData,
    include: { createdBy: { select: { id: true, fullName: true } } },
  });
}

export async function deleteEvent(id: string) {
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) throw Object.assign(new Error('Event not found'), { statusCode: 404 });
  await prisma.event.delete({ where: { id } });
  return { message: 'Event deleted successfully' };
}

export async function getEventRsvps(eventId: string, query: Record<string, string | undefined>) {
  const { page, limit, skip } = getPaginationParams(query);
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw Object.assign(new Error('Event not found'), { statusCode: 404 });

  const [data, total] = await Promise.all([
    prisma.eventRsvp.findMany({
      where: { eventId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { member: { select: { id: true, fullName: true, photoUrl: true } } },
    }),
    prisma.eventRsvp.count({ where: { eventId } }),
  ]);

  return { data, meta: buildPaginationMeta(page, limit, total) };
}
