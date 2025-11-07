'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import type { ApiSweet } from '../../lib/api';
import { fetchSweets } from '../../lib/api';
import { useAuth } from '../../providers/AuthProvider';

export default function SweetPage() {
  const { token, status } = useAuth();
  const [sweets, setSweets] = useState<ApiSweet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string>('ALL');
  const router = useRouter();
  const lineCustomerUrl = process.env.NEXT_PUBLIC_LINE_CUSTOMER_URL ?? '';
  const lineCustomerOaId = process.env.NEXT_PUBLIC_LINE_CUSTOMER_OA_ID ?? '';

  useEffect(() => {
    if (status !== 'authenticated' || !token) {
      return;
    }

    setLoading(true);
    fetchSweets(token)
      .then((res) => {
        setSweets(res.sweets);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [status, token]);

  const locations = useMemo(() => {
    const map = new Map<string, { slug: string; name: string }>();
    sweets.forEach((sweet) => {
      if (sweet.location) {
        map.set(sweet.location.slug, { slug: sweet.location.slug, name: sweet.location.name });
      }
    });
    return Array.from(map.values());
  }, [sweets]);

  const filteredSweets = useMemo(() => {
    if (selectedLocation === 'ALL') {
      return sweets;
    }
    return sweets.filter((sweet) => sweet.location?.slug === selectedLocation);
  }, [sweets, selectedLocation]);

  useEffect(() => {
    if (selectedLocation !== 'ALL' && !locations.some((location) => location.slug === selectedLocation)) {
      setSelectedLocation('ALL');
    }
  }, [locations, selectedLocation]);

  if (status !== 'authenticated') {
    return <p className="text-sm text-slate-600">請先登入 LINE 帳號後再瀏覽甜心列表。</p>;
  }

  if (loading) {
    return <p className="text-sm text-slate-600">甜心資料讀取中...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-500">{error}</p>;
  }

  const handleCustomerBooking = async (sweet: ApiSweet) => {
    const message = `我想預約 ${sweet.name}${sweet.code ? `(${sweet.code})` : ''}`;
    try {
      if (navigator.clipboard && 'writeText' in navigator.clipboard) {
        await navigator.clipboard.writeText(message);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = message;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      alert('已複製預約訊息，將開啟 LINE 客服'); // lightweight feedback
    } catch {
      alert('無法複製預約訊息，請手動複製');
    } finally {
      const encoded = encodeURIComponent(message);
      if (lineCustomerOaId) {
        const oaPath = lineCustomerOaId.startsWith('@') ? lineCustomerOaId : `@${lineCustomerOaId}`;
        window.open(`https://line.me/R/oaMessage/${oaPath}/?text=${encoded}`, '_blank');
        return;
      }
      if (lineCustomerUrl) {
        window.open(lineCustomerUrl, '_blank');
        return;
      }
      window.open(`https://line.me/R/ti/p/${encoded}`, '_blank');
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-brand-pink">甜心列表</h1>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setSelectedLocation('ALL')}
          className={`rounded-full px-4 py-1 text-sm ${
            selectedLocation === 'ALL'
              ? 'bg-brand-pink text-white shadow'
              : 'border border-brand-light text-brand-pink hover:bg-brand-light/60'
          }`}
        >
          全部地點
        </button>
        {locations.map((location) => (
          <button
            key={location.slug}
            type="button"
            onClick={() => setSelectedLocation(location.slug)}
            className={`rounded-full px-4 py-1 text-sm ${
              selectedLocation === location.slug
                ? 'bg-brand-pink text-white shadow'
                : 'border border-brand-light text-brand-pink hover:bg-brand-light/60'
            }`}
          >
            {location.name}
          </button>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {filteredSweets.map((sweet) => (
          <article key={sweet.id} className="flex flex-col justify-between rounded-2xl border border-brand-light bg-white p-4 shadow-sm">
            <div>
              {sweet.imageUrl && (
                <Link href={`/sweet/${sweet.id}`} className="relative mb-3 block w-full overflow-hidden rounded-xl bg-white" style={{ aspectRatio: '3 / 4' }}>
                  <Image src={sweet.imageUrl} alt={sweet.name} fill className="object-contain transition duration-300 hover:scale-[1.02]" sizes="(min-width: 768px) 50vw, 100vw" priority={false} />
                </Link>
              )}
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-lg font-semibold text-slate-800">{sweet.name}</h2>
                {sweet.code && <span className="rounded-full bg-brand-light px-2 py-0.5 text-xs font-medium text-brand-pink">{sweet.code}</span>}
              </div>
              {sweet.location && <p className="mt-1 text-xs text-slate-500">地點：{sweet.location.name}</p>}
              <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
                {[
                  { label: '國籍', value: sweet.nationality },
                  { label: '年齡', value: sweet.ageText },
                  { label: '身高', value: sweet.heightCm ? `${sweet.heightCm} cm` : null },
                  { label: '體重', value: sweet.weightKg ? `${sweet.weightKg} kg` : null },
                  { label: '罩杯', value: sweet.cup },
                  { label: '環境', value: sweet.environment },
                  {
                    label: '長鍾',
                    value: sweet.longDurationMinutes ? `${sweet.longDurationMinutes} 分鐘 / $${sweet.longPrice ?? ''}` : null,
                  },
                  {
                    label: '短鍾',
                    value: sweet.shortDurationMinutes ? `${sweet.shortDurationMinutes} 分鐘 / $${sweet.shortPrice ?? ''}` : null,
                  },
                  { label: '服務', value: sweet.serviceType },
                  { label: '更新', value: sweet.updateTime ? new Date(sweet.updateTime).toLocaleString() : null },
                ]
                  .filter((item) => item.value)
                  .map((item) => (
                    <div key={`${sweet.id}-${item.label}`} className="flex flex-col rounded-xl bg-slate-50 p-2">
                      <dt className="text-[11px] font-semibold text-brand-pink">{item.label}</dt>
                      <dd>{item.value}</dd>
                    </div>
                  ))}
              </dl>
              {sweet.tag && <span className="mt-3 inline-flex rounded-full bg-brand-light px-3 py-1 text-xs text-brand-pink">#{sweet.tag}</span>}
            </div>
            <div className="mt-4 flex flex-col gap-2">
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => router.push(`/booking?sweetId=${sweet.id}`)}
                  className="flex-1 rounded-full bg-brand-pink px-4 py-2 text-sm font-medium text-white shadow transition hover:opacity-90"
                >
                  線上預約
                </button>
                <button
                  type="button"
                  onClick={() => handleCustomerBooking(sweet)}
                  className="flex-1 rounded-full border border-brand-pink px-4 py-2 text-sm font-medium text-brand-pink shadow transition hover:bg-brand-light/40"
                >
                  客服預約
                </button>
              </div>
              <Link
                href={`/sweet/${sweet.id}`}
                className="text-center text-xs font-medium text-brand-pink underline-offset-4 hover:underline"
              >
                查看詳情與評價
              </Link>
              <p className="text-xs text-slate-400">線上預約可直接填表，若需協助可點「客服預約」複製訊息並開啟 LINE 客服。</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
