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
    const params = new URLSearchParams(searchParams);

    if (newFilters.bu) params.set('bu', newFilters.bu);
    else params.delete('bu');
    
    if (newFilters.channel) params.set('channel', newFilters.channel);
    else params.delete('channel');
    
    if (newFilters.dateRange) params.set('dateRange', newFilters.dateRange);
    else params.delete('dateRange');
    
    if (newFilters.type) params.set('type', newFilters.type);
    else params.delete('type');

    const queryString = params.toString();
    router.push(queryString ? `/home?${queryString}` : '/home', { scroll: false });
  }, [router, searchParams]);

  // Determine the date range to use (default to 30d if not set)
  const effectiveDateRange = filters.dateRange || '30d';

  return (
    <div className="flex justify-center w-full">
      <div className="flex flex-col lg:flex-row gap-6 w-full max-w-[1000px]">
        {/* Main Feed Area - Twitter-style max-width 600px */}
        <div className="w-full lg:w-[600px] lg:flex-shrink-0">
          {/* Feed cards render as individual units - no wrapper card */}
          <FeedContainer
            bu={filters.bu || undefined}
            channel={filters.channel || undefined}
            dateRange={effectiveDateRange as 'today' | '7d' | '30d'}
            type={filters.type as 'alert' | 'trending' | 'highlight' | 'upload' | undefined}
          />
        </div>

        {/* Right Rail - Twitter-style width 350px */}
        <div className="w-full lg:w-[350px] lg:flex-shrink-0 hidden lg:block">
          <div className="sticky top-20">
            <PulseSidebar filters={filters} onFilterChange={handleFilterChange} />
          </div>
        </div>
      </div>

      {/* Mobile-only bottom sheet for sidebar on small screens */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#E1E8ED] p-4 z-30">
        <button
          className="w-full py-3 px-4 bg-[#F5F8FA] hover:bg-[#E1E8ED] rounded-full text-[#14171A] font-medium transition-colors twitter-focus-ring"
          onClick={() => {
            const sidebar = document.getElementById('mobile-sidebar');
            const drawer = sidebar?.querySelector('[data-drawer]') as HTMLElement;
            if (sidebar) {
              sidebar.classList.remove('hidden');
              // Trigger slide-in animation on next frame
              requestAnimationFrame(() => {
                if (drawer) {
                  drawer.classList.remove('translate-x-full');
                }
              });
            }
          }}
        >
          View Insights
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      <div
        id="mobile-sidebar"
        className="lg:hidden hidden fixed inset-0 z-40 bg-black/50 transition-opacity duration-300"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            const sidebar = e.currentTarget as HTMLElement;
            const drawer = sidebar.querySelector('[data-drawer]') as HTMLElement;
            if (drawer) {
              drawer.classList.add('translate-x-full');
            }
            setTimeout(() => sidebar.classList.add('hidden'), 300);
          }
        }}
      >
        <div
          data-drawer
          className="absolute right-0 top-0 bottom-0 w-[85%] max-w-[350px] bg-white overflow-y-auto transform translate-x-full transition-transform duration-300 ease-out"
        >
          <div className="p-4">
            <button
              className="mb-4 p-2 hover:bg-[#F5F8FA] rounded-full transition-colors twitter-focus-ring"
              aria-label="Close sidebar"
              onClick={() => {
                const sidebar = document.getElementById('mobile-sidebar');
                const drawer = sidebar?.querySelector('[data-drawer]') as HTMLElement;
                if (drawer) {
                  drawer.classList.add('translate-x-full');
                }
                setTimeout(() => {
                  if (sidebar) sidebar.classList.add('hidden');
                }, 300);
              }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <PulseSidebar filters={filters} onFilterChange={handleFilterChange} />
          </div>
        </div>
      </div>
    </div>
  );
}
