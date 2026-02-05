'use client';

import { useEffect, useState } from 'react';
import { Filter, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusOption {
  status: string;
  count: number;
}

interface StatusFilterProps {
  selectedStatus: string | null;
  onStatusChange: (status: string | null) => void;
}

export function StatusFilter({ selectedStatus, onStatusChange }: StatusFilterProps) {
  const [statuses, setStatuses] = useState<StatusOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    async function fetchStatuses() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const response = await fetch(`${apiUrl}/api/metrics/status-counts`);
        
        if (response.ok) {
          const data = await response.json();
          setStatuses(data.statuses || []);
        }
      } catch (error) {
        console.error('Failed to fetch statuses:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStatuses();
  }, []);

  if (loading) {
    return (
      <div className="flex gap-2 flex-wrap">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-8 w-24 bg-slate-200 rounded-full animate-pulse" />
        ))}
      </div>
    );
  }

  const displayedStatuses = showAll ? statuses : statuses.slice(0, 5);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm text-[#657786]">
        <Filter className="w-4 h-4" />
        <span>Filter by status</span>
      </div>
      
      <div className="flex gap-2 flex-wrap">
        {/* All button */}
        <button
          onClick={() => onStatusChange(null)}
          className={cn(
            'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
            !selectedStatus
              ? 'bg-[#1DA1F2] text-white'
              : 'bg-[#E1E8ED] text-[#14171A] hover:bg-[#d6dce1]'
          )}
        >
          All
        </button>

        {/* Status buttons */}
        {displayedStatuses.map((option) => (
          <button
            key={option.status}
            onClick={() => onStatusChange(option.status)}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5',
              selectedStatus === option.status
                ? 'bg-[#1DA1F2] text-white'
                : 'bg-[#E1E8ED] text-[#14171A] hover:bg-[#d6dce1]'
            )}
          >
            <span className="truncate max-w-[120px]">{option.status}</span>
            <span className="text-xs opacity-75">({option.count})</span>
            {selectedStatus === option.status && (
              <X className="w-3 h-3 ml-0.5" />
            )}
          </button>
        ))}

        {/* Show more/less button */}
        {statuses.length > 5 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="px-3 py-1.5 rounded-full text-sm font-medium text-[#1DA1F2] hover:bg-[#E1E8ED] transition-colors"
          >
            {showAll ? 'Show less' : `+${statuses.length - 5} more`}
          </button>
        )}
      </div>
    </div>
  );
}
