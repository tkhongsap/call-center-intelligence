'use client';

import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

export type AvatarSize = 'sm' | 'md' | 'lg';
export type AvatarVariant = 'icon' | 'user';

const sizeStyles: Record<AvatarSize, string> = {
  sm: 'w-8 h-8 text-sm',   // 32px
  md: 'w-10 h-10 text-base', // 40px
  lg: 'w-12 h-12 text-lg',  // 48px
};

const iconSizeStyles: Record<AvatarSize, string> = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

interface BaseAvatarProps {
  size?: AvatarSize;
  className?: string;
}

interface IconAvatarProps extends BaseAvatarProps {
  variant: 'icon';
  icon: LucideIcon;
  iconClassName?: string;
  bgColor?: string;
}

interface UserAvatarProps extends BaseAvatarProps {
  variant: 'user';
  src?: string | null;
  alt?: string;
  initials?: string;
  bgColor?: string;
}

export type AvatarProps = IconAvatarProps | UserAvatarProps;

export function Avatar(props: AvatarProps) {
  const { size = 'md', className } = props;

  if (props.variant === 'icon') {
    const { icon: Icon, iconClassName, bgColor = 'bg-slate-100' } = props;
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-full flex-shrink-0',
          sizeStyles[size],
          bgColor,
          className
        )}
      >
        <Icon className={cn(iconSizeStyles[size], 'text-slate-600', iconClassName)} />
      </div>
    );
  }

  // User variant
  const { src, alt = '', initials, bgColor = 'bg-[#1DA1F2]' } = props;

  // If we have a valid image source, render the image
  if (src) {
    return (
      <div
        className={cn(
          'rounded-full overflow-hidden flex-shrink-0',
          sizeStyles[size],
          className
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  // Fallback to initials
  const displayInitials = initials || alt?.charAt(0)?.toUpperCase() || '?';

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full flex-shrink-0 text-white font-medium',
        sizeStyles[size],
        bgColor,
        className
      )}
    >
      {displayInitials}
    </div>
  );
}

// Convenience components for common use cases
export function SystemAvatar({
  icon,
  size = 'md',
  bgColor,
  iconClassName,
  className,
}: {
  icon: LucideIcon;
  size?: AvatarSize;
  bgColor?: string;
  iconClassName?: string;
  className?: string;
}) {
  return (
    <Avatar
      variant="icon"
      icon={icon}
      size={size}
      bgColor={bgColor}
      iconClassName={iconClassName}
      className={className}
    />
  );
}

export function UserAvatar({
  src,
  alt,
  initials,
  size = 'md',
  bgColor,
  className,
}: {
  src?: string | null;
  alt?: string;
  initials?: string;
  size?: AvatarSize;
  bgColor?: string;
  className?: string;
}) {
  return (
    <Avatar
      variant="user"
      src={src}
      alt={alt}
      initials={initials}
      size={size}
      bgColor={bgColor}
      className={className}
    />
  );
}
