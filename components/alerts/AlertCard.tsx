'use client';

import { useState } from 'react';
import Link from 'next/link';
import { TrendingUp, BarChart3, AlertTriangle, HelpCircle, Bell, ExternalLink, Share2, ArrowUpRight, Clock } from 'lucide-react';
import { Badge, SeverityBadge } from '@/components/ui/Badge';
import { ShareModal } from '@/components/ui/ShareModal';
import { formatRelativeTime } from '@/lib/utils';
import type { Alert, Case } from '@/lib/db/schema';

interface AlertCardProps {
  alert: Alert;
  sampleCases?: Case[];
  contributingPhrases?: string[];
  timeWindow?: string;
  onShare?: (alertId: string, recipientId: string, message: string, type: 'share' | 'escalation') => Promise<void>;
}

function AlertTypeIcon({ type }: { type: string }) {
  const iconClasses = "w-5 h-5";
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

function AlertStats({ alert }: { alert: Alert }) {
  if (alert.baselineValue === null || alert.currentValue === null) {
    return null;
  }

  const increase = alert.percentageChange !== null && alert.percentageChange > 0;
  const changeColor = increase ? 'text-red-600' : 'text-green-600';

  return (
    <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
      <div className="flex-1">
        <div className="text-xs text-slate-500 mb-1">Baseline</div>
        <div className="text-lg font-semibold text-slate-700">{alert.baselineValue}</div>
      </div>
      <div className="flex items-center text-slate-400">
        <ArrowUpRight className={`w-5 h-5 ${increase ? 'text-red-500' : 'text-green-500 rotate-90'}`} />
      </div>
      <div className="flex-1">
        <div className="text-xs text-slate-500 mb-1">Current</div>
        <div className="text-lg font-semibold text-slate-700">{alert.currentValue}</div>
      </div>
      {alert.percentageChange !== null && (
        <div className="flex-1">
          <div className="text-xs text-slate-500 mb-1">Change</div>
          <div className={`text-lg font-semibold ${changeColor}`}>
            {increase ? '+' : ''}{alert.percentageChange.toFixed(1)}%
          </div>
        </div>
      )}
    </div>
  );
}

function SampleCasesPreview({ cases }: { cases: Case[] }) {
  if (!cases || cases.length === 0) {
    return null;
  }

  return (
    <div className="mt-3">
      <div className="text-xs font-medium text-slate-500 mb-2">Sample Cases ({cases.length})</div>
      <div className="space-y-2">
        {cases.slice(0, 3).map((caseItem) => (
          <Link
            key={caseItem.id}
            href={`/cases/${caseItem.id}`}
            className="flex items-center justify-between p-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors group"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-medium text-blue-600">{caseItem.caseNumber}</span>
              <span className="text-xs text-slate-600 truncate">{caseItem.summary}</span>
            </div>
            <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-blue-500 flex-shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}

function ContributingPhrases({ phrases }: { phrases: string[] }) {
  if (!phrases || phrases.length === 0) {
    return null;
  }

  return (
    <div className="mt-3">
      <div className="text-xs font-medium text-slate-500 mb-2">Contributing Keywords</div>
      <div className="flex flex-wrap gap-1.5">
        {phrases.map((phrase, index) => (
          <span
            key={index}
            className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs rounded-full"
          >
            {phrase}
          </span>
        ))}
      </div>
    </div>
  );
}

export function AlertCard({ alert, sampleCases, contributingPhrases, timeWindow, onShare }: AlertCardProps) {
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareType, setShareType] = useState<'share' | 'escalate'>('share');

  const styles = getSeverityStyles(alert.severity);
  const statusStyles = getStatusStyles(alert.status);

  const handleOpenShare = (type: 'share' | 'escalate') => {
    setShareType(type);
    setShareModalOpen(true);
  };

  const handleShare = async (recipientId: string, message: string) => {
    if (onShare) {
      await onShare(alert.id, recipientId, message, shareType === 'escalate' ? 'escalation' : 'share');
    }
  };

  return (
    <>
      <div className={`bg-white rounded-lg border border-slate-200 ${styles.border} overflow-hidden hover:shadow-md transition-shadow`}>
        {/* Header */}
        <div className={`px-4 py-3 ${styles.headerBg} border-b border-slate-200`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <div className={`p-2 rounded-lg ${styles.iconBg} flex-shrink-0`}>
                <AlertTypeIcon type={alert.type} />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-slate-900 break-words">{alert.title}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusStyles}`}>
                    {alert.status}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-0.5">
                  <SeverityBadge severity={alert.severity} />
                  <span className="text-xs text-slate-500 capitalize">{alert.type} Alert</span>
                  {alert.businessUnit && (
                    <Badge variant="default">{alert.businessUnit}</Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="text-left sm:text-right flex sm:flex-col items-center sm:items-end gap-2 sm:gap-0 ml-11 sm:ml-0">
              <div className="text-xs text-slate-500">{formatRelativeTime(alert.createdAt)}</div>
              {timeWindow && (
                <div className="flex items-center gap-1 text-xs text-slate-400 sm:mt-1">
                  <Clock className="w-3 h-3" />
                  {timeWindow}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-4">
          {/* Description */}
          <p className="text-sm text-slate-600 mb-4">{alert.description}</p>

          {/* Stats */}
          <AlertStats alert={alert} />

          {/* Sample Cases */}
          <SampleCasesPreview cases={sampleCases || []} />

          {/* Contributing Phrases */}
          <ContributingPhrases phrases={contributingPhrases || []} />
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <Link
            href={`/alerts/${alert.id}`}
            className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center justify-center sm:justify-start gap-1 min-h-[44px] sm:min-h-0"
          >
            View Details
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenShare('share')}
              className="flex-1 sm:flex-initial px-3 py-2 sm:py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg flex items-center justify-center gap-1.5 transition-colors min-h-[44px] sm:min-h-0"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
            <button
              onClick={() => handleOpenShare('escalate')}
              className="flex-1 sm:flex-initial px-3 py-2 sm:py-1.5 text-sm font-medium text-amber-700 hover:text-amber-900 hover:bg-amber-50 rounded-lg flex items-center justify-center gap-1.5 transition-colors min-h-[44px] sm:min-h-0"
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
