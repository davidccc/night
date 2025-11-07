'use client';

import { Suspense } from 'react';
import BookingForm from './bookingForm';

export default function BookingPage() {
    return (
        <Suspense fallback={<p className="text-sm text-slate-600">載入預約表單...</p>}>
            <BookingForm />
        </Suspense>
    );
}
