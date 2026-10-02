import { Request, Response, NextFunction } from 'express';
import { verifyMemberToken, verifyAdminToken, MemberTokenPayload, AdminTokenPayload } from '../utils/jwt.utils';
import { isMemberTokenLive, liveAdminPermissions } from '../utils/session-state.utils';
import { errorResponse } from '../utils/response.utils';

declare global {
  namespace Express {
    interface Request {
      user?: MemberTokenPayload;
      /** Raw JSON body bytes, captured only for /api/payments/webhooks/* (signature checks). */
      rawBody?: Buffer;
    }
  }
}

function bearerToken(req: Request): string | undefined {
  const authHeader = req.headers.authorization;
  return authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
}

/**
 * Verified member access token whose account is still live (exists, not
 * suspended/inactive/deleted, issued after the last password change); else null.
 * DB errors propagate (→ 500) rather than logging the member out.
 */
export async function resolveMember(token: string | undefined): Promise<MemberTokenPayload | null> {
  if (!token) return null;
  let payload: MemberTokenPayload;
  try {
    payload = verifyMemberToken(token);
  } catch {
    return null;
  }
  return (await isMemberTokenLive(payload)) ? payload : null;
}

/**
 * Verified admin access token whose account is still active and whose role
 * still exists (see resolveMember), with the admin's effective permissions
 * attached from the live session state.
 */
export async function resolveAdmin(token: string | undefined): Promise<AdminTokenPayload | null> {
  if (!token) return null;
  let payload: AdminTokenPayload;
  try {
    payload = verifyAdminToken(token);
  } catch {
    return null;
  }
  const permissions = await liveAdminPermissions(payload);
  return permissions ? { ...payload, permissions } : null;
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = bearerToken(req) || req.cookies?.accessToken;
  if (!token) {
    errorResponse(res, 'Access token required', 401);
    return;
  }
  const member = await resolveMember(token);
  if (!member) {
    errorResponse(res, 'Invalid or expired token', 401);
    return;
  }
  req.user = member;
  next();
}

export async function optionalAuthMiddleware(req: Request, _res: Response, next: NextFunction): Promise<void> {
  // A stale or revoked token simply means "anonymous" here.
  req.user = (await resolveMember(bearerToken(req) || req.cookies?.accessToken)) ?? undefined;
  next();
}

/**
 * Accepts a member OR an admin access token (e.g. the member directory, which
 * the alumni/mobile apps and the admin dashboard all read). Sets req.user or
 * req.admin accordingly; 401 when neither verifies.
 */
export async function memberOrAdminMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const bearer = bearerToken(req);

  const memberToken = bearer || req.cookies?.accessToken;
  const member = await resolveMember(memberToken);
  if (member) {
    req.user = member;
    next();
    return;
  }

  const adminToken = bearer || req.cookies?.adminToken;
  const admin = await resolveAdmin(adminToken);
  if (admin) {
    req.admin = admin;
    next();
    return;
  }

  errorResponse(res, memberToken || adminToken ? 'Invalid or expired token' : 'Access token required', 401);
}
