'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export interface SSEOptions {
  /** Whether SSE is enabled (default: true) */
  enabled?: boolean;
  /** Reconnect delay in ms after disconnect (default: 3000) */
  reconnectDelay?: number;
  /** Max reconnection attempts before giving up (default: 5) */
  maxReconnectAttempts?: number;
  /** Callback when connection opens */
  onOpen?: () => void;
  /** Callback when connection closes */
  onClose?: () => void;
  /** Callback when connection errors */
  onError?: (error: Event) => void;
  /** Callback when falling back to polling */
  onFallback?: () => void;
}

export interface SSEResult {
  /** Whether SSE is connected */
  isConnected: boolean;
  /** Whether connection is being established */
  isConnecting: boolean;
  /** Whether SSE failed and using fallback */
  isFallback: boolean;
  /** Last error if any */
  error: Event | null;
  /** Number of reconnection attempts */
  reconnectAttempts: number;
  /** Manually close the connection */
  close: () => void;
  /** Manually reconnect */
  reconnect: () => void;
}

type EventHandler = (data: unknown) => void;

/**
 * React hook for Server-Sent Events (SSE) with automatic reconnection
 * and fallback support
 *
 * @param url - SSE endpoint URL
 * @param eventHandlers - Map of event names to handler functions
 * @param options - Configuration options
 * @returns SSE connection state and controls
 *
 * @example
 * ```tsx
 * const { isConnected, isFallback } = useSSE('/api/events', {
 *   new_feed_items: (data) => setItems(data.items),
 *   alert_count: (data) => setAlertCount(data.count),
 * }, {
 *   onFallback: () => startPolling(),
 * });
 * ```
 */
export function useSSE(
  url: string,
  eventHandlers: Record<string, EventHandler>,
  options: SSEOptions = {}
): SSEResult {
  const {
    enabled = true,
    reconnectDelay = 3000,
    maxReconnectAttempts = 5,
    onOpen,
    onClose,
    onError,
    onFallback,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isFallback, setIsFallback] = useState(false);
  const [error, setError] = useState<Event | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastEventIdRef = useRef<string | null>(null);
  const eventHandlersRef = useRef(eventHandlers);
  const connectRef = useRef<() => void>(() => {});

  // Keep handlers ref updated
  useEffect(() => {
    eventHandlersRef.current = eventHandlers;
  }, [eventHandlers]);

  // Clear reconnect timeout
  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  // Close connection
  const close = useCallback(() => {
    clearReconnectTimeout();
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
  }, [clearReconnectTimeout]);

  // Connect to SSE
  const connect = useCallback(() => {
    // Don't connect if not enabled or in fallback mode
    if (!enabled || isFallback) return;

    // Close existing connection
    close();

    setIsConnecting(true);
    setError(null);

    // Build URL with lastEventId if available
    let connectionUrl = url;
    if (lastEventIdRef.current) {
      const separator = url.includes('?') ? '&' : '?';
      connectionUrl = `${url}${separator}lastEventId=${encodeURIComponent(lastEventIdRef.current)}`;
    }

    try {
      const eventSource = new EventSource(connectionUrl);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setIsConnected(true);
        setIsConnecting(false);
        setReconnectAttempts(0);
        onOpen?.();
      };

      eventSource.onerror = (event) => {
        setError(event);
        setIsConnected(false);
        setIsConnecting(false);
        onError?.(event);

        // Attempt reconnection
        setReconnectAttempts((prev) => {
          const newAttempts = prev + 1;

          if (newAttempts >= maxReconnectAttempts) {
            // Max attempts reached, switch to fallback
            setIsFallback(true);
            close();
            onFallback?.();
            return newAttempts;
          }

          // Schedule reconnection with exponential backoff
          const delay = reconnectDelay * Math.pow(2, newAttempts - 1);
          reconnectTimeoutRef.current = setTimeout(() => {
            connectRef.current();
          }, delay);

          return newAttempts;
        });
      };

      // Set up event listeners for each handler
      Object.keys(eventHandlersRef.current).forEach((eventName) => {
        eventSource.addEventListener(eventName, (event) => {
          // Track last event ID for reconnection
          if (event.lastEventId) {
            lastEventIdRef.current = event.lastEventId;
          }

          try {
            const data = JSON.parse((event as MessageEvent).data);
            eventHandlersRef.current[eventName]?.(data);
          } catch {
            console.error(`[SSE] Failed to parse event data for ${eventName}`);
          }
        });
      });

      // Listen for heartbeat to keep connection alive
      eventSource.addEventListener('heartbeat', () => {
        // Heartbeat received, connection is alive
      });
    } catch {
      setIsConnecting(false);
      setIsFallback(true);
      onFallback?.();
    }
  }, [url, enabled, isFallback, close, onOpen, onError, onFallback, reconnectDelay, maxReconnectAttempts]);

  // Keep connect ref updated
  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  // Reconnect function
  const reconnect = useCallback(() => {
    setReconnectAttempts(0);
    setIsFallback(false);
    connect();
  }, [connect]);

  // Effect to manage connection lifecycle
  useEffect(() => {
    if (enabled && !isFallback) {
      connect();
    } else {
      close();
    }

    return () => {
      close();
    };
  }, [enabled, isFallback, connect, close]);

  // Handle page visibility
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && enabled && !isFallback) {
        // Reconnect when page becomes visible
        if (!isConnected && !isConnecting) {
          connect();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, isFallback, isConnected, isConnecting, connect]);

  return {
    isConnected,
    isConnecting,
    isFallback,
    error,
    reconnectAttempts,
    close,
    reconnect,
  };
}
