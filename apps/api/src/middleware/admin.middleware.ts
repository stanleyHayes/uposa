import { Request, Response, NextFunction } from 'express';
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

export function requireRole(...roles: Array<'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR'>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.admin) {
      errorResponse(res, 'Admin authentication required', 401);
      return;
    }
    if (!roles.includes(req.admin.role)) {
      errorResponse(res, 'Insufficient permissions', 403);
      return;
    }
    next();
  };
}

/**
 * Financial and destructive operations (payment-provider credentials, member
 * deletion/suspension, donation/dues records, admin management): ADMIN or
 * SUPER_ADMIN. Moderators keep content moderation only.
 */
export const requireAdminRole = requireRole('SUPER_ADMIN', 'ADMIN');
