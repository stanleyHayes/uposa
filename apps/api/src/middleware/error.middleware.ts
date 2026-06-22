import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env';
import { logger } from '../config/logger';

export function errorMiddleware(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const status = (err as Error & { statusCode?: number }).statusCode;
  // 5xx (and unknown) are real problems; 4xx are expected client errors.
  if (!status || status >= 500) {
    logger.error({ err, method: req.method, url: req.originalUrl }, 'Request error');
  } else {
    logger.warn({ err: err.message, method: req.method, url: req.originalUrl }, 'Request rejected');
  }

  // Zod validation error
  if (err instanceof ZodError) {
    const errors = err.issues.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
    return;
  }

  // Multer errors
  if (err.name === 'MulterError') {
    res.status(400).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      message: 'Invalid token',
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      message: 'Token expired',
    });
    return;
  }

  // Malformed ObjectId / invalid query cast (e.g. a bad id in the URL) → 400, not 500
  if (err.name === 'CastError' || err.name === 'BSONError') {
    res.status(400).json({
      success: false,
      message: 'Invalid identifier',
    });
    return;
  }

  // MongoDB duplicate key error
  const mongoErr = err as Error & { code?: number; keyPattern?: Record<string, number> };
  if (mongoErr.code === 11000) {
    const fields = mongoErr.keyPattern ? Object.keys(mongoErr.keyPattern).join(', ') : 'value';
    res.status(409).json({
      success: false,
      message: `A record with this ${fields} already exists`,
    });
    return;
  }

  // Generic server error
  const statusCode = (err as Error & { statusCode?: number }).statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 ? 'Internal server error' : err.message,
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

export function notFoundMiddleware(_req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
}
