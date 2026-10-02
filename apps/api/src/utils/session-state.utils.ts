/**
 * Live account state for access-token checks. Access tokens are stateless JWTs,
 * so on their own a suspended/deleted member or a deactivated admin kept access
 * until expiry. Every authenticated request (HTTP and Socket.IO) now checks the
 * account too, via a small in-process TTL cache so it isn't a DB hit per request.
 * Writes that revoke access call invalidate*() so they take effect immediately
 * (Render runs a single instance, so an in-process cache is coherent).
 */
import { getRepos } from '../repositories';
import { issuedBeforePasswordChange } from './jwt.utils';
import { resolveAdminAccess } from '../modules/roles/roles.access';

const TTL_MS = 30_000;
const MAX_ENTRIES = 5_000;

export interface MemberSessionState {
  membershipStatus?: string;
  passwordChangedAt?: Date | null;
}

export interface AdminSessionState {
  isActive?: boolean;
  role?: string;
  passwordChangedAt?: Date | null;
  /** False when the admin's role key no longer exists in the roles collection. */
  roleExists?: boolean;
  roleName?: string;
  /** Effective permissions (role ∪ grant − revoke; everything for SUPER_ADMIN). */
  permissions?: string[];
}

type Entry = { state: MemberSessionState | AdminSessionState | null; expiresAt: number };
const cache = new Map<string, Entry>();

const BLOCKED_MEMBER_STATUSES = new Set(['SUSPENDED', 'INACTIVE', 'DELETED']);

/** Pure check: member exists, isn't suspended/inactive/deleted, token not older than the last password change. */
export function isMemberSessionValid(state: MemberSessionState | null, iat: number | undefined): boolean {
  if (!state) return false;
  if (BLOCKED_MEMBER_STATUSES.has(String(state.membershipStatus))) return false;
  return !issuedBeforePasswordChange(iat, state.passwordChangedAt);
}

/**
 * Pure check: admin exists, is active, token not older than the last password
 * change, and still carries the admin's current role (a demotion takes effect
 * now; a refresh mints a token with the new role).
 */
export function isAdminSessionValid(state: AdminSessionState | null, iat: number | undefined, role?: string): boolean {
  if (!state || !state.isActive || state.roleExists === false) return false;
  if (role !== undefined && state.role !== undefined && role !== state.role) return false;
  return !issuedBeforePasswordChange(iat, state.passwordChangedAt);
}

function readCache<T>(key: string, now: number): T | null | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (entry.expiresAt <= now) {
    cache.delete(key);
    return undefined;
  }
  return entry.state as T | null;
}

function writeCache(key: string, state: MemberSessionState | AdminSessionState | null, now: number): void {
  if (cache.size >= MAX_ENTRIES) {
    for (const [k, e] of cache) if (e.expiresAt <= now) cache.delete(k);
    if (cache.size >= MAX_ENTRIES) cache.clear();
  }
  cache.set(key, { state, expiresAt: now + TTL_MS });
}

export async function getMemberSessionState(id: string, now = Date.now()): Promise<MemberSessionState | null> {
  const key = `member:${id}`;
  const cached = readCache<MemberSessionState>(key, now);
  if (cached !== undefined) return cached;
  const member = await getRepos().members.findById(id, { projection: 'membershipStatus passwordChangedAt' });
  const state = member ? { membershipStatus: member.membershipStatus, passwordChangedAt: member.passwordChangedAt ?? null } : null;
  writeCache(key, state, now);
  return state;
}

export async function getAdminSessionState(id: string, now = Date.now()): Promise<AdminSessionState | null> {
  const key = `admin:${id}`;
  const cached = readCache<AdminSessionState>(key, now);
  if (cached !== undefined) return cached;
  const admin = await getRepos().admins.findById(id, { projection: 'isActive role passwordChangedAt permissionOverrides' });
  let state: AdminSessionState | null = null;
  if (admin) {
    const access = await resolveAdminAccess(admin);
    state = {
      isActive: admin.isActive,
      role: admin.role,
      passwordChangedAt: admin.passwordChangedAt ?? null,
      roleExists: !!access,
      roleName: access?.roleInfo.name,
      permissions: access?.permissions ?? [],
    };
  }
  writeCache(key, state, now);
  return state;
}

export async function isMemberTokenLive(payload: { id: string; iat?: number }): Promise<boolean> {
  return isMemberSessionValid(await getMemberSessionState(payload.id), payload.iat);
}

export async function isAdminTokenLive(payload: { id: string; iat?: number; role?: string }): Promise<boolean> {
  return (await liveAdminPermissions(payload)) !== null;
}

/** Effective permissions for a live admin session, or null when the session is no longer valid. */
export async function liveAdminPermissions(payload: { id: string; iat?: number; role?: string }): Promise<string[] | null> {
  const state = await getAdminSessionState(payload.id);
  return isAdminSessionValid(state, payload.iat, payload.role) ? state?.permissions ?? [] : null;
}

/** Drop the cached state so the next request re-reads the account (suspension, password change, deletion…). */
export function invalidateMemberSession(id: string): void {
  cache.delete(`member:${String(id)}`);
}

export function invalidateAdminSession(id: string): void {
  cache.delete(`admin:${String(id)}`);
}

/** After a role's permissions change: drop every admin holding it. */
export async function invalidateAdminsWithRole(roleKey: string): Promise<void> {
  const holders = await getRepos().admins.findMany({ role: roleKey }, { projection: '_id' });
  for (const admin of holders) invalidateAdminSession(String(admin.id));
}

/** Test helper. */
export function clearSessionStateCache(): void {
  cache.clear();
}
