'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Flame, RefreshCw, Clock } from 'lucide-react';
import { TrendingTopicCard } from './TrendingTopicCard';
import type { TrendingTopicData, TimeWindow } from '@/lib/trending';
import { cn } from '@/lib/utils';

interface TrendingListProps {
  initialTopics?: TrendingTopicData[];
  initialWindow?: TimeWindow;
  className?: string;
}

export function TrendingList({ initialTopics = [], initialWindow = '24h', className }: TrendingListProps) {
  const [topics, setTopics] = useState<TrendingTopicData[]>(initialTopics);
  const [timeWindow, setTimeWindow] = useState<TimeWindow>(initialWindow);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initialFetchDone = useRef(false);

  const fetchTopics = useCallback(async (window: TimeWindow) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/trending?window=${window}&limit=5`);
      if (!response.ok) {
        throw new Error('Failed to fetch trending topics');
      }
      const data = await response.json();
      setTopics(data.topics || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Only fetch if no initial topics provided and haven't fetched yet
    if (initialTopics.length === 0 && !initialFetchDone.current) {
      initialFetchDone.current = true;
      fetchTopics(timeWindow);
    }
  }, [initialTopics.length, timeWindow, fetchTopics]);

  const handleWindowChange = (window: TimeWindow) => {
    setTimeWindow(window);
    fetchTopics(window);
  };

  const handleRefresh = () => {
    fetchTopics(timeWindow);
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header with Time Window Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-lg">
            <Flame className="w-5 h-5 text-orange-700" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Top 5 Trending Topics</h2>
            <p className="text-sm text-slate-500">Topics with the highest trend scores</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Time Window Toggle */}
          <div className="flex items-center bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => handleWindowChange('24h')}
              className={cn(
                'flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                timeWindow === '24h'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              <Clock className="w-3.5 h-3.5" />
              24h
            </button>
            <button
              onClick={() => handleWindowChange('7d')}
              className={cn(
                'flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                timeWindow === '7d'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              <Clock className="w-3.5 h-3.5" />
              7d
            </button>
          </div>
          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-slate-200 p-6 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-slate-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-5 bg-slate-200 rounded w-1/3 mb-2" />
                  <div className="h-4 bg-slate-200 rounded w-1/4" />
                </div>
              </div>
              <div className="h-20 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-700">{error}</p>
          <button
            onClick={handleRefresh}
            className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium"
          >
            Try again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && topics.length === 0 && (
        <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
          <Flame className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No trending topics found for this time window</p>
          <p className="text-sm text-slate-400 mt-1">
            Try selecting a different time window or check back later
          </p>
        </div>
      )}

      {/* Topics List */}
      {!loading && !error && topics.length > 0 && (
        <div className="space-y-4">
          {topics.map((topic, index) => (
            <TrendingTopicCard
              key={`${topic.term}-${index}`}
              topic={topic}
              rank={index + 1}
            />
          ))}
        </div>
      )}

      {/* Info Footer */}
      {!loading && topics.length > 0 && (
        <div className="text-center text-xs text-slate-400 py-2">
          Comparing {timeWindow === '24h' ? 'last 24 hours vs previous 24 hours' : 'last 7 days vs previous 7 days'}
        </div>
      )}
    </div>
  );
}
