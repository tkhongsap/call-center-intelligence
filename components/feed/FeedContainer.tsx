'use client';

import { useState, useEffect, useCallback, useRef, useTransition, memo, useMemo } from 'react';
import { Loader2, Inbox, ChevronUp, AlertCircle, RefreshCw } from 'lucide-react';
import { cn, formatRelativeTime, debounce } from '@/lib/utils';
import { AlertFeedCard } from './AlertFeedCard';
import { TrendingCard } from './TrendingCard';
import { HighlightCard } from './HighlightCard';
import { UploadCard } from './UploadCard';
import { usePolling, POLLING_INTERVALS } from '@/hooks/usePolling';
import { RelativeTime } from '@/components/realtime/RelativeTime';
import { NewItemWrapper } from '@/components/realtime/NewItemIndicator';
import { NotificationContainer, useNotifications, NotificationType } from '@/components/realtime/UpdateNotification';
import { FeedCardSkeleton, RefreshSpinner } from '@/components/ui/Skeleton';
import type { FeedItem } from '@/lib/db/schema';

interface FeedItemWithMeta extends FeedItem {
  parsedMetadata?: Record<string, unknown>;
  isNew?: boolean;
}

interface FeedResponse {
  items: FeedItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface FeedContainerProps {
  bu?: string;
  channel?: string;
  dateRange?: 'today' | '7d' | '30d';
  type?: 'alert' | 'trending' | 'highlight' | 'upload';
  className?: string;
  enablePolling?: boolean;
}

export function FeedContainer({ bu, channel, dateRange, type, className, enablePolling = true }: FeedContainerProps) {
  const [items, setItems] = useState<FeedItemWithMeta[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newItemsCount, setNewItemsCount] = useState(0);
  const [pendingItems, setPendingItems] = useState<FeedItemWithMeta[]>([]);
  const [isPending, startTransition] = useTransition();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const knownItemIds = useRef<Set<string>>(new Set());
  const initialLoadDone = useRef(false);

  // Notification management
  const { notifications, addNotification, dismissNotification } = useNotifications(3);

  // Debounced notification to prevent rapid notifications
  const debouncedAddNotification = useMemo(
    () => debounce((notificationType: NotificationType, title: string, message?: string) => {
      addNotification(notificationType, title, message);
    }, 500),
    [addNotification]
  );

  const fetchFeed = useCallback(async (pageNum: number, append = false) => {
    if (pageNum === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('page', pageNum.toString());
      params.set('limit', '10');
      if (bu) params.set('bu', bu);
      if (channel) params.set('channel', channel);
      if (dateRange) params.set('dateRange', dateRange);
      if (type) params.set('type', type);

      const response = await fetch(`/api/feed?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch feed');
      }

      const data: FeedResponse = await response.json();

      // Parse metadata for each item
      const parsedItems: FeedItemWithMeta[] = data.items.map(item => ({
        ...item,
        parsedMetadata: item.metadata ? JSON.parse(item.metadata) : undefined,
      }));

      if (append) {
        setItems(prev => [...prev, ...parsedItems]);
        // Track newly loaded items
        parsedItems.forEach(item => knownItemIds.current.add(item.id));
      } else {
        setItems(parsedItems);
        // Initialize known items on first load
        parsedItems.forEach(item => knownItemIds.current.add(item.id));
        initialLoadDone.current = true;
      }

      setHasMore(pageNum < data.pagination.totalPages);
      setPage(pageNum);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [bu, channel, dateRange, type]);

  // Poll for new items (only first page to check for new content)
  const pollForNewItems = useCallback(async () => {
    if (!initialLoadDone.current) return;

    try {
      const params = new URLSearchParams();
      params.set('page', '1');
      params.set('limit', '10');
      if (bu) params.set('bu', bu);
      if (channel) params.set('channel', channel);
      if (dateRange) params.set('dateRange', dateRange);
      if (type) params.set('type', type);

      const response = await fetch(`/api/feed?${params.toString()}`);
      if (!response.ok) return;

      const data: FeedResponse = await response.json();

      // Find new items that we haven't seen before
      const newItems: FeedItemWithMeta[] = [];
      for (const item of data.items) {
        if (!knownItemIds.current.has(item.id)) {
          newItems.push({
            ...item,
            parsedMetadata: item.metadata ? JSON.parse(item.metadata) : undefined,
            isNew: true,
          });
        }
      }

      if (newItems.length > 0) {
        // Use startTransition for non-urgent updates to keep UI responsive
        startTransition(() => {
          setPendingItems(prev => {
            // Merge with existing pending items, avoiding duplicates
            const existingIds = new Set(prev.map(i => i.id));
            const trulyNew = newItems.filter(i => !existingIds.has(i.id));
            return [...trulyNew, ...prev];
          });
          setNewItemsCount(prev => prev + newItems.length);
        });

        // Debounced notification to prevent rapid-fire toasts
        const firstNewItem = newItems[0];
        const notificationType = (firstNewItem.type as NotificationType) || 'default';
        const itemCount = newItems.length;
        const title = itemCount === 1
          ? firstNewItem.title
          : `${itemCount} new items in feed`;
        const message = itemCount === 1
          ? firstNewItem.content?.slice(0, 100)
          : `Including: ${firstNewItem.title}`;
        debouncedAddNotification(notificationType, title, message);
      }
    } catch {
      // Silently fail on polling errors - not critical
    }
  }, [bu, channel, dateRange, type, debouncedAddNotification]);

  // Setup polling
  const { isPolling, lastUpdated } = usePolling(pollForNewItems, {
    interval: POLLING_INTERVALS.feed,
    enabled: enablePolling && initialLoadDone.current,
    immediate: false,
  });

  // Function to show pending new items
  const showNewItems = useCallback(() => {
    if (pendingItems.length === 0) return;

    // Use startTransition for batched updates
    startTransition(() => {
      // Add pending items to the top of the feed
      setItems(prev => {
        // Mark pending items and add to known set
        pendingItems.forEach(item => knownItemIds.current.add(item.id));
        return [...pendingItems, ...prev];
      });

      // Clear pending items and count
      setPendingItems([]);
      setNewItemsCount(0);
    });

    // Remove isNew flag after animation (3 seconds)
    setTimeout(() => {
      startTransition(() => {
        setItems(prev => prev.map(item => ({ ...item, isNew: false })));
      });
    }, 3000);
  }, [pendingItems]);

  // Initial load and when filters change
  useEffect(() => {
    setPage(1);
    setItems([]);
    setHasMore(true);
    setNewItemsCount(0);
    setPendingItems([]);
    knownItemIds.current.clear();
    initialLoadDone.current = false;
    fetchFeed(1, false);
  }, [bu, channel, dateRange, type, fetchFeed]);

  // Infinite scroll observer
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          fetchFeed(page + 1, true);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loading, loadingMore, page, fetchFeed]);

  if (loading && items.length === 0) {
    return (
      <div className={cn('space-y-4', className)}>
        {/* Update status bar skeleton */}
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-slate-200 rounded-full animate-pulse" />
            <div className="w-24 h-3 bg-slate-200 rounded animate-pulse" />
          </div>
        </div>
        {/* Skeleton feed cards */}
        <FeedCardSkeleton />
        <FeedCardSkeleton />
        <FeedCardSkeleton />
        <FeedCardSkeleton />
      </div>
    );
  }

  if (error && items.length === 0) {
    return (
      <div className={cn('text-center py-12', className)}>
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-50 mb-4">
          <AlertCircle className="h-6 w-6 text-red-500" />
        </div>
        <h3 className="text-lg font-medium text-slate-900 mb-2">Unable to load feed</h3>
        <p className="text-sm text-slate-500 mb-4 max-w-sm mx-auto">{error}</p>
        <button
          onClick={() => fetchFeed(1, false)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={cn('text-center py-12', className)}>
        <Inbox className="h-12 w-12 mx-auto text-slate-300" />
        <h3 className="mt-4 text-lg font-medium text-slate-900">No feed items</h3>
        <p className="mt-2 text-sm text-slate-500">
          {type
            ? `No ${type} items found for the selected filters.`
            : 'There are no items in the feed right now.'}
        </p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Toast notifications for new items */}
      <NotificationContainer
        notifications={notifications}
        onDismiss={dismissNotification}
        position="top-right"
        autoDismissMs={5000}
      />

      {/* Update status bar */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <RelativeTime
          timestamp={lastUpdated}
          prefix="Updated"
          showIcon={true}
        />
        {isPolling && <RefreshSpinner />}
      </div>

      {/* New items notification */}
      {newItemsCount > 0 && (
        <button
          onClick={showNewItems}
          className="w-full py-2.5 px-4 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg
                     flex items-center justify-center gap-2 text-sm font-medium text-blue-700
                     transition-all duration-200 shadow-sm hover:shadow"
        >
          <ChevronUp className="h-4 w-4" />
          <span>
            {newItemsCount === 1
              ? '1 new item'
              : `${newItemsCount} new items`}
          </span>
        </button>
      )}

      {/* Feed items */}
      {items.map(item => (
        <NewItemWrapper key={item.id} isNew={item.isNew}>
          <FeedCard item={item} />
        </NewItemWrapper>
      ))}

      {/* Load more trigger */}
      <div ref={loadMoreRef} className="h-10 flex items-center justify-center">
        {loadingMore && (
          <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
        )}
        {!hasMore && items.length > 0 && (
          <p className="text-sm text-slate-500">No more items</p>
        )}
      </div>
    </div>
  );
}

// Severity and type configurations for generic feed cards
const severityColors: Record<string, string> = {
  critical: 'bg-red-100 border-red-200',
  high: 'bg-amber-100 border-amber-200',
  medium: 'bg-yellow-100 border-yellow-200',
  low: 'bg-blue-100 border-blue-200',
  info: 'bg-slate-100 border-slate-200',
};

const severityDot: Record<string, string> = {
  critical: 'bg-red-500',
  high: 'bg-amber-500',
  medium: 'bg-yellow-500',
  low: 'bg-blue-500',
  info: 'bg-slate-500',
};

const typeIcons: Record<string, string> = {
  alert: '🔔',
  trending: '🔥',
  highlight: '📌',
  upload: '📤',
};

// Memoized feed card router - prevents re-renders when parent re-renders
// Only re-renders when item.id or item.isNew changes
const FeedCard = memo(function FeedCard({ item }: { item: FeedItemWithMeta }) {
  // Use specialized card component for alerts
  if (item.type === 'alert') {
    return <AlertFeedCard item={item} />;
  }

  // Use specialized card component for trending topics
  if (item.type === 'trending') {
    return <TrendingCard item={item} />;
  }

  // Use specialized card component for highlights
  if (item.type === 'highlight') {
    return <HighlightCard item={item} />;
  }

  // Use specialized card component for uploads
  if (item.type === 'upload') {
    return <UploadCard item={item} />;
  }

  // Fallback generic card for any unknown types
  const severity = (item.parsedMetadata?.severity as string) || 'info';
  const colorClass = severityColors[severity] || severityColors.info;
  const dotClass = severityDot[severity] || severityDot.info;

  return (
    <div className={cn('p-4 rounded-lg border', colorClass)}>
      <div className="flex items-start gap-3">
        <div className={cn('w-2 h-2 rounded-full mt-2', dotClass)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base">{typeIcons[item.type] || '📋'}</span>
              <h4 className="font-medium text-slate-900 truncate">{item.title}</h4>
            </div>
            <span className="text-xs text-slate-500 whitespace-nowrap">
              {formatRelativeTime(item.createdAt)}
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-1 line-clamp-2">{item.content}</p>

          {/* Action buttons placeholder */}
          <div className="flex items-center gap-2 mt-3">
            <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
              View cases
            </button>
            <span className="text-slate-300">·</span>
            <button className="text-xs text-slate-500 hover:text-slate-700">
              Share
            </button>
            <span className="text-slate-300">·</span>
            <button className="text-xs text-slate-500 hover:text-slate-700">
              Escalate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison - only re-render if item id or isNew flag changes
  return prevProps.item.id === nextProps.item.id &&
         prevProps.item.isNew === nextProps.item.isNew;
});
