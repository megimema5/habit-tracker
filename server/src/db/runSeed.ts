/** Entry point for `npm run seed`. Kept separate so tests can import seed() without running it. */
import { isProduction } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { closeDatabase } from './connection.js';
import { DEMO_USER, seed } from './seed.js';

if (isProduction && !process.argv.includes('--force')) {
  logger.error('Refusing to seed in production. Use --force if you really mean it.');
  process.exit(1);
}

try {
  await seed();
  logger.info(`🌱 Seeded demo data. Log in with ${DEMO_USER.email} / ${DEMO_USER.password}`);
} catch (err) {
  logger.error({ err }, 'Seeding failed');
  process.exitCode = 1;
} finally {
  closeDatabase();
}
