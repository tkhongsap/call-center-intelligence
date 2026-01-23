'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Flame, TrendingUp, TrendingDown, Minus, MessageSquare } from 'lucide-react';
import { TwitterCard } from './TwitterCard';
import { EngagementAction, EngagementActionType } from './EngagementBar';
import { ShareModal } from '@/components/ui/ShareModal';
import { cn } from '@/lib/utils';
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
      return <TrendingUp className={cn(iconClasses, 'text-[var(--severity-critical-text)]')} />;
    case 'declining':
      return <TrendingDown className={cn(iconClasses, 'text-[var(--twitter-retweet)]')} />;
    case 'stable':
    default:
      return <Minus className={cn(iconClasses, 'text-secondary')} />;
  }
}

function getTrendTextColor(trend: string) {
  switch (trend) {
    case 'rising':
      return 'text-[var(--severity-critical-text)]';
    case 'declining':
      return 'text-[var(--twitter-retweet)]';
    case 'stable':
    default:
      return 'text-secondary';
  }
}

export function TrendingCard({ item, onShare, className }: TrendingCardProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('feed');
  const tShare = useTranslations('share');
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const metadata: TrendingMetadata = item.metadata ? JSON.parse(item.metadata) : {};
  const trend = metadata.trend || 'stable';
  const topicId = metadata.topicId || item.referenceId || item.id;
  const topPhrases = metadata.topPhrases || [];
  const caseCount = metadata.caseCount || 0;
  const percentageChange = metadata.percentageChange;

  const handleShare = async (recipientId: string, message: string) => {
    if (onShare) {
      await onShare(topicId, recipientId, message, 'share');
    }
  };

  // Build the topic query param for navigation
  const topicQuery = encodeURIComponent(metadata.topic || item.title);

  const handleAction = (actionType: EngagementActionType) => {
    switch (actionType) {
      case 'viewCases':
        router.push(`/${locale}/cases?topic=${topicQuery}`);
        break;
      case 'share':
        setShareModalOpen(true);
        break;
      case 'watch':
        // TODO: Implement watch functionality
        console.log('Watch topic:', topicId);
        break;
      case 'bookmark':
        // TODO: Implement bookmark functionality
        console.log('Bookmark topic:', topicId);
        break;
    }
  };

  const actions: EngagementAction[] = [
    { type: 'viewCases' },
    { type: 'watch' },
    { type: 'bookmark' },
    { type: 'share' },
  ];

  // Build subtitle: "{caseCount} cases · Trending"
  const authorSubtitle = `${caseCount} ${t('trendingCard.cases')} · ${t('trendingCard.trending')}`;

  return (
    <>
      <TwitterCard
        authorName={item.title}
        authorSubtitle={authorSubtitle}
        timestamp={item.createdAt}
        avatarIcon={Flame}
        avatarBgColor="bg-orange-100"
        avatarIconClassName="text-orange-600"
        actions={actions}
        onAction={handleAction}
        className={className}
      >
        {/* Trend indicator with percentage change */}
        <div className="flex items-center gap-2 mb-2">
          <TrendDirectionIcon trend={trend} />
          {percentageChange !== undefined && (
            <span className={cn('text-sm font-medium', getTrendTextColor(trend))}>
              {percentageChange > 0 ? '+' : ''}{percentageChange.toFixed(0)}% {t('fromBaseline')}
            </span>
          )}
          {metadata.businessUnit && (
            <span className="text-sm text-secondary">· {metadata.businessUnit}</span>
          )}
        </div>

        {/* Description */}
        <p className="text-primary">{item.content}</p>

        {/* Hashtag-style pills for top phrases */}
        {topPhrases.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {topPhrases.slice(0, 5).map((phrase, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[var(--twitter-blue-light)] text-[var(--twitter-blue)] hover:bg-[var(--twitter-blue)]/20 transition-colors cursor-pointer"
              >
                #{phrase.replace(/\s+/g, '')}
              </span>
            ))}
          </div>
        )}

        {/* Sample case as "quoted tweet" nested card */}
        {metadata.sampleCase && (
          <div className="mt-3 p-3 rounded-xl border border-default hover:bg-surface-secondary transition-colors cursor-pointer">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-secondary" />
              <span className="text-sm font-bold text-primary">{t('trendingCard.sampleCase')}</span>
              {metadata.sampleCase.caseNumber && (
                <span className="text-sm text-secondary">#{metadata.sampleCase.caseNumber}</span>
              )}
            </div>
            <p className="text-sm text-primary mt-1 line-clamp-2">
              {metadata.sampleCase.summary}
            </p>
          </div>
        )}
      </TwitterCard>

      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        onShare={handleShare}
        title={`${tShare('title')} ${t('trendingCard.trending')}`}
        type="share"
      />
    </>
  );
}
