'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Flame, TrendingUp, TrendingDown, Minus, Eye, Share2, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { ShareModal } from '@/components/ui/ShareModal';
import { cn, formatRelativeTime } from '@/lib/utils';
import type { FeedItem } from '@/lib/db/schema';

interface TrendingMetadata {
  topicId?: string;
  topic?: string;
  trend?: 'rising' | 'stable' | 'declining';
  caseCount?: number;
  percentageChange?: number;
  topPhrases?: string[];
  sampleCase?: {
    id: string;
    summary: string;
    caseNumber?: string;
  };
  businessUnit?: string;
  category?: string;
}

interface TrendingCardProps {
  item: FeedItem;
  onShare?: (topicId: string, recipientId: string, message: string, type: 'share' | 'escalation') => Promise<void>;
  className?: string;
}

function TrendDirectionIcon({ trend }: { trend: string }) {
  const iconClasses = 'w-4 h-4';
  switch (trend) {
    case 'rising':
      return <TrendingUp className={cn(iconClasses, 'text-red-500')} />;
    case 'declining':
      return <TrendingDown className={cn(iconClasses, 'text-green-500')} />;
    case 'stable':
    default:
      return <Minus className={cn(iconClasses, 'text-slate-400')} />;
  }
}

function getTrendStyles(trend: string) {
  switch (trend) {
    case 'rising':
      return {
        border: 'border-l-4 border-l-orange-500',
        headerBg: 'bg-orange-50',
        iconBg: 'bg-orange-100 text-orange-700',
        trendText: 'text-red-600',
        trendBg: 'bg-red-50',
      };
    case 'declining':
      return {
        border: 'border-l-4 border-l-green-500',
        headerBg: 'bg-green-50',
        iconBg: 'bg-green-100 text-green-700',
        trendText: 'text-green-600',
        trendBg: 'bg-green-50',
      };
    case 'stable':
    default:
      return {
        border: 'border-l-4 border-l-slate-400',
        headerBg: 'bg-slate-50',
        iconBg: 'bg-slate-100 text-slate-700',
        trendText: 'text-slate-600',
        trendBg: 'bg-slate-50',
      };
  }
}

export function TrendingCard({ item, onShare, className }: TrendingCardProps) {
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const metadata: TrendingMetadata = item.metadata ? JSON.parse(item.metadata) : {};
  const trend = metadata.trend || 'stable';
  const topicId = metadata.topicId || item.referenceId || item.id;
  const topPhrases = metadata.topPhrases || [];
  const caseCount = metadata.caseCount || 0;
  const percentageChange = metadata.percentageChange;

  const styles = getTrendStyles(trend);

  const handleOpenShare = () => {
    setShareModalOpen(true);
  };

  const handleShare = async (recipientId: string, message: string) => {
    if (onShare) {
      await onShare(topicId, recipientId, message, 'share');
    }
  };

  // Build the topic query param for navigation
  const topicQuery = encodeURIComponent(metadata.topic || item.title);

  return (
    <>
      <div className={cn(
        'bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-md transition-shadow',
        styles.border,
        className
      )}>
        {/* Header - Fire icon + "Trending" */}
        <div className={cn('px-4 py-3 border-b border-slate-200', styles.headerBg)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Fire icon */}
              <div className={cn('p-2 rounded-lg', styles.iconBg)}>
                <Flame className="w-5 h-5" />
              </div>
              <div>
                {/* Title with trend direction arrow */}
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-900">{item.title}</h3>
                  <TrendDirectionIcon trend={trend} />
                  {percentageChange !== undefined && (
                    <span className={cn('text-sm font-medium', styles.trendText)}>
                      {percentageChange > 0 ? '+' : ''}{percentageChange.toFixed(0)}%
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="warning">Trending</Badge>
                  {metadata.businessUnit && (
                    <Badge variant="default">{metadata.businessUnit}</Badge>
                  )}
                  {metadata.category && (
                    <Badge variant="default">{metadata.category}</Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500">{formatRelativeTime(item.createdAt)}</div>
              <div className="flex items-center gap-1 text-xs text-slate-400 mt-1 justify-end">
                <MessageSquare className="w-3 h-3" />
                {caseCount} cases
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-4">
          <p className="text-sm text-slate-600">{item.content}</p>

          {/* Top 3 phrases */}
          {topPhrases.length > 0 && (
            <div className="mt-3">
              <div className="text-xs font-medium text-slate-500 mb-2">Top phrases</div>
              <div className="flex flex-wrap gap-2">
                {topPhrases.slice(0, 3).map((phrase, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700"
                  >
                    {phrase}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Sample case preview */}
          {metadata.sampleCase && (
            <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-slate-500">Sample case</span>
                {metadata.sampleCase.caseNumber && (
                  <span className="text-xs text-slate-400">#{metadata.sampleCase.caseNumber}</span>
                )}
              </div>
              <p className="text-sm text-slate-600 line-clamp-2">
                {metadata.sampleCase.summary}
              </p>
            </div>
          )}
        </div>

        {/* Footer - Action buttons */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <Link
            href={`/cases?topic=${topicQuery}`}
            className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <Eye className="w-4 h-4" />
            View cases
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenShare}
              className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
          </div>
        </div>
      </div>

      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        onShare={handleShare}
        title="Share Trending Topic"
        type="share"
      />
    </>
  );
}
