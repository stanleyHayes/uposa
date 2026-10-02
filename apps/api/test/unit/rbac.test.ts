import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import express, { RequestHandler } from 'express';

import {
  ALL_PERMISSIONS,
  PERMISSION_CATALOG,
  SYSTEM_ROLES,
  computeEffectivePermissions,
  forbiddenMessage,
  migrateRolePermissions,
} from '../../src/config/permissions';
import { isRegistrationRejection } from '../../src/modules/members/members.controller';
import preRbacRoutes from './fixtures/pre-rbac-admin-routes.json';
import { requirePermission } from '../../src/middleware/admin.middleware';
import {
  assertAdminChangeAllowed,
  assertNoEscalation,
  roleKeyFromName,
  updateAdminPermissions,
  updateRole,
  SELF_CHANGE_MESSAGE,
  SUPER_ROLE_MESSAGE,
  LAST_SUPER_MESSAGE,
} from '../../src/modules/roles/roles.service';
import { getAdminSessionState, invalidateAdminsWithRole } from '../../src/utils/session-state.utils';
import { installFakeAccounts, restoreRepos } from './fake-repos';

// ── Route discovery ─────────────────────────────────────────────
// Express 5 layers don't keep their mount path, so record it as routers are mounted.
type Guard = RequestHandler & { requiredPermission?: string; anyOf?: string[] };
type Layer = {
  route?: { path: string; methods: Record<string, boolean>; stack: Array<{ handle: Guard }> };
  handle?: { stack?: Layer[] };
  __mountPath?: string;
};
type RouteInfo = { method: string; path: string; permissions: string[]; guards: Guard[] };

const routes: RouteInfo[] = [];

beforeAll(async () => {
  const proto = (express.Router as unknown as { prototype: { use: (...args: unknown[]) => unknown; stack?: Layer[] } }).prototype;
  const originalUse = proto.use;
  proto.use = function patchedUse(this: { stack: Layer[] }, ...args: unknown[]) {
    const mount = typeof args[0] === 'string' ? args[0] : '';
    const before = this.stack.length;
    const result = originalUse.apply(this, args);
    for (const layer of this.stack.slice(before)) layer.__mountPath = mount;
    return result;
  };
  const { default: app } = await import('../../src/app');
  proto.use = originalUse;

  const walk = (stack: Layer[], prefix: string) => {
    for (const layer of stack) {
      if (layer.route) {
        for (const method of Object.keys(layer.route.methods)) {
          routes.push({
            method: method.toUpperCase(),
            path: prefix + layer.route.path,
            permissions: layer.route.stack.map((s) => s.handle.requiredPermission).filter((p): p is string => !!p),
            guards: layer.route.stack.map((s) => s.handle).filter((h) => !!h.requiredPermission),
          });
        }
      } else if (layer.handle?.stack) {
        const mount = layer.__mountPath && layer.__mountPath !== '/' ? layer.__mountPath : '';
        walk(layer.handle.stack, prefix + mount);
      }
    }
  };
  walk((app as unknown as { router: { stack: Layer[] } }).router.stack, '');
});

const isAdminRoute = (path: string) => /^\/api\/admin(\/|$)/.test(path) || /\/admin(\/|$)/.test(path);

// Available to every active admin (no permission needed) and public admin-auth endpoints.
const ANY_ACTIVE_ADMIN = new Set([
  'GET /api/admin/dashboard/stats',
  'PUT /api/admin/profile',
  'PUT /api/admin/change-password',
  'GET /api/admin/notifications/',
  'GET /api/admin/notifications/unread-count',
  'PUT /api/admin/notifications/:id/read',
  'PUT /api/admin/notifications/read-all',
]);
const isPublicAdminAuth = (path: string) => path.startsWith('/api/auth/admin/');

const route = (method: string, path: string) => {
  const found = routes.find((r) => r.method === method && r.path === path);
  if (!found) throw new Error(`Route not found: ${method} ${path}`);
  return found;
};

