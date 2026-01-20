'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bell, AlertTriangle, TrendingUp, BarChart3, HelpCircle, ArrowUpRight, Share2, Eye, Clock } from 'lucide-react';
import { Badge, SeverityBadge } from '@/components/ui/Badge';
import { ShareModal } from '@/components/ui/ShareModal';
import { cn, formatRelativeTime } from '@/lib/utils';
import type { FeedItem } from '@/lib/db/schema';

interface AlertMetadata {
  alertId?: string;
  alertType?: 'spike' | 'threshold' | 'urgency' | 'misclassification';
  severity?: 'low' | 'medium' | 'high' | 'critical';
  status?: 'active' | 'acknowledged' | 'resolved' | 'dismissed';
  businessUnit?: string;
  category?: string;
  baselineValue?: number;
  currentValue?: number;
  percentageChange?: number;
  timeWindow?: string;
}

interface AlertFeedCardProps {
  item: FeedItem;
  onShare?: (alertId: string, recipientId: string, message: string, type: 'share' | 'escalation') => Promise<void>;
  className?: string;
}

function AlertTypeIcon({ type }: { type: string }) {
  const iconClasses = 'w-5 h-5';
  switch (type) {
    case 'spike':
      return <TrendingUp className={iconClasses} />;
    case 'threshold':
      return <BarChart3 className={iconClasses} />;
    case 'urgency':
      return <AlertTriangle className={iconClasses} />;
    case 'misclassification':
      return <HelpCircle className={iconClasses} />;
    default:
      return <Bell className={iconClasses} />;
  }
}

function getSeverityStyles(severity: string) {
  switch (severity) {
    case 'critical':
      return {
        border: 'border-l-4 border-l-red-500',
        iconBg: 'bg-red-100 text-red-700',
        headerBg: 'bg-red-50',
      };
    case 'high':
      return {
        border: 'border-l-4 border-l-orange-500',
        iconBg: 'bg-orange-100 text-orange-700',
        headerBg: 'bg-orange-50',
      };
    case 'medium':
      return {
        border: 'border-l-4 border-l-yellow-500',
        iconBg: 'bg-yellow-100 text-yellow-700',
        headerBg: 'bg-yellow-50',
      };
    case 'low':
      return {
        border: 'border-l-4 border-l-blue-500',
        iconBg: 'bg-blue-100 text-blue-700',
        headerBg: 'bg-blue-50',
      };
    default:
      return {
        border: 'border-l-4 border-l-slate-400',
        iconBg: 'bg-slate-100 text-slate-700',
        headerBg: 'bg-slate-50',
      };
  }
}

function getStatusStyles(status: string) {
  switch (status) {
    case 'active':
      return 'bg-red-50 text-red-700 border border-red-200';
    case 'acknowledged':
      return 'bg-yellow-50 text-yellow-700 border border-yellow-200';
    case 'resolved':
      return 'bg-green-50 text-green-700 border border-green-200';
    case 'dismissed':
      return 'bg-slate-50 text-slate-600 border border-slate-200';
    default:
      return 'bg-slate-50 text-slate-600 border border-slate-200';
  }
}

function AlertStats({ metadata }: { metadata: AlertMetadata }) {
  if (metadata.baselineValue === undefined || metadata.currentValue === undefined) {
    return null;
  }

  const increase = metadata.percentageChange !== undefined && metadata.percentageChange > 0;
  const changeColor = increase ? 'text-red-600' : 'text-green-600';

  return (
    <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg mt-3">
      <div className="flex-1">
        <div className="text-xs text-slate-500 mb-1">Baseline</div>
        <div className="text-lg font-semibold text-slate-700">{metadata.baselineValue}</div>
      </div>
      <div className="flex items-center text-slate-400">
        <ArrowUpRight className={cn('w-5 h-5', increase ? 'text-red-500' : 'text-green-500 rotate-90')} />
      </div>
      <div className="flex-1">
        <div className="text-xs text-slate-500 mb-1">Current</div>
        <div className="text-lg font-semibold text-slate-700">{metadata.currentValue}</div>
      </div>
      {metadata.percentageChange !== undefined && (
        <div className="flex-1">
          <div className="text-xs text-slate-500 mb-1">Change</div>
          <div className={cn('text-lg font-semibold', changeColor)}>
            {increase ? '+' : ''}{metadata.percentageChange.toFixed(1)}%
          </div>
        </div>
      )}
    </div>
  );
}

export function AlertFeedCard({ item, onShare, className }: AlertFeedCardProps) {
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareType, setShareType] = useState<'share' | 'escalate'>('share');

  const metadata: AlertMetadata = item.metadata ? JSON.parse(item.metadata) : {};
  const severity = metadata.severity || 'medium';
  const alertType = metadata.alertType || 'spike';
  const status = metadata.status || 'active';
  const alertId = metadata.alertId || item.referenceId || item.id;

  const styles = getSeverityStyles(severity);
  const statusStyles = getStatusStyles(status);

  const handleOpenShare = (type: 'share' | 'escalate') => {
    setShareType(type);
    setShareModalOpen(true);
  };

  const handleShare = async (recipientId: string, message: string) => {
    if (onShare) {
      await onShare(alertId, recipientId, message, shareType === 'escalate' ? 'escalation' : 'share');
    }
  };

  return (
    <>
      <div className={cn(
        'bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-md transition-shadow',
        styles.border,
        className
      )}>
        {/* Header - Color-coded by severity */}
        <div className={cn('px-4 py-3 border-b border-slate-200', styles.headerBg)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Icon - Bell/Warning based on type */}
              <div className={cn('p-2 rounded-lg', styles.iconBg)}>
                <AlertTypeIcon type={alertType} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-900">{item.title}</h3>
                  <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium capitalize', statusStyles)}>
                    {status}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <SeverityBadge severity={severity} />
                  <span className="text-xs text-slate-500 capitalize">{alertType} Alert</span>
                  {metadata.businessUnit && (
                    <Badge variant="default">{metadata.businessUnit}</Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500">{formatRelativeTime(item.createdAt)}</div>
              {metadata.timeWindow && (
                <div className="flex items-center gap-1 text-xs text-slate-400 mt-1 justify-end">
                  <Clock className="w-3 h-3" />
                  {metadata.timeWindow}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-4">
          <p className="text-sm text-slate-600">{item.content}</p>

          {/* Stats */}
          <AlertStats metadata={metadata} />
        </div>

        {/* Footer - Action buttons */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <Link
            href={`/alerts/${alertId}`}
            className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <Eye className="w-4 h-4" />
            View cases
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenShare('share')}
              className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
            <button
              onClick={() => handleOpenShare('escalate')}
              className="px-3 py-1.5 text-sm font-medium text-amber-700 hover:text-amber-900 hover:bg-amber-50 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <AlertTriangle className="w-4 h-4" />
              Escalate
            </button>
          </div>
        </div>
      </div>

      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        onShare={handleShare}
        title={shareType === 'escalate' ? 'Escalate Alert' : 'Share Alert'}
        type={shareType}
      />
    </>
  );
}
