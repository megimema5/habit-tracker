import { createApp } from './app.js';
import { env } from './config/env.js';
import { closeDatabase } from './db/connection.js';
import { logger } from './utils/logger.js';

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(`🚀 API running on http://localhost:${env.PORT} (${env.NODE_ENV})`);
});

/**
 * Graceful shutdown: stop accepting new requests, let running ones finish,
 * close the database, then exit.
 */
function shutdown(signal: string): void {
  logger.info(`${signal} received, shutting down…`);
  server.close((err) => {
    if (err) {
      logger.error({ err }, 'Error while closing the server');
      process.exit(1);
    }
    closeDatabase();
    process.exit(0);
  });

  // If something hangs, force exit after 10 seconds.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
