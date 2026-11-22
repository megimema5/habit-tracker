# Habit Tracker – Project Plan

---

## 1. Overview

| Layer    | Technology                                                                                                                                                             |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend | React 18 + Vite + TypeScript, React Router, TanStack Query, CSS Modules                                                                                                |
| Backend  | Node.js + Express 5 + TypeScript, zod (validation), `helmet` (security headers), `pino` (logging)                                                                      |
| Auth     | Email + password, `bcryptjs` (hashing), `jsonwebtoken` (JWT in an httpOnly cookie), `cookie-parser`, `express-rate-limit`                                              |
| Database | SQLite via Node's built-in `node:sqlite` (no native package to compile)                                                                                                |
| Shared   | `shared/` package with TypeScript types, zod schemas and constants used by both sides                                                                                  |
| Tooling  | npm workspaces, ESLint, Prettier, Vitest (+ Supertest for the API), `tsx` for running TS in dev, `concurrently`, Husky + lint-staged (pre-commit), GitHub Actions (CI) |

### How it fits together

```
┌──────────────────────────┐      HTTP / JSON       ┌──────────────────────────┐      SQL      ┌──────────────┐
│  client (React + Vite)   │  ───── /api/... ─────▶  │  server (Express + TS)   │  ──────────▶  │  SQLite file │
│  UI · React Query cache  │  ◀──── { data } ──────  │  routes → controllers →  │               │  habits.db   │
│  hooks · components      │                         │  services → repositories │               └──────────────┘
└──────────────────────────┘                         └──────────────────────────┘
            ▲                                                     ▲
            └──────────── shared/ (types, zod schemas, constants) ┘
```

In development Vite proxies `/api` → `http://localhost:3001`, so there are no CORS issues — and because client and API share the same origin, the auth cookie is sent automatically.

---

## 2. MVP Scope (recap)

0. **Authentication** – register, login, logout, stay logged in after refresh; every habit belongs to a user and users only see their own data.
1. **Habit creation & customization** – add / edit / delete; schedule `daily`, `weekly` or `specific_days`; icon (emoji), color, category.
2. **Daily logging & check-ins** – one-tap Done (tap again to undo), Skip, fix past days from the 7-day strip.
3. **Reminders** – in-app popup on open listing today's unfinished habits; max once per day; "Don't remind me today".
4. **Streaks & history** – current + longest streak for **daily habits only**; weekly progress ("2 / 3 this week") for other schedules; 7-day strip.
5. **Progress & analytics (Phase 2)** – heatmap, weekly/monthly completion %, trend chart, "most missed day".

---

## 3. Repository Structure

```
habit-tracker/
├── package.json              # npm workspaces + root scripts (dev, build, test, lint, typecheck)
├── .github/workflows/ci.yml  # lint + typecheck + test on every push / PR
├── .husky/pre-commit         # runs lint-staged (eslint + prettier on staged files)
├── .gitignore                # node_modules, dist, .env, *.db
├── .eslintrc.cjs / .prettierrc
├── README.md
├── plan.md
│
├── shared/                   # code used by BOTH client and server
│   ├── package.json
│   └── src/
│       ├── types.ts          # Habit, HabitLog, HabitWithStats, ApiResponse...
│       ├── schemas.ts        # zod schemas (createHabit, updateHabit, logEntry)
│       ├── constants.ts      # SCHEDULE_TYPES, LOG_STATUS, DEFAULT_CATEGORIES, COLORS, ICONS
│       └── index.ts
│
├── server/
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example          # PORT=3001, DB_PATH=./data/habits.db, JWT_SECRET=<min 32 random chars>, JWT_EXPIRES_IN=7d, CLIENT_ORIGIN, NODE_ENV
│   ├── data/                 # habits.db lives here (git-ignored)
│   └── src/
│       ├── index.ts          # starts the HTTP server
│       ├── app.ts            # builds the Express app (exported for tests)
│       ├── config/
│       │   └── env.ts        # reads + validates env variables
│       ├── db/
│       │   ├── connection.ts # opens SQLite, enables foreign keys + WAL
│       │   ├── migrate.ts    # runs migrations using PRAGMA user_version
│       │   ├── migrations/
│       │   │   └── 001_init.sql
│       │   └── seed.ts       # sample habits + logs for demos
│       ├── routes/
│       │   ├── index.ts      # mounts /api/auth, /api/habits, /api/stats, /api/health
│       │   ├── auth.routes.ts
│       │   ├── habits.routes.ts
│       │   └── stats.routes.ts
│       ├── controllers/      # read req, call service, send res — no business logic
│       │   ├── auth.controller.ts
│       │   ├── habits.controller.ts
│       │   └── stats.controller.ts
│       ├── services/         # business logic
│       │   ├── auth.service.ts        # register, login, hash/verify password, sign/verify JWT
│       │   ├── habits.service.ts
│       │   ├── streaks.service.ts     # current / longest streak, weekly progress
│       │   └── stats.service.ts
│       ├── repositories/     # the ONLY place that writes SQL
│       │   ├── users.repository.ts
│       │   ├── habits.repository.ts
│       │   └── logs.repository.ts
│       ├── middleware/
│       │   ├── requireAuth.ts   # reads JWT cookie → req.user, else 401
│       │   ├── rateLimit.ts     # limits login/register attempts
│       │   ├── validate.ts      # validate(schema, 'body' | 'params' | 'query')
│       │   ├── errorHandler.ts  # turns errors into { error: {...} }
│       │   └── notFound.ts
│       ├── utils/
│       │   ├── dates.ts         # addDays, previousDay, weekStart, dayOfWeek, isScheduledOn
│       │   └── HttpError.ts     # class HttpError(status, message, details?)
│       ├── types/
│       │   └── express.d.ts     # adds req.user: { id } to Express Request
│       └── tests/
│           ├── streaks.test.ts
│           ├── dates.test.ts
│           ├── auth.api.test.ts
│           └── habits.api.test.ts
│
└── client/
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts        # /api proxy
    ├── index.html
    └── src/
        ├── main.tsx          # providers: QueryClientProvider, ToastProvider, Router
        ├── App.tsx           # routes
        ├── api/
        │   ├── client.ts         # fetch wrapper (base URL, JSON, cookies, error handling)
        │   ├── auth.api.ts       # register, login, logout, getMe
        │   ├── habits.api.ts     # getHabits, createHabit, updateHabit, deleteHabit, setLog, clearLog
        │   ├── stats.api.ts
        │   └── queryKeys.ts      # central React Query keys
        ├── hooks/
        │   ├── auth/             # useMe, useLogin, useRegister, useLogout
        │   ├── habits/           # data hooks (React Query)
        │   ├── stats/
        │   └── common/           # generic reusable hooks
        ├── context/
        │   ├── AuthContext.tsx
        │   └── ToastContext.tsx
        ├── components/
        │   ├── ui/               # generic, app-agnostic building blocks
        │   ├── layout/
        │   ├── auth/             # AuthForm, PasswordInput, ProtectedRoute, PublicOnlyRoute
        │   ├── habits/
        │   ├── reminders/
        │   └── stats/
        ├── pages/
        ├── utils/
        │   ├── dates.ts          # todayLocal(), lastNDays(), formatDay()
        │   └── cn.ts             # join classNames
        └── styles/
            ├── variables.css     # design tokens
            ├── reset.css
            └── global.css
```

