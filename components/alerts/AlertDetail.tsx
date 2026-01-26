'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import {
  TrendingUp,
  BarChart3,
  AlertTriangle,
  HelpCircle,
  Bell,
  ExternalLink,
  Share2,
  ArrowUpRight,
  Clock,
  ChevronRight,
  Calendar,
  Building2,
  Tag
} from 'lucide-react';
import { Badge, SeverityBadge } from '@/components/ui/Badge';
import { ShareModal } from '@/components/ui/ShareModal';
import { formatRelativeTime, formatDateTime } from '@/lib/utils';
import type { Alert } from '@/lib/db/schema';

interface SampleCase {
  id: string;
  caseNumber: string;
  summary: string;
  severity: string;
  status: string;
  businessUnit: string;
  category: string;
  createdAt: string;
}

interface AlertDetailProps {
  alert: Alert;
  sampleCases: SampleCase[];
  contributingPhrases: string[];
  timeWindow?: string;
}

const CURRENT_USER_ID = 'user-admin-1'; // Mock current user

function AlertTypeIcon({ type }: { type: string }) {
  const iconClasses = "w-6 h-6";
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

function getAlertTypeLabel(type: string): string {
  switch (type) {
    case 'spike':
      return 'Spike Alert';
    case 'threshold':
      return 'Threshold Alert';
    case 'urgency':
      return 'Urgency Alert';
    case 'misclassification':
      return 'Misclassification Alert';
    default:
      return 'Alert';
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
    // For urgency/misclassification alerts that only have currentValue
    if (alert.currentValue !== null) {
      return (
        <div className="p-4 bg-slate-50 rounded-lg">
          <div className="text-sm text-slate-500 mb-1">Affected Cases</div>
          <div className="text-3xl font-bold text-slate-700">{alert.currentValue}</div>
        </div>
      );
    }
    return null;
  }

  const increase = alert.percentageChange !== null && alert.percentageChange > 0;
  const changeColor = increase ? 'text-red-600' : 'text-green-600';

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="p-4 bg-slate-50 rounded-lg">
        <div className="text-sm text-slate-500 mb-1">
          {alert.type === 'threshold' ? 'Threshold' : 'Baseline'}
        </div>
        <div className="text-3xl font-bold text-slate-700">{alert.baselineValue}</div>
      </div>
      <div className="p-4 bg-slate-50 rounded-lg">
        <div className="text-sm text-slate-500 mb-1">Current</div>
        <div className="text-3xl font-bold text-slate-700">{alert.currentValue}</div>
      </div>
      {alert.percentageChange !== null && (
        <div className="p-4 bg-slate-50 rounded-lg">
          <div className="text-sm text-slate-500 mb-1">Change</div>
          <div className={`text-3xl font-bold ${changeColor} flex items-center gap-1`}>
            {increase && <ArrowUpRight className="w-6 h-6" />}
            {increase ? '+' : ''}{alert.percentageChange.toFixed(1)}%
          </div>
        </div>
      )}
    </div>
  );
}

function ContributingPhrases({ phrases }: { phrases: string[] }) {
  if (!phrases || phrases.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Contributing Keywords</h2>
      <div className="flex flex-wrap gap-2">
        {phrases.map((phrase, index) => (
          <span
            key={index}
            className="px-3 py-1.5 bg-amber-50 text-amber-800 text-sm font-medium rounded-full border border-amber-200"
          >
            {phrase}
          </span>
        ))}
      </div>
    </div>
  );
}

