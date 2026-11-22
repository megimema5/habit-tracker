import 'dotenv/config';
import { z } from 'zod';

/**
 * All environment variables are read and validated here, once, at startup.
 * The rest of the code imports `env` instead of touching `process.env`,
 * so a missing or invalid value fails fast with a clear message.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  DB_PATH: z.string().min(1).default('./data/habits.db'),
  JWT_SECRET: z
    .string({ error: 'JWT_SECRET is required' })
    .min(32, 'JWT_SECRET must be at least 32 characters long'),
  JWT_EXPIRES_IN: z
    .string()
    .regex(/^\d+[smhd]$/, 'JWT_EXPIRES_IN must look like 30m, 12h or 7d')
    .default('7d'),
  // Cost factor for bcrypt. 12 is a good default; tests use 4 so they run fast.
  BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(15).default(12),
  CLIENT_ORIGIN: z.url().default('http://localhost:5173'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
});

export type Env = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:\n' + z.prettifyError(parsed.error));
  console.error('\nCheck server/.env (see server/.env.example).');
  process.exit(1);
}

export const env: Env = parsed.data;

export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
