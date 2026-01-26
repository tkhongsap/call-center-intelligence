'use client';

import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { Avatar, AvatarSize } from '@/components/ui/Avatar';
import { EngagementBar, EngagementAction, EngagementActionType } from './EngagementBar';
import { cn, formatRelativeTime } from '@/lib/utils';

export interface TwitterCardProps {
  // Header props
  authorName: string;
  authorHandle?: string;
  authorSubtitle?: string;
  timestamp?: Date | string;

  // Avatar props - either icon or user avatar
  avatarIcon?: LucideIcon;
  avatarIconClassName?: string;
  avatarBgColor?: string;
  avatarSrc?: string | null;
  avatarSize?: AvatarSize;

  // Content
  children: ReactNode;

  // Engagement actions
  actions?: EngagementAction[];
  onAction?: (type: EngagementActionType) => void;

  // Styling
  className?: string;
  contentClassName?: string;
  hideEngagement?: boolean;

  // Click handler for the whole card
  onClick?: () => void;
}

export function TwitterCard({
  authorName,
  authorHandle,
  authorSubtitle,
  timestamp,
  avatarIcon,
  avatarIconClassName,
  avatarBgColor,
  avatarSrc,
  avatarSize = 'md',
  children,
  actions = [],
  onAction,
  className,
  contentClassName,
  hideEngagement = false,
  onClick,
}: TwitterCardProps) {
  const formattedTime = timestamp
    ? typeof timestamp === 'string'
      ? formatRelativeTime(timestamp)
      : formatRelativeTime(timestamp.toISOString())
    : null;

  // Determine if we show handle or subtitle
  const secondaryLine = authorHandle || authorSubtitle;

  return (
    <article
      className={cn(
        'border-b border-default bg-card',
        'twitter-card-hover cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      <div className="flex gap-3 px-4 py-3">
        {/* Avatar */}
        {avatarIcon ? (
          <Avatar
            variant="icon"
            icon={avatarIcon}
            size={avatarSize}
            bgColor={avatarBgColor}
            iconClassName={avatarIconClassName}
          />
        ) : (
          <Avatar
            variant="user"
            src={avatarSrc}
            alt={authorName}
            initials={authorName.charAt(0)}
            size={avatarSize}
            bgColor={avatarBgColor}
          />
        )}

        {/* Content area */}
        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col min-w-0">
              {/* Author name and timestamp on same line */}
              <div className="flex items-center gap-1 flex-wrap">
                <span className="font-bold text-primary truncate">
                  {authorName}
                </span>
                {formattedTime && (
                  <>
                    <span className="text-secondary">·</span>
                    <span className="text-secondary text-sm whitespace-nowrap">
                      {formattedTime}
                    </span>
                  </>
                )}
              </div>

              {/* Handle or subtitle */}
              {secondaryLine && (
                <span className="text-secondary text-sm truncate">
                  {authorHandle ? `@${authorHandle}` : authorSubtitle}
                </span>
              )}
            </div>
          </div>

          {/* Main content */}
          <div className={cn('mt-1 text-primary', contentClassName)}>
            {children}
          </div>

          {/* Engagement bar */}
          {!hideEngagement && actions.length > 0 && (
            <div className="mt-3 -ml-2">
              <EngagementBar
                actions={actions}
                onAction={onAction}
                size="sm"
              />
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

// Convenience wrapper for system/alert cards
export interface SystemTwitterCardProps extends Omit<TwitterCardProps, 'avatarIcon' | 'avatarSrc'> {
  icon: LucideIcon;
  iconClassName?: string;
  iconBgColor?: string;
}

export function SystemTwitterCard({
  icon,
  iconClassName,
  iconBgColor,
  ...props
}: SystemTwitterCardProps) {
  return (
    <TwitterCard
      {...props}
      avatarIcon={icon}
      avatarIconClassName={iconClassName}
      avatarBgColor={iconBgColor}
    />
  );
}

// Convenience wrapper for user cards
export interface UserTwitterCardProps extends Omit<TwitterCardProps, 'avatarIcon'> {
  userAvatar?: string | null;
  userName: string;
  userHandle?: string;
}

export function UserTwitterCard({
  userAvatar,
  userName,
  userHandle,
  ...props
}: UserTwitterCardProps) {
  return (
    <TwitterCard
      {...props}
      authorName={userName}
      authorHandle={userHandle}
      avatarSrc={userAvatar}
    />
  );
}
