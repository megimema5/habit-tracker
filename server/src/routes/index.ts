import { Router } from 'express';
import { apiLimiter } from '../middleware/rateLimit.js';
import { csrfProtection } from '../middleware/csrfProtection.js';
import { noStore } from '../middleware/noStore.js';
import { authRouter } from './auth.routes.js';
import { habitsRouter } from './habits.routes.js';
import { healthRouter } from './health.routes.js';
import { statsRouter } from './stats.routes.js';

/**
 * Mounts every feature router under /api.
 * Rate limiting, no-caching and CSRF checks run first, for every API route.
 * /habits and /stats are protected with requireAuth inside their routers.
 */
export const apiRouter = Router();

apiRouter.use(apiLimiter);
apiRouter.use(noStore);
apiRouter.use(csrfProtection);

apiRouter.use('/health', healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/habits', habitsRouter);
apiRouter.use('/stats', statsRouter);
