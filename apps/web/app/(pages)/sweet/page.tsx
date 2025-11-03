'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

import type { ApiSweet } from '../../lib/api';
import { fetchSweets } from '../../lib/api';
import { useAuth } from '../../providers/AuthProvider';

export default function SweetPage() {
  const { token, status } = useAuth();
  const [sweets, setSweets] = useState<ApiSweet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (status !== 'authenticated') {
    return <p className="text-sm text-slate-600">請先登入 LINE 帳號後再瀏覽甜心列表。</p>;
  }

  if (loading) {
    return <p className="text-sm text-slate-600">甜心資料讀取中...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-500">{error}</p>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-brand-pink">甜心列表</h1>
      <div className="grid gap-4 md:grid-cols-2">
        {sweets.map((sweet) => (
          <article key={sweet.id} className="flex flex-col justify-between rounded-2xl border border-brand-light bg-white p-4 shadow-sm">
            <div>
              {sweet.imageUrl && (
                <div className="relative mb-3 h-40 w-full overflow-hidden rounded-xl">
                  <Image src={sweet.imageUrl} alt={sweet.name} fill className="object-cover" />
                </div>
              )}
              <h2 className="text-lg font-semibold text-slate-800">{sweet.name}</h2>
              <p className="mt-2 text-sm text-slate-600">{sweet.description}</p>
              {sweet.tag && <span className="mt-3 inline-flex rounded-full bg-brand-light px-3 py-1 text-xs text-brand-pink">#{sweet.tag}</span>}
            </div>
            <p className="mt-4 text-xs text-slate-400">透過 Rich Menu 直接輸入「我想預約 {sweet.name}」即可快速預約。</p>
          </article>
        ))}
      </div>
    </div>
  );
}