describe('route coverage', () => {
  it('discovers the app routes', () => {
    expect(routes.length).toBeGreaterThan(150);
    expect(routes.some((r) => r.path === '/api/admin/members/:id/suspend')).toBe(true);
  });

  it('every admin route has requirePermission (except the any-active-admin allow-list)', () => {
    const missing = routes
      .filter((r) => isAdminRoute(r.path) && !isPublicAdminAuth(r.path) && !ANY_ACTIVE_ADMIN.has(`${r.method} ${r.path}`))
      .filter((r) => r.permissions.length === 0)
      .map((r) => `${r.method} ${r.path}`);
    expect(missing).toEqual([]);
  });

  it('the allow-list only contains routes that exist', () => {
    for (const key of ANY_ACTIVE_ADMIN) {
      const [method, path] = key.split(' ');
      expect(routes.some((r) => r.method === method && r.path === path), key).toBe(true);
    }
  });
});

// ── Effective permissions ───────────────────────────────────────
describe('computeEffectivePermissions', () => {
  it('is (role ∪ grant) − revoke, in catalog order', () => {
    expect(computeEffectivePermissions('EDITOR', ['news:view', 'news:edit'], { grant: ['events:view'], revoke: ['news:edit'] }))
      .toEqual(['events:view', 'news:view']);
  });

  it('gives SUPER_ADMIN everything regardless of its stored list or revokes', () => {
    expect(computeEffectivePermissions('SUPER_ADMIN', [], { revoke: ['roles:edit'] })).toEqual(ALL_PERMISSIONS);
  });

  it('ignores unknown permission strings safely', () => {
    expect(computeEffectivePermissions('X', ['news:view', 'bogus:thing', 'news:explode'], { grant: ['nope'], revoke: ['also:nope'] })).toEqual(['news:view']);
    expect(computeEffectivePermissions('X', null, null)).toEqual([]);
  });

  it('catalog matches the contract shape', () => {
    expect(PERMISSION_CATALOG.find((e) => e.resource === 'members')?.actions).toEqual(['view', 'edit', 'delete']);
    expect(PERMISSION_CATALOG.find((e) => e.resource === 'registrations')).toMatchObject({ label: 'Registrations', actions: ['view', 'edit'] });
    expect(PERMISSION_CATALOG.find((e) => e.resource === 'mentorship')?.actions).toEqual(['view', 'delete']);
    expect(PERMISSION_CATALOG.find((e) => e.resource === 'about')).toMatchObject({ label: 'About page & documents', actions: ['view', 'edit'] });
    expect(PERMISSION_CATALOG.find((e) => e.resource === 'ai')?.actions).toEqual(['create']);
    expect(ALL_PERMISSIONS).toContain('payment_methods:edit');
    expect(forbiddenMessage('payment_methods:edit')).toBe("You don't have permission to edit payment methods");
    expect(forbiddenMessage('ai:create')).toBe("You don't have permission to create AI writing assistant");
  });
});

