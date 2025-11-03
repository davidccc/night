import { Router } from 'express';

import { asyncHandler } from '../../lib/asyncHandler.js';
import { listSweets } from '../../services/sweetService.js';

export const sweetsRouter = Router();

sweetsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const sweets = await listSweets();
    res.json({ sweets });
  })
);
