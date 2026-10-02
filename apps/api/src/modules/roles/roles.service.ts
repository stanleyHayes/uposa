/**
 * Admin RBAC management: roles CRUD and per-admin role/permission overrides,
 * with the guard rules that keep the system recoverable and non-escalatable.
 */
import { getRepos } from '../../repositories';
import {
  ALL_PERMISSIONS,
  PERMISSION_CATALOG,
  SUPER_ADMIN_ROLE,
  SYSTEM_ROLES,
  computeEffectivePermissions,
} from '../../config/permissions';
import { invalidateAdminSession, invalidateAdminsWithRole } from '../../utils/session-state.utils';
import { loadRole, resolveAdminAccess } from './roles.access';

export interface Actor {
  id: string;
  role: string;
  permissions: string[];
}

export interface TargetAdmin {
  id: string;
  role: string;
  isActive: boolean;
}

const fail = (message: string, statusCode: number) => Object.assign(new Error(message), { statusCode });

export const SELF_CHANGE_MESSAGE = 'Ask another administrator to change your own permissions';
export const SUPER_ROLE_MESSAGE = 'Only a SUPER_ADMIN can assign or remove the SUPER_ADMIN role';
export const LAST_SUPER_MESSAGE = "The last active SUPER_ADMIN can't be demoted";
export const ESCALATION_MESSAGE = "You can't grant permissions you don't have yourself";

/**
 * Guard rules for changing another admin's role/overrides/active state:
 *  - nobody changes their own role or overrides (400);
 *  - only a SUPER_ADMIN assigns, removes, edits or deactivates a SUPER_ADMIN (403);
 *  - the last active SUPER_ADMIN can't be demoted or deactivated (409).
 */
export function assertAdminChangeAllowed(opts: {
  actor: Actor;
  target: TargetAdmin;
  newRole?: string;
  deactivating?: boolean;
  changesAccess?: boolean;
  activeSuperAdminCount: number;
}): void {
  const { actor, target, newRole, deactivating, changesAccess, activeSuperAdminCount } = opts;
  const roleChanges = newRole !== undefined && newRole !== target.role;

  if (String(actor.id) === String(target.id) && (roleChanges || changesAccess)) {
    throw fail(SELF_CHANGE_MESSAGE, 400);
  }

  const touchesSuperRole = (roleChanges && (newRole === SUPER_ADMIN_ROLE || target.role === SUPER_ADMIN_ROLE))
    || (target.role === SUPER_ADMIN_ROLE && !!deactivating);
  if (touchesSuperRole && actor.role !== SUPER_ADMIN_ROLE) throw fail(SUPER_ROLE_MESSAGE, 403);
  // Editing a SUPER_ADMIN's account at all (e.g. their email → password-reset takeover) needs a SUPER_ADMIN.
  if (target.role === SUPER_ADMIN_ROLE && actor.role !== SUPER_ADMIN_ROLE) {
    throw fail('Only a SUPER_ADMIN can change a SUPER_ADMIN account', 403);
  }

  const losesSuper = target.role === SUPER_ADMIN_ROLE && target.isActive && ((roleChanges && newRole !== SUPER_ADMIN_ROLE) || !!deactivating);
  if (losesSuper && activeSuperAdminCount <= 1) throw fail(LAST_SUPER_MESSAGE, 409);
}

/**
 * Anti-escalation: a non-SUPER_ADMIN can only hand out permissions they hold.
 * `added` = permissions the change newly grants (existing ones may be kept or removed freely).
 */
export function assertNoEscalation(actor: Actor, added: string[]): void {
  if (actor.role === SUPER_ADMIN_ROLE) return;
  if (added.some((p) => !actor.permissions.includes(p))) throw fail(ESCALATION_MESSAGE, 403);
}

const SYSTEM_ORDER = Object.keys(SYSTEM_ROLES);

