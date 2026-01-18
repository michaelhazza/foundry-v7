/**
 * Rate limiting middleware.
 * Per API Contract: Auth endpoints 5 requests per 15 minutes.
 */

import rateLimit from 'express-rate-limit';
import { RateLimitError } from '../errors';

/**
 * Rate limiter for authentication endpoints.
 * 5 requests per 15 minutes per IP.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  standardHeaders: true, // Return rate limit info in RateLimit-* headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  handler: (_req, _res, next) => {
    next(new RateLimitError());
  },
  keyGenerator: (req) => {
    // Use X-Forwarded-For header if behind proxy
    return req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown';
  },
});

/**
 * General rate limiter for API endpoints.
 * 100 requests per minute per IP.
 */
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new RateLimitError());
  },
  keyGenerator: (req) => {
    return req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown';
  },
});

/**
 * Upload rate limiter.
 * 10 uploads per hour per user.
 */
export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 uploads per window
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new RateLimitError());
  },
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise IP
    return req.user?.id?.toString() || req.ip || 'unknown';
  },
});

export default { authRateLimiter, apiRateLimiter, uploadRateLimiter };
