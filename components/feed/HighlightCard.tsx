'use client';

import Link from 'next/link';
import { Pin, ArrowRight, TrendingUp, TrendingDown, Star, BarChart3 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { cn, formatRelativeTime } from '@/lib/utils';
import type { FeedItem } from '@/lib/db/schema';

interface HighlightMetadata {
  highlightType?: 'top_themes' | 'hot_bu' | 'resolution_rate' | 'daily_summary';
  themes?: Array<{
    name: string;
    count: number;
    trend?: 'up' | 'down' | 'stable';
  }>;
  hotBu?: {
    name: string;
    reason: string;
    caseCount?: number;
    percentageChange?: number;
  };
  resolutionRate?: {
    current: number;
    previous: number;
    change: number;
  };
  summaryItems?: Array<{
    label: string;
    value: string | number;
    trend?: 'up' | 'down' | 'stable';
  }>;
  drilldownUrl?: string;
}

interface HighlightCardProps {
  item: FeedItem;
  className?: string;
}

function getHighlightStyles(highlightType: string) {
  switch (highlightType) {
    case 'top_themes':
      return {
        border: 'border-l-4 border-l-purple-500',
        headerBg: 'bg-purple-50',
        iconBg: 'bg-purple-100 text-purple-700',
        accentColor: 'text-purple-600',
      };
    case 'hot_bu':
      return {
        border: 'border-l-4 border-l-red-500',
        headerBg: 'bg-red-50',
        iconBg: 'bg-red-100 text-red-700',
        accentColor: 'text-red-600',
      };
    case 'resolution_rate':
      return {
        border: 'border-l-4 border-l-green-500',
        headerBg: 'bg-green-50',
        iconBg: 'bg-green-100 text-green-700',
        accentColor: 'text-green-600',
      };
    case 'daily_summary':
    default:
      return {
        border: 'border-l-4 border-l-blue-500',
        headerBg: 'bg-blue-50',
        iconBg: 'bg-blue-100 text-blue-700',
        accentColor: 'text-blue-600',
      };
  }
}

function TrendIcon({ trend }: { trend?: 'up' | 'down' | 'stable' }) {
  if (trend === 'up') {
    return <TrendingUp className="w-3 h-3 text-red-500" />;
  }
  if (trend === 'down') {
    return <TrendingDown className="w-3 h-3 text-green-500" />;
  }
  return null;
}

export function HighlightCard({ item, className }: HighlightCardProps) {
  const metadata: HighlightMetadata = item.metadata ? JSON.parse(item.metadata) : {};
  const highlightType = metadata.highlightType || 'daily_summary';
  const styles = getHighlightStyles(highlightType);

  // Determine the drilldown URL based on highlight type
  const getDrilldownUrl = () => {
    if (metadata.drilldownUrl) return metadata.drilldownUrl;
    switch (highlightType) {
      case 'top_themes':
        return '/cases';
      case 'hot_bu':
        return metadata.hotBu ? `/cases?businessUnit=${encodeURIComponent(metadata.hotBu.name)}` : '/cases';
      case 'resolution_rate':
        return '/cases?status=resolved';
      default:
        return '/cases';
    }
  };

  return (
    <div className={cn(
      'bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-md transition-shadow',
      styles.border,
      className
    )}>
      {/* Header - Pin icon + "Today's Highlight" */}
      <div className={cn('px-4 py-3 border-b border-slate-200', styles.headerBg)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-lg', styles.iconBg)}>
              <Pin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">{item.title}</h3>
              <Badge variant="info">Today&apos;s Highlight</Badge>
            </div>
          </div>
          <div className="text-xs text-slate-500">
            {formatRelativeTime(item.createdAt)}
          </div>
        </div>
      </div>

      {/* Body - Summary content */}
      <div className="p-4">
        <p className="text-sm text-slate-600 mb-4">{item.content}</p>

        {/* Top 3 themes */}
        {highlightType === 'top_themes' && metadata.themes && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-slate-500 mb-2">Top complaint themes today</div>
            {metadata.themes.slice(0, 3).map((theme, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-slate-50 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold',
                    index === 0 ? 'bg-purple-100 text-purple-700' :
                    index === 1 ? 'bg-purple-50 text-purple-600' :
                    'bg-slate-100 text-slate-600'
                  )}>
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium text-slate-700">{theme.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500">{theme.count} cases</span>
                  <TrendIcon trend={theme.trend} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Hot BU */}
        {highlightType === 'hot_bu' && metadata.hotBu && (
          <div className="p-3 bg-red-50 rounded-lg border border-red-100">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 text-red-500" />
              <span className="text-sm font-semibold text-red-700">
                Hot BU: {metadata.hotBu.name}
              </span>
              {metadata.hotBu.percentageChange !== undefined && (
                <span className="text-xs text-red-600 font-medium">
                  +{metadata.hotBu.percentageChange}%
                </span>
              )}
            </div>
            <p className="text-sm text-slate-600">{metadata.hotBu.reason}</p>
            {metadata.hotBu.caseCount !== undefined && (
              <div className="mt-2 text-xs text-slate-500">
                {metadata.hotBu.caseCount} cases today
              </div>
            )}
          </div>
        )}

        {/* Resolution rate */}
        {highlightType === 'resolution_rate' && metadata.resolutionRate && (
          <div className="p-3 bg-green-50 rounded-lg border border-green-100">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-green-500" />
              <span className="text-sm font-semibold text-green-700">
                Resolution Rate Improved
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {metadata.resolutionRate.current}%
                </div>
                <div className="text-xs text-slate-500">Current</div>
              </div>
              <div className="text-slate-400">→</div>
              <div>
                <div className="text-lg text-slate-400 line-through">
                  {metadata.resolutionRate.previous}%
                </div>
                <div className="text-xs text-slate-500">Previous</div>
              </div>
              <div className="ml-auto">
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                  <TrendingUp className="w-3 h-3" />
                  +{metadata.resolutionRate.change}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Daily summary items */}
        {highlightType === 'daily_summary' && metadata.summaryItems && (
          <div className="grid grid-cols-2 gap-3">
            {metadata.summaryItems.map((summaryItem, index) => (
              <div
                key={index}
                className="p-3 bg-slate-50 rounded-lg"
              >
                <div className="text-xs text-slate-500 mb-1">{summaryItem.label}</div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-slate-900">
                    {summaryItem.value}
                  </span>
                  <TrendIcon trend={summaryItem.trend} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer - Learn more button */}
      <div className="px-4 py-3 bg-slate-50 border-t border-slate-200">
        <Link
          href={getDrilldownUrl()}
          className={cn(
            'text-sm font-medium flex items-center gap-1 hover:underline',
            styles.accentColor
          )}
        >
          Learn more
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
