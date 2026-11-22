import type { Request, RequestHandler } from 'express';
import { usersRepository } from '../repositories/users.repository.js';
import { verifyToken } from '../services/auth.service.js';
import type { AuthUser } from '../types/express.js';
import { AUTH_COOKIE } from '../utils/authCookie.js';
import { HttpError } from '../utils/HttpError.js';

/**
 * Protects routes: reads the login cookie, verifies the JWT and sets `req.user`.
 * Anything wrong (no cookie, bad signature, expired, user deleted) → 401.
 *
 * Apply it once at router level so a new route can't accidentally be left public:
 *   router.use(requireAuth);
 */
export const requireAuth: RequestHandler = (req, _res, next) => {
  const cookies = req.cookies as Record<string, string | undefined>;
  const token = cookies[AUTH_COOKIE];
  const userId = token ? verifyToken(token) : null;

  // Also check the user still exists, so tokens of deleted accounts stop working.
  if (userId === null || !usersRepository.findById(userId)) {
    next(HttpError.unauthorized());
    return;
  }

  req.user = { id: userId };
  next();
};

/** Returns the logged-in user in a handler that runs after requireAuth. */
export function getAuthUser(req: Request): AuthUser {
  if (!req.user) throw HttpError.unauthorized();
  return req.user;
}
