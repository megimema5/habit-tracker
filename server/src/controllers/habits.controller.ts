import type { Request, RequestHandler } from 'express';
import type {
  ApiSuccess,
  CreateHabitInput,
  Habit,
  HabitDetailQuery,
  HabitLog,
  HabitsQuery,
  HabitWithStats,
  LogEntryInput,
  UpdateHabitInput,
} from '@habit/shared';
import { getAuthUser } from '../middleware/requireAuth.js';
import * as habitsService from '../services/habits.service.js';

/**
 * Habits controllers: take the validated request, call the service, send the response.
 * Params, body and query were already checked (and converted) by the validate middleware.
 */

interface IdParams {
  id: number;
}
interface LogParams extends IdParams {
  date: string;
}

const params = <T>(req: Request): T => req.params as unknown as T;

/** GET /api/habits */
export const list: RequestHandler = (req, res) => {
  const query = req.query as unknown as HabitsQuery;
  const habits = habitsService.listHabitsWithStats(getAuthUser(req).id, query);
  res.json({ data: habits } satisfies ApiSuccess<HabitWithStats[]>);
};

/** GET /api/habits/:id */
export const getOne: RequestHandler = (req, res) => {
  const { id } = params<IdParams>(req);
  const query = req.query as unknown as HabitDetailQuery;
  const habit = habitsService.getHabitWithStats(getAuthUser(req).id, id, query);
  res.json({ data: habit } satisfies ApiSuccess<HabitWithStats>);
};

/** POST /api/habits → 201 */
export const create: RequestHandler = (req, res) => {
  const habit = habitsService.createHabit(getAuthUser(req).id, req.body as CreateHabitInput);
  res.status(201).json({ data: habit } satisfies ApiSuccess<Habit>);
};

/** PATCH /api/habits/:id */
export const update: RequestHandler = (req, res) => {
  const { id } = params<IdParams>(req);
  const habit = habitsService.updateHabit(getAuthUser(req).id, id, req.body as UpdateHabitInput);
  res.json({ data: habit } satisfies ApiSuccess<Habit>);
};

/** DELETE /api/habits/:id → 204 */
export const remove: RequestHandler = (req, res) => {
  const { id } = params<IdParams>(req);
  habitsService.deleteHabit(getAuthUser(req).id, id);
  res.status(204).end();
};

/** PUT /api/habits/:id/logs/:date */
export const setLog: RequestHandler = (req, res) => {
  const { id, date } = params<LogParams>(req);
  const { status } = req.body as LogEntryInput;
  const log = habitsService.setLog(getAuthUser(req).id, id, date, status);
  res.json({ data: log } satisfies ApiSuccess<HabitLog>);
};

/** DELETE /api/habits/:id/logs/:date → 204 */
export const clearLog: RequestHandler = (req, res) => {
  const { id, date } = params<LogParams>(req);
  habitsService.clearLog(getAuthUser(req).id, id, date);
  res.status(204).end();
};
