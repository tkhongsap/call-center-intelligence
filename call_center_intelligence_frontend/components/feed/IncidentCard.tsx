'use client';

import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { FileText } from 'lucide-react';
import { TwitterCard } from './TwitterCard';
import { highlightCardActions, EngagementActionType } from './EngagementBar';
import { cn } from '@/lib/utils';
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

// Status color mapping
function getStatusColor(status: string): { bg: string; text: string; border: string } {
  const statusLower = status.toLowerCase();
  
  // Critical/Urgent - Red
  if (statusLower.includes('urgent') || statusLower.includes('critical') || statusLower.includes('ด่วน')) {
    return {
      bg: 'bg-red-50 dark:bg-red-950/20',
      text: 'text-red-700 dark:text-red-400',
      border: 'border-red-200 dark:border-red-800'
    };
  }
  
  // Open/Pending - Yellow/Orange
  if (statusLower.includes('open') || statusLower.includes('pending') || 
      statusLower.includes('เปิด') || statusLower.includes('รอ')) {
    return {
      bg: 'bg-yellow-50 dark:bg-yellow-950/20',
      text: 'text-yellow-700 dark:text-yellow-400',
      border: 'border-yellow-200 dark:border-yellow-800'
    };
  }
  
  // In Progress - Blue
  if (statusLower.includes('progress') || statusLower.includes('กำลังดำเนินการ')) {
    return {
      bg: 'bg-blue-50 dark:bg-blue-950/20',
      text: 'text-blue-700 dark:text-blue-400',
      border: 'border-blue-200 dark:border-blue-800'
    };
  }
  
  // Closed/Resolved - Green
  if (statusLower.includes('closed') || statusLower.includes('resolved') || 
      statusLower.includes('ปิด') || statusLower.includes('เสร็จสิ้น')) {
    return {
      bg: 'bg-green-50 dark:bg-green-950/20',
      text: 'text-green-700 dark:text-green-400',
      border: 'border-green-200 dark:border-green-800'
    };
  }
  
  // Default - Gray
  return {
    bg: 'bg-gray-50 dark:bg-gray-950/20',
    text: 'text-gray-700 dark:text-gray-400',
    border: 'border-gray-200 dark:border-gray-800'
  };
}

export function IncidentCard({ item, className }: IncidentCardProps) {
  const router = useRouter();
  const locale = useLocale();
  
  const metadata: IncidentMetadata = item.metadata
    ? (typeof item.metadata === 'string' ? JSON.parse(item.metadata) : item.metadata)
    : {};

  const statusColors = getStatusColor(metadata.status || '');

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
      {/* Subject */}
      <div className="mb-3">
        <h3 className="text-base font-semibold text-primary">
          {metadata.subject || item.title}
        </h3>
      </div>

      {/* Incident Details Grid */}
      <div className="space-y-2">
        {/* Row 1: Incident Number & Issue Type */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col">
            <span className="text-xs text-secondary mb-0.5">Incident Number</span>
            <span className="text-sm font-medium text-primary">
              #{metadata.incident_number || item.id}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-secondary mb-0.5">Issue Type</span>
            <span className="text-sm font-medium text-primary truncate">
              {metadata.issue_type || 'N/A'}
            </span>
          </div>
        </div>

        {/* Row 2: Product Group & Receiver */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col">
            <span className="text-xs text-secondary mb-0.5">Product Group</span>
            <span className="text-sm font-medium text-primary truncate">
              {metadata.product_group || 'N/A'}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-secondary mb-0.5">Receiver</span>
            <span className="text-sm font-medium text-primary truncate">
              {metadata.receiver || 'N/A'}
            </span>
          </div>
        </div>

        {/* Row 3: Status (Full Width with Color) */}
        <div className="flex flex-col">
          <span className="text-xs text-secondary mb-1">Status</span>
          <div className={cn(
            'inline-flex items-center px-3 py-1.5 rounded-lg border font-medium text-sm',
            statusColors.bg,
            statusColors.text,
            statusColors.border
          )}>
            <span className={cn('w-2 h-2 rounded-full mr-2', statusColors.text.replace('text-', 'bg-'))} />
            {metadata.status || 'Unknown'}
          </div>
        </div>
      </div>
    </TwitterCard>
  );
}
