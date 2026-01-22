'use client';

import { useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { X, Filter, ArrowUpDown } from 'lucide-react';

const alertTypeKeys = ['spike', 'threshold', 'urgency'] as const;
const severityKeys = ['low', 'medium', 'high', 'critical'] as const;
const statusKeys = ['open', 'acknowledged', 'resolved', 'closed'] as const;

const businessUnits = [
  'Beer & Spirits',
  'Non-Alcoholic Beverages',
  'Oishi Beverages',
  'Oishi Restaurants',
  'KFC Delivery',
  'KFC Restaurants',
  'KFC Loyalty',
  'Corporate & Events',
];

export function AlertFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations('filters');

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
    router.push(`/${locale}/alerts?${params.toString()}`);
  }, [router, searchParams, locale]);

  const updateSort = useCallback((sortValue: string) => {
    const [sortBy, sortOrder] = sortValue.split(':');
    const params = new URLSearchParams(searchParams.toString());
    params.set('sortBy', sortBy);
    params.set('sortOrder', sortOrder);
    params.set('page', '1');
    router.push(`/${locale}/alerts?${params.toString()}`);
  }, [router, searchParams, locale]);

  const clearAllFilters = useCallback(() => {
    router.push(`/${locale}/alerts`);
  }, [router, locale]);

  // Sort options with translations
  const sortOptions = [
    { value: 'createdAt:desc', label: locale === 'th' ? 'ใหม่สุดก่อน' : 'Newest First' },
    { value: 'createdAt:asc', label: locale === 'th' ? 'เก่าสุดก่อน' : 'Oldest First' },
    { value: 'severity:desc', label: locale === 'th' ? 'ความรุนแรง (สูง→ต่ำ)' : 'Severity (High to Low)' },
    { value: 'severity:asc', label: locale === 'th' ? 'ความรุนแรง (ต่ำ→สูง)' : 'Severity (Low to High)' },
  ];

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-3 sm:p-4 mb-4">
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Filter className="w-4 h-4 text-slate-500" />
        <span className="font-medium text-slate-700">{t('label') || 'Filters'}</span>
        {hasFilters && (
          <button
            onClick={clearAllFilters}
            className="ml-auto flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 min-h-[44px]"
          >
            <X className="w-4 h-4" />
            {t('clearAll')}
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
          <option value="">{t('allTypes')}</option>
          {alertTypeKeys.map((typeKey) => (
            <option key={typeKey} value={typeKey}>{t(`type.${typeKey}`)}</option>
          ))}
        </select>

        {/* Severity */}
        <select
          value={currentSeverity}
          onChange={(e) => updateFilter('severity', e.target.value)}
          className="h-11 sm:h-9 px-3 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">{t('allSeverities')}</option>
          {severityKeys.map((sev) => (
            <option key={sev} value={sev}>
              {t(`severity.${sev}`)}
            </option>
          ))}
        </select>

        {/* Status */}
        <select
          value={currentStatus}
          onChange={(e) => updateFilter('status', e.target.value)}
          className="h-11 sm:h-9 px-3 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">{t('allStatuses')}</option>
          {statusKeys.map((status) => (
            <option key={status} value={status}>
              {t(`status.${status}`)}
            </option>
          ))}
        </select>

        {/* Business Unit */}
        <select
          value={currentBu}
          onChange={(e) => updateFilter('bu', e.target.value)}
          className="h-11 sm:h-9 px-3 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">{t('allBUs')}</option>
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
          placeholder={t('from')}
        />

        {/* End Date */}
        <input
          type="date"
          value={currentEndDate}
          onChange={(e) => updateFilter('endDate', e.target.value)}
          className="h-11 sm:h-9 px-3 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={t('to')}
        />

        {/* Sort */}
        <div className="flex items-center gap-1">
          <ArrowUpDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <select
            value={currentSort}
            onChange={(e) => updateSort(e.target.value)}
            className="h-11 sm:h-9 px-3 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
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
