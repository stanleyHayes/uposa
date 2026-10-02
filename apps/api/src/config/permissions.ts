/**
 * Admin RBAC permission catalog — the single source of truth.
 * A permission is `${resource}:${action}`. Each resource lists only the actions
 * that make sense for it. Enforced by requirePermission() on every admin route.
 */

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete';

export interface PermissionCatalogEntry {
  resource: string;
  label: string;
  description: string;
  actions: PermissionAction[];
}

const CRUD: PermissionAction[] = ['view', 'create', 'edit', 'delete'];

export const PERMISSION_CATALOG: PermissionCatalogEntry[] = [
  { resource: 'registrations', label: 'Registrations', description: 'Review and approve or reject new member registrations', actions: ['view', 'edit'] },
  { resource: 'members', label: 'Members', description: 'Member records (edit = suspend, change status, profile changes)', actions: ['view', 'edit', 'delete'] },
  { resource: 'mentorship', label: 'Mentorship', description: 'Mentorship requests and the mentor list', actions: ['view', 'delete'] },
  { resource: 'dues', label: 'Dues', description: 'Membership dues (create includes bulk; edit = mark paid)', actions: CRUD },
  { resource: 'donations', label: 'Donations', description: 'Donation records (edit includes confirming)', actions: CRUD },
  { resource: 'payments', label: 'Payments', description: 'Online payment transactions', actions: ['view'] },
  { resource: 'payment_methods', label: 'Payment methods', description: 'Payment providers and their credentials', actions: ['view', 'edit'] },
  { resource: 'events', label: 'Events', description: 'Events and RSVPs', actions: CRUD },
  { resource: 'news', label: 'News', description: 'News articles', actions: CRUD },
  { resource: 'projects', label: 'Projects', description: 'Association projects', actions: CRUD },
  { resource: 'announcements', label: 'Announcements', description: 'Announcements to the public and members', actions: CRUD },
  { resource: 'executives', label: 'Executives', description: 'Association executives', actions: CRUD },
  { resource: 'school_leaders', label: 'School leaders', description: 'School leadership profiles', actions: CRUD },
  { resource: 'gallery', label: 'Gallery', description: 'Gallery images and categories', actions: CRUD },
  { resource: 'jobs', label: 'Jobs', description: 'Job board posts and applications', actions: CRUD },
  { resource: 'polls', label: 'Polls', description: 'Member polls', actions: CRUD },
  { resource: 'elections', label: 'Elections', description: 'Elections and results', actions: CRUD },
  { resource: 'forum', label: 'Forum', description: 'Forum moderation (edit = edit, pin, lock, hide)', actions: ['view', 'edit', 'delete'] },
  { resource: 'reports', label: 'Reports', description: 'Content reports (edit = resolve; suspending an author also needs Members: edit)', actions: ['view', 'edit'] },
  { resource: 'contact', label: 'Contact messages', description: 'Contact messages and transcript requests', actions: ['view', 'edit', 'delete'] },
  { resource: 'newsletter', label: 'Newsletter', description: 'Newsletter subscribers', actions: ['view', 'edit', 'delete'] },
  { resource: 'about', label: 'About page & documents', description: 'About-page content, uploaded documents (constitution, forms) and year-group representatives', actions: ['view', 'edit'] },
  { resource: 'site', label: 'Site settings', description: 'Site config: contact details, payment details shown to donors, platform fee', actions: ['view', 'edit'] },
  { resource: 'admin_users', label: 'Admin users', description: 'Administrator accounts', actions: CRUD },
  { resource: 'roles', label: 'Roles and permissions', description: 'Create, edit and delete roles; assign roles and permissions to admins', actions: ['view', 'edit'] },
  { resource: 'ai', label: 'AI writing assistant', description: 'Use the AI writing assistant', actions: ['create'] },
];

export const ALL_PERMISSIONS: string[] = PERMISSION_CATALOG.flatMap((e) => e.actions.map((a) => `${e.resource}:${a}`));
const KNOWN = new Set(ALL_PERMISSIONS);

export function isKnownPermission(permission: string): boolean {
  return KNOWN.has(permission);
}

