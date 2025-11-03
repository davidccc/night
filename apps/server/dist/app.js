import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { getEnv } from './config/env.js';
import { errorHandler } from './middleware/error.js';
import { notFoundHandler } from './middleware/notFound.js';
import { apiRouter } from './routes/api/index.js';
import { webhookRouter } from './routes/webhook.js';
export function createApp(options = {}) {
    const { includeFallback = true } = options;
    const env = getEnv();
    const app = express();
    app.use(helmet());
    app.use(cors({
        origin: env.CORS_ORIGIN ? env.CORS_ORIGIN.split(',') : '*',
        credentials: true,
    }));
    app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
    app.get('/healthz', (_req, res) => {
        res.json({ status: 'ok' });
    });
    app.use('/webhook', webhookRouter);
    app.use(express.json({ limit: '1mb' }));
    app.use(express.urlencoded({ extended: true }));
    app.use('/api', apiRouter);
    if (includeFallback) {
        app.use(notFoundHandler);
        app.use(errorHandler);
    }
    return app;
}
