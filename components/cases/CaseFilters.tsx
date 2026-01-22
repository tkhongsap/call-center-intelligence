'use client';

import { useCallback, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { X, Filter, Download } from 'lucide-react';
import { ExportModal, ExportFormat } from '@/components/export/ExportModal';

const businessUnits = [
  'Credit Cards',
  'Mobile Banking',
  'Online Banking',
  'Personal Loans',
  'Mortgage',
  'Insurance',
];

const channels = ['phone', 'email', 'line', 'web'];
const categories = [
  'Technical Issue',
  'Account Access',
  'Billing Inquiry',
  'Fraud Report',
  'Product Question',
  'Complaint',
];
const severities = ['low', 'medium', 'high', 'critical'];
const statuses = ['open', 'in_progress', 'resolved', 'closed'];

interface CaseFiltersProps {
  totalCount?: number;
}

export function CaseFilters({ totalCount = 0 }: CaseFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showExportModal, setShowExportModal] = useState(false);

  const currentBu = searchParams.get('bu') || '';
  const currentChannel = searchParams.get('channel') || '';
  const currentCategory = searchParams.get('category') || '';
  const currentSeverity = searchParams.get('severity') || '';
  const currentStatus = searchParams.get('status') || '';
  const currentStartDate = searchParams.get('startDate') || '';
  const currentEndDate = searchParams.get('endDate') || '';

  const hasFilters = !!(currentBu || currentChannel || currentCategory ||
                     currentSeverity || currentStatus || currentStartDate || currentEndDate);

  const handleExport = async (format: ExportFormat) => {
    // Build export URL with current filters
    const params = new URLSearchParams();
    params.set('format', format);
    if (currentBu) params.set('bu', currentBu);
    if (currentChannel) params.set('channel', currentChannel);
    if (currentCategory) params.set('category', currentCategory);
    if (currentSeverity) params.set('severity', currentSeverity);
    if (currentStatus) params.set('status', currentStatus);
    if (currentStartDate) params.set('startDate', currentStartDate);
    if (currentEndDate) params.set('endDate', currentEndDate);

    const response = await fetch(`/api/export?${params.toString()}`);
    if (!response.ok) {
      throw new Error('Export failed');
    }

    // Get filename from Content-Disposition header or use default
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = `cases-export.${format}`;
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="?([^";\n]+)"?/);
      if (match) {
        filename = match[1];
      }
    }

    // Trigger browser download
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const updateFilter = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set('page', '1'); // Reset to first page when filtering
    router.push(`/cases?${params.toString()}`);
  }, [router, searchParams]);

  const clearAllFilters = useCallback(() => {
    router.push('/cases');
  }, [router]);

  return (
    <>
    <div className="bg-white rounded-lg border border-slate-200 p-3 sm:p-4 mb-4">
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Filter className="w-4 h-4 text-slate-500" />
        <span className="font-medium text-slate-700">Filters</span>
        {hasFilters && (
          <button
            onClick={clearAllFilters}
            className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
          >
            <X className="w-4 h-4" />
            Clear all
          </button>
        )}
        <button
          onClick={() => setShowExportModal(true)}
          className="ml-auto flex items-center gap-2 h-9 px-3 sm:px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-medium text-white transition-colors min-h-[44px]"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Export</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
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

        {/* Channel */}
        <select
          value={currentChannel}
          onChange={(e) => updateFilter('channel', e.target.value)}
          className="h-11 sm:h-9 px-3 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Channels</option>
          {channels.map((channel) => (
            <option key={channel} value={channel}>
              {channel.charAt(0).toUpperCase() + channel.slice(1)}
            </option>
          ))}
        </select>

        {/* Category */}
        <select
          value={currentCategory}
          onChange={(e) => updateFilter('category', e.target.value)}
          className="h-11 sm:h-9 px-3 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
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
              {status === 'in_progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}
            </option>
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
      </div>
    </div>

    <ExportModal
      isOpen={showExportModal}
      onClose={() => setShowExportModal(false)}
      onExport={handleExport}
      totalCount={totalCount}
      hasFilters={hasFilters}
    />
    </>
  );
}
