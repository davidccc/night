import http from 'node:http';

import { createApp } from './app.js';
import { getEnv } from './config/env.js';
import { closeDatabase, initDatabase } from './db/index.js';

async function bootstrap() {
  const env = getEnv();
  await initDatabase();
  const app = createApp();

  const server = http.createServer(app);

  server.listen(env.PORT, () => {
    console.log(`🚀 Night-king server listening on port ${env.PORT}`);
  });

  const shutdown = async (signal: string) => {
    console.log(`\nReceived ${signal}. Closing server...`);
    server.close(async () => {
      await closeDatabase().catch((error) => {
        console.error('Failed to close database connection', error);
      });
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

bootstrap().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});
