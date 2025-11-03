'use client';

import { useEffect } from 'react';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[app-error]', error);
  }, [error]);

  return (
    <div className="space-y-4 p-6 text-center text-sm text-red-600">
      <p>系統發生錯誤，請稍後再試。</p>
      {error.digest && <p className="text-xs text-red-400">錯誤代碼：{error.digest}</p>}
      <button
        className="rounded-full bg-brand-pink px-4 py-2 text-white shadow hover:opacity-90"
        onClick={() => reset()}
      >
        重新嘗試
      </button>
    </div>
  );
}
