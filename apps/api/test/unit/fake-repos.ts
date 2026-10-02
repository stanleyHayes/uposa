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
    async updateById(id: string, data: Record<string, unknown>) {
      const doc = docs.find((d) => d.id === String(id));
      if (!doc) return null;
      Object.assign(doc, data);
      return doc;
    },
  };
}

/** Swap in fake members/admins repos (everything else stays real). Returns them for assertions. */
export function installFakeAccounts(members: Doc[] = [], admins: Doc[] = []) {
  const fakes = { members: fakeRepo(members), admins: fakeRepo(admins) };
  setRepos({ ...getRepos(), ...fakes } as never);
  clearSessionStateCache();
  return fakes;
}

export function restoreRepos(): void {
  resetRepos();
  clearSessionStateCache();
}
