import { middleware } from '@line/bot-sdk';
import express from 'express';
import { getEnv } from '../config/env.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { handleLineEvent } from '../line/handlers.js';
const env = getEnv();
export const webhookRouter = express.Router();
webhookRouter.get('/', (_req, res) => {
    res.json({
        status: 'ok',
        message: 'Use POST to deliver LINE events',
    });
});
webhookRouter.post('/', middleware({
    channelAccessToken: env.LINE_CHANNEL_ACCESS_TOKEN,
    channelSecret: env.LINE_CHANNEL_SECRET,
}), asyncHandler(async (req, res) => {
    const events = Array.isArray(req.body.events)
        ? req.body.events
        : [];
    if (!events.length) {
        return res.json({ status: 'ignored' });
    }
    await Promise.all(events.map((event) => handleLineEvent(event)));
    res.json({ status: 'processed', events: events.length });
}));
