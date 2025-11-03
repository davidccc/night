'use client';

import { useEffect, useMemo, useState } from 'react';

import type { RewardSummary } from '../../lib/api';
import { fetchReward } from '../../lib/api';
import { useAuth } from '../../providers/AuthProvider';

export default function RewardPage() {
  const { token, status, user } = useAuth();
  const [reward, setReward] = useState<RewardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== 'authenticated' || !token || !user) {
      return;
    }

    fetchReward(token, user.id)
      .then((res) => {
        setReward(res.reward);
        setError(null);
      })
      .catch((err) => setError(err.message));
  }, [status, token, user]);

  const progress = useMemo(() => {
    if (!reward) return 0;
    const goal = 500;
    return Math.min(100, Math.round((reward.rewardPoints / goal) * 100));
  }, [reward]);

  if (status !== 'authenticated' || !user) {
    return <p className="text-sm text-slate-600">登入後即可查看積分。</p>;
  }

  if (error) {
    return <p className="text-sm text-red-500">{error}</p>;
  }

  if (!reward) {
    return <p className="text-sm text-slate-600">Reward 資料載入中...</p>;
  }

  return (
    <div className="space-y-6">
      <header className="rounded-3xl bg-brand-pink/10 p-6">
        <h1 className="text-xl font-semibold text-brand-pink">Reward Card 積分</h1>
        <p className="mt-2 text-sm text-slate-600">每次完成甜心預約可獲得 +50 積分，集滿 500 積分可兌換限定禮。</p>
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700">目前積分</span>
            <span className="text-brand-pink text-lg font-semibold">{reward.rewardPoints}</span>
          </div>
          <div className="mt-2 h-3 w-full rounded-full bg-brand-light">
            <div className="h-full rounded-full bg-brand-pink transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-1 text-xs text-slate-500">進度 {progress}% / 500 分</p>
        </div>
      </header>
      <section>
        <h2 className="text-lg font-semibold text-slate-800">積分紀錄</h2>
        <div className="mt-3 space-y-3">
          {reward.logs.length === 0 && <p className="text-sm text-slate-500">尚無紀錄。</p>}
          {reward.logs.map((log) => (
            <div key={log.id} className="flex items-center justify-between rounded-2xl border border-brand-light bg-white px-4 py-3 shadow-sm">
              <div>
                <p className="text-sm font-medium text-slate-700">{log.reason}</p>
                <p className="text-xs text-slate-400">{new Date(log.createdAt).toLocaleString()}</p>
              </div>
              <span className={log.delta >= 0 ? 'text-brand-pink font-semibold' : 'text-red-500 font-semibold'}>
                {log.delta >= 0 ? `+${log.delta}` : log.delta}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
