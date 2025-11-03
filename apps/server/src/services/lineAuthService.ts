import jwt from 'jsonwebtoken';

import { getEnv } from '../config/env.js';
import type { User } from '../db/index.js';
import { upsertLineUser } from './userService.js';

const env = getEnv();

interface VerifyResponse {
  sub: string;
  name?: string;
  picture?: string;
  email?: string;
}

interface TokenResponse {
  access_token: string;
  expires_in: number;
  id_token: string;
  refresh_token?: string;
  scope?: string;
  token_type: string;
}

export async function verifyLineIdToken(idToken: string) {
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

  const payload = (await response.json()) as VerifyResponse;
  if (!payload.sub) {
    throw Object.assign(new Error('LINE verify response missing sub'), { status: 401 });
  }

  return payload;
}

export async function exchangeAuthorizationCode(code: string, redirectUri: string): Promise<TokenResponse> {
  if (!env.LINE_LOGIN_CHANNEL_SECRET) {
    throw new Error('LINE_LOGIN_CHANNEL_SECRET is required to exchange authorization code');
  }

  let normalizedRedirectUri = redirectUri.trim();
  try {
    const url = new URL(normalizedRedirectUri);
    normalizedRedirectUri = url.toString();
  } catch {
    throw new Error(`Invalid redirect URI: ${redirectUri}`);
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: normalizedRedirectUri,
    client_id: env.LINE_LOGIN_CHANNEL_ID,
    client_secret: env.LINE_LOGIN_CHANNEL_SECRET,
  });

  console.info('[line-token-exchange] request', {
    clientId: env.LINE_LOGIN_CHANNEL_ID,
    redirectUri: normalizedRedirectUri,
    grantType: 'authorization_code',
  });

  const response = await fetch('https://api.line.me/oauth2/v2.1/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('[line-token-exchange] failed', {
      status: response.status,
      statusText: response.statusText,
      body: text,
      redirectUri: normalizedRedirectUri,
    });
    throw new Error(`LINE token exchange failed: ${response.status} ${text}`);
  }

  const tokens = (await response.json()) as TokenResponse;
  console.info('[line-token-exchange] success', {
    scope: tokens.scope,
    expiresIn: tokens.expires_in,
  });
  return tokens;
}

export async function loginWithLineIdToken(idToken: string) {
  const profile = await verifyLineIdToken(idToken);
  const user = await upsertLineUser({
    lineUserId: profile.sub,
    displayName: profile.name,
    avatar: profile.picture,
  });
  const token = issueJwt(user);
  return { user, token };
}

export async function loginWithAuthorizationCode(code: string, redirectUri: string) {
  const tokens = await exchangeAuthorizationCode(code, redirectUri);
  const result = await loginWithLineIdToken(tokens.id_token);
  return { ...result, tokens };
}

export function issueJwt(user: User) {
  return jwt.sign({ userId: user.id }, env.JWT_SECRET, { expiresIn: '7d' });
}

// Backward compatibility for existing callers
export const loginWithLine = loginWithLineIdToken;
