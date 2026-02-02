/**
 * Types for chat responses and interactive cards
 */

export interface FilterState {
  severity?: string[];
  status?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  category?: string[];
  tags?: string[];
}

export interface ChatAction {
  id: string;
  label: string;
  type: 'primary' | 'secondary' | 'link';
  action: string;
  icon?: string;
}

export interface ResponseCard {
  id: string;
  type: 'alert' | 'case' | 'insight' | 'stats' | 'action';
  title: string;
  content?: string;
  metadata?: Record<string, any>;
  actions?: ChatAction[];
}

export interface StatsCard extends ResponseCard {
  type: 'stats';
  stats: {
    label: string;
    value: string | number;
    change?: number;
    trend?: 'up' | 'down' | 'stable';
  }[];
}

export interface InsightCard extends ResponseCard {
  type: 'insight';
  severity?: 'critical' | 'high' | 'medium' | 'low' | 'info';
  recommendations?: string[];
}

/**
 * Parse filter state from chat message
 */
export function parseFiltersFromMessage(message: string): Partial<FilterState> {
  const filters: Partial<FilterState> = {};
  
  // Simple keyword-based parsing
  if (message.toLowerCase().includes('critical')) {
    filters.severity = ['critical'];
  }
  if (message.toLowerCase().includes('open')) {
    filters.status = ['open'];
  }
  
  return filters;
}
