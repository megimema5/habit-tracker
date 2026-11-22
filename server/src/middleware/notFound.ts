import type { RequestHandler } from 'express';
import { HttpError } from '../utils/HttpError.js';

/** Runs when no route matched: forwards a 404 to the error handler. */
export const notFound: RequestHandler = (req, _res, next) => {
  next(HttpError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};
