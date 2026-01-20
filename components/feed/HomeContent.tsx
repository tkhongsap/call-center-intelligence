'use client';

import { useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FeedContainer } from './FeedContainer';
import { PulseSidebar } from '@/components/pulse/PulseSidebar';
import { FilterValues } from '@/components/pulse/QuickFilters';

export function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read filters from URL
  const filters: FilterValues = useMemo(() => ({
    bu: searchParams.get('bu') || '',
    channel: searchParams.get('channel') || '',
    dateRange: (searchParams.get('dateRange') as FilterValues['dateRange']) || '',
    type: searchParams.get('type') || '',
  }), [searchParams]);

  // Update URL when filters change
  const handleFilterChange = useCallback((newFilters: FilterValues) => {
    const params = new URLSearchParams();

    if (newFilters.bu) params.set('bu', newFilters.bu);
    if (newFilters.channel) params.set('channel', newFilters.channel);
    if (newFilters.dateRange) params.set('dateRange', newFilters.dateRange);
    if (newFilters.type) params.set('type', newFilters.type);

    const queryString = params.toString();
    router.push(queryString ? `/home?${queryString}` : '/home', { scroll: false });
  }, [router]);

  // Determine the date range to use (default to 30d if not set)
  const effectiveDateRange = filters.dateRange || '30d';

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Main Feed Area - 70% on large screens */}
      <div className="w-full lg:w-[70%] space-y-6">
        {/* Today Feed */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="px-4 md:px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Today Feed</h2>
            <p className="text-sm text-slate-500">Real-time updates from your call center</p>
          </div>
          <div className="p-4 md:p-6">
            <FeedContainer
              bu={filters.bu || undefined}
              channel={filters.channel || undefined}
              dateRange={effectiveDateRange as 'today' | '7d' | '30d'}
              type={filters.type as 'alert' | 'trending' | 'highlight' | 'upload' | undefined}
            />
          </div>
        </div>
      </div>

      {/* Pulse Sidebar - 30% on large screens */}
      <div className="w-full lg:w-[30%]">
        <PulseSidebar filters={filters} onFilterChange={handleFilterChange} />
      </div>
    </div>
  );
}
