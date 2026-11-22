import { Router } from 'express';
import type { ApiSuccess, HealthStatus } from '@habit/shared';
import { db } from '../db/connection.js';
import { HttpError } from '../utils/HttpError.js';

export const healthRouter = Router();

/** GET /api/health — lets the client (and hosting platforms) check the API and database are up. */
healthRouter.get('/', (_req, res) => {
  try {
    db.prepare('SELECT 1').get();
  } catch {
    throw new HttpError(503, 'Database unavailable');
  }

  const body: ApiSuccess<HealthStatus> = {
    data: {
      status: 'ok',
      database: 'ok',
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    },
  };
  res.json(body);
});
