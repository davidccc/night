const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

export interface ApiUser {
  id: number;
  lineUserId: string;
  displayName?: string | null;
  avatar?: string | null;
  rewardPoints: number;
}

export interface ApiLocation {
  id: number;
  slug: string;
  name: string;
}

export interface ApiSweet {
  id: number;
  code?: string | null;
  name: string;
  description: string;
  imageUrl?: string | null;
  tag?: string | null;
  location?: ApiLocation | null;
  nationality?: string | null;
  ageText?: string | null;
  heightCm?: number | null;
  weightKg?: number | null;
  cup?: string | null;
  environment?: string | null;
  longDurationMinutes?: number | null;
  shortDurationMinutes?: number | null;
  serviceType?: string | null;
  longPrice?: number | null;
  shortPrice?: number | null;
  updateTime?: string | null;
  averageRating?: number | null;
  reviewCount?: number;
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

export interface ApiSweetReview {
  id: number;
  rating: number;
  comment: string;
  userDisplayName: string;
  createdAt: string;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  token?: string;
  data?: Record<string, unknown>;
  cache?: RequestCache;
}

type RawUser = {
  id: number;
  line_user_id?: string;
  lineUserId?: string;
  display_name?: string | null;
  displayName?: string | null;
  avatar?: string | null;
  reward_points?: number | null;
  rewardPoints?: number | null;
};

function normalizeUser(raw: RawUser): ApiUser {
  return {
    id: raw.id,
    lineUserId: raw.lineUserId ?? raw.line_user_id ?? '',
    displayName: raw.displayName ?? raw.display_name ?? undefined,
    avatar: raw.avatar ?? null,
    rewardPoints: raw.rewardPoints ?? raw.reward_points ?? 0,
  };
}

type RawLocation = {
  id: number;
  slug: string;
  name: string;
};

function normalizeLocation(raw?: RawLocation | null): ApiLocation | null {
  if (!raw) {
    return null;
  }
  return {
    id: raw.id,
    slug: raw.slug,
    name: raw.name,
  };
}

type RawSweet = {
  id: number;
  code?: string | null;
  name: string;
  description: string;
  image_url?: string | null;
  tag?: string | null;
  location?: RawLocation | null;
  nationality?: string | null;
  age_text?: string | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  cup?: string | null;
  environment?: string | null;
  long_duration_minutes?: number | null;
  short_duration_minutes?: number | null;
  service_type?: string | null;
  long_price?: number | null;
  short_price?: number | null;
  update_time?: string | null;
  average_rating?: number | null;
  review_count?: number | null;
};

function normalizeSweet(raw: RawSweet): ApiSweet {
  return {
    id: raw.id,
    code: raw.code ?? null,
    name: raw.name,
    description: raw.description,
    imageUrl: raw.image_url ?? null,
    tag: raw.tag ?? null,
    location: normalizeLocation(raw.location),
    nationality: raw.nationality ?? null,
    ageText: raw.age_text ?? null,
    heightCm: raw.height_cm ?? null,
    weightKg: raw.weight_kg ?? null,
    cup: raw.cup ?? null,
    environment: raw.environment ?? null,
    longDurationMinutes: raw.long_duration_minutes ?? null,
    shortDurationMinutes: raw.short_duration_minutes ?? null,
    serviceType: raw.service_type ?? null,
    longPrice: raw.long_price ?? null,
    shortPrice: raw.short_price ?? null,
    updateTime: raw.update_time ?? null,
    averageRating: typeof raw.average_rating === 'number' ? raw.average_rating : null,
    reviewCount: typeof raw.review_count === 'number' ? raw.review_count : 0,
  };
}

type RawBooking = {
  id: number;
  sweet: RawSweet;
  date: string;
  time_slot: string;
  status: string;
  note?: string | null;
  created_at: string;
};

function normalizeBooking(raw: RawBooking): ApiBooking {
  return {
    id: raw.id,
    sweet: normalizeSweet(raw.sweet),
    date: raw.date,
    timeSlot: raw.time_slot,
    status: raw.status,
    note: raw.note ?? null,
    createdAt: raw.created_at,
  };
}

type RawRewardLog = {
  id: number;
  delta: number;
  reason: string;
  created_at: string;
};

function normalizeRewardLog(raw: RawRewardLog): ApiRewardLog {
  return {
    id: raw.id,
    delta: raw.delta,
    reason: raw.reason,
    createdAt: raw.created_at,
  };
}

type RawSweetReview = {
  id: number;
  rating: number;
  comment: string;
  created_at: string;
  userDisplayName: string;
};

function normalizeSweetReview(raw: RawSweetReview): ApiSweetReview {
  return {
    id: raw.id,
    rating: raw.rating,
    comment: raw.comment,
    createdAt: raw.created_at,
    userDisplayName: raw.userDisplayName,
  };
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

export async function login(idToken: string) {
  const result = await apiFetch<{ token: string; user: RawUser }>('/api/login', {
    method: 'POST',
    data: { idToken },
  });
  return {
    token: result.token,
    user: normalizeUser(result.user),
  };
}

export async function fetchProfile(token: string) {
  const result = await apiFetch<{ user: RawUser }>('/api/login/me', { token });
  return { user: normalizeUser(result.user) };
}

export async function fetchSweets(token: string, params?: { location?: string }) {
  const search = params?.location ? `?location=${encodeURIComponent(params.location)}` : '';
  const result = await apiFetch<{ sweets: RawSweet[] }>(`/api/sweets${search}`, { token });
  return { sweets: result.sweets.map(normalizeSweet) };
}

export async function fetchSweetReviews(token: string, sweetId: number) {
  const result = await apiFetch<{
    reviews: RawSweetReview[];
    summary: { averageRating?: number | null; reviewCount?: number | null };
  }>(`/api/sweets/${sweetId}/reviews`, {
    token,
  });
  return {
    reviews: result.reviews.map(normalizeSweetReview),
    summary: {
      averageRating:
        typeof result.summary?.averageRating === 'number' ? result.summary.averageRating : 0,
      reviewCount: typeof result.summary?.reviewCount === 'number' ? result.summary.reviewCount : 0,
    },
  };
}

export async function createSweetReview(
  token: string,
  sweetId: number,
  data: { rating: number; comment: string },
) {
  const result = await apiFetch<{
    review: RawSweetReview;
    summary: { averageRating?: number | null; reviewCount?: number | null };
  }>(`/api/sweets/${sweetId}/reviews`, {
    method: 'POST',
    token,
    data,
  });

  return {
    review: normalizeSweetReview(result.review),
    summary: {
      averageRating:
        typeof result.summary?.averageRating === 'number' ? result.summary.averageRating : 0,
      reviewCount: typeof result.summary?.reviewCount === 'number' ? result.summary.reviewCount : 0,
    },
  };
}

export async function createBooking(
  token: string,
  data: { sweetId: number; date: string; timeSlot: string; note?: string }
) {
  const result = await apiFetch<{ booking: RawBooking }>('/api/booking', {
    method: 'POST',
    token,
    data,
  });
  return { booking: normalizeBooking(result.booking) };
}

export async function fetchBookings(token: string, userId: number) {
  const result = await apiFetch<{ bookings: RawBooking[] }>(`/api/booking/${userId}`, {
    token,
  });
  return { bookings: result.bookings.map(normalizeBooking) };
}

export async function fetchReward(token: string, userId: number): Promise<{ reward: RewardSummary }> {
  const result = await apiFetch<{ reward: { user: RawUser; logs: RawRewardLog[] } }>(`/api/reward/${userId}`, {
    token,
  });
  const user = normalizeUser(result.reward.user);
  return {
    reward: {
      id: user.id,
      rewardPoints: user.rewardPoints,
      logs: (result.reward.logs ?? []).map(normalizeRewardLog),
    },
  };
}

export async function updateReward(token: string, userId: number, rewardPoints: number, reason: string) {
  const result = await apiFetch<{ user: RawUser; delta: number }>(`/api/reward/${userId}`, {
    method: 'PUT',
    token,
    data: { rewardPoints, reason },
  });
  return {
    user: normalizeUser(result.user),
    delta: result.delta,
  };
}
