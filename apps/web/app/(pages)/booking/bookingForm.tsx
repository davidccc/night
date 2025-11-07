'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import type { ChangeEvent, FormEvent } from 'react';
import { useEffect, useState } from 'react';

import type { ApiSweet } from '../../lib/api';
import { createBooking as createBookingApi, fetchSweets } from '../../lib/api';
import { useAuth } from '../../providers/AuthProvider';

export default function BookingForm() {
    const { token, status, user } = useAuth();
    const [sweets, setSweets] = useState<ApiSweet[]>([]);
    const [sweetId, setSweetId] = useState<number | undefined>();
    const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [timeSlot, setTimeSlot] = useState('');
    const [note, setNote] = useState('');
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        if (status !== 'authenticated' || !token) {
            return;
        }

        fetchSweets(token)
            .then((res) => setSweets(res.sweets))
            .catch((err: Error) => setError(err.message));
    }, [status, token]);

    useEffect(() => {
        if (!searchParams) {
            return;
        }
        const param = searchParams.get('sweetId');
        if (!param || sweets.length === 0 || sweetId) {
            return;
        }
        const parsed = Number(param);
        if (Number.isNaN(parsed)) {
            return;
        }
        if (sweets.some((sweet) => sweet.id === parsed)) {
            setSweetId(parsed);
        }
    }, [searchParams, sweets, sweetId]);

    if (status !== 'authenticated' || !user) {
        return <p className="text-sm text-slate-600">請登入後建立預約。</p>;
    }

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setError(null);
        setMessage(null);

        if (!sweetId || !date || !timeSlot) {
            setError('請完整填寫預約資訊');
            return;
        }

        try {
            await createBookingApi(token!, {
                sweetId,
                date,
                timeSlot,
                note: note || undefined,
            });
            setMessage(null);
            setSweetId(undefined);
            setDate(new Date().toISOString().slice(0, 10));
            setTimeSlot('');
            setNote('');
            router.push('/records');
        } catch (err) {
            setError(err instanceof Error ? err.message : '預約失敗，請稍後再試');
        }
    };

    return (
    <div className="space-y-4">
        <h1 className="text-xl font-semibold text-brand-pink">預約甜心</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="text-sm font-medium text-slate-700">選擇甜心</label>
                <select
                    value={sweetId ?? ''}
                    onChange={(event: ChangeEvent<HTMLSelectElement>) => setSweetId(Number(event.target.value))}
                    className="mt-2 w-full rounded-xl border border-brand-light px-3 py-2 text-sm focus:border-brand-pink focus:outline-none"
                >
                    <option value="" disabled>
                        請選擇甜心
                    </option>
                    {sweets.map((sweet: ApiSweet) => (
                        <option value={sweet.id} key={sweet.id}>
                            {sweet.name}
                        </option>
                    ))}
                </select>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
                <div>
                    <label className="text-sm font-medium text-slate-700">日期</label>
                    <input
                        type="date"
                        value={date}
                        onChange={(event: ChangeEvent<HTMLInputElement>) => setDate(event.target.value)}
                        className="mt-2 w-full rounded-xl border border-brand-light px-3 py-2 text-sm focus:border-brand-pink focus:outline-none"
                    />
                </div>
                <div>
                    <label className="text-sm font-medium text-slate-700">時段</label>
                    <input
                        type="text"
                        placeholder="例：19:00-20:00"
                        value={timeSlot}
                        onChange={(event: ChangeEvent<HTMLInputElement>) => setTimeSlot(event.target.value)}
                        className="mt-2 w-full rounded-xl border border-brand-light px-3 py-2 text-sm focus:border-brand-pink focus:outline-none"
                    />
                </div>
            </div>
            <div>
                <label className="text-sm font-medium text-slate-700">備註</label>
                <textarea
                    value={note}
                    onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setNote(event.target.value)}
                    rows={3}
                    className="mt-2 w-full rounded-xl border border-brand-light px-3 py-2 text-sm focus:border-brand-pink focus:outline-none"
                    placeholder="可輸入主題、想聊的內容..."
                />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            {message && <p className="text-sm text-brand-pink">{message}</p>}
            <button
                type="submit"
                className="rounded-full bg-brand-pink px-6 py-2 text-sm font-semibold text-white shadow hover:opacity-90"
            >
                送出預約
            </button>
        </form>
    </div>
    );
}
