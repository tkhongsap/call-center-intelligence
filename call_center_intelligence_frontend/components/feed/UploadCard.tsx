'use client';

import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Upload, FileCheck, AlertCircle } from 'lucide-react';
import { TwitterCard } from './TwitterCard';
import { EngagementAction, EngagementActionType } from './EngagementBar';
import { cn } from '@/lib/utils';
import type { FeedItem } from '@/lib/types';

interface UploadMetadata {
  batchId?: string;
  caseCount?: number;
  fileName?: string;
  fileSize?: string;
  uploadedBy?: string;
  status?: 'completed' | 'processing' | 'failed';
  errorCount?: number;
  businessUnit?: string;
  channel?: string;
}

interface UploadCardProps {
  item: FeedItem;
  className?: string;
}

function getStatusConfig(status: string, t: (key: string) => string) {
  switch (status) {
    case 'completed':
      return {
        iconBg: 'bg-green-100',
        iconColor: 'text-green-600',
        badgeBg: 'bg-green-50 text-green-700 border border-green-200',
        label: t('uploadCard.completed'),
      };
    case 'processing':
      return {
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
        badgeBg: 'bg-blue-50 text-blue-700 border border-blue-200',
        label: t('uploadCard.processing'),
      };
    case 'failed':
      return {
        iconBg: 'bg-red-100',
        iconColor: 'text-red-600',
        badgeBg: 'bg-red-50 text-red-700 border border-red-200',
        label: t('uploadCard.failed'),
      };
    default:
      return {
        iconBg: 'bg-slate-100',
        iconColor: 'text-slate-600',
        badgeBg: 'bg-slate-50 text-slate-600 border border-slate-200',
        label: t('uploadCard.unknown'),
      };
  }
}

export function UploadCard({ item, className }: UploadCardProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('feed');
  const metadata: UploadMetadata = item.metadata
    ? (typeof item.metadata === 'string' ? JSON.parse(item.metadata) : item.metadata)
    : {};
  const status = metadata.status || 'completed';
  const statusConfig = getStatusConfig(status, t);
  const caseCount = metadata.caseCount || 0;
  const batchId = metadata.batchId || item.referenceId || item.id;
  const uploaderName = metadata.uploadedBy || 'System';

  const handleAction = (actionType: EngagementActionType) => {
    switch (actionType) {
      case 'viewBatch':
        const viewCasesUrl = batchId
          ? `/${locale}/cases?uploadBatch=${encodeURIComponent(batchId)}`
          : `/${locale}/cases`;
        router.push(viewCasesUrl);
        break;
      case 'bookmark':
        // TODO: Implement bookmark functionality
        console.log('Bookmark upload:', batchId);
        break;
    }
  };

  const actions: EngagementAction[] = [
    { type: 'viewBatch' },
    { type: 'bookmark' },
  ];

  // Build subtitle with business unit and channel
  const subtitleParts = ['@uploads'];
  if (metadata.businessUnit) {
    subtitleParts.push(metadata.businessUnit);
  }
  if (metadata.channel) {
    subtitleParts.push(metadata.channel);
  }
  const authorSubtitle = subtitleParts.join(' · ');

  // Get error message with proper singular/plural
  const getErrorMessage = (count: number) => {
    return count === 1
      ? t('uploadCard.recordsFailed', { count })
      : t('uploadCard.recordsFailedPlural', { count });
  };

  return (
    <TwitterCard
      authorName={uploaderName}
      authorSubtitle={authorSubtitle}
      timestamp={item.createdAt}
      avatarIcon={Upload}
      avatarBgColor={statusConfig.iconBg}
      avatarIconClassName={statusConfig.iconColor}
      actions={actions}
      onAction={handleAction}
      className={className}
    >
      {/* Title with status badge */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-bold text-[#14171A]">{item.title}</span>
        <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', statusConfig.badgeBg)}>
          {statusConfig.label}
        </span>
      </div>

      {/* Description */}
      <p className="text-[#14171A] mt-2">{item.content}</p>

      {/* Upload details in Twitter-style quoted content */}
      <div className="mt-3 p-3 bg-[#F5F8FA] rounded-xl border border-[#E1E8ED]">
        <div className="flex items-center gap-4">
          {/* Case count */}
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-[#657786]" />
            <div>
              <span className="text-lg font-bold text-[#14171A]">{caseCount.toLocaleString()}</span>
              <span className="text-sm text-[#657786] ml-1">{t('uploadCard.cases')}</span>
            </div>
          </div>

          {/* File info */}
          {metadata.fileName && (
            <div className="flex-1 min-w-0">
              <div className="text-sm text-[#657786] truncate" title={metadata.fileName}>
                {metadata.fileName}
              </div>
              {metadata.fileSize && (
                <div className="text-xs text-[#AAB8C2]">{metadata.fileSize}</div>
              )}
            </div>
          )}
        </div>

        {/* Error count if any */}
        {metadata.errorCount !== undefined && metadata.errorCount > 0 && (
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#E1E8ED]">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm text-red-600">
              {getErrorMessage(metadata.errorCount)}
            </span>
          </div>
        )}
      </div>
    </TwitterCard>
  );
}
