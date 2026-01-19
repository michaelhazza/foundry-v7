/**
 * Global error handler middleware.
 * Converts errors to standard API error envelopes.
 * Per Constitution Section C: Error envelope format.
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors';
import { sendError } from '../lib/response';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log error for debugging (not full stack in production)
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', err);
  } else {
    console.error('Error:', err.message);
  }

  // Handle known operational errors
  if (err instanceof AppError && err.isOperational) {
    sendError(res, err.code, err.message, err.statusCode);
    return;
  }

  // Handle Zod validation errors
  if (err.name === 'ZodError') {
    const zodError = err as unknown as { errors: Array<{ message: string; path: string[] }> };
    const message = zodError.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    sendError(res, 'VALIDATION_ERROR', message, 400);
    return;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    sendError(res, 'UNAUTHORIZED', 'Invalid token', 401);
    return;
  }

  if (err.name === 'TokenExpiredError') {
    sendError(res, 'TOKEN_EXPIRED', 'Token has expired', 401);
    return;
  }

  // Handle multer file upload errors
  if (err.name === 'MulterError') {
    const multerErr = err as unknown as { code: string };
    if (multerErr.code === 'LIMIT_FILE_SIZE') {
      sendError(res, 'UPLOAD_TOO_LARGE', 'File exceeds maximum size limit (50MB)', 413);
      return;
    }
  }

  // Default to internal server error for unknown errors
  sendError(res, 'INTERNAL_ERROR', 'An unexpected error occurred', 500);
}
