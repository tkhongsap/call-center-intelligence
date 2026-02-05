/**
 * Polling utilities for periodic data fetching
 */

export interface PollingOptions {
  /** Polling interval in milliseconds */
  interval: number;
  /** Whether to execute immediately on start (default: false) */
  immediate?: boolean;
  /** Whether to pause polling when page is hidden (default: true) */
  pauseOnHidden?: boolean;
  /** Error handler callback */
  onError?: (error: Error) => void;
}

export interface PollingController {
  /** Start polling */
  start: () => void;
  /** Stop polling */
  stop: () => void;
  /** Execute a single poll immediately */
  poll: () => Promise<void>;
  /** Check if polling is active */
  isActive: () => boolean;
}

/**
 * Predefined polling intervals
 */
export const POLLING_INTERVALS = {
  /** 5 seconds - for real-time updates */
  realtime: 5000,
  /** 15 seconds - default interval */
  default: 15000,
  /** 30 seconds - for less critical updates */
  moderate: 30000,
  /** 1 minute - for background updates */
  slow: 60000,
  /** 5 minutes - for infrequent updates */
  verySlow: 300000,
} as const;

/**
 * Create a polling controller
 *
 * @param callback - Async function to execute on each poll
 * @param options - Polling configuration
 * @returns Polling controller
 *
 * @example
 * ```ts
 * const polling = createPolling(
 *   async () => {
 *     const data = await fetch('/api/data');
 *     return data.json();
 *   },
 *   { interval: 15000, immediate: true }
 * );
 *
 * polling.start();
 * // Later...
 * polling.stop();
 * ```
 */
export function createPolling<T = void>(
  callback: () => Promise<T>,
  options: PollingOptions
): PollingController {
  const {
    interval,
    immediate = false,
    pauseOnHidden = true,
    onError,
  } = options;

  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let isActive = false;
  let isPaused = false;

  // Handle visibility change
  const handleVisibilityChange = () => {
    if (!pauseOnHidden) return;

    if (document.hidden) {
      isPaused = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    } else {
      isPaused = false;
      if (isActive) {
        scheduleNext();
      }
    }
  };

  // Schedule next poll
  const scheduleNext = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    if (!isActive || isPaused) return;

    timeoutId = setTimeout(async () => {
      await executePoll();
      scheduleNext();
    }, interval);
  };

  // Execute the polling callback
  const executePoll = async () => {
    if (!isActive || isPaused) return;

    try {
      await callback();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      if (onError) {
        onError(err);
      } else {
        console.error('Polling error:', err);
      }
    }
  };

  // Start polling
  const start = () => {
    if (isActive) return;

    isActive = true;
    isPaused = document.hidden && pauseOnHidden;

    if (pauseOnHidden) {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    if (immediate && !isPaused) {
      executePoll().then(() => scheduleNext());
    } else {
      scheduleNext();
    }
  };

  // Stop polling
  const stop = () => {
    isActive = false;
    isPaused = false;

    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }

    if (pauseOnHidden) {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    }
  };

  // Manual poll
  const poll = async () => {
    await executePoll();
  };

  // Check if active
  const checkIsActive = () => isActive;

  return {
    start,
    stop,
    poll,
    isActive: checkIsActive,
  };
}

/**
 * Create a polling controller with automatic cleanup
 *
 * @param callback - Async function to execute on each poll
 * @param options - Polling configuration
 * @returns Cleanup function
 *
 * @example
 * ```ts
 * const cleanup = startPolling(
 *   async () => {
 *     const data = await fetch('/api/data');
 *     return data.json();
 *   },
 *   { interval: 15000 }
 * );
 *
 * // Later...
 * cleanup();
 * ```
 */
export function startPolling<T = void>(
  callback: () => Promise<T>,
  options: PollingOptions
): () => void {
  const controller = createPolling(callback, options);
  controller.start();
  return () => controller.stop();
}
