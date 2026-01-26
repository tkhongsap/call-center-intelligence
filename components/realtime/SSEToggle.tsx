'use client';

import { Radio, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useRealtime } from '@/contexts/RealtimeContext';
import { cn } from '@/lib/utils';

interface SSEToggleProps {
  className?: string;
  showLabel?: boolean;
  compact?: boolean;
}

export function SSEToggle({
  className,
  showLabel = true,
  compact = false,
}: SSEToggleProps) {
  const { mode, toggleSSE, isSSEConnected, isFallback } = useRealtime();

  const isSSE = mode === 'sse';

  if (compact) {
    return (
      <button
        onClick={toggleSSE}
        className={cn(
          'relative flex items-center justify-center w-8 h-8 rounded-lg transition-all',
          isSSE
            ? isSSEConnected
              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              : isFallback
                ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
          className
        )}
        title={
          isSSE
            ? isSSEConnected
              ? 'SSE Connected - Click for Polling'
              : isFallback
                ? 'SSE Failed (using polling) - Click to retry SSE'
                : 'SSE Mode - Click for Polling'
            : 'Polling Mode - Click for SSE'
        }
        aria-label={isSSE ? 'Switch to Polling' : 'Switch to SSE'}
      >
        {isSSE ? (
          isSSEConnected ? (
            <Radio className="w-4 h-4" />
          ) : isFallback ? (
            <RefreshCw className="w-4 h-4" />
          ) : (
            <Wifi className="w-4 h-4" />
          )
        ) : (
          <WifiOff className="w-4 h-4" />
        )}
        {isSSE && isSSEConnected && (
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
        )}
        {isFallback && (
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-500 rounded-full" />
        )}
      </button>
    );
  }

  return (
    <button
      onClick={toggleSSE}
      className={cn(
        'relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
        isSSE
          ? isSSEConnected
            ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-200'
            : isFallback
              ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-200'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200',
        className
      )}
      title={
        isSSE
          ? isSSEConnected
            ? 'SSE Connected'
            : isFallback
              ? 'SSE Failed - Using Polling'
              : 'SSE Mode'
          : 'Polling Mode'
      }
    >
      {isSSE ? (
        isSSEConnected ? (
          <Radio className="w-4 h-4" />
        ) : isFallback ? (
          <RefreshCw className="w-4 h-4" />
        ) : (
          <Wifi className="w-4 h-4" />
        )
      ) : (
        <WifiOff className="w-4 h-4" />
      )}

      {showLabel && (
        <span>
          {isSSE
            ? isSSEConnected
              ? 'SSE Connected'
              : isFallback
                ? 'Fallback (Polling)'
                : 'SSE Mode'
            : 'Polling Mode'}
        </span>
      )}

      {isSSE && isSSEConnected && (
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
      )}
      {isFallback && (
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-500 rounded-full" />
      )}
    </button>
  );
}
