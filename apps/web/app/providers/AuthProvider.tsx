'use client';

import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import type { ApiUser } from '../lib/api';
import { fetchProfile } from '../lib/api';

type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'error';

interface AuthState {
  status: AuthStatus;
  user?: ApiUser;
  token?: string;
  error?: string;
}

interface AuthContextValue extends AuthState {
  refresh: () => Promise<void>;
  logout: () => void;
  login: (redirectUrl?: string) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_STORAGE_KEY = 'night-king.auth.token';
const ERROR_STORAGE_KEY = 'night-king.auth.error';

function readAuthParamsFromUrl() {
  if (typeof window === 'undefined') {
    return { token: undefined as string | undefined, error: undefined as string | undefined };
  }

  const url = new URL(window.location.href);
  const token = url.searchParams.get('token') ?? undefined;
  const error = url.searchParams.get('error') ?? undefined;

  if (token) {
    url.searchParams.delete('token');
  }

  if (error) {
    url.searchParams.delete('error');
  }

  if (token || error) {
    window.history.replaceState({}, document.title, url.toString());
  }

  let fallbackError: string | undefined;
  try {
    fallbackError = window.sessionStorage.getItem(ERROR_STORAGE_KEY) ?? undefined;
    if (fallbackError) {
      window.sessionStorage.removeItem(ERROR_STORAGE_KEY);
    }
  } catch {
    fallbackError = undefined;
  }

  return { token, error: error ?? fallbackError };
}

function buildAuthorizeUrl(redirectUrl: string) {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!base) {
    throw new Error('缺少 NEXT_PUBLIC_API_BASE_URL 設定，無法建立登入網址。');
  }

  try {
    const authorizeUrl = new URL('/line/authorize', `${base.replace(/\/+$/, '')}/`);
    authorizeUrl.searchParams.set('redirect', redirectUrl);
    return authorizeUrl.toString();
  } catch {
    return `${base.replace(/\/+$/, '')}/line/authorize?redirect=${encodeURIComponent(redirectUrl)}`;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'idle' });

  const login = useCallback((redirectUrl?: string) => {
    if (typeof window === 'undefined') {
      return;
    }
    const target = redirectUrl ?? window.location.href;
    const authorizeUrl = buildAuthorizeUrl(target);
    console.info('[auth] redirecting to LINE authorize', authorizeUrl);
    window.location.href = authorizeUrl;
  }, []);

  const authenticate = useCallback(async () => {
    if (typeof window === 'undefined') {
      return;
    }

    const { token: tokenFromUrl, error: errorFromUrl } = readAuthParamsFromUrl();
    if (errorFromUrl) {
      setState({ status: 'error', error: errorFromUrl });
      return;
    }

    if (tokenFromUrl) {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, tokenFromUrl);
    }

    const storedToken = window.localStorage.getItem(TOKEN_STORAGE_KEY);

    if (!storedToken) {
      login(window.location.href);
      return;
    }

    try {
      setState({ status: 'loading', token: storedToken });
      const { user } = await fetchProfile(storedToken);
      setState({ status: 'authenticated', user, token: storedToken });
    } catch (error) {
      console.error('Login verification failed', error);
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
      try {
        window.sessionStorage.setItem(ERROR_STORAGE_KEY, error instanceof Error ? error.message : '登入失敗，請稍後再試');
      } catch {
        // ignore storage errors
      }
      setState({
        status: 'error',
        error: error instanceof Error ? error.message : '登入失敗，請稍後再試',
      });
    }
  }, [login]);

  useEffect(() => {
    void authenticate();
  }, [authenticate]);

  const logout = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    setState({ status: 'idle' });
    login();
  }, [login]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      refresh: authenticate,
      logout,
      login,
    }),
    [state, authenticate, logout, login]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth 必須在 AuthProvider 內使用');
  }
  return ctx;
}
