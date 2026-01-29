'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { FilterState } from '@/lib/chatResponses';

interface FilterContextValue {
  /** Current active filters applied via chat */
  filters: FilterState | null;
  /** Apply new filters (from chat or other sources) */
  applyFilters: (filters: FilterState) => void;
  /** Reset all filters to default state */
  resetFilters: () => void;
  /** Flag indicating if filters were recently applied (for confirmation UI) */
  filtersJustApplied: boolean;
  /** Clear the "just applied" flag */
  clearFiltersAppliedFlag: () => void;
}

const FilterContext = createContext<FilterContextValue | null>(null);

const DEFAULT_FILTER_STATE: FilterState = {
  businessUnits: [],
  channels: [],
  severities: [],
  categories: [],
  timeRange: undefined,
  flags: {
    urgent: false,
    risk: false,
    needsReview: false,
  },
};

interface FilterProviderProps {
  children: ReactNode;
}

export function FilterProvider({ children }: FilterProviderProps) {
  const [filters, setFilters] = useState<FilterState | null>(null);
  const [filtersJustApplied, setFiltersJustApplied] = useState(false);

  const applyFilters = useCallback((newFilters: FilterState) => {
    // Merge with defaults to ensure all fields exist
    const mergedFilters: FilterState = {
      ...DEFAULT_FILTER_STATE,
      ...newFilters,
      flags: {
        ...DEFAULT_FILTER_STATE.flags,
        ...newFilters.flags,
      },
    };
    setFilters(mergedFilters);
    setFiltersJustApplied(true);

    // Auto-clear the flag after a delay
    setTimeout(() => {
      setFiltersJustApplied(false);
    }, 3000);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(null);
    setFiltersJustApplied(false);
  }, []);

  const clearFiltersAppliedFlag = useCallback(() => {
    setFiltersJustApplied(false);
  }, []);

  return (
    <FilterContext.Provider
      value={{
        filters,
        applyFilters,
        resetFilters,
        filtersJustApplied,
        clearFiltersAppliedFlag,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
}

export function useFilterContext() {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilterContext must be used within a FilterProvider');
  }
  return context;
}

/**
 * Optional hook that returns null if not within provider
 * Useful for components that can work with or without filter context
 */
export function useOptionalFilterContext() {
  return useContext(FilterContext);
}
