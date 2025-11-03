import type { User } from '@night-king/prisma';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export {};
