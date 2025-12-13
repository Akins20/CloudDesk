import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import { env } from '../config/environment';
import { RATE_LIMIT_CONSTANTS, HTTP_STATUS, ERROR_CODES } from '../config/constants';
import { logger } from '../utils/logger';

interface RateLimitOptions {
  windowMs?: number;
  max?: number;
  message?: string;
  keyGenerator?: (req: Express.Request) => string;
}

/**
 * Create a rate limiter middleware
 */
export const createRateLimiter = (options: RateLimitOptions = {}): RateLimitRequestHandler => {
  const {
    windowMs = env.RATE_LIMIT_WINDOW_MS,
    max = env.RATE_LIMIT_MAX_REQUESTS,
    message = 'Too many requests, please try again later',
    keyGenerator,
  } = options;

  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      error: {
        message,
        code: ERROR_CODES.VALIDATION_ERROR,
      },
    },
    statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
    standardHeaders: true,
    legacyHeaders: false,
    validate: { xForwardedForHeader: false, default: false },
    keyGenerator: keyGenerator || ((req) => {
      // Use X-Forwarded-For if available, otherwise use IP
      const forwarded = req.headers['x-forwarded-for'];
      if (forwarded) {
        const ips = typeof forwarded === 'string' ? forwarded : forwarded[0];
        return ips.split(',')[0].trim();
      }
      return (req as unknown as { ip?: string }).ip || 'unknown';
    }),
    handler: (req, res, _next, options) => {
      logger.warn('Rate limit exceeded', {
        ip: (req as unknown as { ip?: string }).ip,
        path: req.path,
        method: req.method,
      });
      res.status(options.statusCode).json(options.message);
    },
  });
};

/**
 * General API rate limiter
 */
export const apiLimiter = createRateLimiter();

/**
 * Strict rate limiter for authentication endpoints
 */
export const authLimiter = createRateLimiter({
  windowMs: RATE_LIMIT_CONSTANTS.AUTH_WINDOW_MS,
  max: RATE_LIMIT_CONSTANTS.AUTH_MAX_REQUESTS,
  message: 'Too many authentication attempts, please try again later',
});

/**
 * Rate limiter for session endpoints (connect/disconnect)
 */
export const sessionLimiter = createRateLimiter({
  windowMs: 60000, // 1 minute
  max: 10, // 10 connections per minute
  message: 'Too many connection attempts, please try again later',
});

/**
 * Very strict rate limiter for sensitive operations
 */
export const strictLimiter = createRateLimiter({
  windowMs: 3600000, // 1 hour
  max: 5, // 5 attempts per hour
  message: 'Too many attempts, please try again later',
});

/**
 * Rate limiter by user ID (requires authentication)
 */
export const userLimiter = createRateLimiter({
  keyGenerator: (req) => {
    const authReq = req as unknown as { user?: { userId: string }; ip?: string };
    return authReq.user?.userId || authReq.ip || 'unknown';
  },
});

export default {
  createRateLimiter,
  apiLimiter,
  authLimiter,
  sessionLimiter,
  strictLimiter,
  userLimiter,
};
