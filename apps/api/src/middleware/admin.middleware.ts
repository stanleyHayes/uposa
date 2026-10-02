import { Request, Response, NextFunction, RequestHandler } from 'express';
import { forbiddenMessage, isKnownPermission } from '../config/permissions';
import { AdminTokenPayload } from '../utils/jwt.utils';
import { resolveAdmin } from './auth.middleware';
import { errorResponse } from '../utils/response.utils';

declare global {
  namespace Express {
    interface Request {
      admin?: AdminTokenPayload;
    }
  }
}

export async function adminMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : req.cookies?.adminToken;

  if (!token) {
    errorResponse(res, 'Admin access token required', 401);
    return;
  }

  // Also checks the live account: deactivation, a password change or a role
  // change revokes the token immediately (see utils/session-state.utils.ts).
  const admin = await resolveAdmin(token);
  if (!admin) {
    errorResponse(res, 'Invalid or expired admin token', 401);
    return;
  }
  req.admin = admin;
  next();
}

/** True when the authenticated admin's effective permissions include `permission`. */
export function hasPermission(req: Request, permission: string): boolean {
  return !!req.admin?.permissions?.includes(permission);
}

/** Inline check inside a handler/service flow: throws 403 with the standard message. */
export function ensurePermission(req: Request, permission: string): void {
  if (!hasPermission(req, permission)) {
    throw Object.assign(new Error(forbiddenMessage(permission)), { statusCode: 403 });
  }
}

/**
 * Route guard: mount after adminMiddleware on EVERY admin route
 * (`resource:action` from config/permissions.ts). The test in
 * test/unit/rbac.test.ts walks the router stack and fails if a route lacks one.
 */
export function requirePermission(permission: string): RequestHandler & { requiredPermission: string } {
  if (!isKnownPermission(permission)) throw new Error(`Unknown permission "${permission}"`);
  const guard = (req: Request, res: Response, next: NextFunction): void => {
    if (!req.admin) {
      errorResponse(res, 'Admin authentication required', 401);
      return;
    }
    if (!hasPermission(req, permission)) {
      errorResponse(res, forbiddenMessage(permission), 403);
      return;
    }
    next();
  };
  return Object.assign(guard, { requiredPermission: permission });
}

/**
 * Route guard for endpoints shared by two resources (e.g. the member list serves
 * both Members and Registrations): passes with ANY of the permissions; the
 * handler then narrows with ensurePermission/hasPermission. Counts as a
 * requirePermission for the route-coverage test.
 */
export function requireAnyPermission(...permissions: string[]): RequestHandler & { requiredPermission: string; anyOf: string[] } {
  for (const p of permissions) if (!isKnownPermission(p)) throw new Error(`Unknown permission "${p}"`);
  const guard = (req: Request, res: Response, next: NextFunction): void => {
    if (!req.admin) {
      errorResponse(res, 'Admin authentication required', 401);
      return;
    }
    if (!permissions.some((p) => hasPermission(req, p))) {
      errorResponse(res, forbiddenMessage(permissions[0]), 403);
      return;
    }
    next();
  };
  return Object.assign(guard, { requiredPermission: permissions.join('|'), anyOf: permissions });
}
