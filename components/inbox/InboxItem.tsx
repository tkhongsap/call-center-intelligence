'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  AlertTriangle,
  FileText,
  ArrowUpCircle,
  Share2,
  Mail,
  MessageSquare,
  Check,
  Eye,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
}

interface Sender {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl: string | null;
}

interface AlertSource {
  sourceType: 'alert';
  id: string;
  type: string;
  severity: string;
  title: string;
  description: string;
  businessUnit: string | null;
  status: string;
}

interface CaseSource {
  sourceType: 'case';
  id: string;
  caseNumber: string;
  severity: string;
  summary: string;
  businessUnit: string;
  status: string;
  category: string;
}

export interface InboxItemData {
  id: string;
  type: 'share' | 'escalation';
  sourceType: 'alert' | 'case';
  sourceId: string;
  message: string | null;
  channel: string;
  status: 'pending' | 'read' | 'actioned';
  createdAt: string;
  readAt: string | null;
  actionedAt: string | null;
  sender: Sender | null;
  source: AlertSource | CaseSource | null;
}

interface InboxItemProps {
  item: InboxItemData;
  onMarkAsRead: (id: string) => void;
  onMarkAsActioned: (id: string) => void;
}

const severityColors: Record<string, string> = {
  critical: 'bg-red-100 text-red-700 border-red-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  low: 'bg-blue-100 text-blue-700 border-blue-200',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function InboxItem({ item, onMarkAsRead, onMarkAsActioned }: InboxItemProps) {
  const isUnread = item.status === 'pending';
  const isEscalation = item.type === 'escalation';

  const getSourceLink = (): string => {
    if (item.sourceType === 'alert') {
      return `/alerts/${item.sourceId}`;
    }
    return `/cases/${item.sourceId}`;
  };

  const getSourceTitle = (): string => {
    if (!item.source) return 'Unknown Item';
    if (item.source.sourceType === 'alert') {
      return item.source.title;
    }
    return `Case ${item.source.caseNumber}: ${item.source.summary.slice(0, 60)}${
      item.source.summary.length > 60 ? '...' : ''
    }`;
  };

  const getSourceIcon = () => {
    if (item.sourceType === 'alert') {
      return <AlertTriangle className="w-5 h-5 text-amber-500" />;
    }
    return <FileText className="w-5 h-5 text-blue-500" />;
  };

  const getTypeIcon = () => {
    if (isEscalation) {
      return <ArrowUpCircle className="w-4 h-4 text-red-500" />;
    }
    return <Share2 className="w-4 h-4 text-blue-500" />;
  };

  const getChannelIcon = () => {
    switch (item.channel) {
      case 'email':
        return <Mail className="w-3 h-3" />;
      case 'line':
        return <MessageSquare className="w-3 h-3" />;
      default:
        return null;
    }
  };

  return (
    <div
      className={`bg-white rounded-lg border p-4 transition-colors ${
        isUnread
          ? 'border-blue-200 bg-blue-50/30 shadow-sm'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Sender Avatar */}
        <div className="flex-shrink-0">
          {item.sender?.avatarUrl ? (
            <Image
              src={item.sender.avatarUrl}
              alt={item.sender.name}
              width={40}
              height={40}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-sm font-medium text-slate-600">
              {item.sender ? getInitials(item.sender.name) : '??'}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            {getTypeIcon()}
            <span className="text-sm font-medium text-slate-900">
              {item.sender?.name || 'Unknown User'}
            </span>
            <span className="text-sm text-slate-500">
              {isEscalation ? 'escalated' : 'shared'}
            </span>
            <span className="text-sm text-slate-500">
              {item.sourceType === 'alert' ? 'an alert' : 'a case'}
            </span>
            {isUnread && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                New
              </span>
            )}
          </div>

          {/* Source Link */}
          <Link
            href={getSourceLink()}
            className="flex items-center gap-2 mb-2 group"
            onClick={() => isUnread && onMarkAsRead(item.id)}
          >
            {getSourceIcon()}
            <span className="text-sm font-medium text-slate-700 group-hover:text-blue-600 transition-colors truncate">
              {getSourceTitle()}
            </span>
          </Link>

          {/* Source Details */}
          {item.source && (
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge
                className={
                  severityColors[item.source.severity] ||
                  'bg-slate-100 text-slate-700'
                }
              >
                {item.source.severity}
              </Badge>
              {item.source.sourceType === 'alert' && (
                <Badge className="bg-slate-100 text-slate-600">
                  {item.source.type}
                </Badge>
              )}
              {item.source.sourceType === 'case' && (
                <Badge className="bg-slate-100 text-slate-600">
                  {item.source.category}
                </Badge>
              )}
              {item.source.businessUnit && (
                <span className="text-xs text-slate-500">
                  {item.source.businessUnit}
                </span>
              )}
            </div>
          )}

          {/* Message */}
          {item.message && (
            <div className="mt-2 p-3 bg-slate-50 rounded-md border border-slate-100">
              <p className="text-sm text-slate-600 italic">&quot;{item.message}&quot;</p>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span>
                {formatTimeAgo(item.createdAt)}
              </span>
              {item.channel !== 'internal' && (
                <span className="flex items-center gap-1">
                  {getChannelIcon()}
                  via {item.channel}
                </span>
              )}
              {item.status === 'read' && item.readAt && (
                <span className="flex items-center gap-1 text-slate-400">
                  <Eye className="w-3 h-3" />
                  Read
                </span>
              )}
              {item.status === 'actioned' && (
                <span className="flex items-center gap-1 text-green-600">
                  <Check className="w-3 h-3" />
                  Actioned
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {item.status === 'pending' && (
                <button
                  onClick={() => onMarkAsRead(item.id)}
                  className="px-2 py-1 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
                >
                  Mark as read
                </button>
              )}
              {item.status !== 'actioned' && (
                <button
                  onClick={() => onMarkAsActioned(item.id)}
                  className="px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                >
                  Mark as actioned
                </button>
              )}
              <Link
                href={getSourceLink()}
                className="px-3 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                onClick={() => isUnread && onMarkAsRead(item.id)}
              >
                View
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
