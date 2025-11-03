import { Router } from 'express';

import { authenticate } from '../../middleware/auth.js';
import { loginRouter } from './login.js';
import { bookingRouter } from './booking.js';
import { rewardRouter } from './reward.js';
import { sweetsRouter } from './sweets.js';

export const apiRouter = Router();

apiRouter.use('/login', loginRouter);
apiRouter.use('/sweets', authenticate, sweetsRouter);
apiRouter.use('/booking', authenticate, bookingRouter);
apiRouter.use('/reward', authenticate, rewardRouter);
