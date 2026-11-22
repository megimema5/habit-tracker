import { defineConfig } from 'vitest/config';

/** Unit tests for the client's pure logic (utils). They run in Node — no browser needed. */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