/** "You don't have permission to edit members" (acronym labels like "AI …" keep their case). */
export function forbiddenMessage(permission: string): string {
  const [resource, action] = permission.split(':');
  const label = PERMISSION_CATALOG.find((e) => e.resource === resource)?.label ?? resource;
  const noun = /^[A-Z]{2}/.test(label) ? label : label.charAt(0).toLowerCase() + label.slice(1);
  return `You don't have permission to ${action} ${noun}`;
}

// ── System roles ──
// Defaults reproduce the pre-RBAC server behaviour: any admin passed
// adminMiddleware; requireAdminRole (financial/destructive) was ADMIN+;
// admin create/edit/delete was SUPER_ADMIN only. test/unit/rbac.test.ts checks
// every admin route against a snapshot of the pre-RBAC guards.

export const SUPER_ADMIN_ROLE = 'SUPER_ADMIN';

const ADMIN_DEFAULTS = ALL_PERMISSIONS.filter((p) => !['admin_users:create', 'admin_users:edit', 'admin_users:delete', 'roles:view', 'roles:edit'].includes(p));

const MODERATOR_EXCLUDED = new Set([
  'members:edit', 'members:delete',
  'dues:create', 'dues:edit', 'dues:delete',
  'donations:create', 'donations:edit', 'donations:delete',
  'payment_methods:edit',
  'newsletter:delete',
  'site:edit',
]);

export const SYSTEM_ROLES: Record<string, { name: string; description: string; permissions: string[] }> = {
  SUPER_ADMIN: {
    name: 'Super Admin',
    description: 'Full access to everything, always. Cannot be changed or deleted.',
    permissions: ALL_PERMISSIONS,
  },
  ADMIN: {
    name: 'Admin',
    description: 'Runs the association: content, members, finances and settings. Cannot manage admin accounts or roles.',
    permissions: ADMIN_DEFAULTS,
  },
  MODERATOR: {
    name: 'Moderator',
    description: 'Content and community moderation. No financial, destructive member or settings changes.',
    permissions: ADMIN_DEFAULTS.filter((p) => !MODERATOR_EXCLUDED.has(p)),
  },
};

/**
 * Additive catalog migration for a stored role. Permissions that are new to the
 * catalog (not in `knownPermissions`) and in the role's code defaults are added;
 * anything already known is left exactly as stored, so a permission an admin
 * removed is never re-added. Custom roles (no defaults) only get their
 * knownPermissions advanced. A role with no knownPermissions yet (stored before
 * this existed) is treated as already knowing the whole catalog: nothing granted.
 */
export function migrateRolePermissions(
  role: { permissions?: string[] | null; knownPermissions?: string[] | null },
  catalog: string[],
  defaults: string[] = [],
): { permissions: string[]; knownPermissions: string[]; changed: boolean } {
  const permissions = [...(role.permissions ?? [])];
  const known = role.knownPermissions ? new Set(role.knownPermissions) : new Set(catalog);
  const added = catalog.filter((p) => !known.has(p) && defaults.includes(p) && !permissions.includes(p));
  const knownChanged = !role.knownPermissions
    || role.knownPermissions.length !== catalog.length
    || catalog.some((p) => !role.knownPermissions!.includes(p));
  return { permissions: [...permissions, ...added], knownPermissions: [...catalog], changed: added.length > 0 || knownChanged };
}

export interface PermissionOverrides {
  grant?: string[] | null;
  revoke?: string[] | null;
}

/**
 * Effective permissions = SUPER_ADMIN ? everything : (role ∪ grant) − revoke.
 * Unknown strings (e.g. from a removed catalog entry) are ignored. Returned in
 * catalog order.
 */
export function computeEffectivePermissions(
  roleKey: string,
  rolePermissions: string[] | null | undefined,
  overrides?: PermissionOverrides | null,
): string[] {
  if (roleKey === SUPER_ADMIN_ROLE) return [...ALL_PERMISSIONS];
  const granted = new Set([...(rolePermissions ?? []), ...(overrides?.grant ?? [])]);
  for (const p of overrides?.revoke ?? []) granted.delete(p);
  return ALL_PERMISSIONS.filter((p) => granted.has(p));
}
