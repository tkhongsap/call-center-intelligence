'use client';

import { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface RelativeTimeProps {
  timestamp?: Date | string | null;
  className?: string;
  prefix?: string;
  showIcon?: boolean;
}

function formatRelativeTimeSeconds(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffSecs < 10) return 'Just now';
  if (diffSecs < 60) return `${diffSecs}s ago`;
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function RelativeTime({
  timestamp,
  className,
  prefix = 'Updated',
  showIcon = true,
}: RelativeTimeProps) {
  const [formattedTime, setFormattedTime] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  const updateTime = useCallback(() => {
    if (!timestamp) {
      setFormattedTime('Never');
      return;
    }
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    setFormattedTime(formatRelativeTimeSeconds(date));
  }, [timestamp]);

  // Initial mount
  useLayoutEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Hydration guard requires setState on mount
    setMounted(true);
    updateTime();
  }, [updateTime]);

  // Update every second
  useEffect(() => {
    if (!mounted) return;

    const intervalId = setInterval(updateTime, 1000);
    return () => clearInterval(intervalId);
  }, [mounted, updateTime]);

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <span className={cn('text-xs text-slate-500', className)}>
        {showIcon && <span className="inline-block mr-1">●</span>}
        {prefix} ...
      </span>
    );
  }

  return (
    <span className={cn('text-xs text-slate-500 inline-flex items-center gap-1', className)}>
      {showIcon && (
        <span
          className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"
          aria-hidden="true"
        />
      )}
      {prefix} {formattedTime}
    </span>
  );
}
