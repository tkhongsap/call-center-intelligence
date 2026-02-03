"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import {
  ChevronRight,
  Share2,
  AlertTriangle,
  Calendar,
  User,
  Phone,
  Tag,
  Building2,
  Package,
  MapPin,
  FileText,
  Clock,
  CheckCircle,
  Factory,
} from "lucide-react";
import { Badge, SeverityBadge, StatusBadge } from "@/components/ui/Badge";
import { ShareModal } from "@/components/ui/ShareModal";
import { CaseTimeline } from "./CaseTimeline";
import { AISummary } from "./AISummary";
import { formatDateTime } from "@/lib/utils";
import type { Case } from "@/lib/types";

interface TimelineEvent {
  id: string;
  type: "created" | "assigned" | "contact" | "resolved";
  title: string;
  description: string;
  timestamp: string;
}

interface AISummaryData {
  whatHappened: string;
  impact: string;
  suggestedAction: string;
}

interface IncidentData {
  incident_number?: string;
  reference_number?: string;
  received_date?: string;
  closed_date?: string;
  contact_channel?: string;
  customer_name?: string;
  phone?: string;
  issue_type?: string;
  issue_subtype_1?: string;
  issue_subtype_2?: string;
  product?: string;
  product_group?: string;
  factory?: string;
  production_code?: string;
  details?: string;
  solution?: string;
  solution_from_thaibev?: string;
  subject?: string;
  district?: string;
  province?: string;
  order_channel?: string;
  status?: string;
  receiver?: string;
  closer?: string;
  sla?: string;
  upload_id?: string;
}

interface CaseDetailProps {
  caseData: Case & {
    timeline: TimelineEvent[];
    aiSummary: AISummaryData;
    incident_data?: IncidentData;
  };
}

const CURRENT_USER_ID = "user-admin-1"; // Mock current user