---

## 4. Database

SQLite file at `server/data/habits.db`. On startup the server runs `PRAGMA foreign_keys = ON;` and `PRAGMA journal_mode = WAL;`, then applies any pending migrations (tracked with `PRAGMA user_version`).

### 4.1 Tables

#### `users`

| Column          | Type    | Constraints / Default              | Notes                                            |
| --------------- | ------- | ---------------------------------- | ------------------------------------------------ |
| `id`            | INTEGER | PRIMARY KEY AUTOINCREMENT          |                                                  |
| `name`          | TEXT    | NOT NULL                           | display name                                     |
| `email`         | TEXT    | NOT NULL UNIQUE (stored lowercase) | login identifier                                 |
| `password_hash` | TEXT    | NOT NULL                           | bcrypt hash — the plain password is never stored |
| `created_at`    | TEXT    | NOT NULL DEFAULT CURRENT_TIMESTAMP |                                                  |

#### `habits`

| Column          | Type    | Constraints / Default                                                 | Notes                                                                        |
| --------------- | ------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `id`            | INTEGER | PRIMARY KEY AUTOINCREMENT                                             |                                                                              |
| `user_id`       | INTEGER | NOT NULL REFERENCES users(id) ON DELETE CASCADE                       | owner of the habit                                                           |
| `name`          | TEXT    | NOT NULL, 1–60 chars (validated by zod)                               |                                                                              |
| `icon`          | TEXT    | NOT NULL DEFAULT '✅'                                                 | single emoji                                                                 |
| `color`         | TEXT    | NOT NULL DEFAULT '#4f46e5'                                            | hex                                                                          |
| `category`      | TEXT    | NULL                                                                  | free text; suggestions in `shared/constants.ts`                              |
| `schedule_type` | TEXT    | NOT NULL DEFAULT 'daily', CHECK IN ('daily','weekly','specific_days') |                                                                              |
| `schedule_days` | TEXT    | NULL                                                                  | CSV of weekdays `0–6` (0 = Sunday), only for `specific_days`, e.g. `'1,3,5'` |
| `target_count`  | INTEGER | NOT NULL DEFAULT 1                                                    | reserved for measurable targets (not used in MVP)                            |
| `reminder_time` | TEXT    | NULL                                                                  | `'HH:MM'`, optional extra                                                    |
| `created_at`    | TEXT    | NOT NULL DEFAULT CURRENT_TIMESTAMP                                    |                                                                              |
| `updated_at`    | TEXT    | NOT NULL DEFAULT CURRENT_TIMESTAMP                                    | set in repository on update                                                  |

#### `habit_logs`

| Column       | Type    | Constraints / Default                            | Notes                                        |
| ------------ | ------- | ------------------------------------------------ | -------------------------------------------- |
| `id`         | INTEGER | PRIMARY KEY AUTOINCREMENT                        |                                              |
| `habit_id`   | INTEGER | NOT NULL REFERENCES habits(id) ON DELETE CASCADE |                                              |
| `date`       | TEXT    | NOT NULL                                         | local date `'YYYY-MM-DD'` sent by the client |
| `status`     | TEXT    | NOT NULL, CHECK IN ('done','skipped')            | "missed" = no row                            |
| `value`      | INTEGER | NOT NULL DEFAULT 1                               | reserved for measurable targets              |
| `created_at` | TEXT    | NOT NULL DEFAULT CURRENT_TIMESTAMP               |                                              |
|              |         | UNIQUE(`habit_id`, `date`)                       | one log per habit per day                    |

