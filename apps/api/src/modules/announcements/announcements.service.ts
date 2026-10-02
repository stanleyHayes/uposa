import { getRepos } from '../../repositories';
import { getPaginationParams, buildPaginationMeta } from '../../utils/pagination.utils';
import { escapeRegex } from '../../utils/search.utils';
import { CreateAnnouncementInput, UpdateAnnouncementInput } from './announcements.validation';

const STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];

async function attachCreatedByMany<T extends { createdById?: unknown }>(docs: T[]) {
  const adminIds = [...new Set(docs.map(d => d.createdById).filter(Boolean))];
  if (adminIds.length === 0) return docs.map(d => ({ ...d, createdBy: null }));
  const repos = getRepos();
  const adminDocs = await repos.admins.findMany({ _id: { $in: adminIds } }, { projection: 'fullName' });
  const adminMap = new Map(adminDocs.map(a => [String(a.id), { id: a.id, fullName: a.fullName }]));
  return docs.map(d => ({ ...d, createdBy: adminMap.get(String(d.createdById)) || null }));
}

async function attachCreatedBy<T extends { createdById?: unknown }>(doc: T) {
  const [withAdmin] = await attachCreatedByMany([doc]);
  return withAdmin;
}

/** '' / null → no expiry; otherwise the parsed date. */
function toExpiry(value: string | null | undefined): Date | null {
  return value ? new Date(value) : null;
}

async function listVisible(audiences: string[], query: Record<string, string | undefined>) {
  const { page, limit, skip } = getPaginationParams(query);
  const repos = getRepos();
  const where = {
    status: 'PUBLISHED',
    audience: { $in: audiences },
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  };

  const [rawData, total] = await Promise.all([
    repos.announcements.findMany(where, { sort: { publishedAt: -1 }, skip, limit }),
    repos.announcements.count(where),
  ]);

  const data = await attachCreatedByMany(rawData);
  return { data, meta: buildPaginationMeta(page, limit, total) };
}

/** Public: published, audience ALL, not expired. */
export function listPublicAnnouncements(query: Record<string, string | undefined>) {
  return listVisible(['ALL'], query);
}

/** Signed-in members: published, audience ALL or MEMBERS, not expired. */
export function listMemberAnnouncements(query: Record<string, string | undefined>) {
  return listVisible(['ALL', 'MEMBERS'], query);
}

export async function adminListAnnouncements(query: Record<string, string | undefined>) {
  const { page, limit, skip } = getPaginationParams(query);
  const { status, search } = query;
  const repos = getRepos();

  const where: Record<string, unknown> = {};
  if (status && STATUSES.includes(status.toUpperCase())) where.status = status.toUpperCase();
  if (search) {
    where.$or = [
      { title: { $regex: escapeRegex(search), $options: 'i' } },
      { body: { $regex: escapeRegex(search), $options: 'i' } },
    ];
  }

  const [rawData, total] = await Promise.all([
    repos.announcements.findMany(where, { sort: { createdAt: -1 }, skip, limit }),
    repos.announcements.count(where),
  ]);

  const data = await attachCreatedByMany(rawData);
  return { data, meta: buildPaginationMeta(page, limit, total) };
}

export async function getAnnouncementById(id: string) {
  const announcement = await getRepos().announcements.findById(id);
  if (!announcement) throw Object.assign(new Error('Announcement not found'), { statusCode: 404 });
  return attachCreatedBy(announcement);
}

export async function createAnnouncement(adminId: string, data: CreateAnnouncementInput) {
  const status = data.status || 'DRAFT';
  const announcement = await getRepos().announcements.create({
    title: data.title,
    body: data.body,
    type: data.type || 'INFO',
    status,
    audience: data.audience || 'ALL',
    publishedAt: status === 'PUBLISHED' ? new Date() : null,
    expiresAt: toExpiry(data.expiresAt),
    createdById: adminId,
  });
  return attachCreatedBy(announcement);
}

export async function updateAnnouncement(id: string, data: UpdateAnnouncementInput) {
  const repos = getRepos();
  const existing = await repos.announcements.findById(id);
  if (!existing) throw Object.assign(new Error('Announcement not found'), { statusCode: 404 });

  const updates: Record<string, unknown> = {};
  if (data.title !== undefined) updates.title = data.title;
  if (data.body !== undefined) updates.body = data.body;
  if (data.type !== undefined) updates.type = data.type;
  if (data.audience !== undefined) updates.audience = data.audience;
  if (data.expiresAt !== undefined) updates.expiresAt = toExpiry(data.expiresAt);
  if (data.status !== undefined) {
    updates.status = data.status;
    // publishedAt records the FIRST publication; re-publishing keeps it.
    if (data.status === 'PUBLISHED' && !existing.publishedAt) updates.publishedAt = new Date();
  }

  const result = await repos.announcements.updateById(id, updates);
  if (!result) throw Object.assign(new Error('Announcement not found'), { statusCode: 404 });
  return attachCreatedBy(result);
}

export async function deleteAnnouncement(id: string) {
  const deleted = await getRepos().announcements.deleteById(id);
  if (!deleted) throw Object.assign(new Error('Announcement not found'), { statusCode: 404 });
  return { message: 'Announcement deleted successfully' };
}
