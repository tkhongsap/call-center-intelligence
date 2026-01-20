import { Suspense } from 'react';
import { Header } from '@/components/layout/Header';
import { TrendingList } from '@/components/trending/TrendingList';

function TrendingLoading() {
  return (
    <div className="space-y-4">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-200 rounded-lg animate-pulse" />
          <div>
            <div className="h-5 w-48 bg-slate-200 rounded animate-pulse mb-2" />
            <div className="h-4 w-64 bg-slate-200 rounded animate-pulse" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-32 bg-slate-200 rounded-lg animate-pulse" />
          <div className="h-9 w-9 bg-slate-200 rounded-lg animate-pulse" />
        </div>
      </div>

      {/* Cards skeleton */}
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg border border-slate-200 p-6 animate-pulse">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-slate-200 rounded-full" />
            <div className="flex-1">
              <div className="h-5 bg-slate-200 rounded w-1/3 mb-2" />
              <div className="h-4 bg-slate-200 rounded w-1/4" />
            </div>
          </div>
          <div className="h-20 bg-slate-100 rounded mb-3" />
          <div className="h-16 bg-slate-100 rounded" />
        </div>
      ))}
    </div>
  );
}

export default function TrendingPage() {
  return (
    <>
      <Header title="Trending Topics" />
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <Suspense fallback={<TrendingLoading />}>
            <TrendingList />
          </Suspense>
        </div>
      </div>
    </>
  );
}
