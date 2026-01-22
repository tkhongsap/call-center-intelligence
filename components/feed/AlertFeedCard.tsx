'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, AlertTriangle, TrendingUp, BarChart3, HelpCircle, ArrowUpRight } from 'lucide-react';
import { TwitterCard } from './TwitterCard';
import { EngagementAction, EngagementActionType } from './EngagementBar';
import { Badge, SeverityBadge } from '@/components/ui/Badge';
import { ShareModal } from '@/components/ui/ShareModal';
import { cn } from '@/lib/utils';
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

function getAlertIcon(type: string) {
  switch (type) {
    case 'spike':
      return TrendingUp;
    case 'threshold':
      return BarChart3;
    case 'urgency':
      return AlertTriangle;
    case 'misclassification':
      return HelpCircle;
    default:
      return Bell;
  }
}

function getAlertIconStyles(severity: string) {
  switch (severity) {
    case 'critical':
      return { bg: 'bg-red-100', icon: 'text-red-600' };
    case 'high':
      return { bg: 'bg-orange-100', icon: 'text-orange-600' };
    case 'medium':
      return { bg: 'bg-yellow-100', icon: 'text-yellow-600' };
    case 'low':
      return { bg: 'bg-blue-100', icon: 'text-blue-600' };
    default:
      return { bg: 'bg-slate-100', icon: 'text-slate-600' };
  }
}

function getStatusBadgeStyles(status: string) {
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
    <div className="flex items-center gap-4 p-3 bg-[#F5F8FA] rounded-xl mt-3 border border-[#E1E8ED]">
      <div className="flex-1">
        <div className="text-xs text-[#657786] mb-1">Baseline</div>
        <div className="text-lg font-bold text-[#14171A]">{metadata.baselineValue}</div>
      </div>
      <div className="flex items-center">
        <ArrowUpRight className={cn('w-5 h-5', increase ? 'text-red-500' : 'text-green-500 rotate-90')} />
      </div>
      <div className="flex-1">
        <div className="text-xs text-[#657786] mb-1">Current</div>
        <div className="text-lg font-bold text-[#14171A]">{metadata.currentValue}</div>
      </div>
      {metadata.percentageChange !== undefined && (
        <div className="flex-1">
          <div className="text-xs text-[#657786] mb-1">Change</div>
          <div className={cn('text-lg font-bold', changeColor)}>
            {increase ? '+' : ''}{metadata.percentageChange.toFixed(1)}%
          </div>
        </div>
      )}
    </div>
  );
}

export function AlertFeedCard({ item, onShare, className }: AlertFeedCardProps) {
  const router = useRouter();
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareType, setShareType] = useState<'share' | 'escalate'>('share');

  const metadata: AlertMetadata = item.metadata ? JSON.parse(item.metadata) : {};
  const severity = metadata.severity || 'medium';
  const alertType = metadata.alertType || 'spike';
  const status = metadata.status || 'active';
  const alertId = metadata.alertId || item.referenceId || item.id;
  const businessUnit = metadata.businessUnit || 'General';

  const iconStyles = getAlertIconStyles(severity);
  const AlertIcon = getAlertIcon(alertType);

  const handleOpenShare = (type: 'share' | 'escalate') => {
    setShareType(type);
    setShareModalOpen(true);
  };

  const handleShare = async (recipientId: string, message: string) => {
    if (onShare) {
      await onShare(alertId, recipientId, message, shareType === 'escalate' ? 'escalation' : 'share');
    }
  };

  const handleAction = (actionType: EngagementActionType) => {
    switch (actionType) {
      case 'viewCases':
        router.push(`/alerts/${alertId}`);
        break;
      case 'share':
        handleOpenShare('share');
        break;
      case 'escalate':
        handleOpenShare('escalate');
        break;
      case 'acknowledge':
        // TODO: Implement acknowledge API call
        console.log('Acknowledge alert:', alertId);
        break;
      case 'bookmark':
        // TODO: Implement bookmark functionality
        console.log('Bookmark alert:', alertId);
        break;
    }
  };

  const actions: EngagementAction[] = [
    { type: 'viewCases', label: 'View' },
    { type: 'acknowledge' },
    { type: 'bookmark' },
    { type: 'share' },
    { type: 'escalate' },
  ];

  return (
    <>
      <TwitterCard
        authorName="System Alert"
        authorHandle={`alerts · ${businessUnit}`}
        timestamp={item.createdAt}
        avatarIcon={AlertIcon}
        avatarBgColor={iconStyles.bg}
        avatarIconClassName={iconStyles.icon}
        actions={actions}
        onAction={handleAction}
        className={className}
      >
        {/* Title with status badge */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-[#14171A]">{item.title}</span>
          <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium capitalize', getStatusBadgeStyles(status))}>
            {status}
          </span>
        </div>

        {/* Severity and type badges */}
        <div className="flex items-center gap-2 mt-1">
          <SeverityBadge severity={severity} />
          <span className="text-sm text-[#657786] capitalize">{alertType} Alert</span>
          {metadata.category && (
            <Badge variant="default">{metadata.category}</Badge>
          )}
        </div>

        {/* Content */}
        <p className="text-[#14171A] mt-2">{item.content}</p>

        {/* Stats */}
        <AlertStats metadata={metadata} />
      </TwitterCard>

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