Indexes: `idx_logs_habit_date ON habit_logs(habit_id, date)` and `idx_habits_user ON habits(user_id)`.

Relationships: `users 1 ─── * habits 1 ─── * habit_logs` (deleting a user deletes their habits; deleting a habit deletes its logs).

### 4.2 Migration `001_init.sql`

```sql
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT    NOT NULL,
  email         TEXT    NOT NULL UNIQUE,
  password_hash TEXT    NOT NULL,
  created_at    TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS habits (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name          TEXT    NOT NULL,
  icon          TEXT    NOT NULL DEFAULT '✅',
  color         TEXT    NOT NULL DEFAULT '#4f46e5',
  category      TEXT,
  schedule_type TEXT    NOT NULL DEFAULT 'daily'
                CHECK (schedule_type IN ('daily', 'weekly', 'specific_days')),
  schedule_days TEXT,
  target_count  INTEGER NOT NULL DEFAULT 1,
  reminder_time TEXT,
  created_at    TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS habit_logs (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  habit_id   INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  date       TEXT    NOT NULL,
  status     TEXT    NOT NULL CHECK (status IN ('done', 'skipped')),
  value      INTEGER NOT NULL DEFAULT 1,
  created_at TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (habit_id, date)
);

CREATE INDEX IF NOT EXISTS idx_logs_habit_date ON habit_logs (habit_id, date);
CREATE INDEX IF NOT EXISTS idx_habits_user ON habits (user_id);
```

---

## 5. Shared Package (`shared/`)

```ts
// constants.ts
export const SCHEDULE_TYPES = ['daily', 'weekly', 'specific_days'] as const;
export const LOG_STATUSES = ['done', 'skipped'] as const;
export const DEFAULT_CATEGORIES = ['Health', 'Fitness', 'Study', 'Work', 'Mindfulness', 'Other'];
export const HABIT_COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4'];

// types.ts
export type ScheduleType = (typeof SCHEDULE_TYPES)[number];
export type LogStatus = (typeof LOG_STATUSES)[number];

export interface Habit {
  id: number;
  name: string;
  icon: string;
  color: string;
  category: string | null;
  scheduleType: ScheduleType;
  scheduleDays: number[]; // [] unless specific_days
  reminderTime: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  createdAt: string;
} // never includes password_hash

export interface HabitLog {
  date: string;
  status: LogStatus;
}

export interface HabitWithStats extends Habit {
  logs: HabitLog[]; // logs in the requested range (default: last 7 days)
  isScheduledToday: boolean;
  todayStatus: LogStatus | null;
  currentStreak: number | null; // null for non-daily habits
  longestStreak: number | null;
  weekProgress: { done: number; target: number } | null; // null for daily habits
}

export interface ApiSuccess<T> {
  data: T;
}
export interface ApiError {
  error: { message: string; details?: unknown };
}

// schemas.ts (zod) — used by server middleware AND client forms
registerSchema; // name (1–50), email (valid, lowercased), password (8–72 chars, at least 1 letter + 1 number)
// all object schemas use .strict() → unknown fields (e.g. userId, id) are rejected
loginSchema; // email, password (non-empty)
createHabitSchema; // name, icon, color, category?, scheduleType, scheduleDays?, reminderTime?
updateHabitSchema; // createHabitSchema.partial()
logEntrySchema; // { status: 'done' | 'skipped' }
dateParamSchema; // /^\d{4}-\d{2}-\d{2}$/
```

Rules enforced in `createHabitSchema` with `.refine()`: `scheduleDays` must be non-empty when `scheduleType === 'specific_days'`.

The DB uses `snake_case`; the API and TypeScript use `camelCase`. The repository maps between them (`toHabit(row)`).

---

## 6. Backend

### 6.1 Layers (request flow)

```
Request → route → requireAuth → validate(zod) middleware → controller → service → repository → SQLite
                                                             ↓
Response ← controller ← service result          errors → errorHandler middleware
```

| Layer      | Responsibility                                             | Example                                                      |
| ---------- | ---------------------------------------------------------- | ------------------------------------------------------------ |
| Route      | URL + HTTP method + middleware                             | `router.post('/', validate(createHabitSchema), ctrl.create)` |
| Middleware | Auth, validation, errors, 404                              | `requireAuth`, `validate`, `errorHandler`, `notFound`        |
| Controller | Read `req`, call service, send `res` with status code      | `res.status(201).json({ data: habit })`                      |
| Service    | Business rules, streaks, combining data                    | `getHabitsWithStats(userId, today)`                          |
| Repository | SQL only, maps rows ↔ objects, always filters by `user_id` | `findAllByUser(userId)`, `upsertLog()`                       |

### 6.2 Authentication

**Approach:** email + password → the server signs a **JWT** and stores it in an **httpOnly cookie**.

| Decision                                                                                    | Why                                                                                             |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Passwords hashed with `bcryptjs` (cost 12)                                                  | Plain passwords are never stored; a DB leak doesn't expose them                                 |
| JWT in an `httpOnly` cookie, not localStorage                                               | JavaScript can't read it, so an XSS bug can't steal the token                                   |
| Cookie flags: `httpOnly`, `sameSite: 'lax'`, `secure` in production, `maxAge` 7 days        | Blocks the cookie on most cross-site requests (CSRF) and sends it only over HTTPS in production |
| JWT payload `{ sub: userId }` only, signed with `JWT_SECRET`, expires in 7 days             | Small, contains nothing sensitive                                                               |
| Same error for unknown email and wrong password: "Invalid email or password"                | Doesn't reveal which emails are registered                                                      |
| `express-rate-limit` on `/auth/login` and `/auth/register` (e.g. 10 requests / 15 min / IP) | Slows down password-guessing attacks                                                            |

