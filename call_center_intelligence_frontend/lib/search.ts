/**
 * Types and utilities for search functionality
 */

export type SearchResultType = 'case' | 'alert' | 'upload' | 'trending';

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  description: string;
  relevance: number;
  created_at: string;
  updated_at?: string;
  metadata?: Record<string, any>;
  highlights?: string[];
}

export interface SuggestedFilter {
  id: string;
  label: string;
  type: 'category' | 'severity' | 'status' | 'date' | 'tag';
  value: string;
  count?: number;
  icon?: string;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  page: number;
  pageSize: number;
  suggestedFilters?: SuggestedFilter[];
  relatedTopics?: string[];
  query: string;
}

/**
 * Build search query parameters
 */
export function buildSearchParams(
  query: string,
  filters?: Record<string, any>,
  page: number = 1,
  pageSize: number = 20
): URLSearchParams {
  const params = new URLSearchParams();
  
  params.append('q', query);
  params.append('page', page.toString());
  params.append('page_size', pageSize.toString());
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
  }
  
  return params;
}
