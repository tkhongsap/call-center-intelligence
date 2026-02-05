'use client';

import { Play, Pause, Loader2 } from 'lucide-react';
import { useDemoMode } from '@/contexts/DemoModeContext';
import { cn } from '@/lib/utils';

interface DemoModeToggleProps {
  className?: string;
  showLabel?: boolean;
  compact?: boolean;
}

export function DemoModeToggle({
  className,
  showLabel = true,
  compact = false,
}: DemoModeToggleProps) {
  const { isEnabled, toggle, isLoading } = useDemoMode();

  if (compact) {
    return (
      <button
        onClick={toggle}
        disabled={isLoading}
        className={cn(
          'relative flex items-center justify-center w-8 h-8 rounded-lg transition-all',
          isEnabled
            ? 'bg-green-100 text-green-700 hover:bg-green-200'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
          isLoading && 'opacity-50 cursor-not-allowed',
          className
        )}
        title={isEnabled ? 'Demo Mode Active - Click to Stop' : 'Start Demo Mode'}
        aria-label={isEnabled ? 'Stop Demo Mode' : 'Start Demo Mode'}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isEnabled ? (
          <>
            <Pause className="w-4 h-4" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          </>
        ) : (
          <Play className="w-4 h-4" />
        )}
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      disabled={isLoading}
      className={cn(
        'relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
        isEnabled
          ? 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-200'
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200',
        isLoading && 'opacity-50 cursor-not-allowed',
        className
      )}
      title={isEnabled ? 'Demo Mode Active - Click to Stop' : 'Start Demo Mode'}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isEnabled ? (
        <Pause className="w-4 h-4" />
      ) : (
        <Play className="w-4 h-4" />
      )}

      {showLabel && (
        <span>{isEnabled ? 'Demo Active' : 'Demo Mode'}</span>
      )}

      {isEnabled && !isLoading && (
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
      )}
    </button>
  );
}
