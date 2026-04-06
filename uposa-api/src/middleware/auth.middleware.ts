import { Request, Response, NextFunction } from 'express';
import { verifyMemberToken, MemberTokenPayload } from '../utils/jwt.utils';
import { errorResponse } from '../utils/response.utils';

declare global {
  namespace Express {
    interface Request {
      user?: MemberTokenPayload;
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