/** Uppercase slug from a role name; unique against existing keys (MEMBER is reserved for member tokens). */
export function roleKeyFromName(name: string, existingKeys: Iterable<string>): string {
  const base = name.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40) || 'ROLE';
  const taken = new Set([...existingKeys, 'MEMBER', ...SYSTEM_ORDER]);
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}_${n}`)) n++;
  return `${base}_${n}`;
}

async function adminCounts(): Promise<Map<string, number>> {
  const rows = await getRepos().admins.aggregate<{ _id: string; n: number }>([{ $group: { _id: '$role', n: { $sum: 1 } } }]);
  return new Map(rows.map((r) => [String(r._id), r.n]));
}

function toRoleView(role: { key: string; name: string; description?: string | null; permissions: string[]; isSystem: boolean }, adminCount: number) {
  return {
    key: role.key,
    name: role.name,
    description: role.description ?? null,
    // SUPER_ADMIN always holds everything, whatever is stored.
    permissions: computeEffectivePermissions(role.key, role.permissions),
    isSystem: role.isSystem,
    adminCount,
  };
}

export function getPermissionCatalog() {
  return { catalog: PERMISSION_CATALOG };
}

export async function listRoles() {
  const [docs, counts] = await Promise.all([getRepos().roles.findMany({}, { sort: { name: 1 } }), adminCounts()]);
  const byKey = new Map(docs.map((d) => [d.key, d]));
  // System roles first (in their defined order, falling back to code defaults if not seeded), then custom by name.
  const system = SYSTEM_ORDER.map((key) => byKey.get(key) ?? { key, ...SYSTEM_ROLES[key], isSystem: true });
  const custom = docs.filter((d) => !SYSTEM_ROLES[d.key]);
  return [...system, ...custom].map((r) => toRoleView({ ...r, isSystem: !!r.isSystem || !!SYSTEM_ROLES[r.key] }, counts.get(r.key) ?? 0));
}

async function roleView(key: string) {
  const role = await loadRole(key);
  if (!role) throw fail('Role not found', 404);
  return toRoleView(role, (await adminCounts()).get(key) ?? 0);
}

export async function createRole(actor: Actor, data: { name: string; description?: string; permissions: string[] }) {
  const { roles } = getRepos();
  assertNoEscalation(actor, data.permissions);
  const existing = await roles.findMany({}, { projection: 'key' });
  const key = roleKeyFromName(data.name, existing.map((r) => r.key));
  await roles.create({ key, name: data.name, description: data.description ?? null, permissions: [...new Set(data.permissions)], isSystem: false, knownPermissions: ALL_PERMISSIONS });
  return roleView(key);
}

export async function updateRole(actor: Actor, key: string, data: { name?: string; description?: string; permissions?: string[] }) {
  const { roles } = getRepos();
  if (key === SUPER_ADMIN_ROLE) throw fail("The SUPER_ADMIN role can't be changed", 400);
  const current = await loadRole(key);
  if (!current) throw fail('Role not found', 404);

  if (data.permissions !== undefined) {
    // Editing the role you hold would change your own permissions.
    if (actor.role === key) throw fail(SELF_CHANGE_MESSAGE, 400);
    assertNoEscalation(actor, data.permissions.filter((p) => !current.permissions.includes(p)));
  }

  const updates: Record<string, unknown> = {};
  if (data.name !== undefined) updates.name = data.name;
  if (data.description !== undefined) updates.description = data.description || null;
  if (data.permissions !== undefined) updates.permissions = [...new Set(data.permissions)];

  // A system role that was never seeded is created from its defaults first.
  if (!(await roles.findOne({ key }))) {
    await roles.create({ key, name: current.name, description: current.description, permissions: current.permissions, isSystem: true, knownPermissions: ALL_PERMISSIONS });
  }
  await roles.updateOne({ key }, updates);
  await invalidateAdminsWithRole(key);
  return roleView(key);
}

export async function deleteRole(key: string) {
  const { roles, admins } = getRepos();
  if (SYSTEM_ROLES[key]) throw fail("System roles can't be deleted", 400);
  const role = await roles.findOne({ key });
  if (!role) throw fail('Role not found', 404);
  const inUse = await admins.count({ role: key });
  if (inUse > 0) throw fail(`This role is assigned to ${inUse} admin(s); reassign them first`, 409);
  await roles.deleteOne({ key });
  return { message: 'Role deleted' };
}

async function loadTargetAdmin(id: string) {
  const admin = await getRepos().admins.findById(id, { projection: 'role isActive permissionOverrides' });
  if (!admin) throw fail('Admin not found', 404);
  return admin;
}

export async function activeSuperAdminCount(): Promise<number> {
  return getRepos().admins.count({ role: SUPER_ADMIN_ROLE, isActive: true });
}

export async function getAdminPermissions(id: string) {
  const admin = await loadTargetAdmin(id);
  const access = await resolveAdminAccess(admin);
  return {
    role: access?.roleInfo ?? { key: admin.role, name: admin.role },
    grant: admin.permissionOverrides?.grant ?? [],
    revoke: admin.permissionOverrides?.revoke ?? [],
    effective: access?.permissions ?? [],
  };
}

export async function updateAdminPermissions(actor: Actor, id: string, data: { role?: string; grant?: string[]; revoke?: string[] }) {
  const { admins } = getRepos();
  const target = await loadTargetAdmin(id);

  const newRoleKey = data.role ?? target.role;
  const newRole = await loadRole(newRoleKey);
  if (!newRole) throw fail('Role not found', 404);

  assertAdminChangeAllowed({
    actor,
    target: { id: String(target.id), role: target.role, isActive: target.isActive },
    newRole: data.role,
    changesAccess: data.grant !== undefined || data.revoke !== undefined,
    activeSuperAdminCount: await activeSuperAdminCount(),
  });

  const overrides = {
    grant: [...new Set(data.grant ?? target.permissionOverrides?.grant ?? [])],
    revoke: [...new Set(data.revoke ?? target.permissionOverrides?.revoke ?? [])],
  };
  const before = (await resolveAdminAccess(target))?.permissions ?? [];
  const after = computeEffectivePermissions(newRole.key, newRole.permissions, overrides);
  assertNoEscalation(actor, after.filter((p) => !before.includes(p)));

  await admins.updateById(id, { role: newRole.key, permissionOverrides: overrides });
  invalidateAdminSession(id);
  return getAdminPermissions(id);
}
