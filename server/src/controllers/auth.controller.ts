import type { RequestHandler } from 'express';
import type { ApiSuccess, LoginInput, RegisterInput, User } from '@habit/shared';
import { getAuthUser } from '../middleware/requireAuth.js';
import { usersRepository } from '../repositories/users.repository.js';
import * as authService from '../services/auth.service.js';
import { clearAuthCookie, setAuthCookie } from '../utils/authCookie.js';
import { HttpError } from '../utils/HttpError.js';

/**
 * Auth controllers: read the (already validated) request, call the service,
 * set the cookie and send the response. No business logic lives here.
 */

/** POST /api/auth/register → 201 + login cookie */
export const register: RequestHandler = async (req, res) => {
  const user = await authService.register(req.body as RegisterInput);
  setAuthCookie(res, authService.signToken(user.id));
  res.status(201).json({ data: user } satisfies ApiSuccess<User>);
};

/** POST /api/auth/login → 200 + login cookie */
export const login: RequestHandler = async (req, res) => {
  const user = await authService.login(req.body as LoginInput);
  setAuthCookie(res, authService.signToken(user.id));
  res.json({ data: user } satisfies ApiSuccess<User>);
};

/** POST /api/auth/logout → 204, cookie removed */
export const logout: RequestHandler = (_req, res) => {
  clearAuthCookie(res);
  res.status(204).end();
};

/** GET /api/auth/me → the logged-in user (the client calls this when the app loads) */
export const me: RequestHandler = (req, res) => {
  const user = usersRepository.findById(getAuthUser(req).id);
  if (!user) throw HttpError.unauthorized();
  res.json({ data: user } satisfies ApiSuccess<User>);
};
