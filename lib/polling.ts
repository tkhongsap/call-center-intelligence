/**
 * Polling utility for real-time updates
 * Provides configurable polling with visibility handling
 */

export interface PollingOptions {
  /** Polling interval in milliseconds (default: 15000) */
  interval?: number;
  /** Whether to poll immediately on start (default: false) */
  immediate?: boolean;
  /** Whether to pause polling when page is hidden (default: true) */
  pauseOnHidden?: boolean;
  /** Callback when polling errors occur */
  onError?: (error: Error) => void;
}

export interface PollingController {
  /** Start the polling loop */
  start: () => void;
  /** Stop the polling loop */
  stop: () => void;
  /** Manually trigger a poll */
  poll: () => Promise<void>;
  /** Check if polling is active */
  isActive: () => boolean;
}

/**
 * Creates a polling controller for executing a callback at regular intervals
 * Handles page visibility changes automatically
 */
export function createPolling<T>(
  callback: () => Promise<T>,
  options: PollingOptions = {}
): PollingController {
  const {
    interval = 15000,
    immediate = false,
    pauseOnHidden = true,
    onError,
  } = options;

  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let active = false;
  let wasActiveBeforeHidden = false;

  const poll = async (): Promise<void> => {
    try {
      await callback();
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error(String(error)));
    }
  };

  const scheduleNext = () => {
    if (!active) return;
    timeoutId = setTimeout(async () => {
      await poll();
      scheduleNext();
    }, interval);
  };

  const start = () => {
    if (active) return;
    active = true;

    if (immediate) {
      poll().then(scheduleNext);
    } else {
      scheduleNext();
    }
  };

  const stop = () => {
    active = false;
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  // Handle visibility changes
  if (pauseOnHidden && typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        wasActiveBeforeHidden = active;
        if (active) {
          stop();
        }
      } else if (document.visibilityState === 'visible') {
        if (wasActiveBeforeHidden) {
          // Poll immediately when returning to visible, then resume schedule
          active = true;
          poll().then(scheduleNext);
        }
      }
    });
  }

  return {
    start,
    stop,
    poll,
    isActive: () => active,
  };
}

/**
 * Default polling intervals from config (in milliseconds)
 */
export const POLLING_INTERVALS = {
  feed: 10000,      // 10 seconds for live feed
  alerts: 15000,    // 15 seconds for alert counts
  stats: 20000,     // 20 seconds for stats/KPIs
  default: 15000,   // Default interval
} as const;
