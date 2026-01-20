'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';

interface DemoModeContextValue {
  /** Whether demo mode is currently active */
  isEnabled: boolean;
  /** Toggle demo mode on/off */
  toggle: () => void;
  /** Explicitly enable demo mode */
  enable: () => void;
  /** Explicitly disable demo mode */
  disable: () => void;
  /** Loading state while toggling */
  isLoading: boolean;
  /** Interval in milliseconds between mock events (30000-60000) */
  intervalMs: number;
  /** Update the interval */
  setIntervalMs: (ms: number) => void;
}

const DemoModeContext = createContext<DemoModeContextValue | null>(null);

const STORAGE_KEY = 'demo-mode-enabled';
const INTERVAL_STORAGE_KEY = 'demo-mode-interval';
const DEFAULT_INTERVAL = 45000; // 45 seconds

interface DemoModeProviderProps {
  children: ReactNode;
}

export function DemoModeProvider({ children }: DemoModeProviderProps) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [intervalMs, setIntervalMsState] = useState(DEFAULT_INTERVAL);
  const [mounted, setMounted] = useState(false);

  // Load persisted state on mount
  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(STORAGE_KEY);
    const storedInterval = localStorage.getItem(INTERVAL_STORAGE_KEY);

    if (stored === 'true') {
      setIsEnabled(true);
      // Sync with server
      syncWithServer(true, storedInterval ? parseInt(storedInterval, 10) : DEFAULT_INTERVAL);
    }

    if (storedInterval) {
      setIntervalMsState(parseInt(storedInterval, 10));
    }
  }, []);

  // Sync demo mode state with the server
  const syncWithServer = async (enabled: boolean, interval?: number) => {
    try {
      await fetch('/api/demo-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled,
          intervalMs: interval ?? intervalMs
        }),
      });
    } catch (error) {
      console.error('Failed to sync demo mode with server:', error);
    }
  };

  const toggle = useCallback(async () => {
    setIsLoading(true);
    const newState = !isEnabled;

    try {
      await syncWithServer(newState);
      setIsEnabled(newState);
      localStorage.setItem(STORAGE_KEY, String(newState));
    } catch (error) {
      console.error('Failed to toggle demo mode:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isEnabled, intervalMs]);

  const enable = useCallback(async () => {
    if (isEnabled) return;
    setIsLoading(true);

    try {
      await syncWithServer(true);
      setIsEnabled(true);
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch (error) {
      console.error('Failed to enable demo mode:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isEnabled, intervalMs]);

  const disable = useCallback(async () => {
    if (!isEnabled) return;
    setIsLoading(true);

    try {
      await syncWithServer(false);
      setIsEnabled(false);
      localStorage.setItem(STORAGE_KEY, 'false');
    } catch (error) {
      console.error('Failed to disable demo mode:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isEnabled]);

  const setIntervalMs = useCallback(async (ms: number) => {
    const clampedMs = Math.max(30000, Math.min(60000, ms));
    setIntervalMsState(clampedMs);
    localStorage.setItem(INTERVAL_STORAGE_KEY, String(clampedMs));

    if (isEnabled) {
      // Update server with new interval
      await syncWithServer(true, clampedMs);
    }
  }, [isEnabled]);

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <DemoModeContext.Provider
        value={{
          isEnabled: false,
          toggle: () => {},
          enable: () => {},
          disable: () => {},
          isLoading: false,
          intervalMs: DEFAULT_INTERVAL,
          setIntervalMs: () => {},
        }}
      >
        {children}
      </DemoModeContext.Provider>
    );
  }

  return (
    <DemoModeContext.Provider
      value={{
        isEnabled,
        toggle,
        enable,
        disable,
        isLoading,
        intervalMs,
        setIntervalMs,
      }}
    >
      {children}
    </DemoModeContext.Provider>
  );
}

export function useDemoMode() {
  const context = useContext(DemoModeContext);
  if (!context) {
    throw new Error('useDemoMode must be used within a DemoModeProvider');
  }
  return context;
}

/**
 * Optional hook that returns null if not within provider
 */
export function useOptionalDemoMode() {
  return useContext(DemoModeContext);
}