**Flows**

```
Register: POST /auth/register → validate → email taken? 409 → hash password → insert user
          → sign JWT → set cookie → 201 { user }

Login:    POST /auth/login → validate → find user by email → bcrypt.compare
          → no match? 401 "Invalid email or password" → sign JWT → set cookie → 200 { user }

Request:  any /api/habits/* → requireAuth reads cookie → jwt.verify → req.user = { id }
          → missing / invalid / expired? 401

Logout:   POST /auth/logout → clear cookie → 204
```

**Data isolation:** every habit query includes `WHERE user_id = ?` with `req.user.id`. Asking for another user's habit returns **404** (not 403), so the app doesn't even reveal that the habit exists.

### 6.3 API Routes

Base URL: `/api`. All responses are JSON: success → `{ "data": ... }`, error → `{ "error": { "message", "details?" } }`.

Endpoints that depend on "today" accept a `today=YYYY-MM-DD` query param from the client (local date). Falls back to server date if missing.

#### Health

| Method | Route         | Description  | Response                         |
| ------ | ------------- | ------------ | -------------------------------- |
| GET    | `/api/health` | Server check | `200 { data: { status: 'ok' } }` |

#### Auth (public)

| Method | Route                | Body                        | Description                       | Success             | Errors                                                    |
| ------ | -------------------- | --------------------------- | --------------------------------- | ------------------- | --------------------------------------------------------- |
| POST   | `/api/auth/register` | `{ name, email, password }` | Create account + log in           | `201 User` + cookie | `400` invalid, `409` email taken, `429` too many attempts |
| POST   | `/api/auth/login`    | `{ email, password }`       | Log in                            | `200 User` + cookie | `400`, `401` invalid credentials, `429`                   |
| POST   | `/api/auth/logout`   | —                           | Clear cookie                      | `204`               |                                                           |
| GET    | `/api/auth/me`       | —                           | Current user (called on app load) | `200 User`          | `401` not logged in                                       |

#### Habits (MVP) — all require login (`requireAuth`)

| Method | Route                        | Body / Query                      | Description                                           | Success                |
| ------ | ---------------------------- | --------------------------------- | ----------------------------------------------------- | ---------------------- |
| GET    | `/api/habits`                | `?today=2026-11-21&days=7`        | All habits with stats + logs for the last `days` days | `200 HabitWithStats[]` |
| GET    | `/api/habits/:id`            | `?today=...&from=...&to=...`      | One habit with logs in range (detail page / heatmap)  | `200 HabitWithStats`   |
| POST   | `/api/habits`                | `CreateHabitInput`                | Create habit                                          | `201 Habit`            |
| PATCH  | `/api/habits/:id`            | `UpdateHabitInput` (partial)      | Edit habit                                            | `200 Habit`            |
| DELETE | `/api/habits/:id`            | —                                 | Delete habit (logs cascade)                           | `204`                  |
| PUT    | `/api/habits/:id/logs/:date` | `{ status: 'done' \| 'skipped' }` | Set / change log for a day (upsert)                   | `200 HabitLog`         |
| DELETE | `/api/habits/:id/logs/:date` | —                                 | Clear log (undo)                                      | `204`                  |

Why `PUT` + `DELETE` for logs instead of a "toggle"? They are **idempotent**: sending the same request twice gives the same result, so double-clicks or retries can't flip the state by accident.

Validation errors → `400`, not logged in → `401`, unknown habit or another user's habit → `404`, future date log → `400`, unexpected → `500`.

#### Stats — require login

| Method | Route             | Query                        | Description                                                                              |
| ------ | ----------------- | ---------------------------- | ---------------------------------------------------------------------------------------- |
| GET    | `/api/stats`      | `?days=7\|30\|90&today=...`  | Overview: completion rate, perfect days, per-habit rates, daily trend, misses by weekday |
| GET    | `/api/habits/:id` | `?today=...&from=...&to=...` | Reused with a 365-day range for the year heatmap on the detail page                      |

_Changed during build:_ the three planned endpoints (`/summary`, `/trend`, `/missed-days`) became one, because the stats page always needs all of it — one request, one cache entry, one loading state. The heatmap reuses the habit detail endpoint.

Completion rate = done ÷ (scheduled days − skipped days).

### 6.4 Example request / response

```http
PUT /api/habits/3/logs/2026-11-21
Content-Type: application/json

{ "status": "done" }
```

```json
200 OK
{ "data": { "date": "2026-11-21", "status": "done" } }
```

### 6.5 Streak logic (`streaks.service.ts`)

Applies to **daily habits only**.

```ts
currentStreak(logs: Map<string, LogStatus>, today: string): number
```

