'use client';

import { useEffect, useState } from 'react';

import type { ApiBooking } from '../../lib/api';
import { fetchBookings } from '../../lib/api';
import { useAuth } from '../../providers/AuthProvider';

export default function RecordsPage() {
  const { token, status, user } = useAuth();
  const [bookings, setBookings] = useState<ApiBooking[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== 'authenticated' || !token || !user) {
      return;
    }

    fetchBookings(token, user.id)
      .then((res) => {
        setBookings(res.bookings);
        setError(null);
      })
      .catch((err) => setError(err.message));
  }, [status, token, user]);

  if (status !== 'authenticated' || !user) {
    return <p className="text-sm text-slate-600">請登入後查看預約紀錄。</p>;
  }

  if (error) {
    return <p className="text-sm text-red-500">{error}</p>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-brand-pink">預約紀錄</h1>
      <div className="space-y-3">
        {bookings.length === 0 && <p className="text-sm text-slate-500">目前沒有預約紀錄。</p>}
        {bookings.map((booking) => (
          <article key={booking.id} className="rounded-2xl border border-brand-light bg-white px-4 py-3 shadow-sm">
            <div className="flex items-center justify-between text-sm">
              <div>
                <p className="font-semibold text-slate-800">{booking.sweet.name}</p>
                <p className="text-xs text-slate-500">{new Date(booking.date).toLocaleDateString()} · {booking.timeSlot}</p>
              </div>
              <span className="rounded-full bg-brand-light px-3 py-1 text-xs text-brand-pink">
                {translateStatus(booking.status)}
              </span>
            </div>
            {booking.note && <p className="mt-2 text-xs text-slate-600">備註：{booking.note}</p>}
          </article>
        ))}
      </div>
    </div>
  );
}

function translateStatus(status: string) {
  switch (status) {
    case 'CONFIRMED':
      return '已確認';
    case 'CANCELLED':
      return '已取消';
    default:
      return '待確認';
  }
}
