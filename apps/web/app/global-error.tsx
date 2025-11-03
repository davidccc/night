'use client';

export default function GlobalErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  console.error('[global-error]', error);
  return (
    <html lang="zh-Hant">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white text-center text-sm text-red-600">
          <p>系統忙碌中，請稍後再試。</p>
          {error.digest && <p className="text-xs text-red-400">錯誤代碼：{error.digest}</p>}
          <button
            className="rounded-full bg-brand-pink px-4 py-2 text-white shadow hover:opacity-90"
            onClick={() => reset()}
          >
            重新整理
          </button>
        </div>
      </body>
    </html>
  );
}
