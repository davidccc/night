import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { getRewardSummary, setRewardPoints } from '../../services/rewardService.js';
const updateSchema = z.object({
    rewardPoints: z.number().int().min(0),
    reason: z.string().min(1).default('調整積分'),
});
export const rewardRouter = Router();
rewardRouter.get('/:userId', asyncHandler(async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const requestedId = Number.parseInt(req.params.userId, 10);
    if (!Number.isFinite(requestedId) || requestedId <= 0) {
        return res.status(400).json({ error: 'Invalid userId' });
    }
    if (requestedId !== req.user.id) {
        return res.status(403).json({ error: 'Cannot view other users\' rewards' });
    }
    const reward = await getRewardSummary(requestedId);
    res.json({ reward });
}));
rewardRouter.put('/:userId', asyncHandler(async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const requestedId = Number.parseInt(req.params.userId, 10);
    if (!Number.isFinite(requestedId) || requestedId <= 0) {
        return res.status(400).json({ error: 'Invalid userId' });
    }
    if (requestedId !== req.user.id) {
        return res.status(403).json({ error: 'Cannot update other users\' rewards' });
    }
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid request body' });
    }
    const { user, delta } = await setRewardPoints(requestedId, parsed.data.rewardPoints, parsed.data.reason);
    res.json({ user, delta });
}));
