'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CaseFilters } from './CaseFilters';
import { CaseList } from './CaseList';
import type { Case } from '@/lib/types';

interface CasesResponse {
  cases: Case[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function CasesListClient() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<CasesResponse>({
    cases: [],
    pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCases() {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        searchParams.forEach((value, key) => {
          params.set(key, value);
        });

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const response = await fetch(`${apiUrl}/api/cases?${params.toString()}`, {
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch cases: ${response.status}`);
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error('Error fetching cases:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch cases');
      } finally {
        setLoading(false);
      }
    }

    fetchCases();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-8">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-slate-100 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Error Loading Cases</h2>
        <p className="text-slate-600">{error}</p>
      </div>
    );
  }

  return (
    <>
      <CaseFilters totalCount={data.pagination.total} />
      <CaseList cases={data.cases} pagination={data.pagination} />
    </>
  );
}
