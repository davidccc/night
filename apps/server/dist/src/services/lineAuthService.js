import jwt from 'jsonwebtoken';
import { getEnv } from '../config/env.js';
import { upsertLineUser } from './userService.js';
const env = getEnv();
export async function verifyLineIdToken(idToken) {
    const body = new URLSearchParams({
        id_token: idToken,
        client_id: env.LINE_LOGIN_CHANNEL_ID,
    });
    const response = await fetch('https://api.line.me/oauth2/v2.1/verify', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
    });
    if (!response.ok) {
        const text = await response.text();
        throw Object.assign(new Error(`LINE verify failed: ${response.status} ${text}`), {
            status: 401,
        });
    }
    const payload = (await response.json());
    if (!payload.sub) {
        throw Object.assign(new Error('LINE verify response missing sub'), { status: 401 });
    }
    return payload;
}
export async function loginWithLine(idToken) {
    const profile = await verifyLineIdToken(idToken);
    const user = await upsertLineUser({
        lineUserId: profile.sub,
        displayName: profile.name,
        avatar: profile.picture,
    });
    const token = issueJwt(user);
    return { user, token };
}
export function issueJwt(user) {
    return jwt.sign({ userId: user.id }, env.JWT_SECRET, { expiresIn: '7d' });
}
