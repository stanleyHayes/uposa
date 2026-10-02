/**
 * Member blocking (UGC safety). A block is one-way in what the blocker sees
 * (the blocked member's forum posts/comments, jobs and directory entry are
 * hidden from them) plus: the blocked member can't open the blocker's profile,
 * the two are hidden from each other in the directory, and mentorship requests
 * between them are refused in both directions.
 */
import { getRepos } from '../../repositories';

const TTL_MS = 30_000;
const cache = new Map<string, { ids: string[]; expiresAt: number }>();

async function cachedIds(key: string, load: () => Promise<string[]>): Promise<string[]> {
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && hit.expiresAt > now) return hit.ids;
  const ids = await load();
  if (cache.size > 5_000) cache.clear();
  cache.set(key, { ids, expiresAt: now + TTL_MS });
  return ids;
}

/** Members `memberId` has blocked. */
export function getBlockedIds(memberId: string | undefined): Promise<string[]> {
  if (!memberId) return Promise.resolve([]);
  return cachedIds(`blocked:${memberId}`, async () =>
    (await getRepos().memberBlocks.findMany({ blockerId: memberId }, { projection: 'blockedId' })).map((b) => String(b.blockedId)));
}

/** Members who have blocked `memberId`. */
export function getBlockerIds(memberId: string | undefined): Promise<string[]> {
  if (!memberId) return Promise.resolve([]);
  return cachedIds(`blockers:${memberId}`, async () =>
    (await getRepos().memberBlocks.findMany({ blockedId: memberId }, { projection: 'blockerId' })).map((b) => String(b.blockerId)));
}

/** Both directions — for the directory (neither side sees the other). */
export async function getMutuallyHiddenIds(memberId: string | undefined): Promise<string[]> {
  const [blocked, blockers] = await Promise.all([getBlockedIds(memberId), getBlockerIds(memberId)]);
  return [...new Set([...blocked, ...blockers])];
}

export async function isBlockedEitherWay(a: string, b: string): Promise<boolean> {
  const [aBlocked, bBlocked] = await Promise.all([getBlockedIds(a), getBlockedIds(b)]);
  return aBlocked.includes(String(b)) || bBlocked.includes(String(a));
}

export function invalidateBlockCache(blockerId: string, blockedId: string): void {
  cache.delete(`blocked:${blockerId}`);
  cache.delete(`blockers:${blockedId}`);
}

/** Test helper. */
export function clearBlockCache(): void {
  cache.clear();
}

export async function blockMember(blockerId: string, memberId: string) {
  const { members, memberBlocks } = getRepos();
  if (String(blockerId) === String(memberId)) {
    throw Object.assign(new Error('You cannot block yourself'), { statusCode: 400 });
  }
  const target = await members.findById(memberId, { projection: 'fullName photoUrl membershipStatus' });
  if (!target || target.membershipStatus === 'DELETED') {
    throw Object.assign(new Error('Member not found'), { statusCode: 404 });
  }

  // Idempotent: an existing block (or a concurrent duplicate insert) is fine.
  let block = await memberBlocks.findOne({ blockerId, blockedId: memberId });
  if (!block) {
    try {
      block = await memberBlocks.create({ blockerId, blockedId: memberId });
    } catch (err) {
      if ((err as { code?: number }).code !== 11000) throw err;
      block = await memberBlocks.findOne({ blockerId, blockedId: memberId });
    }
  }
  invalidateBlockCache(blockerId, memberId);
  return { id: String(memberId), fullName: target.fullName, photoUrl: target.photoUrl ?? null, blockedAt: block?.createdAt ?? new Date() };
}

export async function unblockMember(blockerId: string, memberId: string) {
  await getRepos().memberBlocks.deleteMany({ blockerId, blockedId: memberId });
  invalidateBlockCache(blockerId, memberId);
  return { message: 'Member unblocked' };
}

export async function listBlocks(blockerId: string) {
  const { members, memberBlocks } = getRepos();
  const blocks = await memberBlocks.findMany({ blockerId }, { sort: { createdAt: -1 } });
  if (blocks.length === 0) return [];
  const people = await members.findMany({ _id: { $in: blocks.map((b) => b.blockedId) } }, { projection: 'fullName photoUrl' });
  const byId = new Map(people.map((m) => [String(m.id), m]));
  return blocks.map((b) => {
    const m = byId.get(String(b.blockedId));
    return { id: String(b.blockedId), fullName: m?.fullName ?? 'Deleted member', photoUrl: m?.photoUrl ?? null, blockedAt: b.createdAt };
  });
}
