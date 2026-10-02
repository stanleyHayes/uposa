/**
 * Role lookup and effective-permission resolution, shared by the session-state
 * cache, login/refresh/me and the roles endpoints.
 */
import { getRepos } from '../../repositories';
import { logger } from '../../config/logger';
import { ALL_PERMISSIONS, SYSTEM_ROLES, computeEffectivePermissions, migrateRolePermissions, PermissionOverrides } from '../../config/permissions';

export interface ResolvedRole {
  key: string;
  name: string;
  description: string | null;
  permissions: string[];
  isSystem: boolean;
}

/**
 * The role from the DB; system roles fall back to their code defaults if the
 * DB copy is missing (e.g. before seeding finishes), so a deploy never locks
 * admins out. Null for an unknown key.
 */
export async function loadRole(key: string): Promise<ResolvedRole | null> {
  const doc = await getRepos().roles.findOne({ key });
  if (doc) {
    return { key: doc.key, name: doc.name, description: doc.description ?? null, permissions: doc.permissions ?? [], isSystem: !!doc.isSystem };
  }
  const system = SYSTEM_ROLES[key];
  return system ? { key, name: system.name, description: system.description, permissions: system.permissions, isSystem: true } : null;
}

/** Effective permissions + role info for an admin record; null when their role no longer exists. */
export async function resolveAdminAccess(admin: { role: string; permissionOverrides?: PermissionOverrides | null }) {
  const role = await loadRole(admin.role);
  if (!role) return null;
  return {
    roleInfo: { key: role.key, name: role.name },
    permissions: computeEffectivePermissions(role.key, role.permissions, admin.permissionOverrides),
  };
}

/**
 * Startup role sync:
 *  1. seed SUPER_ADMIN / ADMIN / MODERATOR if missing (never overwrite them —
 *     ADMIN/MODERATOR permissions may have been edited by a super admin);
 *  2. additive catalog migration: give system roles the default permissions
 *     that are NEW to the catalog since their last sync (never re-adding one an
 *     admin removed), and advance every role's knownPermissions.
 */
export async function ensureSystemRoles(): Promise<void> {
  const { roles } = getRepos();
  for (const [key, def] of Object.entries(SYSTEM_ROLES)) {
    if (await roles.findOne({ key })) continue;
    try {
      await roles.create({ key, name: def.name, description: def.description, permissions: def.permissions, isSystem: true, knownPermissions: ALL_PERMISSIONS });
      logger.info({ role: key }, 'Seeded system role');
    } catch (err) {
      if ((err as { code?: number }).code !== 11000) throw err; // another instance seeded it first
    }
  }

  for (const role of await roles.findMany({})) {
    const defaults = SYSTEM_ROLES[role.key]?.permissions ?? [];
    const result = migrateRolePermissions(role, ALL_PERMISSIONS, defaults);
    if (!result.changed) continue;
    await roles.updateOne({ key: role.key }, { permissions: result.permissions, knownPermissions: result.knownPermissions });
    const added = result.permissions.filter((p) => !(role.permissions ?? []).includes(p));
    if (added.length) logger.info({ role: role.key, added }, 'Added new catalog permissions to system role');
  }
}
