# Habit Tracker — Project Documentation

This is the technical documentation for the Habit Tracker, built for the TalentBridge practical assessment (Option 1: build a small application with AI tools).

| Document                        | What it covers                                            |
| ------------------------------- | --------------------------------------------------------- |
| [`README.md`](../README.md)     | Short intro, quick start, scripts                         |
| **`docs/DOCUMENTATION.md`**     | **This file: how the whole system works**                 |
| [`plan.md`](../plan.md)         | The original design plan written before coding            |
| [`steps.md`](../steps.md)       | Phase-by-phase build log with what was done in each phase |
| [`docs/review.md`](./review.md) | Quality, security and accessibility review, bugs found    |

---

## Table of contents

1. [Overview](#1-overview)
2. [Features](#2-features)
3. [Tech stack](#3-tech-stack)
4. [Architecture](#4-architecture)
5. [Project structure](#5-project-structure)
6. [Database](#6-database)
7. [API reference](#7-api-reference)
8. [Business rules](#8-business-rules)
9. [Frontend](#9-frontend)
10. [Security](#10-security)
11. [Testing & quality](#11-testing--quality)
12. [Setup & running](#12-setup--running)
13. [Configuration](#13-configuration)
14. [Deployment](#14-deployment)
15. [Known limitations & future work](#15-known-limitations--future-work)

---

## 1. Overview

The Habit Tracker is a full-stack web app for building habits. You can:

- create habits on a daily, weekly or specific-days schedule
- tick them off each day with one tap
- keep streaks going
- get a reminder popup when you open the app
- see your progress on a stats page

Each user has their own account, and their data is private to them.

**Demo account** (after `npm run seed`): `demo@example.com` / `demo1234`. It comes with several habits and 30 days of history.

---

## 2. Features

| Area               | What it does                                                                                                                                                                                                                       |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Accounts**       | Register, log in, log out. Passwords are hashed with bcrypt. The session is kept in an httpOnly cookie. Users who aren't logged in are redirected to login, then sent back to the page they asked for.                             |
| **Habits**         | Create, edit and delete habits, each with a name, icon (emoji), colour, optional category and schedule: daily, weekly (once per week) or specific weekdays.                                                                        |
| **Check-ins**      | Mark a habit done or skipped, or undo it. Updates show instantly (optimistic UI) and are rolled back if the server fails. Past days can be fixed from the 7-day strip or the 30-day history.                                       |
| **Streaks**        | Current and best streak for **daily** habits. Weekly and specific-days habits show weekly progress (e.g. "2 / 3 this week") instead.                                                                                               |
| **Daily reminder** | When you open the app, a popup lists what's left today. You can check habits off right in the popup. "Later" snoozes it for this visit; "Don't remind me today" hides it until tomorrow.                                           |
| **Stats**          | For the last 7, 30 or 90 days: completion rate, perfect days, times done, most missed weekday, a daily completion chart, per-habit ranking and misses by weekday. Every chart has a tooltip, keyboard navigation and a table view. |
| **Heatmap**        | A GitHub-style 12-month heatmap on each habit's detail page.                                                                                                                                                                       |
| **Accessibility**  | Usable with the keyboard alone, labelled for screen readers, 0 axe-core violations, respects light/dark OS setting, works on phones (bottom tab bar).                                                                              |

---

## 3. Tech stack

| Layer        | Technology                                                                            | Why                                                               |
| ------------ | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Frontend     | React 19, Vite, TypeScript, React Router                                              | Fast dev server, type safety, standard routing                    |
| Server state | TanStack Query                                                                        | Caching, refetching, optimistic updates with rollback             |
| Styling      | CSS Modules + CSS custom properties (design tokens)                                   | Scoped styles, no runtime cost, easy dark mode                    |
| Backend      | Node.js, Express 5, TypeScript                                                        | Simple, well known; Express 5 forwards async errors automatically |
| Validation   | zod (shared by client and server)                                                     | One definition of "valid" for forms and API                       |
| Database     | SQLite through Node's built-in `node:sqlite`                                          | Zero setup, single file, no native build tools needed on Windows  |
| Auth         | bcryptjs + JSON Web Token in an httpOnly cookie                                       | Token is not readable by JavaScript (XSS-safe)                    |
| Security     | helmet, express-rate-limit, CORS, custom CSRF checks                                  | Standard hardening                                                |
| Logging      | pino                                                                                  | Structured, fast logs                                             |
| Testing      | Vitest, Supertest, Playwright, axe-core, Postman/Newman                               | Unit, API, browser, accessibility and contract tests              |
| Tooling      | npm workspaces, ESLint (type-aware), Prettier, Husky + lint-staged, GitHub Actions CI | Consistent code, checks before every commit and on every push     |

---

## 4. Architecture

```
┌──────────────────────────── Browser ─────────────────────────────┐
│  React app (Vite)                                                 │
│  pages → components → hooks (TanStack Query) → api/client.ts      │
└───────────────────────────────┬───────────────────────────────────┘
                                │  fetch /api/*  (JSON, cookie sent automatically)
┌───────────────────────────────▼───────────────────────────────────┐
│  Express API                                                      │
│  middleware: helmet → CORS → rate limit → JSON (10 kb) → CSRF     │
│  routes → validate (zod) → requireAuth → controller               │
│          → service (business rules) → repository (SQL)            │
└───────────────────────────────┬───────────────────────────────────┘
                                │  prepared statements
                        ┌───────▼────────┐
                        │  SQLite file   │
                        └────────────────┘

          @habit/shared — types, zod schemas, constants, date helpers
                     imported by BOTH client and server
```

### Backend layers

Each layer has one job, so every piece can be tested on its own.

| Layer          | Responsibility                                                   | Example                                  |
| -------------- | ---------------------------------------------------------------- | ---------------------------------------- |
| **Route**      | URL + HTTP method, which middleware runs                         | `habits.routes.ts`                       |
| **Middleware** | Cross-cutting checks: validation, auth, CSRF, rate limit, errors | `validate.ts`, `requireAuth.ts`          |
| **Controller** | Read the request, call the service, send the response            | `habits.controller.ts`                   |
| **Service**    | Business rules: streaks, schedules, stats                        | `streaks.service.ts`, `stats.service.ts` |
| **Repository** | SQL only, always filtered by `user_id`                           | `habits.repository.ts`                   |

The streak and stats rules are **pure functions**: data goes in and a result comes out, with no database or HTTP involved. That makes them easy to unit-test, case by case.

### Shared package

`shared/` (`@habit/shared`) holds the TypeScript types, zod schemas, constants and date helpers. The client uses the schemas to validate forms; the server uses the same schemas to validate requests. If a rule changes, it changes in one place.

---

## 5. Project structure

```
habit-tracker/
├── shared/src/
│   ├── types.ts          # Habit, HabitLog, HabitWithStats, StatsOverview, ApiSuccess/ApiError
│   ├── schemas.ts        # zod: register, login, habit create/update, log, query params
│   ├── constants.ts      # limits, icons, colours, schedule types
│   └── dates.ts          # date-string helpers shared by both sides
│
├── server/src/
│   ├── index.ts          # starts the HTTP server
│   ├── app.ts            # builds the Express app (middleware + routes)
│   ├── config/env.ts     # reads and validates environment variables (zod)
│   ├── db/               # connection, migrations, seed
│   ├── middleware/       # validate, requireAuth, csrfProtection, rateLimit, noStore, errorHandler, notFound
│   ├── routes/           # auth, habits, stats, health
│   ├── controllers/      # auth, habits, stats
│   ├── services/         # auth, habits, streaks, stats
│   ├── repositories/     # users, habits, logs (SQL)
│   ├── utils/            # HttpError, authCookie, logger, dates, duration
│   └── tests/            # Vitest unit + Supertest API tests
│
├── client/src/
│   ├── main.tsx, App.tsx # entry + routes
│   ├── api/              # fetch wrapper, endpoint functions, query keys, query client
│   ├── context/          # AuthProvider
│   ├── hooks/            # auth/, habits/, stats/, reminders/, common/
│   ├── components/
│   │   ├── ui/           # Button, Input, Modal, Card, Badge, ConfirmDialog, … (generic)
│   │   ├── layout/       # AppLayout, Header, NavBar, UserMenu, PageHeader
│   │   ├── auth/         # AuthForm, PasswordInput, ProtectedRoute, PublicOnlyRoute
│   │   ├── habits/       # HabitCard, HabitFormModal, CheckInButton, StreakBadge, YearHeatmap, …
│   │   ├── reminders/    # DailyReminderModal
│   │   └── stats/        # ColumnChart, DataTable, StatTile, PeriodFilter, HabitCompletionList
│   ├── pages/            # Today, ManageHabits, HabitDetail, Stats, Login, Register, NotFound
│   ├── styles/           # variables.css (design tokens), global.css
│   └── utils/            # dates, habits, reminders, formErrors, format (+ unit tests)
│
├── postman/              # Postman collection for the whole API
├── docs/                 # this file + review
└── .github/workflows/ci.yml
```

---

## 6. Database

SQLite, a single file at `server/data/habits.db`. The schema is created by migrations (`server/src/db/migrations/`), which run automatically when the server starts.

```
users 1 ──── * habits 1 ──── * habit_logs
```

### `users`

| Column          | Type    | Notes                                 |
| --------------- | ------- | ------------------------------------- |
| `id`            | INTEGER | Primary key                           |
| `name`          | TEXT    | Required                              |
| `email`         | TEXT    | Unique, always stored lowercase       |
| `password_hash` | TEXT    | bcrypt hash, never the plain password |
| `created_at`    | TEXT    | Timestamp                             |

### `habits`

| Column                     | Type    | Notes                                                      |
| -------------------------- | ------- | ---------------------------------------------------------- |
| `id`                       | INTEGER | Primary key                                                |
| `user_id`                  | INTEGER | FK → users, `ON DELETE CASCADE`                            |
| `name`                     | TEXT    | Max 60 characters                                          |
| `icon`                     | TEXT    | Emoji                                                      |
| `color`                    | TEXT    | Hex colour                                                 |
| `category`                 | TEXT    | Optional                                                   |
| `schedule_type`            | TEXT    | `daily` \| `weekly` \| `specific_days` (CHECK constraint)  |
| `schedule_days`            | TEXT    | Weekdays 0–6 as CSV (0 = Sunday), only for `specific_days` |
| `target_count`             | INTEGER | Reserved for measurable targets                            |
| `reminder_time`            | TEXT    | Optional `HH:MM`                                           |
| `created_at`, `updated_at` | TEXT    | Timestamps                                                 |

### `habit_logs`

| Column       | Type    | Notes                                         |
| ------------ | ------- | --------------------------------------------- |
| `id`         | INTEGER | Primary key                                   |
| `habit_id`   | INTEGER | FK → habits, `ON DELETE CASCADE`              |
| `date`       | TEXT    | Local date `YYYY-MM-DD`, chosen by the client |
| `status`     | TEXT    | `done` \| `skipped`                           |
| `value`      | INTEGER | Reserved for measurable targets               |
| `created_at` | TEXT    | Timestamp                                     |

`UNIQUE (habit_id, date)` means there is at most one log per habit per day. A day with no row means "not logged".

**Indexes:** `habits(user_id)`, `habit_logs(habit_id, date)`.

---

## 7. API reference

Base URL: `/api`. All bodies are JSON.

**Success:** `{ "data": … }`. **Error:** `{ "error": { "message": "…", "details"?: … } }`.

| Status          | Meaning                                                                |
| --------------- | ---------------------------------------------------------------------- |
| 200 / 201 / 204 | OK / created / no content                                              |
| 400             | Validation failed (`details` lists the field errors)                   |
| 401             | Not logged in, or the session expired                                  |
| 403             | Request came from a foreign origin (CSRF check)                        |
| 404             | Not found, **including another user's habit** (existence isn't leaked) |
| 409             | Email already registered                                               |
| 415             | A write request that isn't JSON (CSRF check)                           |
| 429             | Too many requests                                                      |
| 500             | Unexpected error (details hidden in production)                        |

### Auth

| Method | Route                | Body                        | Response                           |
| ------ | -------------------- | --------------------------- | ---------------------------------- |
| POST   | `/api/auth/register` | `{ name, email, password }` | `201 { data: user }` + sets cookie |
| POST   | `/api/auth/login`    | `{ email, password }`       | `200 { data: user }` + sets cookie |
| POST   | `/api/auth/logout`   | —                           | `204`, clears cookie               |
| GET    | `/api/auth/me`       | —                           | `200 { data: user }` or `401`      |

Register and login are limited to **10 attempts per 15 minutes**. Password rules: 8+ characters, at least one letter and one number, max 72 bytes (bcrypt's limit).

### Habits (login required)

| Method | Route                        | Params / body                                                                     | Response                                           |
| ------ | ---------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------- |
| GET    | `/api/habits`                | `?today=YYYY-MM-DD&days=7`                                                        | `HabitWithStats[]`: habits + streaks + recent logs |
| POST   | `/api/habits`                | `{ name, icon?, color?, category?, scheduleType?, scheduleDays?, reminderTime? }` | `201 Habit`                                        |
| GET    | `/api/habits/:id`            | `?today=&from=&to=` (range ≤ 366 days)                                            | `HabitWithStats` with logs in the range            |
| PATCH  | `/api/habits/:id`            | any subset of the create fields (at least one)                                    | `Habit`                                            |
| DELETE | `/api/habits/:id`            | —                                                                                 | `204` (its logs are deleted too)                   |
| PUT    | `/api/habits/:id/logs/:date` | `{ status: "done" \| "skipped" }`                                                 | `HabitLog` (creates or replaces)                   |
| DELETE | `/api/habits/:id/logs/:date` | —                                                                                 | `204` (undo)                                       |

Logging a future date returns `400`. `PUT` and `DELETE` are **idempotent**, so a double-click can't flip the state twice.

### Stats (login required)

| Method | Route        | Params                      | Response                                                                                                                              |
| ------ | ------------ | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/api/stats` | `?today=YYYY-MM-DD&days=30` | `StatsOverview`: `completionRate`, `done`, `target`, `perfectDays`, `perHabit[]`, `trend[]`, `missedByWeekday[]`, `mostMissedWeekday` |

### Health

| Method | Route         | Response                                              |
| ------ | ------------- | ----------------------------------------------------- |
| GET    | `/api/health` | `{ status: "ok", database: "ok", uptime, timestamp }` |

**Why the client sends `today`:** the server never works out "today" from its own clock. A check-in at 23:30 in Tirana must count for that local day, even if the server runs in UTC.

The full collection with automated checks is in `postman/habit-tracker.postman_collection.json` (43 requests, 102 assertions).

---

## 8. Business rules

### Schedules

| Type            | Due on                        | Progress shown       |
| --------------- | ----------------------------- | -------------------- |
| `daily`         | Every day                     | Streak               |
| `weekly`        | Once per week (Monday–Sunday) | "Done this week" ✓/– |
| `specific_days` | The chosen weekdays           | "2 / 3 this week"    |

### Streaks (daily habits only)

- `done` adds 1 to the streak.
- `skipped` **pauses** the streak: it doesn't add to it and doesn't break it (for a sick day or a rest day).
- A day with **no log breaks** the streak.
- **Today doesn't break the streak until it's over.** If today isn't logged yet, the streak counts from yesterday.
- **Best streak** = the longest run in the whole history.

Streaks only make sense when every day is expected, so non-daily habits show weekly progress instead.

### Completion rate (stats)

```
completion rate = done ÷ (scheduled days − skipped days)
```

- Skipped days are left out of both sides.
- An unlogged **today** counts as "in progress", not missed.
- Logs on days a habit isn't scheduled are ignored.
- Weekly habits are counted per week, not per day.
- Days before a habit was created don't count as missed, unless the user filled them in.
- **Perfect day** = every habit due that day was done.
- **Most missed weekday** = the weekday with the most misses; ties are all shown ("Tue & Thu").

### Daily reminder

- It appears once when the app is opened, if anything due today is still unfinished.
- Whether to show it is decided from a **snapshot** taken at first load, so ticking or unticking habits during the visit doesn't make it pop up again.
- "Don't remind me today" is saved per user and per date in localStorage.
- Checking off the last habit in the popup closes it with a "All done for today 🎉" toast.

---

## 9. Frontend

### Pages and routes

| Route         | Page               | Access     | Purpose                                         |
| ------------- | ------------------ | ---------- | ----------------------------------------------- |
| `/`           | `TodayPage`        | logged in  | Today's habits, check-ins, 7-day strip          |
| `/habits`     | `ManageHabitsPage` | logged in  | All habits, category filter, create/edit/delete |
| `/habits/:id` | `HabitDetailPage`  | logged in  | One habit: stats, 30-day history, year heatmap  |
| `/stats`      | `StatsPage`        | logged in  | Analytics                                       |
| `/login`      | `LoginPage`        | logged out | Log in (+ "Try the demo account")               |
| `/register`   | `RegisterPage`     | logged out | Create an account                               |
| `*`           | `NotFoundPage`     | anyone     | 404                                             |

`ProtectedRoute` sends logged-out users to `/login` and remembers where they were going. `PublicOnlyRoute` keeps logged-in users away from the login and register pages.

### Data fetching

- **`api/client.ts`:** one `fetch` wrapper. It sends cookies, sets JSON headers, turns error responses into an `ApiRequestError`, and on `401` clears the session.
- **TanStack Query** caches every server response under a key from `api/queryKeys.ts` (e.g. `['habits', 'list', today]`).
- **Hooks** wrap the queries so pages never call `fetch` directly: `useHabits`, `useHabit`, `useHabitYear`, `useStats`, `useLogHabit`, `useHabitMutations`, `useLogin`, `useLogout`, `useMe`, `useDailyReminder`.
- **Optimistic check-ins:** `useLogHabit` updates the cache immediately, rolls back on error, then refetches so streaks come from the server. It also refreshes the stats.
- **`clearSession()`** runs on logout or expiry. It sets the user to `null` in place, so watching components react, then removes all other cached data so the next user never sees it.

### Components

- `components/ui` holds **generic** building blocks with no knowledge of habits (Button, Input, Modal, Card, ConfirmDialog, Skeleton, …).
- Feature folders (`habits`, `stats`, `reminders`, `auth`, `layout`) build on them.
- Each component lives in its own folder (`Component.tsx`, `Component.module.css`, `index.ts`) and is exported through a barrel file.
- Modals use the native `<dialog>` element, so focus trapping, Esc and the backdrop come from the browser. Focus goes to the first form field when a modal opens.

### Charts

The charts are hand-built SVG, not a library (about 7 KB instead of about 100 KB for Recharts).

- **`ColumnChart`:**
  - hover tooltip
  - one keyboard tab stop; ←/→/Home/End move between columns and a live region reads the value out
  - highlighted columns for the worst weekday(s)
  - resizes with its container
- **`DataTable`:** "Show as table" under every chart, for screen readers and exact numbers.
- **`YearHeatmap`:** 53 weeks × 7 days, with month labels.

### Styling

- `styles/variables.css` defines design tokens: colours, spacing, radius, font sizes, shadows, chart colours.
- Dark mode follows the OS setting (`prefers-color-scheme`).
- CSS Modules keep class names local to each component.
- On phones the navigation becomes a bottom tab bar.

---

## 10. Security

| Risk                        | Protection                                                                                                                                                            |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stolen passwords            | bcrypt with cost 12; passwords never logged or returned                                                                                                               |
| Token theft through XSS     | JWT stored in an **httpOnly**, `SameSite=Lax` cookie (`Secure` in production), not in localStorage                                                                    |
| XSS                         | React escapes output; no `dangerouslySetInnerHTML` (lint rule); helmet sets a Content Security Policy                                                                 |
| CSRF                        | `SameSite=Lax` cookie + writes must be `application/json` (else `415`) + the `Origin` header is checked (else `403`)                                                  |
| SQL injection               | Prepared statements only, no string-built SQL                                                                                                                         |
| Bad input / mass assignment | Strict zod schemas on body, params and query; unknown fields are rejected                                                                                             |
| Seeing other users' data    | Every query is filtered by `user_id`; another user's habit returns `404`; covered by tests                                                                            |
| Brute force                 | 10 login/register attempts per 15 min; 300 API requests per 15 min                                                                                                    |
| User enumeration at login   | Login gives the same "Invalid email or password" message whether the email exists or not (registration must say "Email already in use"; the rate limit slows probing) |
| Big payloads                | JSON body limit of 10 kb                                                                                                                                              |
| Leaking internals           | Production errors hide stack traces; `Cache-Control: no-store` on API responses                                                                                       |
| Weak secrets                | Server refuses to start if `JWT_SECRET` is shorter than 32 characters                                                                                                 |
| Vulnerable packages         | `npm audit` in CI: 0 vulnerabilities                                                                                                                                  |

---

## 11. Testing & quality

| Check                     | Tool                                  | Result                                                                          |
| ------------------------- | ------------------------------------- | ------------------------------------------------------------------------------- |
| Server unit + API tests   | Vitest + Supertest (in-memory SQLite) | **158 passed**                                                                  |
| Client unit tests         | Vitest                                | **35 passed**                                                                   |
| API contract              | Postman / Newman                      | **43 requests, 102 assertions, 0 failed**                                       |
| End-to-end (real browser) | Playwright                            | **76 checks** in 4 suites: auth 16, habits 23, reminder + keyboard 25, stats 12 |
| Accessibility             | axe-core, WCAG 2.2 AA                 | **0 violations** on 14 page states                                              |
| Lint                      | ESLint (type-aware, react-hooks)      | 0 problems                                                                      |
| Types                     | `tsc` strict, every workspace         | 0 errors                                                                        |
| Formatting                | Prettier                              | clean                                                                           |

**What's tested:**

- streak and stats rules, case by case
- every endpoint, including the 400, 401 and 404 paths
- user isolation, so one user can never read or change another's habits
- the CSRF checks
- the reminder logic
- form error mapping

The browser tests click through the real app: register, create a habit, check in, session expiry, reminder popup, keyboard-only use, and stats values compared against the API.

**CI** (`.github/workflows/ci.yml`) runs on every push: format check → lint → typecheck → tests → build → `npm audit`. **Husky** runs lint and Prettier on staged files before each commit.

---

## 12. Setup & running

**Requirements:** Node.js 22.13+ and npm. No Python or C++ build tools are needed.

```bash
npm install                          # installs all workspaces and builds @habit/shared
cp server/.env.example server/.env   # then set JWT_SECRET (32+ characters)
npm run seed                         # optional: demo@example.com / demo1234
npm run dev                          # client + server together
```

- App: http://localhost:5173 (Vite proxies `/api` to the server)
- API: http://localhost:3001/api/health

Generate a secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### Scripts

| Command             | What it does                                    |
| ------------------- | ----------------------------------------------- |
| `npm run dev`       | Shared (watch) + server + client                |
| `npm run build`     | Builds shared, server and client                |
| `npm start`         | Runs the built server                           |
| `npm test`          | Server and client tests                         |
| `npm run lint`      | ESLint                                          |
| `npm run typecheck` | TypeScript in every workspace                   |
| `npm run format`    | Prettier                                        |
| `npm run seed`      | Recreates the demo account with 30 days of data |

After changing anything in `shared/`, run `npm run build -w shared` (`npm run dev` does this automatically in watch mode).

---

## 13. Configuration

`server/.env`:

| Variable         | Default                 | Meaning                                     |
| ---------------- | ----------------------- | ------------------------------------------- |
| `NODE_ENV`       | `development`           | `development` \| `production` \| `test`     |
| `PORT`           | `3001`                  | API port                                    |
| `DB_PATH`        | `./data/habits.db`      | SQLite file (`:memory:` for a throwaway DB) |
| `JWT_SECRET`     | — (required)            | 32+ random characters                       |
| `JWT_EXPIRES_IN` | `7d`                    | Login lifetime                              |
| `BCRYPT_ROUNDS`  | `12`                    | Password hashing cost                       |
| `CLIENT_ORIGIN`  | `http://localhost:5173` | Allowed origin for CORS and the CSRF check  |
| `LOG_LEVEL`      | `info`                  | pino log level                              |

All variables are validated with zod at startup. The server stops with a clear message if one is missing or wrong.

---

## 14. Deployment

1. `npm run build`. The client goes to `client/dist`; the server compiles to `server/dist`.
2. Set `NODE_ENV=production`, a strong `JWT_SECRET` and `CLIENT_ORIGIN` to the public URL.
3. `npm start`.

The database is a file, so the host needs a **persistent disk** (e.g. Render or Railway with a volume, or a small VPS). Free hosts with temporary disks lose the data on every restart.

---
