import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env';

export function errorMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('[Error]', err);

  // Zod validation error
  if (err instanceof ZodError) {
    const errors = err.errors.map((e) => ({
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

  // Prisma errors
  const prismaErr = err as Error & { code?: string; meta?: Record<string, unknown> };
  if (prismaErr.code === 'P2002') {
    const target = prismaErr.meta?.target as string[] | undefined;
    res.status(409).json({
      success: false,
      message: `A record with this ${target ? target.join(', ') : 'value'} already exists`,
    });
    return;
  }

  if (prismaErr.code === 'P2025') {
    res.status(404).json({
      success: false,
      message: 'Record not found',
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
