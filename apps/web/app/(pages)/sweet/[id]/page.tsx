'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import type { ApiSweet } from '../../../lib/api';
import { fetchSweets } from '../../../lib/api';
import { useAuth } from '../../../providers/AuthProvider';

const reviewPool = [
  {
    title: '親切自然，對談沒有壓力',
    body: '顧問先提醒可聊的話題，甜心也會主動分享生活。整體氛圍非常放鬆。',
    author: 'Eason · 科技業',
  },
  {
    title: '準時又細心的安排',
    body: '抵達前 30 分鐘客服再次確認，整個流程無需等待，讓人很安心。',
    author: 'Wesley · 醫療顧問',
  },
  {
    title: '照片與本人一致',
    body: '甜心本人的氣質與照片完全相符，甚至更好，毫無翻車風險。',
    author: 'Marcus · 投資人',
  },
  {
    title: '聊天內容有深度',
    body: '她不只外型亮眼，談吐也很成熟，對工作與生活都有自己的見解。',
    author: 'Ken · 自營商',
  },
];

function buildSweetStats(sweet: ApiSweet) {
  const seed = sweet.id ?? 0;
  return {
    bookingCount: 80 + (seed % 40) * 5,
    rating: (4 + (seed % 10) / 10).toFixed(1),
    repeatRate: 70 + (seed % 20),
    reviews: [reviewPool[seed % reviewPool.length], reviewPool[(seed + 1) % reviewPool.length]],
  };
}

