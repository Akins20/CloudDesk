import rateLimit from 'express-rate-limit';
import { env } from '../config/environment';
import { RateLimitError } from '../utils/errors';

/**
 * General API rate limiter
 */
export const apiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new RateLimitError('Too many requests, please try again later.'));
  },
});

/**
 * Strict rate limiter for authentication endpoints
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  message: 'Too many login attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new RateLimitError('Too many login attempts, please try again later.'));
  },
});

/**
 * Very strict rate limiter for license validation
 * (Self-hosted instances should only validate on startup)
 */
export const validationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 validations per hour per IP
  message: 'Too many validation requests.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new RateLimitError('Too many validation requests.'));
  },
});

/**
 * Webhook rate limiter (Stripe sends multiple events)
 */
export const webhookLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 webhooks per minute
  message: 'Too many webhook requests.',
  standardHeaders: true,
  legacyHeaders: false,
});
