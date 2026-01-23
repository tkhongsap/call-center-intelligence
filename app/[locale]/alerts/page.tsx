import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { Header } from '@/components/layout/Header';
import { AlertFilters } from '@/components/alerts/AlertFilters';
import { AlertCard } from '@/components/alerts/AlertCard';
import type { Alert } from '@/lib/db/schema';

interface SearchParams {
  page?: string;
  limit?: string;
  type?: string;
  severity?: string;
  status?: string;
  bu?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: string;
}

interface AlertsResponse {
  alerts: Alert[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

async function getAlerts(searchParams: SearchParams): Promise<AlertsResponse> {
  const params = new URLSearchParams();

  Object.entries(searchParams).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const response = await fetch(`${baseUrl}/api/alerts?${params.toString()}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch alerts');
  }

  return response.json();
}

function AlertsLoading() {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-8">
      <div className="animate-pulse space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-24 bg-slate-100 rounded" />
        ))}
      </div>
    </div>
  );
}

/**
 * Derive time window label from spike alert title/description
 * Title format: "BU X: [Topic] +65% vs last week"
 */
function getSpikeTimeWindow(alert: Alert): string | undefined {
  if (alert.type !== 'spike') return undefined;

  // Extract time window from title (e.g., "vs last week", "vs previous 24 hours")
  const timeWindowPatterns = [
    { pattern: /vs last week/i, label: 'Last 7 days' },
    { pattern: /vs previous 24 hours/i, label: 'Last 24 hours' },
    { pattern: /vs previous 4 hours/i, label: 'Last 4 hours' },
    { pattern: /(\d+) hours?/i, label: (match: RegExpMatchArray) => `Last ${match[1]} hours` },
  ];

  for (const { pattern, label } of timeWindowPatterns) {
    const match = alert.title.match(pattern) || alert.description.match(pattern);
    if (match) {
      return typeof label === 'function' ? label(match) : label;
    }
  }

  // Default for spike alerts without recognizable pattern
  return 'Comparison period';
}

function AlertList({ alerts, pagination, emptyText }: AlertsResponse & { emptyText: string }) {
  if (alerts.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
        <p className="text-slate-500">{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {alerts.map((alert) => (
        <AlertCard
          key={alert.id}
          alert={alert}
          timeWindow={getSpikeTimeWindow(alert)}
        />
      ))}

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-white rounded-lg border border-slate-200">
          <p className="text-sm text-slate-600">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} alerts
          </p>
          <div className="flex gap-2">
            <span className="text-sm text-slate-600">
              Page {pagination.page} of {pagination.totalPages}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

async function AlertsContent({ searchParams }: { searchParams: SearchParams }) {
  const data = await getAlerts(searchParams);
  const t = await getTranslations('pages.alerts');
  return <AlertList alerts={data.alerts} pagination={data.pagination} emptyText={t('emptyState')} />;
}

export default async function AlertsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const t = await getTranslations('pages.alerts');

  return (
    <>
      <Header title={t('title')} />
      <div className="flex-1 p-4 md:p-6 overflow-auto">
        <Suspense fallback={<div className="h-20 bg-slate-100 rounded-lg animate-pulse mb-4" />}>
          <AlertFilters />
        </Suspense>

        <Suspense fallback={<AlertsLoading />}>
          <AlertsContent searchParams={params} />
        </Suspense>
      </div>
    </>
  );
}