export function CaseDetail({ caseData }: CaseDetailProps) {
  const locale = useLocale();
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [escalateModalOpen, setEscalateModalOpen] = useState(false);
  const incident = caseData.incident_data;

  const handleShare = async (recipientId: string, message: string) => {
    const response = await fetch("/api/shares", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "share",
        sourceType: "case",
        sourceId: caseData.id,
        senderId: CURRENT_USER_ID,
        recipientId,
        message,
      }),
    });

    if (!response.ok) {
      throw new Error("Share failed");
    }
  };

  const handleEscalate = async (recipientId: string, message: string) => {
    const response = await fetch("/api/shares", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "escalation",
        sourceType: "case",
        sourceId: caseData.id,
        senderId: CURRENT_USER_ID,
        recipientId,
        message,
      }),
    });

    if (!response.ok) {
      throw new Error("Escalation failed");
    }

    // Refresh the page to show updated status
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/cases" className="hover:text-slate-700">
          Cases
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-slate-900 font-medium">
          {caseData.case_number}
        </span>
      </nav>

      {/* Header */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-slate-900">
                {caseData.case_number}
              </h1>
              <SeverityBadge severity={caseData.severity} />
              <StatusBadge status={caseData.status} />
              {caseData.risk_flag && <Badge variant="urgent">Urgent</Badge>}
              {caseData.needs_review_flag && (
                <Badge variant="needsReview">Needs Review</Badge>
              )}
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
            value={formatDateTime(caseData.created_at, locale)}
          />
          <InfoItem
            icon={Building2}
            label="Business Unit"
            value={caseData.business_unit}
          />
          <InfoItem
            icon={Phone}
            label="Channel"
            value={
              caseData.channel.charAt(0).toUpperCase() +
              caseData.channel.slice(1)
            }
          />
          <InfoItem icon={Tag} label="Category" value={caseData.category} />
          {caseData.subcategory && (
            <InfoItem
              icon={Tag}
              label="Subcategory"
              value={caseData.subcategory}
            />
          )}
          {caseData.customer_name && (
            <InfoItem
              icon={User}
              label="Customer"
              value={caseData.customer_name}
            />
          )}
          <InfoItem
            icon={User}
            label="Sentiment"
            value={
              caseData.sentiment.charAt(0).toUpperCase() +
              caseData.sentiment.slice(1)
            }
          />
          {caseData.assigned_to && (
            <InfoItem
              icon={User}
              label="Assigned To"
              value={caseData.assigned_to}
            />
          )}
        </div>
      </div>

      {/* Incident Details - All Fields */}
      {incident && (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Complete Incident Details
          </h2>

          {/* Contact Information */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <User className="w-4 h-4" />
              Contact Information
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {incident.customer_name && (
                <DetailField label="Customer Name" value={incident.customer_name} />
              )}
              {incident.phone && (
                <DetailField label="Phone" value={incident.phone} />
              )}
              {incident.contact_channel && (
                <DetailField label="Contact Channel" value={incident.contact_channel} />
              )}
            </div>
          </div>

          {/* Issue Details */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Issue Details
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {incident.incident_number && (
                <DetailField label="Incident Number" value={incident.incident_number} />
              )}
              {incident.reference_number && (
                <DetailField label="Reference Number" value={incident.reference_number} />
              )}
              {incident.issue_type && (
                <DetailField label="Issue Type" value={incident.issue_type} />
              )}
              {incident.issue_subtype_1 && (
                <DetailField label="Issue Subtype 1" value={incident.issue_subtype_1} />
              )}
              {incident.issue_subtype_2 && (
                <DetailField label="Issue Subtype 2" value={incident.issue_subtype_2} />
              )}
              {incident.status && (
                <DetailField label="Status" value={incident.status} />
              )}
            </div>
            {incident.subject && (
              <div className="mt-4">
                <DetailField label="Subject" value={incident.subject} fullWidth />
              </div>
            )}
            {incident.details && (
              <div className="mt-4">
                <DetailField label="Details" value={incident.details} fullWidth multiline />
              </div>
            )}
          </div>

          {/* Product Information */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Product Information
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {incident.product && (
                <DetailField label="Product" value={incident.product} />
              )}
              {incident.product_group && (
                <DetailField label="Product Group" value={incident.product_group} />
              )}
              {incident.factory && (
                <DetailField label="Factory" value={incident.factory} />
              )}
              {incident.production_code && (
                <DetailField label="Production Code" value={incident.production_code} />
              )}
              {incident.order_channel && (
                <DetailField label="Order Channel" value={incident.order_channel} />
              )}
            </div>
          </div>

          {/* Location */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Location
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {incident.district && (
                <DetailField label="District" value={incident.district} />
              )}
              {incident.province && (
                <DetailField label="Province" value={incident.province} />
              )}
            </div>
          </div>

          {/* Resolution */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Resolution
            </h3>
            {incident.solution && (
              <div className="mb-4">
                <DetailField label="Solution" value={incident.solution} fullWidth multiline />
              </div>
            )}
            {incident.solution_from_thaibev && (
              <div>
                <DetailField label="Solution from ThaiBev" value={incident.solution_from_thaibev} fullWidth multiline />
              </div>
            )}
          </div>

          {/* Personnel & Dates */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Personnel & Timeline
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {incident.receiver && (
                <DetailField label="Receiver" value={incident.receiver} />
              )}
              {incident.closer && (
                <DetailField label="Closer" value={incident.closer} />
              )}
              {incident.received_date && (
                <DetailField label="Received Date" value={formatDateTime(incident.received_date, locale)} />
              )}
              {incident.closed_date && (
                <DetailField label="Closed Date" value={formatDateTime(incident.closed_date, locale)} />
              )}
              {incident.sla && (
                <DetailField label="SLA" value={incident.sla} />
              )}
            </div>
          </div>

          {/* Additional Info */}
          {incident.upload_id && (
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Additional Information
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <DetailField label="Upload ID" value={incident.upload_id} />
              </div>
            </div>
          )}
        </div>
      )}

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

function DetailField({
  label,
  value,
  fullWidth = false,
  multiline = false,
}: {
  label: string;
  value: string;
  fullWidth?: boolean;
  multiline?: boolean;
}) {
  return (
    <div className={fullWidth ? "col-span-full" : ""}>
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-sm text-slate-900 ${multiline ? "whitespace-pre-wrap" : ""}`}>
        {value}
      </p>
    </div>
  );
}
