import type { HabitLog, LogStatus } from '@habit/shared';
import { db } from '../db/connection.js';

/**
 * Logs repository — the ONLY place that runs SQL against `habit_logs`.
 *
 * Logs have no user_id column: ownership is checked through the habit. The service
 * always confirms the habit belongs to the user before calling these functions,
 * and `findAllForUser` joins on habits.user_id.
 */

interface LogRow {
  habit_id: number;
  date: string;
  status: LogStatus;
}

export interface UserLog extends HabitLog {
  habitId: number;
}

const statements = {
  /** Insert, or change the status if this habit already has a log for that day. */
  upsert: db.prepare(
    `INSERT INTO habit_logs (habit_id, date, status) VALUES (?, ?, ?)
     ON CONFLICT (habit_id, date) DO UPDATE SET status = excluded.status
     RETURNING habit_id, date, status`,
  ),
  delete: db.prepare('DELETE FROM habit_logs WHERE habit_id = ? AND date = ?'),
  findAllForUser: db.prepare(
    `SELECT l.habit_id, l.date, l.status
       FROM habit_logs l
       JOIN habits h ON h.id = l.habit_id
      WHERE h.user_id = ?
      ORDER BY l.date`,
  ),
  findAllForHabit: db.prepare(
    'SELECT habit_id, date, status FROM habit_logs WHERE habit_id = ? ORDER BY date',
  ),
};

export const logsRepository = {
  upsert(habitId: number, date: string, status: LogStatus): HabitLog {
    const row = statements.upsert.get(habitId, date, status) as LogRow | undefined;
    if (!row) throw new Error('Failed to save log');
    return { date: row.date, status: row.status };
  },

  /** Deleting a log that doesn't exist is fine — the result is the same (idempotent). */
  delete(habitId: number, date: string): void {
    statements.delete.run(habitId, date);
  },

  /** Every log of every habit the user owns, oldest first — one query for the whole list. */
  findAllForUser(userId: number): UserLog[] {
    return (statements.findAllForUser.all(userId) as unknown as LogRow[]).map((row) => ({
      habitId: row.habit_id,
      date: row.date,
      status: row.status,
    }));
  },

  findAllForHabit(habitId: number): HabitLog[] {
    return (statements.findAllForHabit.all(habitId) as unknown as LogRow[]).map((row) => ({
      date: row.date,
      status: row.status,
    }));
  },
};
