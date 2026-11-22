# Habit Tracker

A full-stack habit tracker built for the TalentBridge practical assessment.

Track daily, weekly or specific-day habits, check in with one tap, keep streaks going and get a daily reminder when you open the app.

> Full technical documentation: [`docs/DOCUMENTATION.md`](./docs/DOCUMENTATION.md). See [`plan.md`](./plan.md) for the original design, [`steps.md`](./steps.md) for progress and [`docs/review.md`](./docs/review.md) for the quality, security and accessibility review.

## Features

- **Accounts** – register, log in, log out; passwords hashed with bcrypt, login kept in an httpOnly cookie
- **Habits** – daily, weekly or specific days, with icon, colour, category and optional reminder time
- **One-tap check-ins** – done / skip / undo, instant (optimistic) updates; fix past days from the history strip
- **Streaks & progress** – current and best streak for daily habits, weekly progress for the others, 30-day history
- **Daily reminder** – a popup when you open the app listing what's left today ("Later" snoozes, "Don't remind me today" hides it)
- **Stats** – completion rate, perfect days, most missed weekday, daily completion chart and per-habit ranking for the last 7 / 30 / 90 days; a 12-month heatmap per habit. Every chart has a tooltip, keyboard navigation and a table view
- **Accessible & responsive** – keyboard friendly, screen-reader labels, 0 axe-core violations, works on phones

## Tech stack

| Layer    | Technology                                                      |
| -------- | --------------------------------------------------------------- |
| Frontend | React + Vite + TypeScript, React Router, TanStack Query         |
| Backend  | Node.js + Express 5 + TypeScript, zod, helmet, pino             |
| Database | SQLite via Node's built-in `node:sqlite`                        |
| Shared   | `@habit/shared` — types, zod schemas and constants used by both |
| Tooling  | npm workspaces, ESLint, Prettier, Vitest, Husky, GitHub Actions |

## Project structure

```
habit-tracker/
├── shared/   # @habit/shared — code used by client and server
├── server/   # Express API
└── client/   # React app
```

## Getting started

**Requirements:** Node.js 22.13+ and npm. No Python or C++ build tools needed — the database uses Node's built-in SQLite.

```bash
# 1. install all workspaces (also builds the shared package)
npm install

# 2. create the server env file and set a JWT secret (min 32 characters)
cp server/.env.example server/.env

# 3. (optional) create a demo account with 30 days of history
npm run seed          # demo@example.com / demo1234

# 4. run client + server together
npm run dev
```

- Client: http://localhost:5173
- API: http://localhost:3001/api/health

## Testing the API with Postman

Import [`postman/habit-tracker.postman_collection.json`](./postman/habit-tracker.postman_collection.json) into Postman, start the API with `npm run dev`, then run the whole collection with the Collection Runner. It registers a fresh user, exercises every endpoint (auth, habits, check-ins, stats, security checks) and cleans up after itself — 43 requests with automatic checks.

## Scripts

| Command             | What it does                               |
| ------------------- | ------------------------------------------ |
| `npm run dev`       | Runs shared (watch), server and client     |
| `npm run build`     | Builds shared, server and client           |
| `npm run lint`      | ESLint on the whole repo                   |
| `npm run format`    | Formats everything with Prettier           |
| `npm run typecheck` | TypeScript check in every workspace        |
| `npm test`          | Runs the server tests (Vitest + Supertest) |
