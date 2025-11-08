'use client';

interface RatingStarsProps {
  rating?: number | null;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
}

const sizeClasses: Record<NonNullable<RatingStarsProps['size']>, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

export function RatingStars({ rating = 0, size = 'md', showValue = false }: RatingStarsProps) {
  const normalized = Math.max(0, Math.min(5, Number.isFinite(rating) ? rating ?? 0 : 0));
  const rounded = Math.round(normalized * 10) / 10;
  const filled = Math.round(rounded);

  return (
    <div
      className={`flex items-center gap-0.5 text-brand-pink ${sizeClasses[size]}`}
      role="img"
      aria-label={`評分 ${rounded.toFixed(1)} / 5`}
    >
      {[1, 2, 3, 4, 5].map((index) => (
        <span
          key={index}
          aria-hidden="true"
          className={index <= filled ? 'text-brand-pink' : 'text-slate-300'}
        >
          ★
        </span>
      ))}
      {showValue && (
        <span className="ml-1 text-xs font-semibold text-slate-600">{rounded.toFixed(1)}</span>
      )}
    </div>
  );
}
