import { Client } from '@line/bot-sdk';
import { getEnv } from '../config/env.js';
const env = getEnv();
export const lineClient = new Client({
    channelAccessToken: env.LINE_CHANNEL_ACCESS_TOKEN,
    channelSecret: env.LINE_CHANNEL_SECRET,
});
