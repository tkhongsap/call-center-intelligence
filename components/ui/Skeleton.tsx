'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animate?: boolean;
}

/**
 * Skeleton loading component for placeholder content
 */
export function Skeleton({
  className,
  variant = 'text',
  width,
  height,
  animate = true,
}: SkeletonProps) {
  const variantStyles: Record<string, string> = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-lg',
  };

  const style: React.CSSProperties = {
    width: width,
    height: height,
  };

  return (
    <div
      className={cn(
        'bg-slate-200',
        animate && 'animate-pulse',
        variantStyles[variant],
        className
      )}
      style={style}
    />
  );
}

/**
 * Skeleton for a feed card - matches AlertFeedCard, TrendingCard, etc.
 */
export function FeedCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('p-4 rounded-lg border bg-white border-slate-200', className)}>
      <div className="flex items-start gap-3">
        {/* Severity dot */}
        <Skeleton variant="circular" className="w-2 h-2 mt-2 flex-shrink-0" />

        <div className="flex-1 min-w-0 space-y-3">
          {/* Header row */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-1">
              <Skeleton variant="rectangular" className="w-5 h-5 flex-shrink-0" />
              <Skeleton variant="text" className="h-5 w-3/4" />
            </div>
            <Skeleton variant="text" className="h-4 w-16 flex-shrink-0" />
          </div>

          {/* Content lines */}
          <Skeleton variant="text" className="h-4 w-full" />
          <Skeleton variant="text" className="h-4 w-2/3" />

          {/* Actions row */}
          <div className="flex items-center gap-2 pt-1">
            <Skeleton variant="text" className="h-4 w-16" />
            <Skeleton variant="circular" className="w-1 h-1" />
            <Skeleton variant="text" className="h-4 w-12" />
            <Skeleton variant="circular" className="w-1 h-1" />
            <Skeleton variant="text" className="h-4 w-14" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for the Pulse sidebar stats
 */
export function PulseSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton variant="text" className="h-5 w-24" />
        <Skeleton variant="text" className="h-4 w-16" />
      </div>

      {/* Stats cards */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-3 rounded-lg border border-slate-200 bg-white">
          <div className="flex items-center justify-between">
            <Skeleton variant="text" className="h-4 w-20" />
            <Skeleton variant="text" className="h-6 w-12" />
          </div>
          <Skeleton variant="text" className="h-3 w-24 mt-2" />
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton for alert list items
 */
export function AlertListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4 rounded-lg border border-slate-200 bg-white">
          <div className="flex items-start gap-3">
            <Skeleton variant="circular" className="w-8 h-8 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton variant="text" className="h-5 w-1/2" />
                <Skeleton variant="rounded" className="h-5 w-16" />
              </div>
              <Skeleton variant="text" className="h-4 w-3/4" />
              <div className="flex items-center gap-2">
                <Skeleton variant="text" className="h-3 w-20" />
                <Skeleton variant="text" className="h-3 w-24" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton for case list items
 */
export function CaseListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4 rounded-lg border border-slate-200 bg-white">
          <div className="flex items-center gap-4">
            <Skeleton variant="text" className="h-4 w-20 flex-shrink-0" />
            <Skeleton variant="text" className="h-4 flex-1" />
            <Skeleton variant="rounded" className="h-5 w-16 flex-shrink-0" />
            <Skeleton variant="rounded" className="h-5 w-16 flex-shrink-0" />
            <Skeleton variant="text" className="h-4 w-24 flex-shrink-0" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton for trending topic cards
 */
export function TrendingTopicSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4 rounded-lg border border-slate-200 bg-white">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton variant="circular" className="w-4 h-4" />
                <Skeleton variant="text" className="h-5 w-32" />
              </div>
              <Skeleton variant="text" className="h-4 w-full" />
              <Skeleton variant="text" className="h-4 w-2/3" />
            </div>
            <div className="text-right space-y-1">
              <Skeleton variant="text" className="h-6 w-12" />
              <Skeleton variant="text" className="h-3 w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton for search results
 */
export function SearchResultSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4 rounded-lg border border-slate-200 bg-white">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton variant="rounded" className="h-5 w-20" />
              <Skeleton variant="text" className="h-5 w-48" />
            </div>
            <Skeleton variant="text" className="h-4 w-full" />
            <Skeleton variant="text" className="h-4 w-4/5" />
            <div className="flex items-center gap-4 pt-1">
              <Skeleton variant="text" className="h-3 w-24" />
              <Skeleton variant="text" className="h-3 w-20" />
              <Skeleton variant="text" className="h-3 w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Inline refresh spinner - subtle indicator during background polling
 */
export function RefreshSpinner({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <div className="relative w-3 h-3">
        <div className="absolute inset-0 rounded-full border border-slate-200" />
        <div className="absolute inset-0 rounded-full border border-t-slate-500 animate-spin" />
      </div>
      <span className="text-xs text-slate-500">Refreshing...</span>
    </div>
  );
}

/**
 * Full page loading skeleton
 */
export function PageLoadingSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <Skeleton variant="text" className="h-8 w-48" />
        <div className="flex items-center gap-2">
          <Skeleton variant="rounded" className="h-9 w-24" />
          <Skeleton variant="rounded" className="h-9 w-24" />
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3">
        <Skeleton variant="rounded" className="h-10 w-32" />
        <Skeleton variant="rounded" className="h-10 w-32" />
        <Skeleton variant="rounded" className="h-10 w-32" />
      </div>

      {/* Content area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <FeedCardSkeleton />
          <FeedCardSkeleton />
          <FeedCardSkeleton />
        </div>
        <div className="space-y-4">
          <PulseSkeleton />
        </div>
      </div>
    </div>
  );
}
