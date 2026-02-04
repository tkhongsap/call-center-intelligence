'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { FileText } from 'lucide-react';
import { TwitterCard } from './TwitterCard';
import { highlightCardActions, EngagementActionType } from './EngagementBar';
import type { FeedItem } from '@/lib/types';

interface IncidentMetadata {
  incident_number?: string;
  issue_type?: string;
  product_group?: string;
  subject?: string;
  status?: string;
  receiver?: string;
  customer_name?: string;
}

interface IncidentCardProps {
  item: FeedItem;
  className?: string;
}

const MAX_CONTENT_LENGTH = 280; // Twitter-style character limit

export function IncidentCard({ item, className }: IncidentCardProps) {
  const router = useRouter();
  const locale = useLocale();
  const [isExpanded, setIsExpanded] = useState(false);
  
  const metadata: IncidentMetadata = item.metadata
    ? (typeof item.metadata === 'string' ? JSON.parse(item.metadata) : item.metadata)
    : {};

  const handleAction = (type: EngagementActionType) => {
    switch (type) {
      case 'learnMore':
        // Navigate to incident detail page if available
        router.push(`/${locale}/cases`);
        break;
      case 'bookmark':
        // Bookmark functionality
        break;
      case 'share':
        // Share functionality
        break;
    }
  };

  // Check if content needs truncation
  const content = item.content || '';
  const needsTruncation = content.length > MAX_CONTENT_LENGTH;
  const displayContent = needsTruncation && !isExpanded 
    ? content.substring(0, MAX_CONTENT_LENGTH) + '...'
    : content;

  return (
    <TwitterCard
      authorName={metadata.customer_name || 'Unknown Customer'}
      authorSubtitle={`Incident #${metadata.incident_number || item.id}`}
      timestamp={item.created_at}
      avatarIcon={FileText}
      avatarIconClassName="text-blue-600"
      avatarBgColor="bg-blue-100"
      actions={highlightCardActions}
      onAction={handleAction}
      className={className}
    >
      {/* Subject/Title */}
      <div className="mb-2">
        <h3 className="text-base font-semibold text-primary">
          {metadata.subject || item.title}
        </h3>
      </div>

      {/* Details from API */}
      {content && content !== 'No details available' && (
        <div>
          <div className="text-sm text-primary leading-relaxed">
            {displayContent}
          </div>
          
          {/* Show More/Less Button */}
          {needsTruncation && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="mt-2 text-[#1DA1F2] hover:underline text-sm font-medium transition-colors"
            >
              {isExpanded ? 'แสดงน้อยลง' : 'แสดงเพิ่มเติม'}
            </button>
          )}
        </div>
      )}
    </TwitterCard>
  );
}
