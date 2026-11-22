import type { CookieOptions, Response } from 'express';
import { env, isProduction } from '../config/env.js';
import { durationToMs } from './duration.js';

export const AUTH_COOKIE = 'habit_token';

/**
 * - httpOnly: JavaScript in the page can't read it, so an XSS bug can't steal the token.
 * - sameSite 'lax': the browser doesn't send it on cross-site POST/PUT/DELETE (CSRF protection).
 * - secure in production: only sent over HTTPS.
 */
const baseOptions: CookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: isProduction,
  path: '/',
};

export function setAuthCookie(res: Response, token: string): void {
  res.cookie(AUTH_COOKIE, token, { ...baseOptions, maxAge: durationToMs(env.JWT_EXPIRES_IN) });
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(AUTH_COOKIE, baseOptions);
}
