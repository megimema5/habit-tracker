/**
 * Fills the database with a demo account and ~30 days of history, so the app
 * has realistic data for development, screenshots and the demo video.
 *
 *   npm run seed   (runs runSeed.ts, which calls seed())
 *
 * Safe to run again: it deletes the previous demo user first (their habits and
 * logs go with them thanks to ON DELETE CASCADE).
 */
import { hashPassword } from '../services/auth.service.js';
import { addDays, fromDateString, toDateString } from '../utils/dates.js';
import { db, transaction } from './connection.js';

export const DEMO_USER = {
  name: 'Demo User',
  email: 'demo@example.com',
  password: 'demo1234',
};

const HISTORY_DAYS = 30;

type Status = 'done' | 'skipped' | null;

interface SeedHabit {
  name: string;
  icon: string;
  color: string;
  category: string;
  scheduleType: 'daily' | 'weekly' | 'specific_days';
  scheduleDays?: number[];
  reminderTime?: string;
  /** Decides the log for a day. `daysAgo` 0 = today. */
  statusFor: (daysAgo: number, weekday: number) => Status;
}

const habits: SeedHabit[] = [
  {
    name: 'Drink 8 glasses of water',
    icon: '💧',
    color: '#06b6d4',
    category: 'Health',
    scheduleType: 'daily',
    // Current streak with one skipped day in the middle (a skip doesn't break a streak).
    statusFor: (daysAgo) => (daysAgo === 0 ? null : daysAgo === 5 ? 'skipped' : 'done'),
  },
  {
    name: 'Read 20 pages',
    icon: '📚',
    color: '#4f46e5',
    category: 'Study',
    scheduleType: 'daily',
    reminderTime: '21:00',
    // Missed 4 days ago → the current streak restarted.
    statusFor: (daysAgo) => (daysAgo === 4 || daysAgo === 15 || daysAgo === 16 ? null : 'done'),
  },
  {
    name: 'Meditate 10 minutes',
    icon: '🧘',
    color: '#8b5cf6',
    category: 'Mindfulness',
    scheduleType: 'daily',
    // Long streak a while ago, patchy recently.
    statusFor: (daysAgo) => (daysAgo >= 10 ? 'done' : daysAgo % 3 === 0 ? 'done' : null),
  },
  {
    name: 'Morning run',
    icon: '🏃',
    color: '#10b981',
    category: 'Fitness',
    scheduleType: 'specific_days',
    scheduleDays: [1, 3, 5], // Mon, Wed, Fri
    statusFor: (daysAgo, weekday) =>
      [1, 3, 5].includes(weekday) && daysAgo !== 0 && daysAgo % 7 !== 2 ? 'done' : null,
  },
  {
    name: 'Weekly review',
    icon: '🎯',
    color: '#f59e0b',
    category: 'Work',
    scheduleType: 'weekly',
    // Every Sunday — but never today, so the demo always has something waiting.
    statusFor: (daysAgo, weekday) => (weekday === 0 && daysAgo > 0 ? 'done' : null),
  },
];

export async function seed(): Promise<void> {
  const passwordHash = await hashPassword(DEMO_USER.password);
  const today = toDateString(new Date());

  const insertUser = db.prepare(
    'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?) RETURNING id',
  );
  const insertHabit = db.prepare(
    `INSERT INTO habits
       (user_id, name, icon, color, category, schedule_type, schedule_days, reminder_time, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
  );
  const insertLog = db.prepare('INSERT INTO habit_logs (habit_id, date, status) VALUES (?, ?, ?)');

  // One transaction: either all demo data is written, or none of it.
  transaction(db, () => {
    db.prepare('DELETE FROM users WHERE email = ?').run(DEMO_USER.email);

    const user = insertUser.get(DEMO_USER.name, DEMO_USER.email, passwordHash) as
      { id: number } | undefined;
    if (!user) throw new Error('Failed to create demo user');

    const createdAt = `${addDays(today, -HISTORY_DAYS)} 08:00:00`;

    for (const habit of habits) {
      const row = insertHabit.get(
        user.id,
        habit.name,
        habit.icon,
        habit.color,
        habit.category,
        habit.scheduleType,
        habit.scheduleDays?.join(',') ?? null,
        habit.reminderTime ?? null,
        createdAt,
      ) as { id: number } | undefined;
      if (!row) throw new Error(`Failed to create habit ${habit.name}`);

      for (let daysAgo = HISTORY_DAYS - 1; daysAgo >= 0; daysAgo--) {
        const date = addDays(today, -daysAgo);
        const status = habit.statusFor(daysAgo, fromDateString(date).getDay());
        if (status) insertLog.run(row.id, date, status);
      }
    }
  });
}
