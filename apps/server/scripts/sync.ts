import { closeDatabase, initDatabase } from '../src/db/index.js';

async function main() {
  try {
    await initDatabase();
    console.log('Database schema synchronized successfully.');
  } finally {
    await closeDatabase().catch((error) => {
      console.error('Failed to close database connection', error);
    });
  }
}

main().catch((error) => {
  console.error('Database sync failed', error);
  process.exit(1);
});
