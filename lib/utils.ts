import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Creates a debounced version of a function that delays execution
 * until after the specified wait period has elapsed since the last call.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  waitMs: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function debounced(...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, waitMs);
  };
}

/**
 * Creates a throttled version of a function that only allows execution
 * at most once per specified time period.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limitMs: number
): (...args: Parameters<T>) => void {
  let lastRun = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function throttled(...args: Parameters<T>) {
    const now = Date.now();
    const remaining = limitMs - (now - lastRun);

    if (remaining <= 0) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      lastRun = now;
      fn(...args);
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        lastRun = Date.now();
        timeoutId = null;
        fn(...args);
      }, remaining);
    }
  };
}

/**
 * Batches multiple calls into a single execution after the specified delay.
 * Collects all arguments from batched calls and passes them to the callback.
 */
export function batchUpdates<T>(
  callback: (items: T[]) => void,
  delayMs: number = 100
): (item: T) => void {
  let batch: T[] = [];
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function addToBatch(item: T) {
    batch.push(item);

    if (!timeoutId) {
      timeoutId = setTimeout(() => {
        const currentBatch = batch;
        batch = [];
        timeoutId = null;
        callback(currentBatch);
      }, delayMs);
    }
  };
}

/**
 * Maps locale codes to full locale identifiers for Intl APIs
 */
function getLocaleCode(locale: string = 'en'): string {
  const localeCodeMap: Record<string, string> = {
    'en': 'en-US',
    'th': 'th-TH',
  };
  return localeCodeMap[locale] || 'en-US';
}

export function formatDate(date: string | Date, locale: string = 'en') {
  const localeCode = getLocaleCode(locale);
  return new Date(date).toLocaleDateString(localeCode, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: string | Date, locale: string = 'en') {
  const localeCode = getLocaleCode(locale);
  return new Date(date).toLocaleString(localeCode, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelativeTime(date: string | Date, locale: string = 'en') {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date, locale);
}
