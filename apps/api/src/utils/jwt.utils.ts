import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

export interface MemberTokenPayload {
  id: string;
  email: string;
  role: 'MEMBER';
}

export interface AdminTokenPayload {
  id: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR';
}

const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'];

// Access and refresh tokens share a secret, so they're told apart by `tokenType`:
// a 7-day refresh token must not work as a bearer token, and a 15-minute access
// token must not be able to mint new sessions indefinitely.
type TokenClaims = JwtPayload & { role?: string; tokenType?: 'access' | 'refresh' };

function reject(message: string): never {
  throw new jwt.JsonWebTokenError(message);
}

export function signMemberToken(payload: Omit<MemberTokenPayload, 'role'>): string {
  const options: SignOptions = { expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'] };
  return jwt.sign({ ...payload, role: 'MEMBER', tokenType: 'access' }, env.JWT_SECRET, options);
}

export function signMemberRefreshToken(payload: Omit<MemberTokenPayload, 'role'>): string {
  const options: SignOptions = { expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn'] };
  return jwt.sign({ ...payload, role: 'MEMBER', tokenType: 'refresh' }, env.JWT_SECRET, options);
}

export function signAdminToken(payload: AdminTokenPayload): string {
  const options: SignOptions = { expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'] };
  return jwt.sign({ ...payload, tokenType: 'access' }, env.JWT_ADMIN_SECRET, options);
}

export function signAdminRefreshToken(payload: AdminTokenPayload): string {
  const options: SignOptions = { expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn'] };
  return jwt.sign({ ...payload, tokenType: 'refresh' }, env.JWT_ADMIN_SECRET, options);
}

export function verifyMemberToken(token: string): MemberTokenPayload {
  const payload = jwt.verify(token, env.JWT_SECRET) as TokenClaims;
  if (payload.role !== 'MEMBER' || payload.tokenType === 'refresh') reject('Invalid access token');
  return payload as unknown as MemberTokenPayload;
}

export function verifyMemberRefreshToken(token: string): MemberTokenPayload {
  const payload = jwt.verify(token, env.JWT_SECRET) as TokenClaims;
  if (payload.role !== 'MEMBER' || (payload.tokenType !== 'refresh' && !isLegacyRefresh(payload))) reject('Invalid refresh token');
  return payload as unknown as MemberTokenPayload;
}

function isLegacyRefresh(payload: TokenClaims): boolean {
  // Refresh tokens issued before `tokenType` existed have no claim; they're the
  // long-lived ones (access tokens last minutes). Accepting them keeps existing
  // sessions alive across the deploy; they all expire within JWT_REFRESH_EXPIRES_IN.
  return payload.tokenType === undefined && (payload.exp ?? 0) - (payload.iat ?? 0) > 24 * 60 * 60;
}

export function verifyAdminRefreshToken(token: string): AdminTokenPayload {
  const payload = jwt.verify(token, env.JWT_ADMIN_SECRET) as TokenClaims;
  if (!ADMIN_ROLES.includes(String(payload.role)) || (payload.tokenType !== 'refresh' && !isLegacyRefresh(payload))) {
    reject('Invalid admin refresh token');
  }
  return payload as unknown as AdminTokenPayload;
}

export function verifyAdminToken(token: string): AdminTokenPayload {
  const payload = jwt.verify(token, env.JWT_ADMIN_SECRET) as TokenClaims;
  // The role check also keeps member tokens out if both secrets were ever set to the same value.
  if (!ADMIN_ROLES.includes(String(payload.role)) || payload.tokenType === 'refresh') reject('Invalid admin token');
  return payload as unknown as AdminTokenPayload;
}
