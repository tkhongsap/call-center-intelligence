'use client';

import { cn } from '@/lib/utils';

type BadgeVariant =
  | 'default'
  | 'urgent'
  | 'needsReview'
  | 'success'
  | 'warning'
  | 'info'
  | 'critical'
  | 'high'
  | 'medium'
  | 'low';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-slate-100 text-slate-700',
  urgent: 'bg-red-100 text-red-700 border border-red-200',
  needsReview: 'bg-amber-100 text-amber-700 border border-amber-200',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-amber-100 text-amber-700',
  info: 'bg-blue-100 text-blue-700',
  critical: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-slate-100 text-slate-600',
};

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: string }) {
  const variant = severity as BadgeVariant;
  const label = severity.charAt(0).toUpperCase() + severity.slice(1);
  return <Badge variant={variant}>{label}</Badge>;
}

export function StatusBadge({ status }: { status: string }) {
  const statusMap: Record<string, { variant: BadgeVariant; label: string }> = {
    open: { variant: 'info', label: 'Open' },
    in_progress: { variant: 'warning', label: 'In Progress' },
    resolved: { variant: 'success', label: 'Resolved' },
    closed: { variant: 'default', label: 'Closed' },
  };
  const { variant, label } = statusMap[status] || { variant: 'default', label: status };
  return <Badge variant={variant}>{label}</Badge>;
}
