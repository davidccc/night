'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Route } from 'next';
import type { ReactNode } from 'react';

import { useAuth } from '../providers/AuthProvider';

const navItems = [
  { href: '/', label: '首頁' },
  { href: '/sweet', label: '甜心列表' },
  { href: '/booking', label: '預約' },
  { href: '/records', label: '預約紀錄' },
  { href: '/reward', label: '積分卡' },
  { href: '/profile', label: '個人檔案' },
] satisfies ReadonlyArray<{ href: Route; label: string }>;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { status, user, error, logout } = useAuth();

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-brand-gray">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-pink text-white font-semibold">
              XO
            </div>
            <div>
              <p className="text-lg font-semibold">小夜 OMO</p>
              <p className="text-xs text-slate-500">LINE Bot × LIFF 預約系統</p>
            </div>
          </Link>
          <nav className="hidden gap-4 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? 'bg-brand-pink text-white shadow'
                    : 'text-slate-600 hover:bg-brand-light hover:text-slate-900'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            {status === 'authenticated' && user ? (
              <div className="flex items-center gap-2">
                {user.avatar ? (
                  <Image
                    src={user.avatar}
                    alt={user.displayName ?? '用戶頭像'}
                    width={36}
                    height={36}
                    className="h-9 w-9 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-light text-brand-pink">
                    {user.displayName?.charAt(0) ?? '用戶'}
                  </div>
                )}
                <div className="hidden text-left text-sm leading-tight md:block">
                  <p className="font-medium">{user.displayName ?? 'LINE 用戶'}</p>
                  <p className="text-xs text-slate-500">積分 {user.rewardPoints}</p>
                </div>
                <button
                  onClick={logout}
                  className="rounded-full border border-brand-gray px-3 py-1 text-xs text-slate-600 hover:bg-brand-light"
                >
                  登出
                </button>
              </div>
            ) : (
              <span className="text-xs text-slate-500">
                {status === 'loading' && '登入中...'}
                {status === 'error' && error}
                {status === 'idle' && '等待登入'}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto border-t border-brand-light bg-white px-4 py-2 md:hidden">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                pathname === item.href
                  ? 'bg-brand-pink text-white'
                  : 'bg-brand-light text-slate-600'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl px-4 py-6">
        <div className="rounded-3xl bg-white/80 p-6 shadow-sm ring-1 ring-brand-light">
          {children}
        </div>
      </main>
      <footer className="pb-10 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} 小夜 LINE OMO 系統. 保留所有權利。
      </footer>
    </div>
  );
}
