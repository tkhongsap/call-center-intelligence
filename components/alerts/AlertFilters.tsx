'use client';

import { useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { X, Filter, ArrowUpDown } from 'lucide-react';

const alertTypes = [
  { value: 'spike', label: 'Spike' },
  { value: 'threshold', label: 'Threshold' },
  { value: 'urgency', label: 'Urgency' },
  { value: 'misclassification', label: 'Misclassification' },
];

const severities = ['low', 'medium', 'high', 'critical'];
const statuses = ['active', 'acknowledged', 'resolved', 'dismissed'];

const businessUnits = [
  'Credit Cards',
  'Mobile Banking',
  'Online Banking',
  'Personal Loans',
  'Mortgage',
  'Insurance',
];

const sortOptions = [
  { value: 'createdAt:desc', label: 'Newest First' },
  { value: 'createdAt:asc', label: 'Oldest First' },
  { value: 'severity:desc', label: 'Severity (High to Low)' },
  { value: 'severity:asc', label: 'Severity (Low to High)' },
];

export function AlertFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentType = searchParams.get('type') || '';
  const currentSeverity = searchParams.get('severity') || '';
  const currentStatus = searchParams.get('status') || '';
  const currentBu = searchParams.get('bu') || '';
  const currentStartDate = searchParams.get('startDate') || '';
  const currentEndDate = searchParams.get('endDate') || '';
  const currentSortBy = searchParams.get('sortBy') || 'createdAt';
  const currentSortOrder = searchParams.get('sortOrder') || 'desc';

  const currentSort = `${currentSortBy}:${currentSortOrder}`;

  const hasFilters = currentType || currentSeverity || currentStatus ||
                     currentBu || currentStartDate || currentEndDate;

  const updateFilter = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set('page', '1'); // Reset to first page when filtering
    router.push(`/alerts?${params.toString()}`);
  }, [router, searchParams]);

  const updateSort = useCallback((sortValue: string) => {
    const [sortBy, sortOrder] = sortValue.split(':');
    const params = new URLSearchParams(searchParams.toString());
    params.set('sortBy', sortBy);
    params.set('sortOrder', sortOrder);
    params.set('page', '1');
    router.push(`/alerts?${params.toString()}`);
  }, [router, searchParams]);

  const clearAllFilters = useCallback(() => {
    router.push('/alerts');
  }, [router]);

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-3 sm:p-4 mb-4">
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Filter className="w-4 h-4 text-slate-500" />
        <span className="font-medium text-slate-700">Filters</span>
        {hasFilters && (
          <button
            onClick={clearAllFilters}
            className="ml-auto flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 min-h-[44px]"
          >
            <X className="w-4 h-4" />
            Clear all
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {/* Alert Type */}
        <select
          value={currentType}
          onChange={(e) => updateFilter('type', e.target.value)}
          className="h-11 sm:h-9 px-3 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Types</option>
          {alertTypes.map((type) => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>

        {/* Severity */}
        <select
          value={currentSeverity}
          onChange={(e) => updateFilter('severity', e.target.value)}
          className="h-11 sm:h-9 px-3 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Severities</option>
          {severities.map((sev) => (
            <option key={sev} value={sev}>
              {sev.charAt(0).toUpperCase() + sev.slice(1)}
            </option>
          ))}
        </select>

        {/* Status */}
        <select
          value={currentStatus}
          onChange={(e) => updateFilter('status', e.target.value)}
          className="h-11 sm:h-9 px-3 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </option>
          ))}
        </select>

        {/* Business Unit */}
        <select
          value={currentBu}
          onChange={(e) => updateFilter('bu', e.target.value)}
          className="h-11 sm:h-9 px-3 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All BUs</option>
          {businessUnits.map((bu) => (
            <option key={bu} value={bu}>{bu}</option>
          ))}
        </select>

        {/* Start Date */}
        <input
          type="date"
          value={currentStartDate}
          onChange={(e) => updateFilter('startDate', e.target.value)}
          className="h-11 sm:h-9 px-3 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Start Date"
        />

        {/* End Date */}
        <input
          type="date"
          value={currentEndDate}
          onChange={(e) => updateFilter('endDate', e.target.value)}
          className="h-11 sm:h-9 px-3 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="End Date"
        />

        {/* Sort */}
        <div className="flex items-center gap-1">
          <ArrowUpDown className="w-4 h-4 text-slate-400" />
          <select
            value={currentSort}
            onChange={(e) => updateSort(e.target.value)}
            className="h-9 px-3 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
