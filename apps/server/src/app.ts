import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import { getEnv } from './config/env.js';
import { errorHandler } from './middleware/error.js';
import { notFoundHandler } from './middleware/notFound.js';
import { apiRouter } from './routes/api/index.js';
import { lineLoginRouter } from './routes/lineLogin.js';
import { webhookRouter } from './routes/webhook.js';

interface CreateAppOptions {
  includeFallback?: boolean;
  applySecurityHeaders?: boolean;
}

export function createApp(options: CreateAppOptions = {}) {
  const { includeFallback = true, applySecurityHeaders = true } = options;
  const env = getEnv();
  const app = express();

  if (applySecurityHeaders) {
    app.use(helmet());
  }
  app.use(
    cors({
      origin: env.CORS_ORIGIN ? env.CORS_ORIGIN.split(',') : '*',
      credentials: true,
    })
  );

  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  app.get('/', (req, res, next) => {
    const token = typeof req.query.token === 'string' ? req.query.token : undefined;
    const error = typeof req.query.error === 'string' ? req.query.error : undefined;

    if (!token && !error) {
      return next();
    }

    res.set('Content-Type', 'text/html; charset=utf-8');
    res.send(`<!DOCTYPE html>
<html>
  <head>
    <meta http-equiv="refresh" content="0;url=/">
    <title>Processing login…</title>
  </head>
  <body>
    <script>
      (() => {
        const token = ${JSON.stringify(token ?? null)};
        const error = ${JSON.stringify(error ?? null)};
        const tokenKey = 'night-king.auth.token';
        const errorKey = 'night-king.auth.error';
        try {
          if (token) {
            localStorage.setItem(tokenKey, token);
          }
          if (error) {
            sessionStorage.setItem(errorKey, error);
          } else {
            sessionStorage.removeItem(errorKey);
          }
        } catch (storageError) {
          console.warn('Failed to persist auth state', storageError);
        }
        const url = new URL(window.location.href);
        url.searchParams.delete('token');
        url.searchParams.delete('error');
        window.location.replace(url.pathname + url.search + url.hash || '/');
      })();
    </script>
  </body>
</html>`);
  });

  app.get('/healthz', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/webhook', webhookRouter);
  app.use('/line', lineLoginRouter);

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.use('/api', apiRouter);

  if (includeFallback) {
    app.use(notFoundHandler);
    app.use(errorHandler);
  }

  return app;
}
