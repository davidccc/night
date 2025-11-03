import type { NextFunction, Request, Response } from 'express';

interface HttpError extends Error {
  status?: number;
  details?: unknown;
}

export function errorHandler(err: HttpError, _req: Request, res: Response, _next: NextFunction) {
  const status = err.status ?? 500;
  if (status >= 500) {
    console.error(err);
  }
  res.status(status).json({
    error: err.message ?? 'Internal Server Error',
    details: err.details,
  });
}
