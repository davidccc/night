'use client';

import Image from 'next/image';

import { useAuth } from '../../providers/AuthProvider';

export default function ProfilePage() {
  const { user, status, refresh } = useAuth();

  if (status !== 'authenticated' || !user) {
    return <p className="text-sm text-slate-600">請登入後查看個人資料。</p>;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col items-center gap-4 md:flex-row">
        {user.avatar ? (
          <Image src={user.avatar} alt="頭像" width={96} height={96} className="h-24 w-24 rounded-full object-cover shadow" />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-brand-light text-3xl font-semibold text-brand-pink">
            {user.displayName?.charAt(0) ?? '用'}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-semibold text-brand-pink">{user.displayName ?? 'LINE 用戶'}</h1>
          <p className="text-sm text-slate-500">會員編號：{user.lineUserId}</p>
          <p className="text-sm text-slate-500">累積積分：{user.rewardPoints}</p>
        </div>
      </header>
      <section className="rounded-3xl border border-brand-light bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800">帳戶資訊</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-600">
          <li>LINE User ID：{user.lineUserId}</li>
          <li>最近登入：透過 LIFF 自動登入</li>
          <li>安全驗證：JWT + LINE Login</li>
        </ul>
        <button
          onClick={() => refresh()}
          className="mt-4 rounded-full border border-brand-pink px-4 py-2 text-sm font-medium text-brand-pink hover:bg-brand-light"
        >
          重新同步 LINE 資訊
        </button>
      </section>
    </div>
  );
}
