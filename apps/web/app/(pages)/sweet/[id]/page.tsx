'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { FormEvent, useEffect, useMemo, useState } from 'react';

import type { ApiSweet, ApiSweetReview } from '../../../lib/api';
import { createSweetReview, fetchSweetReviews, fetchSweets } from '../../../lib/api';
import { formatDateTime } from '../../../lib/datetime';
import { RatingStars } from '../../../components/RatingStars';
import { useAuth } from '../../../providers/AuthProvider';

export default function SweetDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { token, status } = useAuth();
  const [sweets, setSweets] = useState<ApiSweet[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [reviews, setReviews] = useState<ApiSweetReview[]>([]);
  const [reviewSummary, setReviewSummary] = useState({ averageRating: 0, reviewCount: 0 });
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading'>('idle');
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== 'authenticated' || !token) {
      return;
    }
    fetchSweets(token)
      .then((res) => {
        setSweets(res.sweets);
        setError(null);
      })
      .catch((err: Error) => setError(err.message));
  }, [status, token]);

  const sweet = useMemo(() => sweets.find((item) => item.id === Number(params?.id)), [sweets, params]);

  useEffect(() => {
    if (!sweet) {
      return;
    }
    setReviewSummary({
      averageRating: sweet.averageRating ?? 0,
      reviewCount: sweet.reviewCount ?? 0,
    });
    setReviews([]);
  }, [sweet]);

  useEffect(() => {
    if (status !== 'authenticated' || !token || !sweet) {
      return;
    }
    setReviewsLoading(true);
    setReviewsError(null);
    fetchSweetReviews(token, sweet.id)
      .then((res) => {
        setReviews(res.reviews);
        setReviewSummary(res.summary);
        setReviewsError(null);
      })
      .catch((err: Error) => setReviewsError(err.message))
      .finally(() => setReviewsLoading(false));
  }, [status, token, sweet]);

  if (status !== 'authenticated') {
    return <p className="text-sm text-slate-600">請登入後查看甜心詳細資訊。</p>;
  }

  if (error) {
    return <p className="text-sm text-red-500">{error}</p>;
  }
  if (!sweet) {
    return <p className="text-sm text-slate-600">載入中或找不到該甜心，可返回列表再試一次。</p>;
  }

  const recommendations = sweets.filter((item) => item.id !== sweet.id).slice(0, 6);
  const averageRatingText =
    reviewSummary.averageRating > 0 ? reviewSummary.averageRating.toFixed(1) : '—';
  const canSubmitReview = reviewForm.comment.trim().length >= 5;
  const latestUpdateText = sweet.updateTime ? formatDateTime(sweet.updateTime) : '—';
  const isSubmittingReview = submitStatus === 'loading';

  const handleReviewSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !sweet) {
      return;
    }
    const comment = reviewForm.comment.trim();
    if (!comment) {
      setSubmitError('請輸入評論內容（至少 5 個字）');
      return;
    }
    setSubmitStatus('loading');
    setSubmitError(null);
    setSubmitMessage(null);
    try {
      const result = await createSweetReview(token, sweet.id, {
        rating: reviewForm.rating,
        comment,
      });
      setReviews((prev) => [result.review, ...prev]);
      setReviewSummary(result.summary);
      setReviewForm({ rating: 5, comment: '' });
      setSubmitMessage('已送出，感謝你的分享！');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : '提交評論失敗，請稍後再試');
    } finally {
      setSubmitStatus('idle');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between text-sm text-slate-500">
        <button onClick={() => router.back()} className="rounded-full border border-brand-light px-3 py-1 text-xs text-brand-pink hover:bg-brand-light/40">
          ← 返回上一頁
        </button>
        <Link href="/sweet" className="text-xs font-medium text-brand-pink underline-offset-4 hover:underline">
          回到甜心列表
        </Link>
      </div>

      <section className="grid gap-6 md:grid-cols-[1.1fr,0.9fr]">
        <div className="space-y-4 rounded-3xl border border-brand-light bg-white/90 p-5 shadow-sm">
          <div className="relative w-full overflow-hidden rounded-2xl bg-white" style={{ aspectRatio: '3 / 4' }}>
            {sweet.imageUrl ? (
              <Image src={sweet.imageUrl} alt={sweet.name} fill sizes="(min-width: 768px) 55vw, 90vw" className="object-contain" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">暫無照片</div>
            )}
          </div>
          <p className="text-xs text-slate-500">
            編號 {sweet.code ?? 'N/A'} · 更新：{latestUpdateText}
          </p>
        </div>

        <div className="space-y-4 rounded-3xl border border-brand-light bg-white/95 p-5 shadow-sm">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{sweet.name}</h1>
            {sweet.location && <p className="text-sm text-slate-500">{sweet.location.name} · {sweet.serviceType || '客製約茶'}</p>}
          </div>
          <div className="grid gap-3 text-sm text-slate-700 md:grid-cols-2">
            {[
              ['國籍', sweet.nationality],
              ['年齡', sweet.ageText],
              ['身高', sweet.heightCm ? `${sweet.heightCm} cm` : null],
              ['體重', sweet.weightKg ? `${sweet.weightKg} kg` : null],
              ['罩杯', sweet.cup],
              ['環境', sweet.environment],
              ['長鍾', sweet.longDurationMinutes ? `${sweet.longDurationMinutes} 分鐘 / ${sweet.longPrice ?? '依約'} ` : null],
              ['短鍾', sweet.shortDurationMinutes ? `${sweet.shortDurationMinutes} 分鐘 / ${sweet.shortPrice ?? '依約'}` : null],
            ]
              .filter(([, value]) => value)
              .map(([label, value]) => (
                <div key={`${label}-${value}`} className="rounded-2xl border border-brand-light px-3 py-2">
                  <p className="text-xs text-slate-400">{label}</p>
                  <p className="font-medium text-slate-900">{value}</p>
                </div>
              ))}
          </div>
          {sweet.description && <p className="rounded-2xl bg-brand-light/40 p-3 text-sm text-slate-600">{sweet.description}</p>}
          <div className="rounded-2xl border border-brand-light bg-white/90 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs text-slate-500">平均評分</p>
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-semibold text-brand-pink">{averageRatingText}</span>
                  <RatingStars rating={reviewSummary.averageRating} size="md" />
                </div>
              </div>
              <div className="text-sm text-slate-500">共 {reviewSummary.reviewCount} 則評論</div>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => router.push(`/booking?sweetId=${sweet.id}`)}
              className="flex-1 rounded-full bg-brand-pink px-4 py-2 text-sm font-medium text-white shadow hover:opacity-90"
            >
              立即預約
            </button>
            <Link
              href="/sweet"
              className="flex-1 rounded-full border border-brand-light px-4 py-2 text-center text-sm font-medium text-brand-pink hover:bg-brand-light/40"
            >
              查看其他甜心
            </Link>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">真實評論</h2>
          <p className="text-xs text-slate-500">分享僅供參考，所有評論皆經過匿名處理。</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-[0.9fr,1.1fr]">
          <form
            onSubmit={handleReviewSubmit}
            className="flex flex-col gap-3 rounded-3xl border border-brand-light bg-white/95 p-4 shadow-sm"
          >
            <div>
              <label className="text-xs text-slate-500">給個評分</label>
              <div className="mt-2 flex items-center gap-3">
                <select
                  value={reviewForm.rating}
                  onChange={(event) =>
                    setReviewForm((prev) => ({ ...prev, rating: Number(event.target.value) }))
                  }
                  className="rounded-2xl border border-brand-light px-3 py-2 text-sm focus:border-brand-pink focus:outline-none"
                >
                  {[5, 4, 3, 2, 1].map((score) => (
                    <option key={score} value={score}>
                      {score} 分
                    </option>
                  ))}
                </select>
                <RatingStars rating={reviewForm.rating} size="sm" />
              </div>
            </div>
            <div>
              <label htmlFor="review-comment" className="text-xs text-slate-500">
                留下評論（至少 5 個字）
              </label>
              <textarea
                id="review-comment"
                value={reviewForm.comment}
                onChange={(event) =>
                  setReviewForm((prev) => ({ ...prev, comment: event.target.value }))
                }
                className="mt-2 min-h-[120px] w-full rounded-2xl border border-brand-light px-3 py-2 text-sm text-slate-700 focus:border-brand-pink focus:outline-none"
                placeholder="分享服務感受、氣氛或需要注意的小提醒"
                minLength={5}
                required
              />
            </div>
            {submitError && <p className="text-xs text-red-500">{submitError}</p>}
            {submitMessage && <p className="text-xs text-emerald-600">{submitMessage}</p>}
            <button
              type="submit"
              disabled={!canSubmitReview || isSubmittingReview}
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                !canSubmitReview || isSubmittingReview
                  ? 'cursor-not-allowed bg-slate-200 text-slate-500'
                  : 'bg-brand-pink text-white hover:opacity-90'
              }`}
            >
              {isSubmittingReview ? '送出中...' : '送出評論'}
            </button>
          </form>
          <div className="rounded-3xl border border-brand-light bg-white/95 p-4 shadow-sm">
            {reviewsLoading && <p className="text-sm text-slate-500">評論載入中...</p>}
            {reviewsError && <p className="text-sm text-red-500">{reviewsError}</p>}
            {!reviewsLoading && !reviewsError && reviews.length === 0 && (
              <p className="text-sm text-slate-500">
                還沒有評論，成為第一個分享體驗的小夜好友吧！
              </p>
            )}
            {!reviewsLoading && !reviewsError && reviews.length > 0 && (
              <div className="space-y-3">
                {reviews.map((review) => (
                  <article
                    key={review.id}
                    className="rounded-2xl border border-brand-light/60 bg-white p-3 text-sm text-slate-700"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <RatingStars rating={review.rating} size="sm" />
                      <span className="text-xs text-slate-400">{formatDateTime(review.createdAt)}</span>
                    </div>
                    <p className="mt-2 whitespace-pre-line">{review.comment}</p>
                    <p className="mt-2 text-xs text-slate-500">{review.userDisplayName}</p>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">猜你也會喜歡</h2>
          <Link href="/sweet" className="text-xs text-brand-pink underline-offset-4 hover:underline">
            更多甜心
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {recommendations.map((item) => (
            <article key={item.id} className="flex flex-col rounded-3xl border border-brand-light bg-white/90 p-4 shadow-sm">
              {item.imageUrl && (
                <Link href={`/sweet/${item.id}`} className="relative mb-3 block w-full overflow-hidden rounded-2xl bg-white" style={{ aspectRatio: '3 / 4' }}>
                  <Image src={item.imageUrl} alt={item.name} fill className="object-contain transition duration-300 hover:scale-[1.02]" />
                </Link>
              )}
              <h3 className="text-base font-semibold text-slate-900">{item.name}</h3>
              <p className="text-xs text-slate-500">{item.location?.name || '彈性地點'}</p>
              <p className="mt-2 text-sm text-slate-600">{item.description?.split('\n')[0] ?? '甜心詳細資訊請點開查看'}</p>
              <div className="mt-auto flex flex-col gap-2 pt-3 text-sm">
                <button
                  type="button"
                  onClick={() => router.push(`/booking?sweetId=${item.id}`)}
                  className="rounded-full bg-brand-pink px-4 py-2 text-white"
                >
                  預約
                </button>
                <Link
                  href={`/sweet/${item.id}`}
                  className="rounded-full border border-brand-light px-4 py-2 text-center text-brand-pink"
                >
                  查看詳情
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
