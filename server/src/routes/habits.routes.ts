import { Router } from 'express';
import {
  createHabitSchema,
  habitDetailQuerySchema,
  habitIdParamsSchema,
  habitsQuerySchema,
  logEntrySchema,
  logParamsSchema,
  updateHabitSchema,
} from '@habit/shared';
import * as habitsController from '../controllers/habits.controller.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';

export const habitsRouter = Router();

// Every habit route needs a logged-in user. Applied once here, so a new route
// added below can't accidentally be left public.
habitsRouter.use(requireAuth);

habitsRouter.get('/', validate(habitsQuerySchema, 'query'), habitsController.list);
habitsRouter.post('/', validate(createHabitSchema), habitsController.create);

habitsRouter.get(
  '/:id',
  validate(habitIdParamsSchema, 'params'),
  validate(habitDetailQuerySchema, 'query'),
  habitsController.getOne,
);
habitsRouter.patch(
  '/:id',
  validate(habitIdParamsSchema, 'params'),
  validate(updateHabitSchema),
  habitsController.update,
);
habitsRouter.delete('/:id', validate(habitIdParamsSchema, 'params'), habitsController.remove);

habitsRouter.put(
  '/:id/logs/:date',
  validate(logParamsSchema, 'params'),
  validate(logEntrySchema),
  habitsController.setLog,
);
habitsRouter.delete(
  '/:id/logs/:date',
  validate(logParamsSchema, 'params'),
  habitsController.clearLog,
);
