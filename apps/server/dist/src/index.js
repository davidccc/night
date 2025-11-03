import http from 'node:http';
import { createApp } from './app.js';
import { getEnv } from './config/env.js';
import { prisma } from './lib/prisma.js';
async function bootstrap() {
    const env = getEnv();
    const app = createApp();
    const server = http.createServer(app);
    server.listen(env.PORT, () => {
        console.log(`🚀 Night-king server listening on port ${env.PORT}`);
    });
    const shutdown = async (signal) => {
        console.log(`\nReceived ${signal}. Closing server...`);
        server.close(async () => {
            await prisma.$disconnect();
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
