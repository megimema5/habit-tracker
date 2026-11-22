import type { CreateHabitInput, Habit, ScheduleType } from '@habit/shared';
import { db } from '../db/connection.js';

/**
 * Habits repository — the ONLY place that runs SQL against the `habits` table.
 *
 * Security rule: every function takes the `userId` of the logged-in user and every
 * query filters on it (`WHERE id = ? AND user_id = ?`). A user can never read,
 * change or delete another user's habit — it simply looks like it doesn't exist.
 */

interface HabitRow {
  id: number;
  user_id: number;
  name: string;
  icon: string;
  color: string;
  category: string | null;
  schedule_type: ScheduleType;
  schedule_days: string | null;
  target_count: number;
  reminder_time: string | null;
  created_at: string;
  updated_at: string;
}

/** Fields that can be changed, mapped to their column names. Anything else is never written. */
const UPDATABLE_COLUMNS = {
  name: 'name',
  icon: 'icon',
  color: 'color',
  category: 'category',
  scheduleType: 'schedule_type',
  scheduleDays: 'schedule_days',
  reminderTime: 'reminder_time',
} as const satisfies Partial<Record<keyof Habit, string>>;

export type HabitChanges = Partial<Pick<Habit, keyof typeof UPDATABLE_COLUMNS>>;

/** [1, 3, 5] ⇄ '1,3,5' */
function daysToCsv(days: number[]): string | null {
  return days.length > 0 ? days.join(',') : null;
}
function csvToDays(csv: string | null): number[] {
  return csv ? csv.split(',').map(Number) : [];
}

function toHabit(row: HabitRow): Habit {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    color: row.color,
    category: row.category,
    scheduleType: row.schedule_type,
    scheduleDays: csvToDays(row.schedule_days),
    reminderTime: row.reminder_time,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const statements = {
  findAllByUser: db.prepare('SELECT * FROM habits WHERE user_id = ? ORDER BY created_at, id'),
  findByIdForUser: db.prepare('SELECT * FROM habits WHERE id = ? AND user_id = ?'),
  insert: db.prepare(
    `INSERT INTO habits
       (user_id, name, icon, color, category, schedule_type, schedule_days, reminder_time)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     RETURNING *`,
  ),
  delete: db.prepare('DELETE FROM habits WHERE id = ? AND user_id = ?'),
};

export const habitsRepository = {
  findAllByUser(userId: number): Habit[] {
    return (statements.findAllByUser.all(userId) as unknown as HabitRow[]).map(toHabit);
  },

  findByIdForUser(id: number, userId: number): Habit | undefined {
    const row = statements.findByIdForUser.get(id, userId) as HabitRow | undefined;
    return row ? toHabit(row) : undefined;
  },

  create(userId: number, input: CreateHabitInput): Habit {
    const row = statements.insert.get(
      userId,
      input.name,
      input.icon,
      input.color,
      input.category,
      input.scheduleType,
      daysToCsv(input.scheduleDays),
      input.reminderTime,
    ) as HabitRow | undefined;
    if (!row) throw new Error('Failed to create habit');
    return toHabit(row);
  },

  /**
   * Updates only the fields that were sent. The SET clause is built from the
   * UPDATABLE_COLUMNS whitelist (never from user input), and values go in as
   * `?` parameters — so this is still safe from SQL injection.
   */
  update(id: number, userId: number, changes: HabitChanges): Habit | undefined {
    const setClauses: string[] = [];
    const values: (string | number | null)[] = [];

    for (const [field, column] of Object.entries(UPDATABLE_COLUMNS)) {
      const value = changes[field as keyof HabitChanges];
      if (value === undefined) continue;
      setClauses.push(`${column} = ?`);
      values.push(Array.isArray(value) ? daysToCsv(value) : value);
    }

    if (setClauses.length === 0) return this.findByIdForUser(id, userId);

    setClauses.push('updated_at = CURRENT_TIMESTAMP');
    const row = db
      .prepare(
        `UPDATE habits SET ${setClauses.join(', ')} WHERE id = ? AND user_id = ? RETURNING *`,
      )
      .get(...values, id, userId) as HabitRow | undefined;

    return row ? toHabit(row) : undefined;
  },

  /** Returns true if a habit was deleted. Its logs are removed by ON DELETE CASCADE. */
  delete(id: number, userId: number): boolean {
    return Number(statements.delete.run(id, userId).changes) > 0;
  },
};
