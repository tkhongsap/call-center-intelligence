'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useLayoutEffect,
  type ReactNode,
} from 'react';

export type RealtimeMode = 'sse' | 'polling';

interface RealtimeContextValue {
  /** Current realtime mode: 'sse' or 'polling' */
  mode: RealtimeMode;
  /** Set the realtime mode */
  setMode: (mode: RealtimeMode) => void;
  /** Whether SSE is enabled */
  sseEnabled: boolean;
  /** Toggle SSE on/off (switches to polling when off) */
  toggleSSE: () => void;
  /** Whether SSE connection is active */
  isSSEConnected: boolean;
  /** Update SSE connection status (for internal use) */
  setSSEConnected: (connected: boolean) => void;
  /** Whether using fallback (SSE failed) */
  isFallback: boolean;
  /** Set fallback state */
  setFallback: (fallback: boolean) => void;
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

const STORAGE_KEY = 'realtime-mode';

interface RealtimeProviderProps {
  children: ReactNode;
}

export function RealtimeProvider({ children }: RealtimeProviderProps) {
  const [mode, setModeState] = useState<RealtimeMode>('sse');
  const [isSSEConnected, setSSEConnected] = useState(false);
  const [isFallback, setFallback] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Load persisted state on mount
  useLayoutEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Hydration guard requires setState on mount
    setMounted(true);
    const stored = localStorage.getItem(STORAGE_KEY) as RealtimeMode | null;
    if (stored === 'sse' || stored === 'polling') {
      setModeState(stored);
    }
  }, []);

  const setMode = useCallback((newMode: RealtimeMode) => {
    setModeState(newMode);
    localStorage.setItem(STORAGE_KEY, newMode);
    // Reset fallback when manually switching modes
    if (newMode === 'sse') {
      setFallback(false);
    }
  }, []);

  const toggleSSE = useCallback(() => {
    const newMode = mode === 'sse' ? 'polling' : 'sse';
    setMode(newMode);
  }, [mode, setMode]);

  const sseEnabled = mode === 'sse' && !isFallback;

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <RealtimeContext.Provider
        value={{
          mode: 'sse',
          setMode: () => {},
          sseEnabled: false,
          toggleSSE: () => {},
          isSSEConnected: false,
          setSSEConnected: () => {},
          isFallback: false,
          setFallback: () => {},
        }}
      >
        {children}
      </RealtimeContext.Provider>
    );
  }

  return (
    <RealtimeContext.Provider
      value={{
        mode,
        setMode,
        sseEnabled,
        toggleSSE,
        isSSEConnected,
        setSSEConnected,
        isFallback,
        setFallback,
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
}

export function useOptionalRealtime() {
  return useContext(RealtimeContext);
}
