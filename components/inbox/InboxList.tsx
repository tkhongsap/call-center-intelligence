'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { InboxItem, InboxItemData } from './InboxItem';
import { Inbox as InboxIcon, Filter } from 'lucide-react';

interface InboxListProps {
  items: InboxItemData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function InboxList({ items, pagination }: InboxListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleMarkAsRead = async (id: string) => {
    try {
      const response = await fetch('/api/inbox', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'read' }),
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAsActioned = async (id: string) => {
    try {
      const response = await fetch('/api/inbox', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'actioned' }),
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to mark as actioned:', error);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set('page', '1');
    router.push(`/inbox?${params.toString()}`);
  };

  const currentStatus = searchParams.get('status') || 'all';
  const currentType = searchParams.get('type') || 'all';

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
        <InboxIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-700 mb-2">No items in inbox</h3>
        <p className="text-sm text-slate-500">
          When alerts or cases are shared with you, they will appear here.
        </p>
      </div>
    );
  }

  const unreadCount = items.filter((i) => i.status === 'pending').length;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">Filters:</span>
            </div>

            {/* Status Filter */}
            <select
              value={currentStatus}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Unread</option>
              <option value="read">Read</option>
              <option value="actioned">Actioned</option>
            </select>

            {/* Type Filter */}
            <select
              value={currentType}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="share">Shares</option>
              <option value="escalation">Escalations</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <span className="text-sm text-slate-500">
                {unreadCount} unread item{unreadCount !== 1 ? 's' : ''}
              </span>
            )}
            <span className="text-sm text-slate-500">
              {pagination.total} total item{pagination.total !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="space-y-3">
        {items.map((item) => (
          <InboxItem
            key={item.id}
            item={item}
            onMarkAsRead={handleMarkAsRead}
            onMarkAsActioned={handleMarkAsActioned}
          />
        ))}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-white rounded-lg border border-slate-200">
          <p className="text-sm text-slate-600">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} items
          </p>
          <div className="flex gap-2">
            {pagination.page > 1 && (
              <button
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString());
                  params.set('page', String(pagination.page - 1));
                  router.push(`/inbox?${params.toString()}`);
                }}
                className="px-3 py-1 text-sm font-medium text-slate-600 hover:text-slate-800 border border-slate-200 rounded hover:bg-slate-50 transition-colors"
              >
                Previous
              </button>
            )}
            <span className="text-sm text-slate-600 px-2 py-1">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            {pagination.page < pagination.totalPages && (
              <button
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString());
                  params.set('page', String(pagination.page + 1));
                  router.push(`/inbox?${params.toString()}`);
                }}
                className="px-3 py-1 text-sm font-medium text-slate-600 hover:text-slate-800 border border-slate-200 rounded hover:bg-slate-50 transition-colors"
              >
                Next
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
