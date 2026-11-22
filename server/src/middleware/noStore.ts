import type { RequestHandler } from 'express';

/**
 * API responses contain personal data (habits, the user's name and email), so browsers
 * and proxies must never cache them — e.g. on a shared computer, the back button after
 * logout must not show the previous user's data from the cache.
 */
export const noStore: RequestHandler = (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
};
