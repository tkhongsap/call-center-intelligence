'use client';

import { memo } from 'react';
import { cn } from '@/lib/utils';

interface NewItemIndicatorProps {
  className?: string;
  position?: 'top-left' | 'top-right' | 'inline';
}

/**
 * A visual indicator that shows when a feed item is new.
 * Displays a small pulsing badge that auto-fades.
 */
export const NewItemIndicator = memo(function NewItemIndicator({
  className,
  position = 'top-right'
}: NewItemIndicatorProps) {
  const positionClasses = {
    'top-left': 'absolute -top-1 -left-1',
    'top-right': 'absolute -top-1 -right-1',
    'inline': 'inline-flex ml-2',
  };

  return (
    <span
      className={cn(
        'flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
        'bg-blue-500 text-white rounded-full',
        'animate-pulse shadow-sm',
        positionClasses[position],
        className
      )}
      aria-label="New item"
    >
      <span className="w-1 h-1 bg-white rounded-full animate-ping" />
      New
    </span>
  );
});

interface NewItemWrapperProps {
  isNew?: boolean;
  children: React.ReactNode;
  className?: string;
  highlightDuration?: number;
}

/**
 * Wrapper component that adds visual highlighting to new items.
 * Applies ring highlight and slide-in animation for new items.
 * Memoized to prevent unnecessary re-renders of children.
 */
export const NewItemWrapper = memo(function NewItemWrapper({
  isNew = false,
  children,
  className,
}: NewItemWrapperProps) {
  return (
    <div
      className={cn(
        'relative transition-all duration-500',
        isNew && [
          'animate-slideIn',
          'ring-2 ring-blue-400/50 rounded-lg',
          'shadow-lg shadow-blue-100',
        ],
        className
      )}
    >
      {isNew && <NewItemIndicator />}
      {children}
    </div>
  );
});