function SampleCasesTable({ cases, locale }: { cases: SampleCase[]; locale: string }) {
  if (!cases || cases.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Contributing Cases</h2>
        <p className="text-slate-500">No cases found for this alert.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900">
          Contributing Cases ({cases.length})
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Case
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Summary
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Severity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {cases.map((caseItem) => (
              <tr key={caseItem.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-medium text-blue-600">{caseItem.caseNumber}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-slate-600 line-clamp-2">{caseItem.summary}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <SeverityBadge severity={caseItem.severity} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-slate-600">{caseItem.category}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-slate-500">{formatRelativeTime(caseItem.createdAt, locale)}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link
                    href={`/cases/${caseItem.id}`}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                  >
                    View
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TrendChart({ alert }: { alert: Alert }) {
  // Only show for spike alerts with baseline/current values
  if (alert.type !== 'spike' || alert.baselineValue === null || alert.currentValue === null) {
    return null;
  }

  const baseline = alert.baselineValue;
  const current = alert.currentValue;
  const maxValue = Math.max(baseline, current);
  const baselineHeight = (baseline / maxValue) * 100;
  const currentHeight = (current / maxValue) * 100;

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Trend Comparison</h2>
      <div className="flex items-end justify-center gap-8 h-40">
        {/* Baseline bar */}
        <div className="flex flex-col items-center gap-2">
          <div
            className="w-20 bg-slate-200 rounded-t-lg transition-all duration-500"
            style={{ height: `${baselineHeight}%` }}
          />
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-600">{baseline}</div>
            <div className="text-xs text-slate-500">Baseline</div>
          </div>
        </div>
        {/* Current bar */}
        <div className="flex flex-col items-center gap-2">
          <div
            className="w-20 bg-red-400 rounded-t-lg transition-all duration-500"
            style={{ height: `${currentHeight}%` }}
          />
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{current}</div>
            <div className="text-xs text-slate-500">Current</div>
          </div>
        </div>
      </div>
      {alert.percentageChange !== null && (
        <div className="mt-4 text-center">
          <span className="text-red-600 font-semibold">
            +{alert.percentageChange.toFixed(1)}% increase
          </span>
        </div>
      )}
    </div>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-4 h-4 text-slate-400 mt-0.5" />
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm font-medium text-slate-900">{value}</p>
      </div>
    </div>
  );
}

export function AlertDetail({ alert, sampleCases, contributingPhrases, timeWindow }: AlertDetailProps) {
  const locale = useLocale();
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [escalateModalOpen, setEscalateModalOpen] = useState(false);

  const styles = getSeverityStyles(alert.severity);
  const statusStyles = getStatusStyles(alert.status);

  const handleShare = async (recipientId: string, message: string) => {
    const response = await fetch('/api/shares', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'share',
        sourceType: 'alert',
        sourceId: alert.id,
        senderId: CURRENT_USER_ID,
        recipientId,
        message,
      }),
    });

    if (!response.ok) {
      throw new Error('Share failed');
    }
  };

  const handleEscalate = async (recipientId: string, message: string) => {
    const response = await fetch('/api/shares', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'escalation',
        sourceType: 'alert',
        sourceId: alert.id,
        senderId: CURRENT_USER_ID,
        recipientId,
        message,
      }),
    });

    if (!response.ok) {
      throw new Error('Escalation failed');
    }

    // Refresh the page to show updated status
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/alerts" className="hover:text-slate-700">Alerts</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-slate-900 font-medium">{getAlertTypeLabel(alert.type)}</span>
      </nav>

      {/* Header Card */}
      <div className={`bg-white rounded-lg border border-slate-200 ${styles.border} overflow-hidden`}>
        <div className={`px-6 py-4 ${styles.headerBg} border-b border-slate-200`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${styles.iconBg}`}>
                <AlertTypeIcon type={alert.type} />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-xl font-bold text-slate-900">{alert.title}</h1>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusStyles}`}>
                    {alert.status}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <SeverityBadge severity={alert.severity} />
                  <span className="text-sm text-slate-500">{getAlertTypeLabel(alert.type)}</span>
                  {alert.businessUnit && (
                    <Badge variant="default">{alert.businessUnit}</Badge>
                  )}
                  {alert.category && (
                    <Badge variant="default">{alert.category}</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => setShareModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
              <button
                onClick={() => setEscalateModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 text-sm font-medium text-white hover:bg-amber-700"
              >
                <AlertTriangle className="w-4 h-4" />
                Escalate
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Description */}
          <p className="text-slate-600 mb-6">{alert.description}</p>

          {/* Stats */}
          <AlertStats alert={alert} />

          {/* Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 mt-6 border-t border-slate-200">
            <InfoItem
              icon={Calendar}
              label="Created"
              value={formatDateTime(alert.createdAt, locale)}
            />
            {timeWindow && (
              <InfoItem
                icon={Clock}
                label="Time Window"
                value={timeWindow}
              />
            )}
            {alert.businessUnit && (
              <InfoItem
                icon={Building2}
                label="Business Unit"
                value={alert.businessUnit}
              />
            )}
            {alert.category && (
              <InfoItem
                icon={Tag}
                label="Category"
                value={alert.category}
              />
            )}
          </div>
        </div>
      </div>

      {/* Two column layout for trend chart and keywords */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrendChart alert={alert} />
        <ContributingPhrases phrases={contributingPhrases} />
      </div>

      {/* Sample Cases Table */}
      <SampleCasesTable cases={sampleCases} locale={locale} />

      {/* Share Modal */}
      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        onShare={handleShare}
        title="Share Alert"
        type="share"
      />

      {/* Escalate Modal */}
      <ShareModal
        isOpen={escalateModalOpen}
        onClose={() => setEscalateModalOpen(false)}
        onShare={handleEscalate}
        title="Escalate Alert"
        type="escalate"
      />
    </div>
  );
}
