'use client';

import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface KPITileProps {
  title: string;
  value: string | number;
  change?: number; // percentage change
  changeLabel?: string; // e.g., "vs yesterday"
  icon: LucideIcon;
  status?: 'green' | 'yellow' | 'red' | 'neutral';
}

export function KPITile({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  status = 'neutral',
}: KPITileProps) {
  const statusColors = {
    green: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      valueColor: 'text-green-700',
    },
    yellow: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      valueColor: 'text-amber-700',
    },
    red: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      valueColor: 'text-red-700',
    },
    neutral: {
      bg: 'bg-white',
      border: 'border-slate-200',
      iconBg: 'bg-slate-100',
      iconColor: 'text-slate-600',
      valueColor: 'text-slate-900',
    },
  };

  const colors = statusColors[status];

  const getTrendIcon = () => {
    if (change === undefined || change === null) return null;
    if (change > 0) return <TrendingUp className="w-3 h-3" />;
    if (change < 0) return <TrendingDown className="w-3 h-3" />;
    return <Minus className="w-3 h-3" />;
  };

  const getTrendColor = () => {
    if (change === undefined || change === null) return 'text-slate-500';
    // For metrics where up is good (like resolution rate)
    // The parent component can control this via status prop
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-slate-500';
  };

  return (
    <div
      className={`rounded-xl border p-4 ${colors.bg} ${colors.border} transition-all hover:shadow-sm`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            {title}
          </p>
          <p className={`text-2xl font-bold mt-1 ${colors.valueColor}`}>
            {value}
          </p>
          {(change !== undefined || changeLabel) && (
            <div className={`flex items-center gap-1 mt-1 text-xs ${getTrendColor()}`}>
              {getTrendIcon()}
              <span>
                {change !== undefined && `${change > 0 ? '+' : ''}${change}%`}
                {changeLabel && ` ${changeLabel}`}
              </span>
            </div>
          )}
        </div>
        <div
          className={`w-10 h-10 rounded-lg ${colors.iconBg} flex items-center justify-center flex-shrink-0`}
        >
          <Icon className={`w-5 h-5 ${colors.iconColor}`} />
        </div>
      </div>
    </div>
  );
}
