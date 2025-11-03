'use client';

export const dynamic = 'force-dynamic';

import type { Route } from 'next';
import Link from 'next/link';

import { useAuth } from './providers/AuthProvider';

export default function HomePage() {
  const { status, user, refresh, error } = useAuth();

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h1 className="text-2xl font-semibold text-brand-pink">小夜 LINE OMO 系統</h1>
        <p className="text-sm text-slate-600">
          透過 LINE Bot 與 LIFF 登入，體驗一站式的預約管理與積分兌換流程。
        </p>
        <div className="rounded-2xl bg-brand-light/60 p-4 text-sm text-slate-700">
          <p>登入狀態：<strong>{status}</strong></p>
          {error && <p className="mt-2 text-red-500">{error}</p>}
          {user && (
            <ul className="mt-3 space-y-1 text-xs">
              <li>暱稱：{user.displayName ?? 'LINE 使用者'}</li>
              <li>積分：{user.rewardPoints}</li>
              <li>會員 ID：{user.lineUserId}</li>
            </ul>
          )}
        </div>
        <button
          onClick={() => refresh()}
          className="rounded-full bg-brand-pink px-4 py-2 text-sm font-medium text-white shadow hover:opacity-90"
        >
          重新同步 LINE 資訊
        </button>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-slate-800">功能導覽</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {([
            { href: '/sweet', title: '甜心列表', desc: '瀏覽甜心卡片與標籤，快速進入預約流程。' },
            { href: '/booking', title: '預約甜心', desc: '選擇日期與時段，完成預約並獲得積分。' },
            { href: '/records', title: '預約紀錄', desc: '查看歷史預約狀態與備註。' },
            { href: '/reward', title: 'Reward Card', desc: '追蹤積分累積與兌換紀錄。' },
            { href: '/profile', title: '個人檔案', desc: '維護個人暱稱與頭像，掌握帳戶資訊。' },
          ] satisfies ReadonlyArray<{ href: Route; title: string; desc: string }>).map((card) => (
            <Link key={card.href} href={card.href} className="flex flex-col rounded-2xl border border-brand-light bg-white/90 p-4 shadow-sm transition hover:-translate-y-[2px] hover:shadow">
              <span className="text-sm font-semibold text-brand-pink">{card.title}</span>
              <span className="mt-2 text-xs text-slate-600">{card.desc}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