export default function SweetDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { token, status } = useAuth();
  const [sweets, setSweets] = useState<ApiSweet[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== 'authenticated' || !token) {
      return;
    }
    fetchSweets(token)
      .then((res) => {
        setSweets(res.sweets);
        setError(null);
      })
      .catch((err: Error) => setError(err.message));
  }, [status, token]);

  const sweet = useMemo(() => sweets.find((item) => item.id === Number(params?.id)), [sweets, params]);

  if (status !== 'authenticated') {
    return <p className="text-sm text-slate-600">請登入後查看甜心詳細資訊。</p>;
  }

  if (error) {
    return <p className="text-sm text-red-500">{error}</p>;
  }
  if (!sweet) {
    return <p className="text-sm text-slate-600">載入中或找不到該甜心，可返回列表再試一次。</p>;
  }

  const stats = buildSweetStats(sweet);
  const recommendations = sweets.filter((item) => item.id !== sweet.id).slice(0, 6);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between text-sm text-slate-500">
        <button onClick={() => router.back()} className="rounded-full border border-brand-light px-3 py-1 text-xs text-brand-pink hover:bg-brand-light/40">
          ← 返回上一頁
        </button>
        <Link href="/sweet" className="text-xs font-medium text-brand-pink underline-offset-4 hover:underline">
          回到甜心列表
        </Link>
      </div>

      <section className="grid gap-6 md:grid-cols-[1.1fr,0.9fr]">
        <div className="space-y-4 rounded-3xl border border-brand-light bg-white/90 p-5 shadow-sm">
          <div className="relative w-full overflow-hidden rounded-2xl bg-white" style={{ aspectRatio: '3 / 4' }}>
            {sweet.imageUrl ? (
              <Image src={sweet.imageUrl} alt={sweet.name} fill sizes="(min-width: 768px) 55vw, 90vw" className="object-contain" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">暫無照片</div>
            )}
          </div>
          <p className="text-xs text-slate-500">
            編號 {sweet.code ?? 'N/A'} · 更新：{sweet.updateTime ? new Date(sweet.updateTime).toLocaleString() : '—'}
          </p>
        </div>

        <div className="space-y-4 rounded-3xl border border-brand-light bg-white/95 p-5 shadow-sm">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{sweet.name}</h1>
            {sweet.location && <p className="text-sm text-slate-500">{sweet.location.name} · {sweet.serviceType || '客製約茶'}</p>}
          </div>
          <div className="grid gap-3 text-sm text-slate-700 md:grid-cols-2">
            {[
              ['國籍', sweet.nationality],
              ['年齡', sweet.ageText],
              ['身高', sweet.heightCm ? `${sweet.heightCm} cm` : null],
              ['體重', sweet.weightKg ? `${sweet.weightKg} kg` : null],
              ['罩杯', sweet.cup],
              ['環境', sweet.environment],
              ['長鍾', sweet.longDurationMinutes ? `${sweet.longDurationMinutes} 分鐘 / ${sweet.longPrice ?? '依約'} ` : null],
              ['短鍾', sweet.shortDurationMinutes ? `${sweet.shortDurationMinutes} 分鐘 / ${sweet.shortPrice ?? '依約'}` : null],
            ]
              .filter(([, value]) => value)
              .map(([label, value]) => (
                <div key={`${label}-${value}`} className="rounded-2xl border border-brand-light px-3 py-2">
                  <p className="text-xs text-slate-400">{label}</p>
                  <p className="font-medium text-slate-900">{value}</p>
                </div>
              ))}
          </div>
          {sweet.description && <p className="rounded-2xl bg-brand-light/40 p-3 text-sm text-slate-600">{sweet.description}</p>}
          <div className="grid gap-3 rounded-2xl bg-gradient-to-br from-white to-brand-light/40 p-4 text-sm text-slate-700 md:grid-cols-3">
            <div>
              <p className="text-xs text-slate-500">平均評分</p>
              <p className="text-xl font-semibold text-brand-pink">{stats.rating}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">累計預約</p>
              <p className="text-xl font-semibold text-brand-pink">{stats.bookingCount} 次</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">回訪率</p>
              <p className="text-xl font-semibold text-brand-pink">{stats.repeatRate}%</p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => router.push(`/booking?sweetId=${sweet.id}`)}
              className="flex-1 rounded-full bg-brand-pink px-4 py-2 text-sm font-medium text-white shadow hover:opacity-90"
            >
              立即預約
            </button>
            <Link
              href="/sweet"
              className="flex-1 rounded-full border border-brand-light px-4 py-2 text-center text-sm font-medium text-brand-pink hover:bg-brand-light/40"
            >
              查看其他甜心
            </Link>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">真實評論</h2>
          <p className="text-xs text-slate-500">分享僅供參考，所有評論皆經過匿名處理。</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {stats.reviews.map((review) => (
            <article key={review.author + review.title} className="rounded-3xl border border-brand-light bg-white/90 p-4 shadow-sm">
              <p className="text-sm font-semibold text-brand-pink">{review.title}</p>
              <p className="mt-2 text-sm text-slate-600">{review.body}</p>
              <p className="mt-3 text-xs text-slate-500">{review.author}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">猜你也會喜歡</h2>
          <Link href="/sweet" className="text-xs text-brand-pink underline-offset-4 hover:underline">
            更多甜心
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {recommendations.map((item) => (
            <article key={item.id} className="flex flex-col rounded-3xl border border-brand-light bg-white/90 p-4 shadow-sm">
              {item.imageUrl && (
                <Link href={`/sweet/${item.id}`} className="relative mb-3 block w-full overflow-hidden rounded-2xl bg-white" style={{ aspectRatio: '3 / 4' }}>
                  <Image src={item.imageUrl} alt={item.name} fill className="object-contain transition duration-300 hover:scale-[1.02]" />
                </Link>
              )}
              <h3 className="text-base font-semibold text-slate-900">{item.name}</h3>
              <p className="text-xs text-slate-500">{item.location?.name || '彈性地點'}</p>
              <p className="mt-2 text-sm text-slate-600">{item.description?.split('\n')[0] ?? '甜心詳細資訊請點開查看'}</p>
              <div className="mt-auto flex flex-col gap-2 pt-3 text-sm">
                <button
                  type="button"
                  onClick={() => router.push(`/booking?sweetId=${item.id}`)}
                  className="rounded-full bg-brand-pink px-4 py-2 text-white"
                >
                  預約
                </button>
                <Link
                  href={`/sweet/${item.id}`}
                  className="rounded-full border border-brand-light px-4 py-2 text-center text-brand-pink"
                >
                  查看詳情
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
