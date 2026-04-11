import { Request, Response, NextFunction } from 'express';
import { verifyAdminToken, AdminTokenPayload } from '../utils/jwt.utils';
import { errorResponse } from '../utils/response.utils';

declare global {
  namespace Express {
    interface Request {
      admin?: AdminTokenPayload;
    }
  }
}

export function adminMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies?.adminToken) {
      token = req.cookies.adminToken;
    }

    if (!token) {
      errorResponse(res, 'Admin access token required', 401);
      return;
    }

    const payload = verifyAdminToken(token);
    req.admin = payload;
    next();
  } catch {
    errorResponse(res, 'Invalid or expired admin token', 401);
  }
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
