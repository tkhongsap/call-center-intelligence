'use client';

import { MessageSquare, Sparkles, AlertTriangle, TrendingUp } from 'lucide-react';

interface QuickAction {
  label: string;
  icon: React.ElementType;
}

const QUICK_ACTIONS: QuickAction[] = [
  { label: "What's happening today?", icon: Sparkles },
  { label: 'Show trending topics', icon: TrendingUp },
  { label: 'Find urgent cases', icon: AlertTriangle },
];

interface QuickActionsProps {
  onSelectAction: (action: string) => void;
}

export function QuickActions({ onSelectAction }: QuickActionsProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
        <MessageSquare className="w-8 h-8 text-blue-600" />
      </div>
      <h4 className="font-semibold text-slate-900 mb-2">
        How can I help you today?
      </h4>
      <p className="text-sm text-slate-500 mb-6 max-w-xs">
        Ask me about trends, cases, alerts, or apply filters to your dashboard.
      </p>
      <div className="space-y-2 w-full">
        <p className="text-xs text-slate-400 font-medium">Quick actions</p>
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              onClick={() => onSelectAction(action.label)}
              className="w-full px-4 py-2.5 text-sm text-left text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 flex items-center gap-3"
            >
              <Icon className="w-4 h-4 text-slate-500" />
              {action.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { QUICK_ACTIONS };
