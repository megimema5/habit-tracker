import type { RequestHandler } from 'express';
import { env } from '../config/env.js';
import { HttpError } from '../utils/HttpError.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Extra CSRF protection on top of the SameSite cookie, for requests that change data.
 *
 * 1. Content-Type must be JSON when a body type is sent. A malicious site can submit an
 *    HTML form to our API, but forms can only send urlencoded / multipart / text —
 *    never application/json — so those requests are rejected (415).
 * 2. If the browser sends an Origin header, it must be our own client's origin (403).
 *
 * GET requests never change data in this API, so they are always allowed.
 */
export const csrfProtection: RequestHandler = (req, _res, next) => {
  if (SAFE_METHODS.has(req.method)) {
    next();
    return;
  }

  const contentType = req.headers['content-type'];
  if (contentType && !contentType.toLowerCase().startsWith('application/json')) {
    next(new HttpError(415, 'Content-Type must be application/json'));
    return;
  }

  const origin = req.headers.origin;
  if (origin && origin !== env.CLIENT_ORIGIN) {
    next(new HttpError(403, 'Request origin not allowed'));
    return;
  }

  next();
};
