import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // Tests get their own safe values so they never depend on a local .env file.
    env: {
      NODE_ENV: 'test',
      LOG_LEVEL: 'silent',
      DB_PATH: ':memory:',
      JWT_SECRET: 'test-secret-that-is-at-least-32-characters-long',
      BCRYPT_ROUNDS: '4',
    },
  },
});
