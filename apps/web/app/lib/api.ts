const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

export interface ApiUser {
  id: number;
  lineUserId: string;
  displayName?: string | null;
  avatar?: string | null;
  rewardPoints: number;
}

export interface ApiSweet {
  id: number;
  name: string;
  description: string;
  imageUrl?: string | null;
  tag?: string | null;
}

export interface ApiBooking {
  id: number;
  sweet: ApiSweet;
  date: string;
  timeSlot: string;
  status: string;
  note?: string | null;
  createdAt: string;
}

export interface ApiRewardLog {
  id: number;
  delta: number;
  reason: string;
  createdAt: string;
}

export interface RewardSummary {
  id: number;
  rewardPoints: number;
  logs: ApiRewardLog[];
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  token?: string;
  data?: Record<string, unknown>;
  cache?: RequestCache;
}

async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.data ? JSON.stringify(options.data) : undefined,
    cache: options.cache ?? 'no-store',
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || response.statusText);
  }

  return response.json() as Promise<T>;
}

export function login(idToken: string) {
  return apiFetch<{ token: string; user: ApiUser }>('/api/login', {
    method: 'POST',
    data: { idToken },
  });
}

export function fetchProfile(token: string) {
  return apiFetch<{ user: ApiUser }>('/api/login/me', { token });
}

export function fetchSweets(token: string) {
  return apiFetch<{ sweets: ApiSweet[] }>('/api/sweets', { token });
}

export function createBooking(token: string, data: { sweetId: number; date: string; timeSlot: string; note?: string }) {
  return apiFetch<{ booking: ApiBooking }>('/api/booking', {
    method: 'POST',
    token,
    data,
  });
}

export function fetchBookings(token: string, userId: number) {
  return apiFetch<{ bookings: ApiBooking[] }>(`/api/booking/${userId}`, {
    token,
  });
}

export function fetchReward(token: string, userId: number) {
  return apiFetch<{ reward: RewardSummary }>(`/api/reward/${userId}`, {
    token,
  });
}

export function updateReward(token: string, userId: number, rewardPoints: number, reason: string) {
  return apiFetch<{ user: ApiUser; delta: number }>(`/api/reward/${userId}`, {
    method: 'PUT',
    token,
    data: { rewardPoints, reason },
  });
}
