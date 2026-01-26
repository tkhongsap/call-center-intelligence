'use client';

import { useCallback } from 'react';
import { Filter, X } from 'lucide-react';

export interface FilterValues {
  bu: string;
  channel: string;
  dateRange: 'today' | '7d' | '30d' | '';
  type: string;
}

interface QuickFiltersProps {
  filters: FilterValues;
  onFilterChange: (filters: FilterValues) => void;
  className?: string;
}

const businessUnits = [
  'Credit Cards',
  'Mobile Banking',
  'Online Banking',
  'Personal Loans',
  'Mortgage',
  'Insurance',
];

const channels = ['phone', 'email', 'line', 'web'];

const dateRanges = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
];

const feedTypes = [
  { value: 'alert', label: 'Alerts' },
  { value: 'trending', label: 'Trending' },
  { value: 'highlight', label: 'Highlights' },
  { value: 'upload', label: 'Uploads' },
];

export function QuickFilters({ filters, onFilterChange, className = '' }: QuickFiltersProps) {
  const hasFilters = filters.bu || filters.channel || filters.dateRange || filters.type;

  const updateFilter = useCallback(
    (key: keyof FilterValues, value: string) => {
      onFilterChange({
        ...filters,
        [key]: value,
      });
    },
    [filters, onFilterChange]
  );

  const clearAllFilters = useCallback(() => {
    onFilterChange({
      bu: '',
      channel: '',
      dateRange: '',
      type: '',
    });
  }, [onFilterChange]);

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-medium text-slate-700">Quick Filters</h3>
        </div>
        {hasFilters && (
          <button
            onClick={clearAllFilters}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
          >
            <X className="w-3 h-3" />
            Clear
          </button>
        )}
      </div>

      <div className="space-y-2">
        {/* Business Unit */}
        <select
          value={filters.bu}
          onChange={(e) => updateFilter('bu', e.target.value)}
          className="w-full h-8 px-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Business Units</option>
          {businessUnits.map((bu) => (
            <option key={bu} value={bu}>
              {bu}
            </option>
          ))}
        </select>

        {/* Channel */}
        <select
          value={filters.channel}
          onChange={(e) => updateFilter('channel', e.target.value)}
          className="w-full h-8 px-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Channels</option>
          {channels.map((channel) => (
            <option key={channel} value={channel}>
              {channel.charAt(0).toUpperCase() + channel.slice(1)}
            </option>
          ))}
        </select>

        {/* Date Range - Tab style buttons */}
        <div className="flex gap-1">
          {dateRanges.map((range) => (
            <button
              key={range.value}
              onClick={() =>
                updateFilter('dateRange', filters.dateRange === range.value ? '' : range.value)
              }
              className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition-colors ${
                filters.dateRange === range.value
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>

        {/* Feed Type Filter */}
        <select
          value={filters.type}
          onChange={(e) => updateFilter('type', e.target.value)}
          className="w-full h-8 px-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Types</option>
          {feedTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {/* Active Filter Tags */}
      {hasFilters && (
        <div className="flex flex-wrap gap-1 pt-1">
          {filters.bu && (
            <FilterTag label={filters.bu} onRemove={() => updateFilter('bu', '')} />
          )}
          {filters.channel && (
            <FilterTag
              label={filters.channel.charAt(0).toUpperCase() + filters.channel.slice(1)}
              onRemove={() => updateFilter('channel', '')}
            />
          )}
          {filters.dateRange && (
            <FilterTag
              label={dateRanges.find((d) => d.value === filters.dateRange)?.label || filters.dateRange}
              onRemove={() => updateFilter('dateRange', '')}
            />
          )}
          {filters.type && (
            <FilterTag
              label={feedTypes.find((t) => t.value === filters.type)?.label || filters.type}
              onRemove={() => updateFilter('type', '')}
            />
          )}
        </div>
      )}
    </div>
  );
}

function FilterTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">
      {label}
      <button
        onClick={onRemove}
        className="hover:bg-blue-100 rounded-full p-0.5"
        aria-label={`Remove ${label} filter`}
      >
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}
