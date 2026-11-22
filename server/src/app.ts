import type { IncomingMessage } from 'node:http';
import express, { type Express } from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { pinoHttp } from 'pino-http';
import { isProduction } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
import { apiRouter } from './routes/index.js';
import { logger } from './utils/logger.js';

/** Express rewrites req.url inside routers; originalUrl keeps the full path (/api/health). */
function fullUrl(req: IncomingMessage): string {
  return (req as IncomingMessage & { originalUrl?: string }).originalUrl ?? req.url ?? '';
}

/**
 * Builds the Express app without starting it.
 * Kept separate from index.ts so tests can import the app and call it with Supertest
 * without opening a real network port.
 *
 * Middleware order matters: security headers → body parsing → cookies → logging
 * → routes → 404 → error handler (always last).
 */
export function createApp(): Express {
  const app = express();

  // Behind a hosting proxy (Render, Railway, Fly…) this makes req.ip and secure cookies work.
  if (isProduction) app.set('trust proxy', 1);

  // Security headers (CSP, nosniff, frame options…) and removes X-Powered-By.
  app.use(helmet());

  // Parse JSON bodies, but reject anything over 10 KB (protects against huge payloads).
  app.use(express.json({ limit: '10kb' }));

  // Reads cookies into req.cookies (used for the login cookie from Phase 3).
  app.use(cookieParser());

  // One short log line per request: method, url, status, duration.
  // Only these fields are logged, so headers (cookies, tokens) never reach the logs.
  app.use(
    pinoHttp({
      logger,
      serializers: {
        req: (req: { method: string; url: string }) => ({ method: req.method, url: req.url }),
        res: (res: { statusCode: number }) => ({ statusCode: res.statusCode }),
      },
      customLogLevel: (_req, res, err) => {
        if (err || res.statusCode >= 500) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
      },
      customSuccessMessage: (req, res, responseTime) =>
        `${req.method} ${fullUrl(req)} → ${res.statusCode} (${Math.round(responseTime)}ms)`,
      customErrorMessage: (req, res) => `${req.method} ${fullUrl(req)} → ${res.statusCode}`,
    }),
  );

  app.use('/api', apiRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
