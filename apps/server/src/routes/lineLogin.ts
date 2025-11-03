import jwt from 'jsonwebtoken';
import { Router } from 'express';

import { getEnv } from '../config/env.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { loginWithAuthorizationCode } from '../services/lineAuthService.js';

const env = getEnv();
const lineLoginRouter = Router();

const STATE_EXPIRES_IN = 10 * 60; // 10 minutes
const AUTHORIZE_ENDPOINT = 'https://access.line.me/oauth2/v2.1/authorize';

function getServerBaseUrl() {
  if (env.BASE_URL) {
    return env.BASE_URL.replace(/\/+$/, '');
  }
  return `http://localhost:${env.PORT}`;
}

function getCallbackUrl() {
  return new URL('/line/callback', `${getServerBaseUrl()}/`).toString();
}

function getDefaultRedirectUrl() {
  if (env.LIFF_BASE_URL) {
    return env.LIFF_BASE_URL;
  }
  if (env.CORS_ORIGIN) {
    return env.CORS_ORIGIN;
  }
  throw new Error('LIFF_BASE_URL or CORS_ORIGIN must be configured for redirect');
}

function sanitizeRedirect(target: string | undefined, fallback: string) {
  if (!target) {
    return fallback;
  }

  try {
    const fallbackUrl = new URL(fallback);

    if (target.startsWith('/')) {
      return new URL(target, fallbackUrl.origin).toString();
    }

    const targetUrl = new URL(target);
    if (targetUrl.origin !== fallbackUrl.origin) {
      return fallback;
    }

    return targetUrl.toString();
  } catch {
    return fallback;
  }
}

function createStateToken(redirectUrl: string) {
  return jwt.sign({ redirectUrl }, env.JWT_SECRET, { expiresIn: STATE_EXPIRES_IN });
}

function verifyStateToken(state: string) {
  try {
    return jwt.verify(state, env.JWT_SECRET) as { redirectUrl?: string };
  } catch {
    throw new Error('Invalid or expired login state');
  }
}

lineLoginRouter.get(
  '/authorize',
  asyncHandler(async (req, res) => {
    const fallbackRedirect = getDefaultRedirectUrl();
    const requestedRedirect =
      typeof req.query.redirect === 'string' ? req.query.redirect : undefined;
    const redirectTarget = sanitizeRedirect(requestedRedirect, fallbackRedirect);
    const state = createStateToken(redirectTarget);

    const authorizeUrl = new URL(AUTHORIZE_ENDPOINT);
    authorizeUrl.searchParams.set('response_type', 'code');
    authorizeUrl.searchParams.set('client_id', env.LINE_LOGIN_CHANNEL_ID);
    authorizeUrl.searchParams.set('redirect_uri', getCallbackUrl());
    authorizeUrl.searchParams.set('state', state);
    authorizeUrl.searchParams.set('scope', 'profile openid');

    console.info('[line-authorize]', {
      authorize: authorizeUrl.toString(),
      redirectTarget,
      callback: getCallbackUrl(),
    });

    res.redirect(authorizeUrl.toString());
  })
);

lineLoginRouter.get(
  '/callback',
  asyncHandler(async (req, res) => {
    console.info('[line-callback] query', req.query);
    const fallbackRedirect = getDefaultRedirectUrl();
    const stateValue = typeof req.query.state === 'string' ? req.query.state : undefined;
    let redirectTarget = fallbackRedirect;

    if (!stateValue) {
      const url = new URL(redirectTarget);
      url.searchParams.set('error', '缺少驗證資訊，請重新登入');
      return res.redirect(url.toString());
    }

    try {
      const payload = verifyStateToken(stateValue);
      redirectTarget = sanitizeRedirect(payload.redirectUrl, fallbackRedirect);
    } catch (error) {
      const url = new URL(redirectTarget);
      url.searchParams.set('error', '登入驗證逾時或來源不正確，請重新登入');
      return res.redirect(url.toString());
    }

    const redirectWithError = (message: string) => {
      const url = new URL(redirectTarget);
      url.searchParams.set('error', message);
      res.redirect(url.toString());
    };

    const errorCode = typeof req.query.error === 'string' ? req.query.error : undefined;
    if (errorCode) {
      const description =
        typeof req.query.error_description === 'string'
          ? req.query.error_description
          : errorCode;
      return redirectWithError(description);
    }

    const authorizationCode =
      typeof req.query.code === 'string' ? req.query.code : undefined;
    if (!authorizationCode) {
      return redirectWithError('缺少授權碼，登入失敗');
    }

    try {
      const { token } = await loginWithAuthorizationCode(
        authorizationCode,
        getCallbackUrl()
      );
      const url = new URL(redirectTarget);
      url.searchParams.set('token', token);
      res.redirect(url.toString());
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '登入流程失敗，請稍後再試';
      redirectWithError(message);
    }
  })
);

export { lineLoginRouter };
