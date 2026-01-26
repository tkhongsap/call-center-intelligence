'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { createPolling, POLLING_INTERVALS, type PollingOptions } from '@/lib/polling';

interface UsePollingOptions extends Omit<PollingOptions, 'onError'> {
  /** Whether polling is enabled (default: true) */
  enabled?: boolean;
  /** Dependencies that trigger a refresh when changed */
  deps?: unknown[];
  /** Number of retries on failure (default: 3) */
  retryCount?: number;
  /** Delay between retries in ms (default: 2000) */
  retryDelay?: number;
}

interface UsePollingResult {
  /** Manually trigger a poll */
  refresh: () => Promise<void>;
  /** Whether a poll is currently in progress */
  isPolling: boolean;
  /** Last polling error, if any */
  error: Error | null;
  /** Timestamp of last successful poll */
  lastUpdated: Date | null;
  /** Number of consecutive failures */
  failureCount: number;
  /** Whether currently retrying after a failure */
  isRetrying: boolean;
}

/**
 * React hook for polling with automatic lifecycle management
 *
 * @param callback - Async function to execute on each poll
 * @param options - Polling configuration options
 * @returns Polling control and status
 *
 * @example
 * ```tsx
 * const { refresh, lastUpdated } = usePolling(
 *   async () => {
 *     const data = await fetch('/api/feed');
 *     setFeedItems(await data.json());
 *   },
 *   { interval: 15000 }
 * );
 * ```
 */
export function usePolling<T = void>(
  callback: () => Promise<T>,
  options: UsePollingOptions = {}
): UsePollingResult {
  const {
    interval = POLLING_INTERVALS.default,
    immediate = false,
    pauseOnHidden = true,
    enabled = true,
    deps = [],
    retryCount = 3,
    retryDelay = 2000,
  } = options;

  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [failureCount, setFailureCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const controllerRef = useRef<ReturnType<typeof createPolling> | null>(null);
  const callbackRef = useRef(callback);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep callback ref updated to avoid stale closures
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Clear retry timeout on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // Retry function with exponential backoff
  const scheduleRetry = useCallback((currentFailures: number) => {
    if (currentFailures >= retryCount) {
      setIsRetrying(false);
      return;
    }

    setIsRetrying(true);
    const delay = retryDelay * Math.pow(1.5, currentFailures); // Exponential backoff

    retryTimeoutRef.current = setTimeout(async () => {
      try {
        setIsPolling(true);
        await callbackRef.current();
        setLastUpdated(new Date());
        setError(null);
        setFailureCount(0);
        setIsRetrying(false);
      } catch (err) {
        const newFailures = currentFailures + 1;
        setFailureCount(newFailures);
        if (newFailures < retryCount) {
          scheduleRetry(newFailures);
        } else {
          const error = err instanceof Error ? err : new Error(String(err));
          setError(error);
          setIsRetrying(false);
        }
      } finally {
        setIsPolling(false);
      }
    }, delay);
  }, [retryCount, retryDelay]);

  // Wrapped callback that tracks state and handles retries
  const wrappedCallback = useCallback(async (): Promise<T> => {
    setIsPolling(true);
    setError(null);
    try {
      const result = await callbackRef.current();
      setLastUpdated(new Date());
      setFailureCount(0);
      setIsRetrying(false);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      const newFailures = failureCount + 1;
      setFailureCount(newFailures);

      // Schedule retry if we haven't exhausted retries
      if (newFailures < retryCount) {
        scheduleRetry(newFailures);
      } else {
        setError(error);
      }
      throw error;
    } finally {
      setIsPolling(false);
    }
  }, [failureCount, retryCount, scheduleRetry]);

  // Manual refresh function
  const refresh = useCallback(async (): Promise<void> => {
    if (controllerRef.current) {
      await controllerRef.current.poll();
    } else {
      await wrappedCallback();
    }
  }, [wrappedCallback]);

  // Setup and cleanup polling controller
  useEffect(() => {
    if (!enabled) {
      if (controllerRef.current) {
        controllerRef.current.stop();
        controllerRef.current = null;
      }
      return;
    }

    controllerRef.current = createPolling(wrappedCallback, {
      interval,
      immediate,
      pauseOnHidden,
      onError: (err) => setError(err),
    });

    controllerRef.current.start();

    return () => {
      if (controllerRef.current) {
        controllerRef.current.stop();
        controllerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, interval, immediate, pauseOnHidden, wrappedCallback, ...deps]);

  return {
    refresh,
    isPolling,
    error,
    lastUpdated,
    failureCount,
    isRetrying,
  };
}

export { POLLING_INTERVALS };
