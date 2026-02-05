'use client';

import Link from 'next/link';
import { Clock, Building, Megaphone, Star } from 'lucide-react';
import { Badge, SeverityBadge } from '@/components/ui/Badge';
import { formatRelativeTime } from '@/lib/utils';
import type { SearchResult } from '@/lib/search';

interface SearchResultCardProps {
  result: SearchResult;
  keywords: string[];
}

function highlightText(text: string, keywords: string[]): React.ReactNode {
  if (!keywords.length) return text;

  // Create a regex that matches any of the keywords (case insensitive)
  const escapedKeywords = keywords.map((k) =>
    k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  );
  const regex = new RegExp(`(${escapedKeywords.join('|')})`, 'gi');

  const parts = text.split(regex);

  return parts.map((part, index) => {
    const isMatch = keywords.some(
      (k) => k.toLowerCase() === part.toLowerCase()
    );
    if (isMatch) {
      return (
        <mark key={index} className="bg-yellow-200 text-yellow-900 rounded px-0.5">
          {part}
        </mark>
      );
    }
    return part;
  });
}

function RelevanceIndicator({ score }: { score: number }) {
  // Score is 0-100
  const filled = Math.round(score / 20); // 0-5 stars

  return (
    <div className="flex items-center gap-1" title={`Relevance: ${score}%`}>
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`w-3 h-3 ${
            i < filled ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'
          }`}
        />
      ))}
      <span className="text-xs text-slate-400 ml-1">{score}%</span>
    </div>
  );
}

export function SearchResultCard({ result, keywords }: SearchResultCardProps) {
  const { case: caseData, relevanceScore, matchedFields } = result;

  return (
    <Link
      href={`/cases/${caseData.id}`}
      className="block bg-white rounded-lg border border-slate-200 p-4 hover:border-slate-300 hover:shadow-sm transition-all"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-2">
        <div className="flex items-center gap-3 text-sm">
          <span className="font-medium text-blue-600">{caseData.caseNumber}</span>
          <div className="flex items-center gap-1 text-slate-500">
            <Clock className="w-3.5 h-3.5" />
            <span>{formatRelativeTime(caseData.createdAt)}</span>
          </div>
        </div>
        <RelevanceIndicator score={relevanceScore} />
      </div>

      {/* Summary with highlighting */}
      <p className="text-slate-900 mb-3 line-clamp-2">
        {highlightText(caseData.summary, keywords)}
      </p>

      {/* Meta info */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 text-sm text-slate-600">
          <Building className="w-3.5 h-3.5 text-slate-400" />
          <span
            className={
              matchedFields.includes('businessUnit') ? 'font-medium text-blue-600' : ''
            }
          >
            {caseData.businessUnit}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-slate-600">
          <Megaphone className="w-3.5 h-3.5 text-slate-400" />
          <span
            className={`capitalize ${
              matchedFields.includes('channel') ? 'font-medium text-purple-600' : ''
            }`}
          >
            {caseData.channel}
          </span>
        </div>
        <span
          className={`text-sm ${
            matchedFields.includes('category') ? 'font-medium text-green-600' : 'text-slate-600'
          }`}
        >
          {caseData.category}
        </span>
        <SeverityBadge severity={caseData.severity} />
        {caseData.riskFlag && <Badge variant="urgent">Urgent</Badge>}
        {caseData.needsReviewFlag && <Badge variant="needsReview">Needs Review</Badge>}
      </div>

      {/* Matched fields indicator */}
      {matchedFields.length > 0 && (
        <div className="mt-2 pt-2 border-t border-slate-100">
          <span className="text-xs text-slate-400">
            Matched in: {matchedFields.join(', ')}
          </span>
        </div>
      )}
    </Link>
  );
}
