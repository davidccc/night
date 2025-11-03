import http from 'node:http';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';
import { getEnv } from './config/env.js';
import { prisma } from './lib/prisma.js';
import { errorHandler } from './middleware/error.js';
import { notFoundHandler } from './middleware/notFound.js';
async function bootstrap() {
    if (!process.env.PORT) {
        process.env.PORT = '3000';
    }
    if (!process.env.NEXT_PUBLIC_API_BASE_URL) {
        process.env.NEXT_PUBLIC_API_BASE_URL = `http://localhost:${process.env.PORT}`;
    }
    const env = getEnv();
    const isDev = env.NODE_ENV !== 'production';
    const currentFile = fileURLToPath(import.meta.url);
    const currentDir = dirname(currentFile);
    const webDir = resolve(currentDir, '../../web');
    process.chdir(webDir);
    const nextModule = await import('next/dist/server/next.js');
    const createNextServer = nextModule.default;
    const nextApp = createNextServer({
        dev: isDev,
        dir: webDir,
    });
    const handle = nextApp.getRequestHandler();
    await nextApp.prepare();
    const app = createApp({ includeFallback: false });
    app.all('*', (req, res) => void handle(req, res));
    app.use(notFoundHandler);
    app.use(errorHandler);
    const server = http.createServer(app);
    server.listen(env.PORT, () => {
        console.log(`🚀 Combined app listening on port ${env.PORT}`);
    });
    const shutdown = async (signal) => {
        console.log(`\nReceived ${signal}. Closing server...`);
        server.close(async () => {
            if ('close' in nextApp && typeof nextApp.close === 'function') {
                await nextApp.close();
            }
            await prisma.$disconnect();
            process.exit(0);
        });
    };
    process.on('SIGTERM', () => void shutdown('SIGTERM'));
    process.on('SIGINT', () => void shutdown('SIGINT'));
}
bootstrap().catch((error) => {
    console.error('Failed to start combined app', error);
    process.exit(1);
});
