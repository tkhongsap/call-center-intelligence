'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { ChevronRight, Share2, AlertTriangle, Calendar, User, Phone, Tag, Building2 } from 'lucide-react';
import { Badge, SeverityBadge, StatusBadge } from '@/components/ui/Badge';
import { ShareModal } from '@/components/ui/ShareModal';
import { CaseTimeline } from './CaseTimeline';
import { AISummary } from './AISummary';
import { formatDateTime } from '@/lib/utils';
import type { Case } from '@/lib/db/schema';

interface TimelineEvent {
  id: string;
  type: 'created' | 'assigned' | 'contact' | 'resolved';
  title: string;
  description: string;
  timestamp: string;
}

interface AISummaryData {
  whatHappened: string;
  impact: string;
  suggestedAction: string;
}

interface CaseDetailProps {
  caseData: Case & {
    timeline: TimelineEvent[];
    aiSummary: AISummaryData;
  };
}

const CURRENT_USER_ID = 'user-admin-1'; // Mock current user

export function CaseDetail({ caseData }: CaseDetailProps) {
  const locale = useLocale();
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [escalateModalOpen, setEscalateModalOpen] = useState(false);

  const handleShare = async (recipientId: string, message: string) => {
    const response = await fetch('/api/shares', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'share',
        sourceType: 'case',
        sourceId: caseData.id,
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
        sourceType: 'case',
        sourceId: caseData.id,
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
        <Link href="/cases" className="hover:text-slate-700">Cases</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-slate-900 font-medium">{caseData.caseNumber}</span>
      </nav>

      {/* Header */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-slate-900">{caseData.caseNumber}</h1>
              <SeverityBadge severity={caseData.severity} />
              <StatusBadge status={caseData.status} />
              {caseData.riskFlag && <Badge variant="urgent">Urgent</Badge>}
              {caseData.needsReviewFlag && <Badge variant="needsReview">Needs Review</Badge>}
            </div>
            <p className="text-slate-600">{caseData.summary}</p>
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

        {/* Info Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-200">
          <InfoItem
            icon={Calendar}
            label="Created"
            value={formatDateTime(caseData.createdAt, locale)}
          />
          <InfoItem
            icon={Building2}
            label="Business Unit"
            value={caseData.businessUnit}
          />
          <InfoItem
            icon={Phone}
            label="Channel"
            value={caseData.channel.charAt(0).toUpperCase() + caseData.channel.slice(1)}
          />
          <InfoItem
            icon={Tag}
            label="Category"
            value={caseData.category}
          />
          {caseData.subcategory && (
            <InfoItem
              icon={Tag}
              label="Subcategory"
              value={caseData.subcategory}
            />
          )}
          {caseData.customerName && (
            <InfoItem
              icon={User}
              label="Customer"
              value={caseData.customerName}
            />
          )}
          <InfoItem
            icon={User}
            label="Sentiment"
            value={caseData.sentiment.charAt(0).toUpperCase() + caseData.sentiment.slice(1)}
          />
          {caseData.assignedTo && (
            <InfoItem
              icon={User}
              label="Assigned To"
              value={caseData.assignedTo}
            />
          )}
        </div>
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Summary */}
        <AISummary summary={caseData.aiSummary} />

        {/* Timeline */}
        <CaseTimeline events={caseData.timeline} />
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        onShare={handleShare}
        title="Share Case"
        type="share"
      />

      {/* Escalate Modal */}
      <ShareModal
        isOpen={escalateModalOpen}
        onClose={() => setEscalateModalOpen(false)}
        onShare={handleEscalate}
        title="Escalate Case"
        type="escalate"
      />
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