1. Start at `today`. If today has no log, start from yesterday (the day isn't over yet).
2. Walk backwards day by day while a log exists:
   - `done` → streak + 1
   - `skipped` → no change, keep walking (pauses, doesn't break)
3. Stop at the first day with no log (missed).

```ts
longestStreak(logs: Map<string, LogStatus>): number
```

Sort dates, walk forward once, count consecutive days (skipped days continue the run without adding), track the max.

```ts
weekProgress(habit, logs, today): { done: number; target: number }
```

- `weekly` → target 1, done = min(1, done logs this week)
- `specific_days` → target = number of scheduled weekdays this week, done = done logs on those days

Week starts on Monday.

All three are pure functions → unit tested in `streaks.test.ts` (normal run, skipped in the middle, gap, today not logged, empty logs).

### 6.6 Server scripts

```json
"dev":   "tsx watch src/index.ts",
"build": "tsc",
"start": "node dist/index.js",
"seed":  "tsx src/db/seed.ts",
"test":  "vitest run"
```

---

## 7. Frontend

### 7.1 Pages & routing (React Router)

| Route         | Page               | Access      | Purpose                                                                                 |
| ------------- | ------------------ | ----------- | --------------------------------------------------------------------------------------- |
| `/login`      | `LoginPage`        | public only | Email + password form, link to register                                                 |
| `/register`   | `RegisterPage`     | public only | Name, email, password, confirm password                                                 |
| `/`           | `TodayPage`        | protected   | Main screen: today's habits, check-ins, streaks, 7-day strip. Shows the reminder popup. |
| `/habits`     | `ManageHabitsPage` | protected   | List all habits, create / edit / delete, filter by category                             |
| `/habits/:id` | `HabitDetailPage`  | protected   | One habit: stats, full history (heatmap in Phase 2)                                     |
| `/stats`      | `StatsPage`        | protected   | Phase 2: completion %, trend chart, most missed day                                     |
| `*`           | `NotFoundPage`     | any         | 404                                                                                     |

- **Protected** pages are wrapped in `ProtectedRoute` → redirects to `/login` if not logged in, and back to the original page after login.
- **Public only** pages are wrapped in `PublicOnlyRoute` → redirects to `/` if already logged in.
- Protected pages render inside `AppLayout` (header + nav + `<Outlet />`); auth pages use a simple centered `AuthLayout`.

```tsx
<Routes>
  <Route element={<PublicOnlyRoute />}>
    <Route element={<AuthLayout />}>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
    </Route>
  </Route>
  <Route element={<ProtectedRoute />}>
    <Route element={<AppLayout />}>
      <Route path="/" element={<TodayPage />} />
      <Route path="/habits" element={<ManageHabitsPage />} />
      <Route path="/habits/:id" element={<HabitDetailPage />} />
      <Route path="/stats" element={<StatsPage />} />
    </Route>
  </Route>
  <Route path="*" element={<NotFoundPage />} />
</Routes>
```

### 7.2 Data fetching – TanStack Query + a small fetch wrapper

**Why TanStack Query:** it caches server data, handles loading/error states, refetches after changes and supports optimistic updates — so we don't need a global store for habits.

**Rule:** server data lives in React Query. UI-only state lives in components (`useState`) or a small context.

`api/client.ts` – one reusable fetch wrapper:

```ts
export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // send the auth cookie
    ...options,
  });
  if (res.status === 401) onUnauthorized(); // clears the user cache → ProtectedRoute redirects to /login
  if (res.status === 204) return undefined as T;
  const body = await res.json();
  if (!res.ok)
    throw new ApiRequestError(
      res.status,
      body.error?.message ?? 'Request failed',
      body.error?.details,
    );
  return body.data as T;
}
```

`api/habits.api.ts` – one function per endpoint (`getHabits(today)`, `createHabit(input)`, `setLog(id, date, status)`...).

`api/queryKeys.ts` – keys in one place so invalidation is consistent:

```ts
export const queryKeys = {
  auth: { me: ['auth', 'me'] as const },
  habits: {
    all: ['habits'] as const,
    list: (today: string) => ['habits', 'list', today] as const,
    detail: (id: number) => ['habits', 'detail', id] as const,
  },
  stats: {
    summary: (period: string) => ['stats', 'summary', period] as const,
    trend: (days: number) => ['stats', 'trend', days] as const,
  },
};
```

### 7.3 Hooks

#### Auth hooks (`hooks/auth/`)

| Hook            | Type     | Notes                                                                                                    |
| --------------- | -------- | -------------------------------------------------------------------------------------------------------- |
| `useMe()`       | query    | `GET /auth/me` on app load; `401` → `null` (logged out), no retry                                        |
| `useLogin()`    | mutation | on success → put user into the `auth.me` cache, navigate to `/` (or the page they came from)             |
| `useRegister()` | mutation | same as login                                                                                            |
| `useLogout()`   | mutation | on success → `queryClient.clear()` (removes the previous user's habits from cache), navigate to `/login` |

#### Data hooks (`hooks/habits/`) – wrap React Query, reused across pages

| Hook               | Type     | Used by                                         | Notes                                                 |
| ------------------ | -------- | ----------------------------------------------- | ----------------------------------------------------- |
| `useHabits()`      | query    | TodayPage, ManageHabitsPage, DailyReminderModal | passes `todayLocal()`                                 |
| `useHabit(id)`     | query    | HabitDetailPage                                 |                                                       |
| `useCreateHabit()` | mutation | HabitFormModal                                  | invalidates `habits.all`, toast on success            |
| `useUpdateHabit()` | mutation | HabitFormModal                                  | invalidates `habits.all`                              |
| `useDeleteHabit()` | mutation | HabitCard menu, ConfirmDialog                   | invalidates `habits.all`                              |
| `useSetLog()`      | mutation | CheckInButton, WeekStrip, DailyReminderModal    | **optimistic update** → instant UI, rollback on error |
| `useClearLog()`    | mutation | same as above                                   | optimistic                                            |

Phase 2: `useStatsSummary(period)`, `useTrend(days)`, `useMissedDays()`, `useHeatmap(id, year)`.

#### Generic hooks (`hooks/common/`) – not tied to habits, reusable anywhere

| Hook                               | Purpose                                                                |
| ---------------------------------- | ---------------------------------------------------------------------- |
| `useDisclosure()`                  | `{ isOpen, open, close, toggle }` for modals / menus                   |
| `useLocalStorage<T>(key, initial)` | `useState` that persists to localStorage (try/catch safe)              |
| `useToday()`                       | current local date string; updates if the app stays open past midnight |
| `useDailyReminder(habits)`         | decides if the reminder popup should show today (see 7.6)              |

### 7.4 Context

Kept minimal on purpose — React Query already shares server data.

| Context                           | Why it's global                                                                | API                                                                                                                                                          |
| --------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `AuthContext`                     | Header, route guards and pages all need the current user                       | `const { user, isLoading, isAuthenticated, login, register, logout } = useAuth()` — a thin wrapper around `useMe` / `useLogin` / `useRegister` / `useLogout` |
| `ToastContext`                    | Any hook/component can show feedback ("Habit created", "Something went wrong") | `const { showToast } = useToast(); showToast('Saved', 'success')`                                                                                            |
| `ThemeContext` _(optional extra)_ | Light / dark mode toggle, saved in localStorage                                | `{ theme, toggleTheme }`                                                                                                                                     |

Provider order in `main.tsx`:

```tsx
<QueryClientProvider client={queryClient}>
  <ToastProvider>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </ToastProvider>
</QueryClientProvider>
```

### 7.5 Components

#### `components/ui/` – generic & reusable (no habit knowledge)

| Component       | Props (main)                                                                                       | Notes                            |
| --------------- | -------------------------------------------------------------------------------------------------- | -------------------------------- |
| `Button`        | `variant: 'primary' \| 'secondary' \| 'ghost' \| 'danger'`, `size`, `loading`, native button props |                                  |
| `IconButton`    | `icon`, `label` (aria-label), `variant`                                                            |                                  |
| `Input`         | `label`, `error`, native input props                                                               |                                  |
| `Select`        | `label`, `options`, `error`                                                                        |                                  |
| `Modal`         | `isOpen`, `onClose`, `title`, `children`, `footer`                                                 | portal, Esc to close, focus trap |
| `ConfirmDialog` | `isOpen`, `title`, `message`, `onConfirm`, `onCancel`, `danger`                                    | built on `Modal`                 |
| `Card`          | `children`, `accentColor?`                                                                         |                                  |
| `Badge`         | `children`, `color?`                                                                               | category / streak labels         |
| `ColorPicker`   | `value`, `onChange`, `colors`                                                                      | swatches                         |
| `EmojiPicker`   | `value`, `onChange`, `options`                                                                     | small grid of preset emojis      |
| `Spinner`       | `size`                                                                                             |                                  |
| `EmptyState`    | `icon`, `title`, `description`, `action?`                                                          |                                  |
| `ErrorState`    | `message`, `onRetry`                                                                               |                                  |
| `Toast`         | rendered by `ToastProvider`                                                                        |                                  |

#### `components/layout/`

| Component    | Purpose                                                   |
| ------------ | --------------------------------------------------------- |
| `AppLayout`  | Header + NavBar + `<Outlet />` (logged-in pages)          |
| `AuthLayout` | Centered card for login / register                        |
| `Header`     | App title, today's date, user name + Logout, theme toggle |
| `NavBar`     | Links: Today · Habits · Stats                             |

#### `components/auth/`

| Component         | Purpose                                                                                                   | Reuses                                                                   |
| ----------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `AuthForm`        | One form for both Login and Register (`mode: 'login' \| 'register'` adds name + confirm password)         | `Input`, `Button`, `PasswordInput`, zod `loginSchema` / `registerSchema` |
| `PasswordInput`   | Input with show/hide toggle                                                                               | `Input`, `IconButton`                                                    |
| `ProtectedRoute`  | Spinner while `useMe` loads → `<Outlet />` if logged in, else `<Navigate to="/login" state={{ from }} />` | `Spinner`                                                                |
| `PublicOnlyRoute` | Redirects logged-in users away from login / register                                                      |                                                                          |

#### `components/habits/` – feature components

| Component          | Purpose                                                           | Reuses                                                                                                 |
| ------------------ | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HabitList`        | Renders a list of `HabitCard`s, handles empty state               | `EmptyState`                                                                                           |
| `HabitCard`        | Icon, name, category, check-in, streak/progress, week strip, menu | `Card`, `Badge`, `CheckInButton`, `StreakBadge`, `WeekProgress`, `WeekStrip`                           |
| `CheckInButton`    | Done / undo + Skip for a given date                               | `useSetLog`, `useClearLog`                                                                             |
| `StreakBadge`      | 🔥 current streak · best streak                                   | `Badge`                                                                                                |
| `WeekProgress`     | "2 / 3 this week" bar                                             |                                                                                                        |
| `WeekStrip`        | Last 7 days ✓ / – / ✗ / blank; click a day to change it           | `useSetLog`, `useClearLog`                                                                             |
| `HabitFormModal`   | Create & edit (same component, `initialValues` decides mode)      | `Modal`, `Input`, `Select`, `ColorPicker`, `EmojiPicker`, `ScheduleSelector`, zod schema from `shared` |
| `ScheduleSelector` | daily / weekly / specific days + `DayPicker`                      |                                                                                                        |
| `DayPicker`        | Mon–Sun toggle chips                                              |                                                                                                        |
| `CategoryFilter`   | Filter chips on ManageHabitsPage                                  |                                                                                                        |

#### `components/reminders/`

| Component            | Purpose                                                                                              |
| -------------------- | ---------------------------------------------------------------------------------------------------- |
| `DailyReminderModal` | "You have 3 habits left for today" with quick check-ins; "Later" and "Don't remind me today" buttons |

#### `components/stats/` (Phase 2)

`CompletionRateCard`, `TrendChart` (Recharts line chart), `CalendarHeatmap`, `MostMissedDayCard`.

### 7.6 Reminder popup logic (`useDailyReminder` + pure rules in `utils/reminders.ts`)

The popup is about **opening the app**. When the habits first load, a snapshot is taken:
which habits exist, which are still pending today, and the time of day.

```
a habit is listed if ALL are true:
  1. scheduled today and not done / skipped
  2. it existed when the app opened            (habits created this visit never trigger it)
  3. its reminder time (if any) has passed
  4. it was pending when the app opened
     OR its reminder time passed while the app was open

the popup is open if:
  at least one habit is listed
  AND localStorage 'habit-tracker:reminder:<userId>' doesn't say
      dismissedOn = today   ("Don't remind me today")
      or snoozedUntil > now ("Later", Esc, ✕, or finishing the last habit → 2 hours)
```

Everything is derived from data (no effects that set state), so it can't get out of sync.
Un-checking a habit during the visit never re-opens it.

### 7.7 Forms & validation

- Controlled inputs with `useState` (small forms, no form library needed).
- On submit, validate with the **same zod schema the server uses** (`createHabitSchema.safeParse`) → show field errors.
- Server errors are shown via toast.

---

## 8. Styling

- **CSS Modules** – one `Component.module.css` next to each component; class names are scoped, no clashes.
- **Design tokens** in `styles/variables.css`, used everywhere via `var(--...)`:

```css
:root {
  /* colors */
  --color-bg: #f8fafc;
  --color-surface: #ffffff;
  --color-text: #0f172a;
  --color-text-muted: #64748b;
  --color-border: #e2e8f0;
  --color-primary: #4f46e5;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-danger: #ef4444;

  /* spacing (4px scale) */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;

  /* radius, shadow, type */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --shadow-sm: 0 1px 2px rgb(0 0 0 / 0.06);
  --shadow-md: 0 4px 12px rgb(0 0 0 / 0.08);
  --font-sans: 'Inter', system-ui, sans-serif;
  --text-sm: 0.875rem;
  --text-md: 1rem;
  --text-lg: 1.25rem;
  --text-xl: 1.5rem;
}

[data-theme='dark'] {
  --color-bg: #0f172a;
  --color-surface: #1e293b;
  --color-text: #f1f5f9; /* ... */
}
```

- Habit color is passed as a CSS variable: `style={{ '--habit-color': habit.color }}`.
- Mobile-first, responsive with a single breakpoint (`min-width: 768px`).
- Accessible: buttons have labels, visible focus rings, color is never the only signal (✓ / – / ✗ icons too).

---

## 9. Code Style & Conventions

| Topic        | Convention                                                                                          |
| ------------ | --------------------------------------------------------------------------------------------------- |
| Formatting   | Prettier (2 spaces, single quotes, semicolons, 100 cols)                                            |
| Linting      | ESLint + `@typescript-eslint` + `react-hooks` rules                                                 |
| TypeScript   | `strict: true`; no `any`; types from `shared/`                                                      |
| Components   | PascalCase, one per folder: `HabitCard/HabitCard.tsx`, `HabitCard.module.css`, `index.ts`           |
| Hooks        | camelCase with `use` prefix, one per file                                                           |
| Server files | `name.layer.ts` (e.g. `habits.service.ts`)                                                          |
| Naming       | DB `snake_case` · API & TS `camelCase` · constants `UPPER_SNAKE_CASE`                               |
| Exports      | Named exports (no default exports, except pages for lazy loading if needed)                         |
| Errors       | Server throws `HttpError`; client shows toast; never swallow errors silently                        |
| Commits      | Conventional commits: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:` — small and frequent |

### Root scripts

```json
"dev":   "concurrently -n server,client \"npm run dev -w server\" \"npm run dev -w client\"",
"build": "npm run build -w shared && npm run build -w server && npm run build -w client",
"test":  "npm run test -w server",
"lint":  "eslint . --ext .ts,.tsx",
"seed":  "npm run seed -w server"
```

---

## 10. Security

A review of the whole app against the most common web risks (based on the OWASP Top 10). Every item has a concrete rule.

### 10.1 Authentication & passwords

| Risk                                      | Rule                                                                                                                                                                                        |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stolen password database                  | `bcryptjs` with cost 12; plain passwords are never stored or logged                                                                                                                         |
| bcrypt silently ignores bytes after 72    | Password max length 72 (validated by zod)                                                                                                                                                   |
| Weak passwords                            | Min 8 chars, at least one letter and one number                                                                                                                                             |
| Finding out which emails exist by timing  | When the email isn't found, still run `bcrypt.compare` against a dummy hash so both cases take the same time                                                                                |
| Finding out which emails exist by message | Login always says "Invalid email or password". _Trade-off:_ register returns `409 Email already in use` because the user needs to know — acceptable for this app, mentioned in the write-up |
| Brute force                               | `express-rate-limit`: 10 attempts / 15 min / IP on `/auth/login` and `/auth/register`; 300 requests / 15 min on the rest of `/api`                                                          |

### 10.2 Tokens & cookies

| Risk                                                        | Rule                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Token stolen through XSS                                    | JWT lives in an `httpOnly` cookie — JavaScript can never read it; nothing auth-related in localStorage                                                                                                 |
| Token sent over plain HTTP                                  | `secure: true` in production; app served over HTTPS; `app.set('trust proxy', 1)` behind a host's proxy                                                                                                 |
| CSRF (another site submits requests with the user's cookie) | `sameSite: 'lax'`; **no state changes on GET**; mutations accept only `Content-Type: application/json` (HTML forms can't send that cross-site); optional `Origin` header check against `CLIENT_ORIGIN` |
| Forged tokens                                               | Signed with `JWT_SECRET` (≥ 32 random chars, checked at startup — the server refuses to start with a weak or missing secret); `jwt.verify` pinned to `algorithms: ['HS256']`                           |
| Token lives forever                                         | `expiresIn: '7d'`; cookie `maxAge` matches                                                                                                                                                             |
| Logout doesn't kill a copied token (JWTs are stateless)     | Known limitation, documented. _Optional upgrade:_ a `token_version` column on `users` included in the JWT; increment it to log out everywhere                                                          |

### 10.3 Authorization (who can access what)

| Risk                                                                    | Rule                                                                                                                                                                 |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| User A reads / edits / deletes user B's habit by changing the id (IDOR) | Every repository function takes `userId` and uses `WHERE id = ? AND user_id = ?`; not found → `404`                                                                  |
| Logging a day on someone else's habit                                   | The log service first loads the habit with the user check, then writes the log                                                                                       |
| Mass assignment (sending `userId` or `id` in the body)                  | zod schemas use `.strict()`; `user_id` always comes from `req.user.id`, never from the request                                                                       |
| Forgetting `requireAuth` on a new route                                 | `requireAuth` is applied once at the router level for `/habits` and `/stats`, not per route; an API test checks every protected route returns `401` without a cookie |

### 10.4 Input validation & injection

| Risk                   | Rule                                                                                                                                                                                                                                                                     |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| SQL injection          | Only prepared statements with `?` parameters (`db.prepare(...).run(a, b)`); never build SQL with string concatenation or template literals                                                                                                                               |
| Bad / unexpected input | zod validates `body`, `params` and `query` on every route. `id` → positive integer; `date` → real calendar date `YYYY-MM-DD`, not in the future; `color` → `^#[0-9a-fA-F]{6}$`; `icon` → max 8 chars; `name` → trimmed, 1–60 chars; `scheduleDays` → unique integers 0–6 |
| Huge requests (DoS)    | `express.json({ limit: '10kb' })`; range queries capped (`days` ≤ 366, `from`–`to` ≤ 1 year)                                                                                                                                                                             |
| XSS in the UI          | React escapes all text by default; **no `dangerouslySetInnerHTML`** anywhere (ESLint rule `react/no-danger`); user values used in `style` (habit color) are validated as hex first                                                                                       |

### 10.5 HTTP hardening

- `helmet()` → sets safe headers (Content-Security-Policy, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`...) and removes `X-Powered-By`.
- CORS: not needed in dev (Vite proxy). In production, either serve the client from the same origin, or `cors({ origin: CLIENT_ORIGIN, credentials: true })` — never `origin: '*'` with credentials.
- Error handler: in production return a generic `{ error: { message: 'Something went wrong' } }` for `500`s; stack traces only in the server log.

### 10.6 Secrets, data & dependencies

- `.env` and `*.db` are in `.gitignore`; only `.env.example` (no real values) is committed.
- Environment variables are validated with zod at startup (`config/env.ts`) → the app fails fast with a clear message.
- Logging with `pino`: log method, path, status, duration and user id — **never** passwords, password hashes, cookies or tokens (`redact` option).
- API responses never include `password_hash` — the repository maps rows to a `User` type that doesn't have it.
- Dependencies: committed `package-lock.json`, `npm audit` in CI, Dependabot enabled on GitHub.

---

## 11. Testing

| What                | Tool                                             | Cases                                                                                                                                    |
| ------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Streak logic        | Vitest                                           | consecutive days, skipped in middle, gap resets, today not logged, empty, longest streak                                                 |
| Date utils          | Vitest                                           | previousDay across month/year boundaries, weekStart, isScheduledOn                                                                       |
| Auth API            | Vitest + Supertest                               | register → 201 + cookie, duplicate email → 409, wrong password → 401, `/me` without cookie → 401, password hash never returned           |
| API                 | Vitest + Supertest (in-memory SQLite `:memory:`) | user A can't read/edit/delete user B's habit (404), create → 201, invalid body → 400, unknown id → 404, log upsert, delete cascades logs |
| Frontend (optional) | Vitest + React Testing Library                   | `CheckInButton` toggles, `HabitFormModal` validation                                                                                     |

---
