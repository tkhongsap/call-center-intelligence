export default function HomeLoading() {
  return (
    <div className="flex-1 p-6">
      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="h-4 bg-slate-200 rounded w-20 mb-2" />
                <div className="h-8 bg-slate-200 rounded w-16 mb-2" />
                <div className="h-3 bg-slate-200 rounded w-24" />
              </div>
              <div className="w-12 h-12 rounded-lg bg-slate-200" />
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Feed Skeleton */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-200">
            <div className="h-6 bg-slate-200 rounded w-24 mb-2 animate-pulse" />
            <div className="h-4 bg-slate-200 rounded w-48 animate-pulse" />
          </div>
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4 rounded-lg bg-slate-50 animate-pulse">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-slate-200 mt-2" />
                  <div className="flex-1">
                    <div className="h-5 bg-slate-200 rounded w-3/4 mb-2" />
                    <div className="h-4 bg-slate-200 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pulse Sidebar Skeleton */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-200">
            <div className="h-6 bg-slate-200 rounded w-16 mb-2 animate-pulse" />
            <div className="h-4 bg-slate-200 rounded w-32 animate-pulse" />
          </div>
          <div className="p-6 space-y-6">
            {[1, 2, 3].map((section) => (
              <div key={section}>
                <div className="h-4 bg-slate-200 rounded w-28 mb-3 animate-pulse" />
                <div className="space-y-2">
                  {[1, 2, 3].map((bar) => (
                    <div key={bar}>
                      <div className="flex justify-between mb-1">
                        <div className="h-3 bg-slate-200 rounded w-20 animate-pulse" />
                        <div className="h-3 bg-slate-200 rounded w-8 animate-pulse" />
                      </div>
                      <div className="h-2 bg-slate-200 rounded-full animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
