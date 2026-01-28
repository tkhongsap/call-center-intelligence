'use client';

import { X, Filter, Calendar, Building, Megaphone, AlertCircle, FolderOpen, Flag, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SuggestedFilter } from '@/lib/search';

interface SuggestedFiltersProps {
  filters: SuggestedFilter[];
  onRemove: (filter: SuggestedFilter) => void;
  onClearAll: () => void;
  className?: string;
}

const filterIcons: Record<SuggestedFilter['type'], React.ElementType> = {
  keyword: Search,
  businessUnit: Building,
  channel: Megaphone,
  severity: AlertCircle,
  category: FolderOpen,
  timeRange: Calendar,
  flag: Flag,
};

const filterColors: Record<SuggestedFilter['type'], string> = {
  keyword: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100',
  businessUnit: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
  channel: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
  severity: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100',
  category: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',
  timeRange: 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100',
  flag: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',
};

export function SuggestedFilters({ filters, onRemove, onClearAll, className }: SuggestedFiltersProps) {
  if (filters.length === 0) return null;

  return (
    <div className={cn('flex items-center gap-2 flex-wrap', className)}>
      <div className="flex items-center gap-1.5 text-sm text-slate-500">
        <Filter className="w-4 h-4" />
        <span>Filters:</span>
      </div>

      {filters.map((filter, index) => {
        const Icon = filterIcons[filter.type];
        const colorClass = filterColors[filter.type];

        return (
          <button
            key={`${filter.type}-${filter.value}-${index}`}
            onClick={() => onRemove(filter)}
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm border transition-colors group',
              colorClass
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{filter.label}</span>
            <X className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
          </button>
        );
      })}

      {filters.length > 1 && (
        <button
          onClick={onClearAll}
          className="text-sm text-slate-500 hover:text-slate-700 underline-offset-2 hover:underline transition-colors"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
