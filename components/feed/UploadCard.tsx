'use client';

import Link from 'next/link';
import { Upload, Eye, FileCheck, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { cn, formatRelativeTime } from '@/lib/utils';
import type { FeedItem } from '@/lib/db/schema';

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

function getStatusStyles(status: string) {
  switch (status) {
    case 'completed':
      return {
        border: 'border-l-4 border-l-green-500',
        headerBg: 'bg-green-50',
        iconBg: 'bg-green-100 text-green-700',
        statusBadge: 'success' as const,
      };
    case 'processing':
      return {
        border: 'border-l-4 border-l-blue-500',
        headerBg: 'bg-blue-50',
        iconBg: 'bg-blue-100 text-blue-700',
        statusBadge: 'info' as const,
      };
    case 'failed':
      return {
        border: 'border-l-4 border-l-red-500',
        headerBg: 'bg-red-50',
        iconBg: 'bg-red-100 text-red-700',
        statusBadge: 'critical' as const,
      };
    default:
      return {
        border: 'border-l-4 border-l-slate-400',
        headerBg: 'bg-slate-50',
        iconBg: 'bg-slate-100 text-slate-700',
        statusBadge: 'default' as const,
      };
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'completed':
      return 'Completed';
    case 'processing':
      return 'Processing';
    case 'failed':
      return 'Failed';
    default:
      return 'Unknown';
  }
}

export function UploadCard({ item, className }: UploadCardProps) {
  const metadata: UploadMetadata = item.metadata ? JSON.parse(item.metadata) : {};
  const status = metadata.status || 'completed';
  const styles = getStatusStyles(status);
  const caseCount = metadata.caseCount || 0;
  const batchId = metadata.batchId || item.referenceId || item.id;

  // Build the URL for viewing cases from this upload batch
  const viewCasesUrl = batchId
    ? `/cases?uploadBatch=${encodeURIComponent(batchId)}`
    : '/cases';

  return (
    <div className={cn(
      'bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-md transition-shadow',
      styles.border,
      className
    )}>
      {/* Header - Upload icon + timestamp */}
      <div className={cn('px-4 py-3 border-b border-slate-200', styles.headerBg)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-lg', styles.iconBg)}>
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">{item.title}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant={styles.statusBadge}>{getStatusLabel(status)}</Badge>
                {metadata.businessUnit && (
                  <Badge variant="default">{metadata.businessUnit}</Badge>
                )}
                {metadata.channel && (
                  <Badge variant="default">{metadata.channel}</Badge>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Clock className="w-3 h-3" />
              {formatRelativeTime(item.createdAt)}
            </div>
          </div>
        </div>
      </div>

      {/* Body - Upload batch info */}
      <div className="p-4">
        <p className="text-sm text-slate-600">{item.content}</p>

        {/* Upload details */}
        <div className="mt-3 grid grid-cols-2 gap-3">
          {/* Case count */}
          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-500">Cases Added</span>
            </div>
            <div className="mt-1 text-lg font-semibold text-slate-900">
              {caseCount.toLocaleString()}
            </div>
          </div>

          {/* File info */}
          {metadata.fileName && (
            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="text-xs text-slate-500">File</div>
              <div className="mt-1 text-sm font-medium text-slate-700 truncate" title={metadata.fileName}>
                {metadata.fileName}
              </div>
              {metadata.fileSize && (
                <div className="text-xs text-slate-400">{metadata.fileSize}</div>
              )}
            </div>
          )}

          {/* Error count if any */}
          {metadata.errorCount !== undefined && metadata.errorCount > 0 && (
            <div className="p-3 bg-red-50 rounded-lg col-span-2">
              <div className="text-xs text-red-500">Errors</div>
              <div className="mt-1 text-sm font-medium text-red-700">
                {metadata.errorCount} record{metadata.errorCount === 1 ? '' : 's'} failed to process
              </div>
            </div>
          )}
        </div>

        {/* Uploaded by info */}
        {metadata.uploadedBy && (
          <div className="mt-3 text-xs text-slate-500">
            Uploaded by {metadata.uploadedBy}
          </div>
        )}
      </div>

      {/* Footer - View cases button */}
      <div className="px-4 py-3 bg-slate-50 border-t border-slate-200">
        <Link
          href={viewCasesUrl}
          className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          <Eye className="w-4 h-4" />
          View cases
        </Link>
      </div>
    </div>
  );
}