// ── Seeded defaults reproduce the pre-RBAC behaviour ────────────
describe('system role defaults', () => {
  const allowed = (role: string, perm: string) => role === 'SUPER_ADMIN' || SYSTEM_ROLES[role].permissions.includes(perm);
  // A route admits a role when every guard passes (requireAnyPermission: any one of its permissions).
  const rolesFor = (method: string, path: string) => {
    const guards = route(method, path).guards;
    return ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'].filter((role) => guards.every((g) => (g.anyOf ?? [g.requiredPermission as string]).some((p) => allowed(role, p))));
  };
  const ALL = ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'];
  const ADMIN_PLUS = ['SUPER_ADMIN', 'ADMIN'];

  it.each([
    // any admin before (adminMiddleware only)
    ['GET', '/api/admin/members/', ALL],
    ['GET', '/api/donations/admin', ALL],
    ['GET', '/api/payments/admin', ALL],
    ['GET', '/api/admin/admins', ALL],
    ['POST', '/api/news/admin', ALL],
    ['DELETE', '/api/forum/admin/posts/:id', ALL],
    ['PUT', '/api/admin/reports/:id', ALL],
    ['POST', '/api/admin/ai/writing', ALL],
    ['PUT', '/api/admin/newsletter/:id/unsubscribe', ALL],
    ['GET', '/api/admin/site/config', ALL],
    // requireAdminRole before (ADMIN / SUPER_ADMIN)
    ['PUT', '/api/admin/members/:id/suspend', ADMIN_PLUS],
    ['DELETE', '/api/admin/members/:id', ADMIN_PLUS],
    ['POST', '/api/donations/admin', ADMIN_PLUS],
    ['PUT', '/api/donations/admin/:id/confirm', ADMIN_PLUS],
    ['POST', '/api/dues/admin/bulk', ADMIN_PLUS],
    ['PUT', '/api/payment-methods/admin/:id', ADMIN_PLUS],
    // (PUT /api/admin/site/config/:key is gated per key — see 'site config per-key permissions')
    ['DELETE', '/api/admin/newsletter/:id', ADMIN_PLUS],
    // requireRole('SUPER_ADMIN') before
    ['POST', '/api/admin/admins', ['SUPER_ADMIN']],
    ['DELETE', '/api/admin/admins/:id', ['SUPER_ADMIN']],
  ])('%s %s → %j', (method, path, expected) => {
    expect(rolesFor(method as string, path as string)).toEqual(expected);
  });

  it('every pre-RBAC admin route keeps exactly the same per-role access (snapshot of HEAD guards)', () => {
    const before: Record<string, string[]> = { ALL, 'ALL(member-or-admin)': ALL, ADMIN_PLUS, SUPER: ['SUPER_ADMIN'] };
    // Intentional exceptions (both narrowed per request in the handler):
    //  - registrations:edit covers reject as well as approve → moderators may move PENDING → INACTIVE only;
    //  - site config is gated per key → moderators (about:edit) may write the About-page keys only.
    const EXCEPTIONS: Record<string, string[]> = {
      'PUT /api/admin/members/:id/status': ALL,
      'PUT /api/admin/site/config/:key': ALL,
    };
    const mismatches = Object.entries(preRbacRoutes as Record<string, string>)
      .map(([key, cls]) => {
        const [method, path] = key.split(' ');
        const now = rolesFor(method, path);
        const expected = EXCEPTIONS[key] ?? before[cls];
        return JSON.stringify(now) === JSON.stringify(expected) ? null : `${key}: expected ${expected} got ${now}`;
      })
      .filter(Boolean);
    expect(Object.keys(preRbacRoutes).length).toBe(121);
    expect(mismatches).toEqual([]);
  });

  it('moderators keep approve, mentorship moderation, documents and year-group reps', () => {
    expect(rolesFor('PUT', '/api/admin/members/:id/approve')).toEqual(ALL);
    expect(rolesFor('DELETE', '/api/mentorship/admin/requests/:id')).toEqual(ALL);
    expect(rolesFor('POST', '/api/admin/site/upload-document')).toEqual(ALL);
    expect(rolesFor('POST', '/api/admin/site/year-group-reps')).toEqual(ALL);
  });

  it('only a pending → inactive change counts as rejecting a registration', () => {
    expect(isRegistrationRejection('PENDING', 'INACTIVE')).toBe(true);
    expect(isRegistrationRejection('ACTIVE', 'INACTIVE')).toBe(false);
    expect(isRegistrationRejection('PENDING', 'SUSPENDED')).toBe(false);
  });

  it('report SUSPEND_AUTHOR still needs what only ADMIN+ had (members:edit)', () => {
    expect(allowed('MODERATOR', 'members:edit')).toBe(false);
    expect(allowed('ADMIN', 'members:edit')).toBe(true);
  });
});

// ── requirePermission middleware ────────────────────────────────
describe('requirePermission', () => {
  function run(mw: RequestHandler, admin?: { permissions: string[] }) {
    let status = 0;
    let message = '';
    let nexted = false;
    const res = { status(s: number) { status = s; return this; }, json(b: { message: string }) { message = b.message; return this; } };
    mw({ admin } as never, res as never, () => { nexted = true; });
    return { status, message, nexted };
  }

  it('passes with the permission, 403s without, 401s without an admin', () => {
    const guard = requirePermission('news:delete');
    expect(run(guard, { permissions: ['news:delete'] }).nexted).toBe(true);
    expect(run(guard, { permissions: ['news:view'] })).toEqual({ status: 403, message: "You don't have permission to delete news", nexted: false });
    expect(run(guard).status).toBe(401);
  });

  it('refuses to guard a route with a permission not in the catalog', () => {
    expect(() => requirePermission('news:explode')).toThrow(/Unknown permission/);
  });
});

