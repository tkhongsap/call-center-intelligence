'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import { X, Bell, TrendingUp, AlertTriangle, Upload, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export type NotificationType = 'alert' | 'trending' | 'highlight' | 'upload' | 'default';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  timestamp: Date;
}

interface UpdateNotificationProps {
  notification: Notification;
  onDismiss: (id: string) => void;
  autoDismissMs?: number;
}

const typeConfig: Record<NotificationType, { icon: React.ElementType; bgColor: string; borderColor: string; iconColor: string }> = {
  alert: {
    icon: AlertTriangle,
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    iconColor: 'text-amber-600',
  },
  trending: {
    icon: TrendingUp,
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    iconColor: 'text-purple-600',
  },
  highlight: {
    icon: Sparkles,
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    iconColor: 'text-blue-600',
  },
  upload: {
    icon: Upload,
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    iconColor: 'text-green-600',
  },
  default: {
    icon: Bell,
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-200',
    iconColor: 'text-slate-600',
  },
};

/**
 * A single toast notification for feed updates.
 * Auto-dismisses after the specified duration.
 * Memoized to prevent unnecessary re-renders.
 */
export const UpdateNotification = memo(function UpdateNotification({
  notification,
  onDismiss,
  autoDismissMs = 5000,
}: UpdateNotificationProps) {
  const [isExiting, setIsExiting] = useState(false);

  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => onDismiss(notification.id), 300);
  }, [notification.id, onDismiss]);

  // Auto-dismiss after specified duration
  useEffect(() => {
    const timer = setTimeout(handleDismiss, autoDismissMs);
    return () => clearTimeout(timer);
  }, [autoDismissMs, handleDismiss]);

  const config = typeConfig[notification.type] || typeConfig.default;
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg border shadow-lg max-w-sm',
        'transition-all duration-300 ease-out',
        config.bgColor,
        config.borderColor,
        isExiting ? 'animate-toastOut opacity-0 translate-x-full' : 'animate-toastIn'
      )}
      role="alert"
      aria-live="polite"
    >
      <div className={cn('flex-shrink-0 p-1.5 rounded-full', config.bgColor)}>
        <Icon className={cn('w-4 h-4', config.iconColor)} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 truncate">
          {notification.title}
        </p>
        {notification.message && (
          <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">
            {notification.message}
          </p>
        )}
      </div>

      <button
        onClick={handleDismiss}
        className="flex-shrink-0 p-1 rounded-full hover:bg-slate-200/50 transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="w-3.5 h-3.5 text-slate-400" />
      </button>
    </div>
  );
});

interface NotificationContainerProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  autoDismissMs?: number;
}

const positionClasses = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
};

/**
 * Container for stacking multiple toast notifications.
 * Handles positioning and stacking of notifications.
 * Memoized to prevent unnecessary re-renders.
 */
export const NotificationContainer = memo(function NotificationContainer({
  notifications,
  onDismiss,
  position = 'top-right',
  autoDismissMs = 5000,
}: NotificationContainerProps) {
  if (notifications.length === 0) return null;

  return (
    <div
      className={cn(
        'fixed z-50 flex flex-col gap-2',
        positionClasses[position]
      )}
      aria-label="Notifications"
    >
      {notifications.map((notification) => (
        <UpdateNotification
          key={notification.id}
          notification={notification}
          onDismiss={onDismiss}
          autoDismissMs={autoDismissMs}
        />
      ))}
    </div>
  );
});

// Hook for managing notifications
export function useNotifications(maxNotifications = 3) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((
    type: NotificationType,
    title: string,
    message?: string
  ) => {
    const notification: Notification = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      title,
      message,
      timestamp: new Date(),
    };

    setNotifications((prev) => {
      const updated = [notification, ...prev];
      // Limit to maxNotifications
      return updated.slice(0, maxNotifications);
    });

    return notification.id;
  }, [maxNotifications]);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    addNotification,
    dismissNotification,
    clearAll,
  };
}
