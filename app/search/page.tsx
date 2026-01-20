'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Clock, AlertTriangle, Lightbulb } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { SearchBar } from '@/components/search/SearchBar';
import { SuggestedFilters } from '@/components/search/SuggestedFilters';
import { SearchResultCard } from '@/components/search/SearchResultCard';
import type { SearchResponse, SuggestedFilter } from '@/lib/search';

function SearchLoading() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg border border-slate-200 p-4 animate-pulse">
          <div className="h-4 bg-slate-100 rounded w-1/4 mb-3" />
          <div className="h-5 bg-slate-100 rounded w-3/4 mb-2" />
          <div className="h-4 bg-slate-100 rounded w-full" />
        </div>
      ))}
    </div>
  );
}

function NoResults({ query }: { query: string }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Search className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-medium text-slate-900 mb-2">No results found</h3>
      <p className="text-slate-600 mb-6">
        We couldn&apos;t find any cases matching &quot;{query}&quot;
      </p>
      <div className="text-left bg-slate-50 rounded-lg p-4 max-w-md mx-auto">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
          <Lightbulb className="w-4 h-4" />
          Search tips
        </div>
        <ul className="text-sm text-slate-600 space-y-1">
          <li>• Try different keywords or synonyms</li>
          <li>• Use natural language like &quot;urgent cases this week&quot;</li>
          <li>• Specify a BU or channel like &quot;credit card phone cases&quot;</li>
          <li>• Check for typos in your search</li>
        </ul>
      </div>
    </div>
  );
}

interface PopularSearch {
  query: string;
  searchCount: number;
  avgResultCount: number;
}

function EmptySearch() {
  const [popularSearches, setPopularSearches] = useState<PopularSearch[]>([]);
  const [loading, setLoading] = useState(true);

  // Default suggestions to show while loading or if no analytics data
  const defaultSuggestions = [
    'urgent cases this week',
    'credit card payment issues',
    'fraud reports last month',
    'high severity complaints',
  ];

  useEffect(() => {
    const fetchPopularSearches = async () => {
      try {
        const response = await fetch('/api/search/analytics?limit=6&days=30');
        if (response.ok) {
          const data = await response.json();
          setPopularSearches(data.popularSearches || []);
        }
      } catch (error) {
        console.error('Failed to fetch popular searches:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPopularSearches();
  }, []);

  const searchesToShow = popularSearches.length > 0
    ? popularSearches.map(s => s.query)
    : defaultSuggestions;

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
      <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
        <Search className="w-8 h-8 text-blue-500" />
      </div>
      <h3 className="text-lg font-medium text-slate-900 mb-2">Search for cases</h3>
      <p className="text-slate-600 mb-6">
        Use natural language to find cases by keywords, BU, channel, severity, or date range.
      </p>
      <div className="text-left max-w-md mx-auto">
        <div className="text-sm font-medium text-slate-700 mb-3">
          {popularSearches.length > 0 ? 'Popular searches:' : 'Try searching for:'}
        </div>
        {loading ? (
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-8 w-32 bg-slate-100 rounded-full animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {searchesToShow.map((search) => (
              <Link
                key={search}
                href={`/search?q=${encodeURIComponent(search)}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-full text-sm text-slate-700 transition-colors"
              >
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {search}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';

  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<SuggestedFilter[]>([]);

  useEffect(() => {
    if (!query) {
      setResults(null);
      setAppliedFilters([]);
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (!response.ok) {
          throw new Error('Search failed');
        }
        const data: SearchResponse = await response.json();
        setResults(data);
        setAppliedFilters(data.suggestedFilters);

        // Log search analytics (fire and forget)
        fetch('/api/search/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query,
            resultCount: data.totalCount,
            executionTimeMs: data.executionTimeMs,
          }),
        }).catch(() => {
          // Silently ignore analytics errors
        });
      } catch (err) {
        setError('Failed to search. Please try again.');
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query]);

  const handleFilterRemove = (filter: SuggestedFilter) => {
    setAppliedFilters((prev) => prev.filter((f) => f.value !== filter.value || f.type !== filter.type));
  };

  const handleClearAllFilters = () => {
    setAppliedFilters([]);
  };

  // Empty state - no query
  if (!query) {
    return <EmptySearch />;
  }

  // Loading state
  if (loading) {
    return <SearchLoading />;
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white rounded-lg border border-red-200 p-6 text-center">
        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
          <AlertTriangle className="w-6 h-6 text-red-500" />
        </div>
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => router.refresh()}
          className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  // No results
  if (results && results.results.length === 0) {
    return <NoResults query={query} />;
  }

  // Results
  if (results) {
    return (
      <div className="space-y-4">
        {/* Results header */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-600">
            Found <span className="font-medium text-slate-900">{results.totalCount}</span> results
            {results.executionTimeMs && (
              <span className="text-slate-400"> in {results.executionTimeMs}ms</span>
            )}
          </div>
        </div>

        {/* Suggested filters */}
        {appliedFilters.length > 0 && (
          <SuggestedFilters
            filters={appliedFilters}
            onRemove={handleFilterRemove}
            onClearAll={handleClearAllFilters}
          />
        )}

        {/* Results list */}
        <div className="space-y-3">
          {results.results.map((result) => (
            <SearchResultCard
              key={result.case.id}
              result={result}
              keywords={results.parsedQuery.keywords}
            />
          ))}
        </div>
      </div>
    );
  }

  return null;
}

export default function SearchPage() {
  return (
    <>
      <Header title="Search" />
      <div className="flex-1 p-6 overflow-auto">
        {/* Search bar at top of results page */}
        <div className="mb-6">
          <Suspense fallback={null}>
            <SearchBarWithQuery />
          </Suspense>
        </div>

        {/* Search results */}
        <Suspense fallback={<SearchLoading />}>
          <SearchResultsContent />
        </Suspense>
      </div>
    </>
  );
}

function SearchBarWithQuery() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';

  return (
    <SearchBar
      className="max-w-2xl"
      initialQuery={query}
      placeholder="Search cases with natural language..."
    />
  );
}
