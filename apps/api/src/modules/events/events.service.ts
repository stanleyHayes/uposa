import { escapeRegex } from '../../utils/search.utils';
import mongoose from 'mongoose';
import { getRepos } from '../../repositories';
import { getPaginationParams, buildPaginationMeta } from '../../utils/pagination.utils';
import { generateUniqueSlug } from '../../utils/response.utils';
import { CreateEventInput, UpdateEventInput, RsvpInput } from './events.validation';

async function attachCreatedBy(doc: Record<string, any>) {
  if (!doc.createdById) return { ...doc, createdBy: null };
  const repos = getRepos();
  const admin = await repos.admins.findById(doc.createdById, { projection: 'fullName' });
  return { ...doc, createdBy: admin ? { id: admin.id, fullName: admin.fullName } : null };
}

async function attachCreatedByMany(docs: Record<string, any>[]) {
  const adminIds = [...new Set(docs.map(d => d.createdById).filter(Boolean))];
  if (adminIds.length === 0) return docs.map(d => ({ ...d, createdBy: null }));
  const repos = getRepos();
  const adminDocs = await repos.admins.findMany({ _id: { $in: adminIds } }, { projection: 'fullName' });
  const adminMap = new Map(adminDocs.map(a => [String(a.id), { id: a.id, fullName: a.fullName }]));
  return docs.map(d => ({ ...d, createdBy: adminMap.get(String(d.createdById)) || null }));
}

export async function listEvents(query: Record<string, string | undefined>) {
  const { page, limit, skip } = getPaginationParams(query);
  const { status, search } = query;
  const repos = getRepos();

  const where: Record<string, unknown> = {};
  if (status) where.status = status.toUpperCase();
  if (search) {
    where.$or = [
      { title: { $regex: escapeRegex(search), $options: 'i' } },
      { description: { $regex: escapeRegex(search), $options: 'i' } },
    ];
  }

  const [rawData, total] = await Promise.all([
    repos.events.findMany(where, { sort: { date: -1 }, skip, limit }),
    repos.events.count(where),
  ]);

  const data = await attachCreatedByMany(rawData);
  return { data, meta: buildPaginationMeta(page, limit, total) };
}

export async function getUpcomingEvents(query: Record<string, string | undefined>) {
  const { page, limit, skip } = getPaginationParams(query);
  const repos = getRepos();
  const now = new Date();
  const where = { status: 'UPCOMING', date: { $gte: now } };

  const [rawData, total] = await Promise.all([
    repos.events.findMany(where, { sort: { date: 1 }, skip, limit }),
    repos.events.count(where),
  ]);

  const data = await attachCreatedByMany(rawData);
  return { data, meta: buildPaginationMeta(page, limit, total) };
}

export async function getPastEvents(query: Record<string, string | undefined>) {
  const { page, limit, skip } = getPaginationParams(query);
  const repos = getRepos();
  const where = { status: 'PAST' };

  const [rawData, total] = await Promise.all([
    repos.events.findMany(where, { sort: { date: -1 }, skip, limit }),
    repos.events.count(where),
  ]);

  const data = await attachCreatedByMany(rawData);
  return { data, meta: buildPaginationMeta(page, limit, total) };
}

export async function getEventBySlug(slug: string) {
  const repos = getRepos();
  const event = await repos.events.findOne({ slug });
  if (!event) throw Object.assign(new Error('Event not found'), { statusCode: 404 });

  const rsvpCount = await repos.eventRsvps.count({ eventId: event.id });
  const withAdmin = await attachCreatedBy(event);
  return { ...withAdmin, _count: { rsvps: rsvpCount } };
}

export async function rsvpToEvent(eventId: string, data: RsvpInput, memberId?: string) {
  const repos = getRepos();
  const event = await repos.events.findById(eventId);
  if (!event) throw Object.assign(new Error('Event not found'), { statusCode: 404 });
  if (event.status === 'PAST' || event.status === 'CANCELLED') {
    throw Object.assign(new Error('Cannot RSVP to a past or cancelled event'), { statusCode: 400 });
  }

  const rsvp = await repos.eventRsvps.create({
    eventId,
    memberId: memberId || null,
    name: data.name,
    email: data.email,
    phone: data.phone || null,
  });

  return rsvp;
}

export async function createEvent(adminId: string, data: CreateEventInput, imageUrl?: string) {
  const repos = getRepos();
  const slug = generateUniqueSlug(data.title);
  const event = await repos.events.create({
    title: data.title,
    slug,
    description: data.description,
    imageUrl: imageUrl || null,
    date: new Date(data.date),
    endDate: data.endDate ? new Date(data.endDate) : null,
    location: data.location || null,
    rsvpLink: data.rsvpLink || null,
    status: data.status || 'UPCOMING',
    isFeatured: data.isFeatured || false,
    createdById: adminId,
  });

  const withAdmin = await attachCreatedBy(event);
  return withAdmin;
}

export async function updateEvent(id: string, data: UpdateEventInput, imageUrl?: string) {
  const repos = getRepos();
  const event = await repos.events.findById(id);
  if (!event) throw Object.assign(new Error('Event not found'), { statusCode: 404 });

  const updateData: Record<string, unknown> = { ...data };
  if (data.date) updateData.date = new Date(data.date);
  if (data.endDate) updateData.endDate = new Date(data.endDate);
  if (imageUrl) updateData.imageUrl = imageUrl;

  const result = await repos.events.updateById(id, updateData);
  const withAdmin = await attachCreatedBy(result!);
  return withAdmin;
}

export async function deleteEvent(id: string) {
  const repos = getRepos();
  const event = await repos.events.findById(id);
  if (!event) throw Object.assign(new Error('Event not found'), { statusCode: 404 });
  await repos.events.deleteById(id);
  return { message: 'Event deleted successfully' };
}

export async function getEventRsvps(eventId: string, query: Record<string, string | undefined>) {
  const { page, limit, skip } = getPaginationParams(query);
  const repos = getRepos();
  const event = await repos.events.findById(eventId);
  if (!event) throw Object.assign(new Error('Event not found'), { statusCode: 404 });

  const pipeline = [
    { $match: { eventId: new mongoose.Types.ObjectId(eventId) } },
    { $sort: { createdAt: -1 as const } },
    { $skip: skip },
    { $limit: limit },
    {
      $lookup: {
        from: 'members',
        let: { mid: '$memberId' },
        pipeline: [
          { $match: { $expr: { $eq: [{ $toString: '$_id' }, { $toString: '$$mid' }] } } },
          { $project: { _id: 0, id: { $toString: '$_id' }, fullName: 1, photoUrl: 1 } },
        ],
        as: '_member',
      },
    },
    { $addFields: { member: { $arrayElemAt: ['$_member', 0] } } },
    { $project: { _member: 0 } },
  ];

  const [data, total] = await Promise.all([
    repos.eventRsvps.aggregate<any>(pipeline),
    repos.eventRsvps.count({ eventId }),
  ]);

  // Normalize _id → id for aggregation results (plain objects)
  const normalized = data.map((d: any) => {
    const { _id, ...rest } = d;
    return { id: _id.toString(), ...rest };
  });

  return { data: normalized, meta: buildPaginationMeta(page, limit, total) };
}
