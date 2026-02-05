'use client';

import Link from 'next/link';
import {
  AlertTriangle,
  TrendingUp,
  Target,
  Zap,
  Eye,
  ChevronRight,
  Building2,
  ArrowUpRight,
} from 'lucide-react';
import { Badge, SeverityBadge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import type { PredictedRisk, PredictionType, CaseData } from '@/lib/trending';

interface PredictedRiskCardProps {
  prediction: PredictedRisk;
  className?: string;
  onTakeAction?: (predictionId: string) => void;
}

function PredictionTypeIcon({ type }: { type: PredictionType }) {
  const iconClasses = 'w-5 h-5';
  switch (type) {
    case 'consecutive_increase':
      return <TrendingUp className={iconClasses} />;
    case 'approaching_threshold':
      return <Target className={iconClasses} />;
    case 'accelerating_growth':
      return <Zap className={iconClasses} />;
    default:
      return <AlertTriangle className={iconClasses} />;
  }
}

function getPredictionTypeLabel(type: PredictionType): string {
  switch (type) {
    case 'consecutive_increase':
      return 'Sustained Increase';
    case 'approaching_threshold':
      return 'Approaching Threshold';
    case 'accelerating_growth':
      return 'Accelerating Growth';
    default:
      return 'Predicted Risk';
  }
}

function getSeverityStyles(severity: 'low' | 'medium' | 'high') {
  switch (severity) {
    case 'high':
      return {
        border: 'border-l-4 border-l-red-500',
        iconBg: 'bg-red-100 text-red-700',
        headerBg: 'bg-red-50',
        accentColor: 'text-red-600',
      };
    case 'medium':
      return {
        border: 'border-l-4 border-l-amber-500',
        iconBg: 'bg-amber-100 text-amber-700',
        headerBg: 'bg-amber-50',
        accentColor: 'text-amber-600',
      };
    case 'low':
    default:
      return {
        border: 'border-l-4 border-l-yellow-500',
        iconBg: 'bg-yellow-100 text-yellow-700',
        headerBg: 'bg-yellow-50',
        accentColor: 'text-yellow-600',
      };
  }
}

function TrajectoryVisualization({ prediction }: { prediction: PredictedRisk }) {
  if (prediction.type === 'approaching_threshold' && prediction.threshold) {
    const percent = (prediction.currentCount / prediction.threshold) * 100;
    return (
      <div className="mt-3 p-3 bg-slate-50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-500">Progress to Threshold</span>
          <span className="text-xs font-medium text-slate-700">
            {prediction.currentCount} / {prediction.threshold}
          </span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              percent >= 95 ? 'bg-red-500' : percent >= 90 ? 'bg-amber-500' : 'bg-yellow-500'
            )}
            style={{ width: `${Math.min(percent, 100)}%` }}
          />
        </div>
        {prediction.daysToThreshold && (
          <div className="mt-2 text-xs text-slate-500">
            Estimated {prediction.daysToThreshold} day{prediction.daysToThreshold !== 1 ? 's' : ''} to threshold
          </div>
        )}
      </div>
    );
  }

  if (prediction.type === 'consecutive_increase' && prediction.consecutiveDays) {
    return (
      <div className="mt-3 p-3 bg-slate-50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-500">Consecutive Days Rising</span>
          <span className="text-xs font-medium text-slate-700">{prediction.consecutiveDays} days</span>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: Math.min(prediction.consecutiveDays, 7) }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'flex-1 h-4 rounded',
                i < prediction.consecutiveDays! - 1 ? 'bg-amber-400' : 'bg-red-500'
              )}
            />
          ))}
          {prediction.consecutiveDays < 7 &&
            Array.from({ length: 7 - prediction.consecutiveDays }).map((_, i) => (
              <div key={`empty-${i}`} className="flex-1 h-4 rounded bg-slate-200" />
            ))}
        </div>
      </div>
    );
  }

  if (prediction.type === 'accelerating_growth' && prediction.growthRate !== undefined) {
    return (
      <div className="mt-3 p-3 bg-slate-50 rounded-lg">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="text-xs text-slate-500 mb-1">Current</div>
            <div className="text-lg font-semibold text-slate-700">{prediction.currentCount}</div>
          </div>
          <ArrowUpRight className="w-5 h-5 text-red-500" />
          <div className="flex-1">
            <div className="text-xs text-slate-500 mb-1">Projected</div>
            <div className="text-lg font-semibold text-red-600">{prediction.projectedCount}</div>
          </div>
          <div className="flex-1">
            <div className="text-xs text-slate-500 mb-1">Growth Rate</div>
            <div className="text-lg font-semibold text-amber-600">+{prediction.growthRate.toFixed(0)}%</div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

function SampleCasesPreview({ cases }: { cases: CaseData[] }) {
  if (!cases || cases.length === 0) {
    return null;
  }

  return (
    <div className="mt-3">
      <div className="text-xs font-medium text-slate-500 mb-2">Related Cases</div>
      <div className="space-y-2">
        {cases.slice(0, 2).map((caseItem) => (
          <div
            key={caseItem.id}
            className="p-2 bg-slate-50 rounded border border-slate-100"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-400">{caseItem.businessUnit}</span>
              <Badge variant="default">{caseItem.category}</Badge>
            </div>
            <p className="text-sm text-slate-600 line-clamp-1">{caseItem.summary}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PredictedRiskCard({ prediction, className, onTakeAction }: PredictedRiskCardProps) {
  const styles = getSeverityStyles(prediction.severity);
  const topicQuery = encodeURIComponent(prediction.term);

  return (
    <div
      className={cn(
        'bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-md transition-shadow',
        styles.border,
        className
      )}
    >
      {/* Header */}
      <div className={cn('px-4 py-3 border-b border-slate-200', styles.headerBg)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-lg', styles.iconBg)}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Predicted Risk
                </span>
              </div>
              <h3 className="font-semibold text-slate-900 capitalize mt-0.5">
                {prediction.term}
              </h3>
            </div>
          </div>
          <div className="text-right">
            <SeverityBadge severity={prediction.severity} />
            <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
              <PredictionTypeIcon type={prediction.type} />
              <span>{getPredictionTypeLabel(prediction.type)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        {/* Explanation */}
        <p className="text-sm text-slate-600">{prediction.explanation}</p>

        {/* Trajectory Visualization */}
        <TrajectoryVisualization prediction={prediction} />

        {/* Impacted BUs */}
        {prediction.impactedBUs.length > 0 && (
          <div className="mt-3">
            <div className="flex items-center gap-1 text-xs font-medium text-slate-500 mb-2">
              <Building2 className="w-3 h-3" />
              Impacted Business Units
            </div>
            <div className="flex flex-wrap gap-2">
              {prediction.impactedBUs.map((bu) => (
                <Badge key={bu} variant="default">{bu}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Sample Cases */}
        <SampleCasesPreview cases={prediction.sampleCases} />
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
        <Link
          href={`/trending?topic=${topicQuery}`}
          className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          <Eye className="w-4 h-4" />
          View trend
        </Link>
        <button
          onClick={() => onTakeAction?.(prediction.id)}
          className="px-3 py-1.5 text-sm font-medium text-amber-700 hover:text-amber-900 hover:bg-amber-100 rounded-lg flex items-center gap-1.5 transition-colors"
        >
          Take action
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
