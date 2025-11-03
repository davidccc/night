import './globals.css';
import type { Metadata } from 'next';
import { Noto_Sans_TC } from 'next/font/google';
import type { ReactNode } from 'react';

import { AppShell } from './components/AppShell';
import { AuthProvider } from './providers/AuthProvider';

const noto = Noto_Sans_TC({ subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  title: '小夜 LINE OMO 系統',
  description: '整合 LINE Bot 與 LIFF 的預約與積分平台',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-Hant">
      <body className={noto.className}>
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
