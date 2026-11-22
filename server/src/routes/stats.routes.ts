import { Router } from 'express';
import { statsQuerySchema } from '@habit/shared';
import * as statsController from '../controllers/stats.controller.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';

export const statsRouter = Router();

statsRouter.use(requireAuth);

statsRouter.get('/', validate(statsQuerySchema, 'query'), statsController.overview);
