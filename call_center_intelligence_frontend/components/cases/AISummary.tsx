"use client";

import { Sparkles, AlertCircle, TrendingUp, Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

interface AISummaryProps {
  summary?: {
    whatHappened: string;
    impact: string;
    suggestedAction: string;
  };
}

export function AISummary({ summary }: AISummaryProps) {
  if (!summary) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-slate-900">AI Summary</h3>
          <Badge variant="info" className="ml-auto">
            AI Generated
          </Badge>
        </div>
        <p className="text-sm text-slate-500">
          No AI summary available for this case.
        </p>
      </div>
    );
  }
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-slate-900">AI Summary</h3>
        <Badge variant="info" className="ml-auto">
          AI Generated
        </Badge>
      </div>

      <div className="space-y-4">
        {/* What Happened */}
        <div className="bg-white rounded-lg p-4 border border-blue-100">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-blue-500" />
            <h4 className="font-medium text-slate-900">What Happened</h4>
          </div>
          <p className="text-sm text-slate-600">{summary.whatHappened}</p>
        </div>

        {/* Impact */}
        <div className="bg-white rounded-lg p-4 border border-blue-100">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-amber-500" />
            <h4 className="font-medium text-slate-900">Impact</h4>
          </div>
          <p className="text-sm text-slate-600">{summary.impact}</p>
        </div>

        {/* Suggested Action */}
        <div className="bg-white rounded-lg p-4 border border-blue-100">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-green-500" />
            <h4 className="font-medium text-slate-900">
              Suggested Next Action
            </h4>
          </div>
          <p className="text-sm text-slate-600">{summary.suggestedAction}</p>
        </div>
      </div>
    </div>
  );
}
