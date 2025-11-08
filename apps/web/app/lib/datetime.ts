export function formatDateTime(value?: string | number | Date | null, fallback = '—') {
  if (value === null || value === undefined) {
    return fallback;
  }

  const parsed =
    typeof value === 'string' || typeof value === 'number'
      ? new Date(value)
      : value instanceof Date
        ? value
        : new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return fallback;
  }

  const pad = (num: number) => num.toString().padStart(2, '0');
  const year = parsed.getFullYear();
  const month = pad(parsed.getMonth() + 1);
  const day = pad(parsed.getDate());
  const hours = pad(parsed.getHours());
  const minutes = pad(parsed.getMinutes());
  const seconds = pad(parsed.getSeconds());

  return `${year}/${month}/${day} ${hours}/${minutes}/${seconds}`;
}
