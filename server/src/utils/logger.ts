import { pino } from 'pino';
import { env, isProduction } from '../config/env.js';

/**
 * App-wide logger.
 * - Pretty, coloured output in development; JSON lines in production.
 * - Secrets (cookies, auth headers, passwords) are redacted so they never end up in logs.
 */
export const logger = pino({
  level: env.LOG_LEVEL,
  redact: {
    paths: [
      'req.headers.cookie',
      'req.headers.authorization',
      'res.headers["set-cookie"]',
      '*.password',
      '*.passwordHash',
      '*.token',
    ],
    censor: '[REDACTED]',
  },
  ...(isProduction || env.NODE_ENV === 'test'
    ? {}
    : {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss',
            ignore: 'pid,hostname,req,res,responseTime',
          },
        },
      }),
});
