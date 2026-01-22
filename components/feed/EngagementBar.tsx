'use client';

import { useState } from 'react';
import {
  Eye,
  Share2,
  AlertTriangle,
  Bookmark,
  BookmarkCheck,
  CheckCircle,
  MessageCircle,
  TrendingUp,
  FileText,
  LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type EngagementActionType =
  | 'viewCases'
  | 'acknowledge'
  | 'bookmark'
  | 'share'
  | 'escalate'
  | 'watch'
  | 'learnMore'
  | 'viewBatch'
  | 'comment';

export interface EngagementAction {
  type: EngagementActionType;
  label?: string;
  count?: number;
  active?: boolean;
  disabled?: boolean;
}

interface EngagementBarProps {
  actions: EngagementAction[];
  onAction?: (type: EngagementActionType) => void;
  className?: string;
  size?: 'sm' | 'md';
}

const actionConfig: Record<
  EngagementActionType,
  {
    icon: LucideIcon;
    activeIcon?: LucideIcon;
    label: string;
    hoverClass: string;
    activeClass: string;
  }
> = {
  viewCases: {
    icon: Eye,
    label: 'View',
    hoverClass: 'hover:text-[#1DA1F2] hover:bg-[#1DA1F2]/10',
    activeClass: 'text-[#1DA1F2]',
  },
  acknowledge: {
    icon: CheckCircle,
    label: 'Acknowledge',
    hoverClass: 'hover:text-[#17BF63] hover:bg-[#17BF63]/10',
    activeClass: 'text-[#17BF63]',
  },
  bookmark: {
    icon: Bookmark,
    activeIcon: BookmarkCheck,
    label: 'Bookmark',
    hoverClass: 'hover:text-[#1DA1F2] hover:bg-[#1DA1F2]/10',
    activeClass: 'text-[#1DA1F2]',
  },
  share: {
    icon: Share2,
    label: 'Share',
    hoverClass: 'hover:text-[#17BF63] hover:bg-[#17BF63]/10',
    activeClass: 'text-[#17BF63]',
  },
  escalate: {
    icon: AlertTriangle,
    label: 'Escalate',
    hoverClass: 'hover:text-[#E0245E] hover:bg-[#E0245E]/10',
    activeClass: 'text-[#E0245E]',
  },
  watch: {
    icon: TrendingUp,
    label: 'Watch',
    hoverClass: 'hover:text-[#1DA1F2] hover:bg-[#1DA1F2]/10',
    activeClass: 'text-[#1DA1F2]',
  },
  learnMore: {
    icon: FileText,
    label: 'Learn More',
    hoverClass: 'hover:text-[#1DA1F2] hover:bg-[#1DA1F2]/10',
    activeClass: 'text-[#1DA1F2]',
  },
  viewBatch: {
    icon: Eye,
    label: 'View Batch',
    hoverClass: 'hover:text-[#1DA1F2] hover:bg-[#1DA1F2]/10',
    activeClass: 'text-[#1DA1F2]',
  },
  comment: {
    icon: MessageCircle,
    label: 'Comment',
    hoverClass: 'hover:text-[#1DA1F2] hover:bg-[#1DA1F2]/10',
    activeClass: 'text-[#1DA1F2]',
  },
};

export function EngagementBar({
  actions,
  onAction,
  className,
  size = 'md',
}: EngagementBarProps) {
  const [animatingAction, setAnimatingAction] = useState<EngagementActionType | null>(null);

  const handleClick = (action: EngagementAction) => {
    if (action.disabled) return;

    // Trigger animation for bookmark and acknowledge (heart-like actions)
    if (action.type === 'bookmark' || action.type === 'acknowledge') {
      setAnimatingAction(action.type);
      setTimeout(() => setAnimatingAction(null), 400);
    }

    onAction?.(action.type);
  };

  const sizeStyles = {
    sm: {
      container: 'gap-1',
      button: 'px-2 py-1 gap-1',
      icon: 'w-4 h-4',
      text: 'text-xs',
    },
    md: {
      container: 'gap-2',
      button: 'px-3 py-1.5 gap-1.5',
      icon: 'w-[18px] h-[18px]',
      text: 'text-sm',
    },
  };

  const styles = sizeStyles[size];

  return (
    <div
      className={cn(
        'flex items-center justify-between w-full max-w-md',
        styles.container,
        className
      )}
    >
      {actions.map((action) => {
        const config = actionConfig[action.type];
        const Icon = action.active && config.activeIcon ? config.activeIcon : config.icon;
        const label = action.label ?? config.label;
        const isAnimating = animatingAction === action.type;

        return (
          <button
            key={action.type}
            onClick={() => handleClick(action)}
            disabled={action.disabled}
            className={cn(
              'flex items-center rounded-full transition-colors duration-200 twitter-focus-ring',
              'text-[#657786]',
              styles.button,
              config.hoverClass,
              action.active && config.activeClass,
              action.disabled && 'opacity-50 cursor-not-allowed',
              isAnimating && action.type === 'bookmark' && 'animate-bookmark-fill',
              isAnimating && action.type === 'acknowledge' && 'animate-heart-pulse'
            )}
            aria-label={label}
          >
            <Icon
              className={cn(
                styles.icon,
                action.active && action.type === 'bookmark' && 'fill-current'
              )}
            />
            {(action.count !== undefined || label) && (
              <span className={cn(styles.text, 'font-normal')}>
                {action.count !== undefined ? action.count : label}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// Preset configurations for different card types
export const alertCardActions: EngagementAction[] = [
  { type: 'viewCases' },
  { type: 'acknowledge' },
  { type: 'bookmark' },
  { type: 'share' },
  { type: 'escalate' },
];

export const trendingCardActions: EngagementAction[] = [
  { type: 'viewCases' },
  { type: 'watch' },
  { type: 'bookmark' },
  { type: 'share' },
];

export const highlightCardActions: EngagementAction[] = [
  { type: 'learnMore' },
  { type: 'bookmark' },
  { type: 'share' },
];

export const uploadCardActions: EngagementAction[] = [
  { type: 'viewBatch' },
  { type: 'bookmark' },
];
