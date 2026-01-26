'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { ChevronLeft, ChevronRight, ArrowUpDown, ChevronRightIcon } from 'lucide-react';
import { Badge, SeverityBadge, StatusBadge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import type { Case } from '@/lib/db/schema';

interface CaseListProps {
  cases: Case[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface SortHeaderProps {
  column: string;
  children: React.ReactNode;
  currentSortBy: string;
  onSort: (column: string) => void;
}

function SortHeader({ column, children, currentSortBy, onSort }: SortHeaderProps) {
  return (
    <th
      onClick={() => onSort(column)}
      className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
    >
      <div className="flex items-center gap-1">
        {children}
        <ArrowUpDown className={`w-3 h-3 ${currentSortBy === column ? 'text-blue-500' : 'text-slate-400'}`} />
      </div>
    </th>
  );
}

function CaseCard({ caseItem, onClick, locale }: { caseItem: Case; onClick: () => void; locale: string }) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg border border-slate-200 p-4 hover:bg-slate-50 cursor-pointer transition-colors active:bg-slate-100"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <Link
            href={`/cases/${caseItem.id}`}
            className="text-sm font-semibold text-blue-600 hover:text-blue-800"
            onClick={(e) => e.stopPropagation()}
          >
            {caseItem.caseNumber}
          </Link>
          <p className="text-xs text-slate-500 mt-0.5">{formatDate(caseItem.createdAt, locale)}</p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <SeverityBadge severity={caseItem.severity} />
          <ChevronRightIcon className="w-4 h-4 text-slate-400" />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-500 min-w-[60px]">BU:</span>
          <span className="text-slate-700 font-medium">{caseItem.businessUnit}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-500 min-w-[60px]">Channel:</span>
          <span className="text-slate-700 capitalize">{caseItem.channel}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-500 min-w-[60px]">Category:</span>
          <span className="text-slate-700">{caseItem.category}</span>
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
        <StatusBadge status={caseItem.status} />
        <div className="flex gap-1">
          {caseItem.riskFlag && (
            <Badge variant="urgent">Urgent</Badge>
          )}
          {caseItem.needsReviewFlag && (
            <Badge variant="needsReview">Review</Badge>
          )}
        </div>
      </div>
    </div>
  );
}

export function CaseList({ cases, pagination }: CaseListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();

  const currentSortBy = searchParams.get('sortBy') || 'createdAt';
  const currentSortOrder = searchParams.get('sortOrder') || 'desc';

  const handleSort = (column: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (currentSortBy === column) {
      params.set('sortOrder', currentSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      params.set('sortBy', column);
      params.set('sortOrder', 'desc');
    }
    router.push(`/cases?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/cases?${params.toString()}`);
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      {/* Mobile Card View */}
      <div className="lg:hidden p-4 space-y-3">
        {cases.map((caseItem) => (
          <CaseCard
            key={caseItem.id}
            caseItem={caseItem}
            locale={locale}
            onClick={() => router.push(`/cases/${caseItem.id}`)}
          />
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <SortHeader column="createdAt" currentSortBy={currentSortBy} onSort={handleSort}>Date</SortHeader>
              <SortHeader column="caseNumber" currentSortBy={currentSortBy} onSort={handleSort}>Case #</SortHeader>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">BU</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Channel</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Category</th>
              <SortHeader column="severity" currentSortBy={currentSortBy} onSort={handleSort}>Severity</SortHeader>
              <SortHeader column="status" currentSortBy={currentSortBy} onSort={handleSort}>Status</SortHeader>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Flags</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {cases.map((caseItem) => (
              <tr
                key={caseItem.id}
                className="hover:bg-slate-50 cursor-pointer transition-colors"
                onClick={() => router.push(`/cases/${caseItem.id}`)}
              >
                <td className="px-4 py-3 text-sm text-slate-600">
                  {formatDate(caseItem.createdAt, locale)}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/cases/${caseItem.id}`}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {caseItem.caseNumber}
                  </Link>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {caseItem.businessUnit}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600 capitalize">
                  {caseItem.channel}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {caseItem.category}
                </td>
                <td className="px-4 py-3">
                  <SeverityBadge severity={caseItem.severity} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={caseItem.status} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {caseItem.riskFlag && (
                      <Badge variant="urgent">Urgent</Badge>
                    )}
                    {caseItem.needsReviewFlag && (
                      <Badge variant="needsReview">Needs Review</Badge>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination - responsive layout */}
      <div className="px-4 py-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-sm text-slate-600 text-center sm:text-left">
          Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
          {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
          {pagination.total} cases
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-slate-600 min-w-[80px] text-center">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
