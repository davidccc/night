import { Router } from 'express';
import { z } from 'zod';

import { asyncHandler } from '../../lib/asyncHandler.js';
import { loginWithLine } from '../../services/lineAuthService.js';
import { authenticate } from '../../middleware/auth.js';

const loginSchema = z.object({
  idToken: z.string().min(1),
});

export const loginRouter = Router();

loginRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    const { user, token } = await loginWithLine(parsed.data.idToken);

    res.json({
      token,
      user,
    });
  })
);

loginRouter.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    res.json({ user: req.user });
  })
);
