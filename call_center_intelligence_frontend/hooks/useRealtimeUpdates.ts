'use client';

import { useEffect, useCallback, useState } from 'react';
import { useSSE } from './useSSE';
import { usePolling, POLLING_INTERVALS } from './usePolling';
import { useOptionalRealtime } from '@/contexts/RealtimeContext';

interface FeedItem {
  id: string;
  type: string;
  title: string;
  content: string | null;
  metadata: string | null;
  priority: number;
  referenceId: string | null;
  referenceType: string | null;
  createdAt: string;
  expiresAt: string | null;
}

interface UseRealtimeUpdatesOptions {
  /** Callback when new feed items arrive */
  onNewFeedItems?: (items: FeedItem[]) => void;
  /** Callback when alert count changes */
  onAlertCountChange?: (count: number) => void;
  /** Polling interval in ms (default: 10000) */
  pollingInterval?: number;
  /** Whether updates are enabled (default: true) */
  enabled?: boolean;
}

interface UseRealtimeUpdatesResult {
  /** Whether connected via SSE */
  isSSEConnected: boolean;
  /** Whether using polling */
  isPolling: boolean;
  /** Whether using fallback (SSE failed) */
  isFallback: boolean;
  /** Last update timestamp */
  lastUpdated: Date | null;
  /** Current error if any */
  error: Error | Event | null;
  /** Manually trigger a refresh */
  refresh: () => Promise<void>;
}

/**
 * Combined hook for real-time updates using SSE with automatic fallback to polling
 *
 * @example
 * ```tsx
 * const { isSSEConnected, isFallback, lastUpdated } = useRealtimeUpdates({
 *   onNewFeedItems: (items) => setFeedItems(prev => [...items, ...prev]),
 *   onAlertCountChange: (count) => setAlertCount(count),
 * });
 * ```
 */
export function useRealtimeUpdates(
  options: UseRealtimeUpdatesOptions = {}
): UseRealtimeUpdatesResult {
  const {
    onNewFeedItems,
    onAlertCountChange,
    pollingInterval = POLLING_INTERVALS.feed,
    enabled = true,
  } = options;

  const realtime = useOptionalRealtime();
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [localFallback, setLocalFallback] = useState(false);

  // Determine if SSE should be used
  const useSSEMode = realtime?.sseEnabled ?? true;
  const isFallbackMode = realtime?.isFallback ?? localFallback;

  // SSE event handlers
  const sseEventHandlers = {
    new_feed_items: (data: unknown) => {
      const payload = data as { items: FeedItem[] };
      if (payload.items?.length > 0) {
        onNewFeedItems?.(payload.items);
        setLastUpdated(new Date());
      }
    },
    alert_count: (data: unknown) => {
      const payload = data as { count: number };
      onAlertCountChange?.(payload.count);
    },
  };

  // SSE connection
  const {
    isConnected: isSSEConnected,
    isFallback: sseFallback,
    error: sseError,
    reconnect: sseReconnect,
  } = useSSE('/api/events', sseEventHandlers, {
    enabled: enabled && useSSEMode && !isFallbackMode,
    onFallback: () => {
      setLocalFallback(true);
      realtime?.setFallback?.(true);
    },
    onOpen: () => {
      realtime?.setSSEConnected?.(true);
    },
    onClose: () => {
      realtime?.setSSEConnected?.(false);
    },
  });

  // Update realtime context when SSE connection status changes
  useEffect(() => {
    realtime?.setSSEConnected?.(isSSEConnected);
  }, [isSSEConnected, realtime]);

  // Polling callback - only used when SSE is not active
  const pollCallback = useCallback(async () => {
    try {
      // Fetch latest feed items
      const feedResponse = await fetch('/api/feed?limit=10');
      if (feedResponse.ok) {
        const data = await feedResponse.json();
        if (data.items?.length > 0) {
          onNewFeedItems?.(data.items);
        }
      }

      // Fetch alert count
      const alertResponse = await fetch('/api/alerts/count');
      if (alertResponse.ok) {
        const data = await alertResponse.json();
        onAlertCountChange?.(data.count);
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error('[Realtime] Polling error:', error);
      throw error;
    }
  }, [onNewFeedItems, onAlertCountChange]);

  // Polling - active when SSE is disabled or in fallback mode
  const shouldPoll = enabled && (!useSSEMode || isFallbackMode || sseFallback);
  const {
    refresh: pollRefresh,
    isPolling,
    error: pollingError,
    lastUpdated: pollingLastUpdated,
  } = usePolling(pollCallback, {
    interval: pollingInterval,
    immediate: true,
    enabled: shouldPoll,
  });

  // Manual refresh function
  const refresh = useCallback(async () => {
    if (isSSEConnected) {
      // For SSE, we can trigger a reconnect to get fresh data
      sseReconnect();
    } else {
      await pollRefresh();
    }
  }, [isSSEConnected, sseReconnect, pollRefresh]);

  // Combine last updated from both sources
  const effectiveLastUpdated = isSSEConnected ? lastUpdated : pollingLastUpdated;

  return {
    isSSEConnected,
    isPolling: shouldPoll && isPolling,
    isFallback: isFallbackMode || sseFallback,
    lastUpdated: effectiveLastUpdated,
    error: sseError || pollingError,
    refresh,
  };
}
