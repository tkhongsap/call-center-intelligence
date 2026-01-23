'use client';

import { useState } from 'react';
import { Plus, MessageCircle, Bell, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FABAction {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  className?: string;
}

interface FloatingActionButtonProps {
  /** Primary action when FAB is clicked (if no actions provided) */
  onPrimaryClick?: () => void;
  /** Secondary actions shown in expanded menu */
  actions?: FABAction[];
  /** Bottom offset in pixels (accounts for bottom nav + safe area) */
  bottomOffset?: number;
  /** Additional CSS classes */
  className?: string;
}

export function FloatingActionButton({
  onPrimaryClick,
  actions,
  bottomOffset = 140,
  className,
}: FloatingActionButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handlePrimaryClick = () => {
    if (actions && actions.length > 0) {
      setIsExpanded(!isExpanded);
    } else if (onPrimaryClick) {
      onPrimaryClick();
    }
  };

  const handleActionClick = (action: FABAction) => {
    action.onClick();
    setIsExpanded(false);
  };

  return (
    <div
      className={cn('fixed right-4 z-40 lg:hidden', className)}
      style={{ bottom: `${bottomOffset}px` }}
    >
      {/* Expanded actions */}
      {actions && actions.length > 0 && (
        <div
          className={cn(
            'absolute bottom-16 right-0 flex flex-col gap-3 items-end transition-all duration-200',
            isExpanded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
          )}
        >
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={() => handleActionClick(action)}
              className={cn(
                'flex items-center gap-3 pl-4 pr-3 py-2 rounded-full',
                'bg-[var(--card-bg)] shadow-lg border border-default',
                'transition-all duration-200 tap-scale',
                'hover:shadow-xl',
                action.className
              )}
              aria-label={action.label}
            >
              <span className="text-sm font-medium text-primary whitespace-nowrap">
                {action.label}
              </span>
              <div className="w-10 h-10 rounded-full bg-[var(--background-secondary)] flex items-center justify-center">
                <action.icon className="w-5 h-5 text-[var(--twitter-blue)]" />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Main FAB button */}
      <button
        onClick={handlePrimaryClick}
        className={cn(
          'w-14 h-14 rounded-full',
          'bg-[var(--twitter-blue)] hover:bg-[var(--twitter-blue-hover)]',
          'text-white shadow-lg hover:shadow-xl',
          'flex items-center justify-center',
          'transition-all duration-200 tap-scale',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--twitter-blue)] focus-visible:ring-offset-2',
          isExpanded && 'rotate-45'
        )}
        aria-label={isExpanded ? 'Close menu' : 'Quick actions'}
        aria-expanded={isExpanded}
      >
        {isExpanded ? (
          <X className="w-6 h-6" />
        ) : (
          <Plus className="w-6 h-6" />
        )}
      </button>
    </div>
  );
}

// Pre-configured FAB with common actions
interface QuickActionFABProps {
  onOpenChat?: () => void;
  onCreateAlert?: () => void;
  bottomOffset?: number;
}

export function QuickActionFAB({
  onOpenChat,
  onCreateAlert,
  bottomOffset = 140,
}: QuickActionFABProps) {
  const actions: FABAction[] = [];

  if (onOpenChat) {
    actions.push({
      icon: MessageCircle,
      label: 'Open Chat',
      onClick: onOpenChat,
    });
  }

  if (onCreateAlert) {
    actions.push({
      icon: Bell,
      label: 'New Alert',
      onClick: onCreateAlert,
    });
  }

  // If only one action, make it the primary action without expansion
  if (actions.length === 1) {
    const SingleIcon = actions[0].icon;
    return (
      <div
        className="fixed right-4 z-40 lg:hidden"
        style={{ bottom: `${bottomOffset}px` }}
      >
        <button
          onClick={actions[0].onClick}
          className={cn(
            'w-14 h-14 rounded-full',
            'bg-[var(--twitter-blue)] hover:bg-[var(--twitter-blue-hover)]',
            'text-white shadow-lg hover:shadow-xl',
            'flex items-center justify-center',
            'transition-all duration-200 tap-scale',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--twitter-blue)] focus-visible:ring-offset-2'
          )}
          aria-label={actions[0].label}
        >
          <SingleIcon className="w-6 h-6" />
        </button>
      </div>
    );
  }

  return (
    <FloatingActionButton
      actions={actions}
      bottomOffset={bottomOffset}
    />
  );
}
