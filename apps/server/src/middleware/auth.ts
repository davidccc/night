import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import { getEnv } from '../config/env.js';
import { getUserById } from '../services/userService.js';

const env = getEnv();

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Missing Authorization header' });
  }

  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Invalid Authorization header' });
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as { userId: number };
    const user = await getUserById(payload.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    req.user = user;
    next();
  } catch (error) {
    console.warn('Authentication failed', error);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
