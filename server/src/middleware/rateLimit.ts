import { rateLimit, type RateLimitRequestHandler } from 'express-rate-limit';
import type { ApiError } from '@habit/shared';
import { isTest } from '../config/env.js';

const FIFTEEN_MINUTES = 15 * 60 * 1000;

interface LimiterOptions {
  limit: number;
  windowMs?: number;
  message?: string;
}

/**
 * Creates a rate limiter that answers in our normal error format.
 * Counts are kept in memory per IP (fine for a single server; they reset on restart).
 */
export function createRateLimiter({
  limit,
  windowMs = FIFTEEN_MINUTES,
  message = 'Too many requests, please try again later',
}: LimiterOptions): RateLimitRequestHandler {
  const body: ApiError = { error: { message } };
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-8', // sends RateLimit-* headers so clients know when to retry
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json(body);
    },
  });
}

/**
 * Login / register: 10 attempts per 15 minutes per IP — slows down password guessing.
 * The API tests make many auth requests from one "IP", so the limit is raised there;
 * the limiter itself is tested separately with a small limit.
 */
export const authLimiter = createRateLimiter({
  limit: isTest ? 1000 : 10,
  message: 'Too many attempts, please try again in 15 minutes',
});

/** Everything else under /api: generous, just stops runaway scripts. */
export const apiLimiter = createRateLimiter({ limit: isTest ? 10_000 : 300 });
