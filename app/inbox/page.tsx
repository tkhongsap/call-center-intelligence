import { Suspense } from 'react';
import { Header } from '@/components/layout/Header';
import { InboxList } from '@/components/inbox/InboxList';
import type { InboxItemData } from '@/components/inbox/InboxItem';

interface SearchParams {
  page?: string;
  limit?: string;
  status?: string;
  type?: string;
  userId?: string;
}

interface InboxResponse {
  items: InboxItemData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

async function getInboxItems(searchParams: SearchParams): Promise<InboxResponse> {
  const params = new URLSearchParams();

  Object.entries(searchParams).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const response = await fetch(`${baseUrl}/api/inbox?${params.toString()}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch inbox');
  }

  return response.json();
}

function InboxLoading() {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-8">
      <div className="animate-pulse space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className="w-10 h-10 bg-slate-200 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 rounded w-1/3" />
              <div className="h-4 bg-slate-200 rounded w-2/3" />
              <div className="h-3 bg-slate-100 rounded w-1/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

async function InboxContent({ searchParams }: { searchParams: SearchParams }) {
  const data = await getInboxItems(searchParams);
  return <InboxList items={data.items} pagination={data.pagination} />;
}

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  return (
    <>
      <Header title="Inbox" />
      <div className="flex-1 p-4 md:p-6 overflow-auto">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-800">Management Inbox</h2>
          <p className="text-sm text-slate-500 mt-1">
            Shared alerts and cases, and escalated items directed to you.
          </p>
        </div>

        <Suspense fallback={<InboxLoading />}>
          <InboxContent searchParams={params} />
        </Suspense>
      </div>
    </>
  );
}