// ── Guard rules ─────────────────────────────────────────────────
describe('admin change guards', () => {
  const superActor = { id: 's1', role: 'SUPER_ADMIN', permissions: ALL_PERMISSIONS };
  const adminActor = { id: 'a1', role: 'ADMIN', permissions: [...SYSTEM_ROLES.ADMIN.permissions, 'roles:edit'] };

  it('blocks changing your own role or overrides', () => {
    expect(() => assertAdminChangeAllowed({ actor: superActor, target: { id: 's1', role: 'SUPER_ADMIN', isActive: true }, newRole: 'ADMIN', activeSuperAdminCount: 3 })).toThrow(SELF_CHANGE_MESSAGE);
    expect(() => assertAdminChangeAllowed({ actor: adminActor, target: { id: 'a1', role: 'ADMIN', isActive: true }, changesAccess: true, activeSuperAdminCount: 3 })).toThrow(SELF_CHANGE_MESSAGE);
  });

  it('only a SUPER_ADMIN assigns or removes SUPER_ADMIN', () => {
    expect(() => assertAdminChangeAllowed({ actor: adminActor, target: { id: 'x', role: 'MODERATOR', isActive: true }, newRole: 'SUPER_ADMIN', activeSuperAdminCount: 1 })).toThrow(SUPER_ROLE_MESSAGE);
    expect(() => assertAdminChangeAllowed({ actor: adminActor, target: { id: 'x', role: 'SUPER_ADMIN', isActive: true }, newRole: 'ADMIN', activeSuperAdminCount: 2 })).toThrow(SUPER_ROLE_MESSAGE);
    expect(() => assertAdminChangeAllowed({ actor: superActor, target: { id: 'x', role: 'MODERATOR', isActive: true }, newRole: 'SUPER_ADMIN', activeSuperAdminCount: 1 })).not.toThrow();
  });

  it("the last active SUPER_ADMIN can't be demoted or deactivated (409)", () => {
    const lastSuper = { id: 'x', role: 'SUPER_ADMIN', isActive: true };
    expect(() => assertAdminChangeAllowed({ actor: superActor, target: lastSuper, newRole: 'ADMIN', activeSuperAdminCount: 1 })).toThrow(LAST_SUPER_MESSAGE);
    expect(() => assertAdminChangeAllowed({ actor: superActor, target: lastSuper, deactivating: true, activeSuperAdminCount: 1 })).toThrow(LAST_SUPER_MESSAGE);
    expect(() => assertAdminChangeAllowed({ actor: superActor, target: lastSuper, newRole: 'ADMIN', activeSuperAdminCount: 2 })).not.toThrow();
    try {
      assertAdminChangeAllowed({ actor: superActor, target: lastSuper, newRole: 'ADMIN', activeSuperAdminCount: 1 });
    } catch (err) {
      expect((err as { statusCode: number }).statusCode).toBe(409);
    }
  });

  it("non-super admins can't hand out permissions they don't hold", () => {
    expect(() => assertNoEscalation(adminActor, ['admin_users:delete'])).toThrow(/don't have yourself/);
    expect(() => assertNoEscalation(adminActor, ['news:delete'])).not.toThrow();
    expect(() => assertNoEscalation(superActor, ['admin_users:delete'])).not.toThrow();
  });

  it('generates unique uppercase role keys and reserves MEMBER and system keys', () => {
    expect(roleKeyFromName('Content editor', [])).toBe('CONTENT_EDITOR');
    expect(roleKeyFromName('Content editor!', ['CONTENT_EDITOR', 'CONTENT_EDITOR_2'])).toBe('CONTENT_EDITOR_3');
    expect(roleKeyFromName('member', [])).toBe('MEMBER_2');
    expect(roleKeyFromName('Admin', [])).toBe('ADMIN_2');
  });
});

// ── Service-level rules + cache invalidation (in-memory repos) ──
describe('admin permission changes (service)', () => {
  afterEach(restoreRepos);
  const S1 = '000000000000000000000001';
  const S2 = '000000000000000000000002';
  const M1 = '000000000000000000000003';
  const superActor = { id: S1, role: 'SUPER_ADMIN', permissions: ALL_PERMISSIONS };

  it('updates role + overrides, returns { role, grant, revoke, effective }, and rejects unknown roles', async () => {
    installFakeAccounts([], [
      { id: S1, role: 'SUPER_ADMIN', isActive: true },
      { id: M1, role: 'MODERATOR', isActive: true, permissionOverrides: { grant: [], revoke: [] } },
    ]);
    const result = await updateAdminPermissions(superActor, M1, { role: 'ADMIN', revoke: ['donations:delete'], grant: ['roles:view'] });
    expect(result.role).toEqual({ key: 'ADMIN', name: 'Admin' });
    expect(result.grant).toEqual(['roles:view']);
    expect(result.revoke).toEqual(['donations:delete']);
    expect(result.effective).toContain('roles:view');
    expect(result.effective).not.toContain('donations:delete');

    await expect(updateAdminPermissions(superActor, M1, { role: 'NOPE' })).rejects.toMatchObject({ statusCode: 404 });
    await expect(updateAdminPermissions(superActor, S1, { grant: [] })).rejects.toMatchObject({ statusCode: 400, message: SELF_CHANGE_MESSAGE });
  });

  it('refuses to demote the last active SUPER_ADMIN', async () => {
    installFakeAccounts([], [
      { id: S1, role: 'SUPER_ADMIN', isActive: true },
      { id: S2, role: 'SUPER_ADMIN', isActive: false },
    ]);
    const otherSuper = { id: S2, role: 'SUPER_ADMIN', permissions: ALL_PERMISSIONS };
    await expect(updateAdminPermissions(otherSuper, S1, { role: 'ADMIN' })).rejects.toMatchObject({ statusCode: 409 });
  });

  it("SUPER_ADMIN's role can't be edited; editing another role refreshes its holders' cached permissions", async () => {
    const { roles } = installFakeAccounts([], [{ id: M1, role: 'MODERATOR', isActive: true }], [
      { id: 'r1', key: 'MODERATOR', name: 'Moderator', permissions: ['news:view'], isSystem: true },
    ]);
    await expect(updateRole(superActor, 'SUPER_ADMIN', { name: 'Boss' })).rejects.toMatchObject({ statusCode: 400 });

    expect((await getAdminSessionState(M1))?.permissions).toEqual(['news:view']);
    roles.docs[0].permissions = ['news:view', 'news:edit'];
    expect((await getAdminSessionState(M1))?.permissions).toEqual(['news:view']); // cached…
    await invalidateAdminsWithRole('MODERATOR');
    expect((await getAdminSessionState(M1))?.permissions).toEqual(['news:view', 'news:edit']); // …until invalidated

    await updateRole(superActor, 'MODERATOR', { permissions: ['news:view'] }); // updateRole invalidates itself
    expect((await getAdminSessionState(M1))?.permissions).toEqual(['news:view']);
  });

  it('a role key that no longer exists ends the session', async () => {
    installFakeAccounts([], [{ id: M1, role: 'GONE', isActive: true }]);
    expect(await getAdminSessionState(M1)).toMatchObject({ roleExists: false, permissions: [] });
  });
});

// ── Additive catalog migration ──────────────────────────────────
describe('migrateRolePermissions', () => {
  const v1 = ['news:view', 'news:edit', 'events:view'];
  const v2 = [...v1, 'about:view', 'about:edit'];

  it('adds defaults that are new to the catalog and advances knownPermissions', () => {
    const r = migrateRolePermissions({ permissions: ['news:view', 'news:edit'], knownPermissions: v1 }, v2, ['news:view', 'news:edit', 'about:view']);
    expect(r.permissions).toEqual(['news:view', 'news:edit', 'about:view']); // about:edit isn't a default → not granted
    expect(r.knownPermissions).toEqual(v2);
    expect(r.changed).toBe(true);
  });

  it('never re-adds a default an admin removed', () => {
    // news:edit was known and removed by an admin → stays removed even though it's a default.
    const r = migrateRolePermissions({ permissions: ['news:view'], knownPermissions: v2 }, v2, ['news:view', 'news:edit']);
    expect(r).toEqual({ permissions: ['news:view'], knownPermissions: v2, changed: false });
  });

  it('custom roles (no defaults) only get knownPermissions updated', () => {
    const r = migrateRolePermissions({ permissions: ['events:view'], knownPermissions: v1 }, v2, []);
    expect(r.permissions).toEqual(['events:view']);
    expect(r.knownPermissions).toEqual(v2);
  });

  it('a role stored before knownPermissions existed is not granted anything', () => {
    const r = migrateRolePermissions({ permissions: ['news:view'] }, v2, v2);
    expect(r.permissions).toEqual(['news:view']);
    expect(r.knownPermissions).toEqual(v2);
    expect(r.changed).toBe(true);
  });
});

describe('startup role sync (ensureSystemRoles)', () => {
  afterEach(restoreRepos);

  it('seeds missing system roles and migrates stored ones without undoing admin removals', async () => {
    const { ensureSystemRoles } = await import('../../src/modules/roles/roles.access');
    const oldCatalog = ALL_PERMISSIONS.filter((p) => !p.startsWith('about:'));
    const moderatorWithoutForum = SYSTEM_ROLES.MODERATOR.permissions.filter((p) => !p.startsWith('about:') && p !== 'forum:delete');
    const { roles } = installFakeAccounts([], [], [
      { id: 'r-mod', key: 'MODERATOR', name: 'Moderator', isSystem: true, permissions: moderatorWithoutForum, knownPermissions: oldCatalog },
      { id: 'r-custom', key: 'EDITOR', name: 'Editor', isSystem: false, permissions: ['news:view'], knownPermissions: oldCatalog },
    ]);
    await ensureSystemRoles();

    const byKey = (key: string) => roles.docs.find((r) => r.key === key) as { permissions: string[]; knownPermissions: string[] };
    expect(byKey('SUPER_ADMIN')).toBeTruthy();
    expect(byKey('ADMIN').permissions).toEqual(SYSTEM_ROLES.ADMIN.permissions);
    expect(byKey('MODERATOR').permissions).toEqual(expect.arrayContaining(['about:view', 'about:edit'])); // new → added
    expect(byKey('MODERATOR').permissions).not.toContain('forum:delete'); // removed by an admin → stays removed
    expect(byKey('EDITOR').permissions).toEqual(['news:view']); // custom → nothing granted
    expect(byKey('EDITOR').knownPermissions).toEqual(ALL_PERMISSIONS);
  });
});

describe('end-to-end through the app (in-memory accounts)', () => {
  afterEach(restoreRepos);
  const ADMIN_ID = '000000000000000000000009';

  it('a custom role without members:view gets 403 on the directory and member admin', async () => {
    const request = (await import('supertest')).default;
    const { default: app } = await import('../../src/app');
    const { signAdminToken } = await import('../../src/utils/jwt.utils');
    installFakeAccounts([], [{ id: ADMIN_ID, role: 'NEWS_DESK', isActive: true }], [
      { id: 'r1', key: 'NEWS_DESK', name: 'News desk', isSystem: false, permissions: ['news:view'] },
    ]);
    const token = signAdminToken({ id: ADMIN_ID, email: 'n@x.com', role: 'NEWS_DESK' });

    const directory = await request(app).get('/api/members/directory').set('Authorization', `Bearer ${token}`);
    expect(directory.status).toBe(403);
    expect(directory.body.message).toBe("You don't have permission to view members");

    const members = await request(app).delete('/api/admin/members/000000000000000000000001').set('Authorization', `Bearer ${token}`);
    expect(members.status).toBe(403);
    expect(members.body.message).toBe("You don't have permission to delete members");
  });
});

describe('site config per-key permissions', () => {
  afterEach(restoreRepos);

  it('maps About-page keys to about:* and everything else to site:*', async () => {
    const { configKeyPermission, ABOUT_CONFIG_KEYS } = await import('../../src/modules/site-data/site-data.service');
    expect([...ABOUT_CONFIG_KEYS]).toEqual(['mission', 'history', 'stats', 'schoolInfo', 'impactStories', 'constitution']);
    for (const key of ABOUT_CONFIG_KEYS) {
      expect(configKeyPermission(key, 'edit')).toBe('about:edit');
      expect(configKeyPermission(key, 'view')).toBe('about:view');
    }
    for (const key of ['contact', 'social', 'payment', 'dues', 'donationAllocation', 'PAYMENT_PLATFORM_FEE_PERCENT', 'anythingNew']) {
      expect(configKeyPermission(key, 'edit')).toBe('site:edit');
      expect(configKeyPermission(key, 'view')).toBe('site:view');
    }
  });

  it('validates the constitution value', async () => {
    const { constitutionSchema } = await import('../../src/modules/site-data/site-data.service');
    expect(constitutionSchema.safeParse({ url: 'https://res.cloudinary.com/x/raw/upload/c.pdf', summary: 'Our constitution' }).success).toBe(true);
    expect(constitutionSchema.safeParse({ url: '', summary: '' }).success).toBe(true);
    expect(constitutionSchema.safeParse({ url: 'http://insecure.example/c.pdf', summary: '' }).success).toBe(false);
    expect(constitutionSchema.safeParse({ url: 'javascript:alert(1)', summary: '' }).success).toBe(false);
    expect(constitutionSchema.safeParse({ url: 'https://x.org/c.pdf' }).success).toBe(false);
  });

  it('enforces per key and filters the admin config list to what the caller may view', async () => {
    const request = (await import('supertest')).default;
    const { default: app } = await import('../../src/app');
    const { signAdminToken } = await import('../../src/utils/jwt.utils');
    const { getRepos, setRepos } = await import('../../src/repositories');
    const MOD = '000000000000000000000010';
    const ABOUT_ONLY = '000000000000000000000011';
    installFakeAccounts([], [
      { id: MOD, role: 'MODERATOR', isActive: true },
      { id: ABOUT_ONLY, role: 'ABOUT_EDITOR', isActive: true },
    ], [{ id: 'r1', key: 'ABOUT_EDITOR', name: 'About editor', isSystem: false, permissions: ['about:view', 'about:edit'] }]);
    const store: Record<string, unknown> = { mission: 'M', payment: { momo: '024' }, contact: { phone: '1' } };
    const siteConfig = {
      async findMany() { return Object.entries(store).map(([key, value]) => ({ key, value })); },
      async upsert(_f: unknown, data: { key: string; value: unknown }) { store[data.key] = data.value; return data; },
    };
    setRepos({ ...getRepos(), siteConfig } as never);
    const auth = (id: string, role: string) => ({ Authorization: `Bearer ${signAdminToken({ id, email: 'x@x.com', role })}` });

    // MODERATOR: About keys yes (new), site config no (as before RBAC).
    expect((await request(app).put('/api/admin/site/config/mission').set(auth(MOD, 'MODERATOR')).send({ value: 'New mission' })).status).toBe(200);
    const payment = await request(app).put('/api/admin/site/config/payment').set(auth(MOD, 'MODERATOR')).send({ value: {} });
    expect(payment.status).toBe(403);
    expect(payment.body.message).toBe("You don't have permission to edit site settings");

    // A role with about:* only sees and edits About keys.
    const list = await request(app).get('/api/admin/site/config').set(auth(ABOUT_ONLY, 'ABOUT_EDITOR'));
    expect(list.status).toBe(200);
    expect(Object.keys(list.body.data)).toEqual(['mission']);
    const bad = await request(app).put('/api/admin/site/config/constitution').set(auth(ABOUT_ONLY, 'ABOUT_EDITOR')).send({ value: { url: 'http://x', summary: '' } });
    expect(bad.status).toBe(422);
    expect((await request(app).put('/api/admin/site/config/constitution').set(auth(ABOUT_ONLY, 'ABOUT_EDITOR')).send({ value: { url: '', summary: 'Draft' } })).status).toBe(200);
    expect(store.constitution).toEqual({ url: '', summary: 'Draft' });
  });
});

describe('approving a suspended member', () => {
  it('needs members:edit (registrations reviewers cannot reverse a suspension)', async () => {
    const { installFakeAccounts, restoreRepos } = await import('./fake-repos');
    const { approveMember } = await import('../../src/modules/members/members.service');
    const id = 'a'.repeat(24);
    try {
      installFakeAccounts([{ id, membershipStatus: 'SUSPENDED', email: 's@example.com', fullName: 'Suspended Person' }]);
      await expect(approveMember(id, { canReinstate: false })).rejects.toMatchObject({ statusCode: 403 });
      const approved = await approveMember(id, { canReinstate: true });
      expect(approved).toMatchObject({ membershipStatus: 'ACTIVE' });
    } finally {
      restoreRepos();
    }
  });
});
