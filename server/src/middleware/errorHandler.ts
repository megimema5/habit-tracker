import type { ErrorRequestHandler } from 'express';
import { ZodError, z } from 'zod';
import type { ApiError } from '@habit/shared';
import { isProduction } from '../config/env.js';
import { HttpError } from '../utils/HttpError.js';
import { logger } from '../utils/logger.js';

/** Errors thrown by express.json() (invalid JSON, body too large) carry these fields. */
interface BodyParserError extends Error {
  type: string;
  status: number;
}

function isBodyParserError(err: unknown): err is BodyParserError {
  return err instanceof Error && 'type' in err && 'status' in err;
}

/**
 * Central error handler — the only place that turns errors into responses.
 * Every error becomes `{ error: { message, details? } }` with the right status code.
 * Unexpected errors are logged in full but only a generic message is sent in production,
 * so stack traces and internals never leak to the client.
 *
 * Express recognises error handlers by their 4 arguments, so `_next` must stay.
 */
export const errorHandler: ErrorRequestHandler = (err: unknown, req, res, _next) => {
  let status = 500;
  let body: ApiError = { error: { message: 'Something went wrong' } };

  if (err instanceof HttpError) {
    status = err.status;
    body = { error: { message: err.message, details: err.details } };
  } else if (err instanceof ZodError) {
    status = 400;
    body = { error: { message: 'Validation failed', details: z.flattenError(err) } };
  } else if (isBodyParserError(err)) {
    status = err.status;
    const message =
      err.type === 'entity.parse.failed'
        ? 'Invalid JSON body'
        : err.type === 'entity.too.large'
          ? 'Request body is too large'
          : 'Invalid request body';
    body = { error: { message } };
  } else if (!isProduction && err instanceof Error) {
    // In development, show the real message to make debugging easier.
    body = { error: { message: err.message } };
  }

  if (status >= 500) {
    logger.error({ err, method: req.method, url: req.originalUrl }, 'Unhandled error');
  }

  res.status(status).json(body);
};
