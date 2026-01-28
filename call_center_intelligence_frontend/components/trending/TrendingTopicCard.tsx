'use client';

import Link from 'next/link';
import { TrendingUp, TrendingDown, Minus, Eye, BarChart3, Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import type { TrendingTopicData } from '@/lib/trending';

interface TrendingTopicCardProps {
  topic: TrendingTopicData;
  rank: number;
  className?: string;
}

function TrendDirectionIcon({ direction }: { direction: string }) {
  const iconClasses = 'w-4 h-4';
  switch (direction) {
    case 'rising':
      return <TrendingUp className={cn(iconClasses, 'text-red-500')} />;
    case 'declining':
      return <TrendingDown className={cn(iconClasses, 'text-green-500')} />;
    case 'stable':
    default:
      return <Minus className={cn(iconClasses, 'text-slate-400')} />;
  }
}

function getTrendStyles(direction: string) {
  switch (direction) {
    case 'rising':
      return {
        border: 'border-l-4 border-l-orange-500',
        headerBg: 'bg-orange-50',
        percentText: 'text-red-600',
        scoreText: 'text-orange-600',
      };
    case 'declining':
      return {
        border: 'border-l-4 border-l-green-500',
        headerBg: 'bg-green-50',
        percentText: 'text-green-600',
        scoreText: 'text-green-600',
      };
    case 'stable':
    default:
      return {
        border: 'border-l-4 border-l-slate-400',
        headerBg: 'bg-slate-50',
        percentText: 'text-slate-600',
        scoreText: 'text-slate-600',
      };
  }
}

export function TrendingTopicCard({ topic, rank, className }: TrendingTopicCardProps) {
  const styles = getTrendStyles(topic.direction);
  const topicQuery = encodeURIComponent(topic.term);

  return (
    <div
      className={cn(
        'bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-md transition-shadow',
        styles.border,
        className
      )}
    >
      {/* Header */}
      <div className={cn('px-4 py-3 border-b border-slate-200', styles.headerBg)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Rank Badge */}
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-700 text-white text-sm font-bold">
              #{rank}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-900 capitalize">{topic.term}</h3>
                <TrendDirectionIcon direction={topic.direction} />
                <span className={cn('text-sm font-medium', styles.percentText)}>
                  {topic.percentChange > 0 ? '+' : ''}{topic.percentChange.toFixed(0)}%
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="warning">Trending</Badge>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className={cn('text-lg font-bold', styles.scoreText)}>
              {topic.trendScore.toFixed(0)}
            </div>
            <div className="text-xs text-slate-500">Trend Score</div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        {/* Stats Row */}
        <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
          <div className="flex-1 text-center">
            <div className="text-xs text-slate-500 mb-1">Baseline</div>
            <div className="text-lg font-semibold text-slate-700">{topic.baselineCount}</div>
          </div>
          <div className="flex items-center">
            <BarChart3 className={cn('w-5 h-5', topic.percentChange > 0 ? 'text-red-500' : 'text-green-500')} />
          </div>
          <div className="flex-1 text-center">
            <div className="text-xs text-slate-500 mb-1">Current</div>
            <div className="text-lg font-semibold text-slate-700">{topic.currentCount}</div>
          </div>
          <div className="flex-1 text-center">
            <div className="text-xs text-slate-500 mb-1">Change</div>
            <div className={cn('text-lg font-semibold', styles.percentText)}>
              {topic.percentChange > 0 ? '+' : ''}{topic.percentChange.toFixed(0)}%
            </div>
          </div>
        </div>

        {/* Impacted BUs */}
        {topic.impactedBUs.length > 0 && (
          <div className="mt-3">
            <div className="flex items-center gap-1 text-xs font-medium text-slate-500 mb-2">
              <Building2 className="w-3 h-3" />
              Impacted Business Units
            </div>
            <div className="flex flex-wrap gap-2">
              {topic.impactedBUs.map((bu) => (
                <Badge key={bu} variant="default">{bu}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Sample Cases */}
        {topic.sampleCases.length > 0 && (
          <div className="mt-3">
            <div className="text-xs font-medium text-slate-500 mb-2">Example Cases</div>
            <div className="space-y-2">
              {topic.sampleCases.slice(0, 3).map((caseItem) => (
                <div
                  key={caseItem.id}
                  className="p-2 bg-slate-50 rounded border border-slate-100"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-400">{caseItem.businessUnit}</span>
                    <Badge variant="default">{caseItem.category}</Badge>
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-2">{caseItem.summary}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
        <Link
          href={`/cases?topic=${topicQuery}`}
          className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          <Eye className="w-4 h-4" />
          View all {topic.currentCount} cases
        </Link>
      </div>
    </div>
  );
}
