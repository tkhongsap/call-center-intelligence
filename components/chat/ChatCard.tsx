'use client';

import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  FileText,
  BarChart3,
  ExternalLink,
  Filter,
  ArrowUpRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  ResponseCard,
  TrendCard,
  CaseCard,
  AlertCard,
  StatsCard,
  ChatAction,
} from '@/lib/chatResponses';

interface ChatCardProps {
  card: ResponseCard;
  onAction?: (action: ChatAction) => void;
}

function TrendIcon({ direction }: { direction: 'rising' | 'stable' | 'declining' }) {
  switch (direction) {
    case 'rising':
      return <TrendingUp className="w-4 h-4 text-emerald-500" />;
    case 'declining':
      return <TrendingDown className="w-4 h-4 text-red-500" />;
    default:
      return <Minus className="w-4 h-4 text-slate-400" />;
  }
}

function SeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    critical: 'bg-red-100 text-red-700 border-red-200',
    high: 'bg-orange-100 text-orange-700 border-orange-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    low: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  return (
    <span
      className={cn(
        'px-2 py-0.5 text-xs font-medium rounded-full border',
        colors[severity] || colors.low
      )}
    >
      {severity}
    </span>
  );
}

function TrendCardView({ data, onAction }: { data: TrendCard; onAction?: (action: ChatAction) => void }) {
  const isPositive = data.direction === 'rising';

  return (
    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <TrendIcon direction={data.direction} />
            <span className="font-medium text-slate-900 text-sm truncate">
              {data.topic}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>{data.caseCount} cases</span>
            <span
              className={cn(
                'font-medium',
                isPositive ? 'text-emerald-600' : data.direction === 'declining' ? 'text-red-600' : 'text-slate-500'
              )}
            >
              {isPositive ? '+' : ''}{Math.round(data.percentChange)}%
            </span>
            {data.businessUnit && (
              <span className="text-slate-400">{data.businessUnit}</span>
            )}
          </div>
        </div>
        {onAction && (
          <button
            onClick={() =>
              onAction({
                type: 'apply_filter',
                label: `Filter to ${data.topic}`,
                payload: { category: data.topic },
              })
            }
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
            title={`Filter to ${data.topic}`}
          >
            <Filter className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

function CaseCardView({ data, onAction }: { data: CaseCard; onAction?: (action: ChatAction) => void }) {
  return (
    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-slate-400" />
          <span className="font-medium text-slate-900 text-sm">
            {data.caseNumber}
          </span>
        </div>
        <SeverityBadge severity={data.severity} />
      </div>
      <p className="text-xs text-slate-600 line-clamp-2 mb-2">{data.summary}</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>{data.businessUnit}</span>
          <span>•</span>
          <span>{data.channel}</span>
        </div>
        {onAction && (
          <button
            onClick={() =>
              onAction({
                type: 'open_case',
                label: 'Open case',
                payload: { caseId: data.id },
              })
            }
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            Open
            <ExternalLink className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}

function AlertCardView({ data, onAction }: { data: AlertCard; onAction?: (action: ChatAction) => void }) {
  const typeColors: Record<string, string> = {
    spike: 'bg-orange-500',
    threshold: 'bg-amber-500',
    urgency: 'bg-red-500',
  };

  return (
    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <AlertTriangle
            className={cn(
              'w-4 h-4',
              data.severity === 'critical' ? 'text-red-500' : 'text-orange-500'
            )}
          />
          <span className="font-medium text-slate-900 text-sm line-clamp-1">
            {data.title}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              'w-2 h-2 rounded-full',
              typeColors[data.type] || 'bg-slate-400'
            )}
          />
          <span className="text-xs text-slate-500 capitalize">{data.type}</span>
        </div>
      </div>
      <p className="text-xs text-slate-600 line-clamp-2 mb-2">{data.description}</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SeverityBadge severity={data.severity} />
          {data.businessUnit && (
            <span className="text-xs text-slate-400">{data.businessUnit}</span>
          )}
        </div>
        {onAction && (
          <button
            onClick={() =>
              onAction({
                type: 'open_alert',
                label: 'View alert',
                payload: { alertId: data.id },
              })
            }
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            View
            <ExternalLink className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}

function StatsCardView({ data }: { data: StatsCard }) {
  return (
    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-500">{data.label}</span>
        </div>
        {data.trend && data.change !== undefined && (
          <div
            className={cn(
              'flex items-center gap-0.5 text-xs font-medium',
              data.trend === 'up' ? 'text-emerald-600' : data.trend === 'down' ? 'text-red-600' : 'text-slate-500'
            )}
          >
            {data.trend === 'up' ? (
              <ArrowUpRight className="w-3 h-3" />
            ) : data.trend === 'down' ? (
              <ArrowUpRight className="w-3 h-3 rotate-90" />
            ) : null}
            {data.change > 0 ? '+' : ''}{data.change}%
          </div>
        )}
      </div>
      <div className="mt-1">
        <span className="text-2xl font-semibold text-slate-900">{data.value}</span>
      </div>
    </div>
  );
}

export function ChatCard({ card, onAction }: ChatCardProps) {
  switch (card.type) {
    case 'trend':
      return <TrendCardView data={card.data} onAction={onAction} />;
    case 'case':
      return <CaseCardView data={card.data} onAction={onAction} />;
    case 'alert':
      return <AlertCardView data={card.data} onAction={onAction} />;
    case 'stats':
      return <StatsCardView data={card.data} />;
    default:
      return null;
  }
}

interface ChatCardListProps {
  cards: ResponseCard[];
  onAction?: (action: ChatAction) => void;
}

export function ChatCardList({ cards, onAction }: ChatCardListProps) {
  if (!cards || cards.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 mt-2">
      {cards.map((card, index) => (
        <ChatCard key={`${card.type}-${index}`} card={card} onAction={onAction} />
      ))}
    </div>
  );
}

interface ActionButtonsProps {
  actions: ChatAction[];
  onAction?: (action: ChatAction) => void;
}

export function ActionButtons({ actions, onAction }: ActionButtonsProps) {
  if (!actions || actions.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {actions.map((action, index) => (
        <button
          key={`${action.type}-${index}`}
          onClick={() => onAction?.(action)}
          className={cn(
            'px-3 py-1.5 text-xs font-medium rounded-full border transition-colors',
            action.type === 'apply_filter'
              ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
          )}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}
