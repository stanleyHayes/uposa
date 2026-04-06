import jwt, { SignOptions } from 'jsonwebtoken';
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

export function signMemberToken(payload: Omit<MemberTokenPayload, 'role'>): string {
  const options: SignOptions = { expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'] };
  return jwt.sign({ ...payload, role: 'MEMBER' }, env.JWT_SECRET, options);
}

export function signMemberRefreshToken(payload: Omit<MemberTokenPayload, 'role'>): string {
  const options: SignOptions = { expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn'] };
  return jwt.sign({ ...payload, role: 'MEMBER' }, env.JWT_SECRET, options);
}

export function signAdminToken(payload: AdminTokenPayload): string {
  const options: SignOptions = { expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'] };
  return jwt.sign(payload, env.JWT_ADMIN_SECRET, options);
}

export function signAdminRefreshToken(payload: AdminTokenPayload): string {
  const options: SignOptions = { expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn'] };
  return jwt.sign(payload, env.JWT_ADMIN_SECRET, options);
}

export function verifyMemberToken(token: string): MemberTokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as MemberTokenPayload;
}

export function verifyAdminToken(token: string): AdminTokenPayload {
  return jwt.verify(token, env.JWT_ADMIN_SECRET) as AdminTokenPayload;
}
