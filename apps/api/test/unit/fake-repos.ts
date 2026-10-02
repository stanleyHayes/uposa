/**
 * In-memory stand-ins for the members/admins repositories so auth/session code
 * can be unit-tested without MongoDB. Supports the filter shapes those code
 * paths use: equality, `_id`, and `{ $gt }`.
 */
import { getRepos, setRepos, resetRepos } from '../../src/repositories';
import { clearSessionStateCache } from '../../src/utils/session-state.utils';

type Doc = Record<string, unknown> & { id: string };

function matches(doc: Doc, filter: Record<string, unknown>): boolean {
  return Object.entries(filter).every(([key, expected]) => {
    const actual = key === '_id' ? doc.id : doc[key];
    if (expected && typeof expected === 'object' && '$gt' in expected) {
      return actual instanceof Date && actual > (expected as { $gt: Date }).$gt;
    }
    return actual === expected;
  });
}

export function fakeRepo(docs: Doc[]) {
  const calls = { findById: 0 };
  return {
    docs,
    calls,
    async findById(id: string) {
      calls.findById++;
      return docs.find((d) => d.id === String(id)) ?? null;
    },
    async findOne(filter: Record<string, unknown>) {
      return docs.find((d) => matches(d, filter)) ?? null;
    },
    async findMany(filter: Record<string, unknown> = {}) {
      return docs.filter((d) => matches(d, filter));
    },
    async count(filter: Record<string, unknown> = {}) {
      return docs.filter((d) => matches(d, filter)).length;
    },
    async updateById(id: string, data: Record<string, unknown>) {
      const doc = docs.find((d) => d.id === String(id));
      if (!doc) return null;
      Object.assign(doc, data);
      return doc;
    },
    async updateOne(filter: Record<string, unknown>, data: Record<string, unknown>) {
      const doc = docs.find((d) => matches(d, filter));
      if (!doc) return null;
      Object.assign(doc, data);
      return doc;
    },
    async create(data: Record<string, unknown>) {
      const doc = { id: String(docs.length + 1).padStart(24, '0'), ...data } as Doc;
      docs.push(doc);
      return doc;
    },
    async deleteOne(filter: Record<string, unknown>) {
      const i = docs.findIndex((d) => matches(d, filter));
      return i === -1 ? null : docs.splice(i, 1)[0];
    },
    async aggregate() {
      return [];
    },
  };
}

/**
 * Swap in fake members/admins/roles repos (everything else stays real). With no
 * roles given, system roles resolve to their code defaults. Returns the fakes.
 */
export function installFakeAccounts(members: Doc[] = [], admins: Doc[] = [], roles: Doc[] = []) {
  const fakes = { members: fakeRepo(members), admins: fakeRepo(admins), roles: fakeRepo(roles) };
  setRepos({ ...getRepos(), ...fakes } as never);
  clearSessionStateCache();
  return fakes;
}

export function restoreRepos(): void {
  resetRepos();
  clearSessionStateCache();
}
