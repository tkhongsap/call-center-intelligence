'use client';

import { useRouter } from 'next/navigation';
import { Pin, TrendingUp, TrendingDown, Star, BarChart3, Lightbulb } from 'lucide-react';
import { TwitterCard } from './TwitterCard';
import { highlightCardActions, EngagementActionType } from './EngagementBar';
import { cn } from '@/lib/utils';
import type { FeedItem } from '@/lib/db/schema';
import type { LucideIcon } from 'lucide-react';

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

function getHighlightConfig(highlightType: string): {
  icon: LucideIcon;
  iconClassName: string;
  bgColor: string;
  authorName: string;
} {
  switch (highlightType) {
    case 'top_themes':
      return {
        icon: Lightbulb,
        iconClassName: 'text-purple-600',
        bgColor: 'bg-purple-100',
        authorName: 'Top Themes',
      };
    case 'hot_bu':
      return {
        icon: Star,
        iconClassName: 'text-red-600',
        bgColor: 'bg-red-100',
        authorName: 'Hot Business Unit',
      };
    case 'resolution_rate':
      return {
        icon: BarChart3,
        iconClassName: 'text-green-600',
        bgColor: 'bg-green-100',
        authorName: 'Performance Update',
      };
    case 'daily_summary':
    default:
      return {
        icon: Pin,
        iconClassName: 'text-blue-600',
        bgColor: 'bg-blue-100',
        authorName: 'Daily Digest',
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
  const router = useRouter();
  const metadata: HighlightMetadata = item.metadata ? JSON.parse(item.metadata) : {};
  const highlightType = metadata.highlightType || 'daily_summary';
  const config = getHighlightConfig(highlightType);

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

  const handleAction = (type: EngagementActionType) => {
    switch (type) {
      case 'learnMore':
        router.push(getDrilldownUrl());
        break;
      case 'bookmark':
        // Bookmark functionality handled by parent or state
        break;
      case 'share':
        // Share functionality handled by parent
        break;
    }
  };

  return (
    <TwitterCard
      authorName={config.authorName}
      authorSubtitle={`@insights · ${item.title}`}
      timestamp={item.createdAt}
      avatarIcon={config.icon}
      avatarIconClassName={config.iconClassName}
      avatarBgColor={config.bgColor}
      actions={highlightCardActions}
      onAction={handleAction}
      className={className}
    >
      {/* Description */}
      <p className="text-sm text-[#14171A] mb-3">{item.content}</p>

      {/* Top 3 themes - Compact inline display */}
      {highlightType === 'top_themes' && metadata.themes && (
        <div className="space-y-1.5">
          {metadata.themes.slice(0, 3).map((theme, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-1.5 px-2 bg-[#F5F8FA] rounded-lg"
            >
              <div className="flex items-center gap-2">
                <span className={cn(
                  'w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold',
                  index === 0 ? 'bg-purple-200 text-purple-700' :
                  index === 1 ? 'bg-purple-100 text-purple-600' :
                  'bg-[#E1E8ED] text-[#657786]'
                )}>
                  {index + 1}
                </span>
                <span className="text-sm font-medium text-[#14171A]">{theme.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#657786]">{theme.count} cases</span>
                <TrendIcon trend={theme.trend} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Hot BU - Compact card style */}
      {highlightType === 'hot_bu' && metadata.hotBu && (
        <div className="p-3 bg-[#F5F8FA] rounded-xl border border-[#E1E8ED]">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-bold text-[#14171A]">
              {metadata.hotBu.name}
            </span>
            {metadata.hotBu.percentageChange !== undefined && (
              <span className="text-xs font-medium text-red-500 bg-red-50 px-1.5 py-0.5 rounded">
                +{metadata.hotBu.percentageChange}%
              </span>
            )}
          </div>
          <p className="text-sm text-[#657786]">{metadata.hotBu.reason}</p>
          {metadata.hotBu.caseCount !== undefined && (
            <div className="mt-1.5 text-xs text-[#657786]">
              {metadata.hotBu.caseCount} cases today
            </div>
          )}
        </div>
      )}

      {/* Resolution rate - Inline metrics */}
      {highlightType === 'resolution_rate' && metadata.resolutionRate && (
        <div className="flex items-center gap-4 p-3 bg-[#F5F8FA] rounded-xl border border-[#E1E8ED]">
          <div className="flex-1">
            <div className="text-2xl font-bold text-green-600">
              {metadata.resolutionRate.current}%
            </div>
            <div className="text-xs text-[#657786]">Current rate</div>
          </div>
          <div className="text-[#AAB8C2]">→</div>
          <div>
            <div className="text-lg text-[#AAB8C2] line-through">
              {metadata.resolutionRate.previous}%
            </div>
            <div className="text-xs text-[#657786]">Previous</div>
          </div>
          <div className="ml-auto">
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
              <TrendingUp className="w-3 h-3" />
              +{metadata.resolutionRate.change}%
            </span>
          </div>
        </div>
      )}

      {/* Daily summary items - Grid layout */}
      {highlightType === 'daily_summary' && metadata.summaryItems && (
        <div className="grid grid-cols-2 gap-2">
          {metadata.summaryItems.map((summaryItem, index) => (
            <div
              key={index}
              className="p-2.5 bg-[#F5F8FA] rounded-lg"
            >
              <div className="text-xs text-[#657786] mb-0.5">{summaryItem.label}</div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-semibold text-[#14171A]">
                  {summaryItem.value}
                </span>
                <TrendIcon trend={summaryItem.trend} />
              </div>
            </div>
          ))}
        </div>
      )}
    </TwitterCard>
  );
}
