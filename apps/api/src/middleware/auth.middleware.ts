import { Request, Response, NextFunction } from 'express';
import { verifyMemberToken, verifyAdminToken, MemberTokenPayload } from '../utils/jwt.utils';
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

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      errorResponse(res, 'Access token required', 401);
      return;
    }

    const payload = verifyMemberToken(token);
    req.user = payload;
    next();
  } catch {
    errorResponse(res, 'Invalid or expired token', 401);
  }
}

export function optionalAuthMiddleware(req: Request, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (token) {
      req.user = verifyMemberToken(token);
    }
  } catch {
    req.user = undefined;
  }

  next();
}

/**
 * Accepts a member OR an admin access token (e.g. the member directory, which
 * the alumni/mobile apps and the admin dashboard all read). Sets req.user or
 * req.admin accordingly; 401 when neither verifies.
 */
export function memberOrAdminMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const bearer = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : undefined;

  const memberToken = bearer || req.cookies?.accessToken;
  if (memberToken) {
    try {
      req.user = verifyMemberToken(memberToken);
      next();
      return;
    } catch { /* fall through to admin */ }
  }

  const adminToken = bearer || req.cookies?.adminToken;
  if (adminToken) {
    try {
      req.admin = verifyAdminToken(adminToken);
      next();
      return;
    } catch { /* fall through */ }
  }

  errorResponse(res, memberToken || adminToken ? 'Invalid or expired token' : 'Access token required', 401);
}
