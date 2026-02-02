/**
 * Types and utilities for trending topics and predictions
 */

export type TimeWindow = '1h' | '6h' | '24h' | '7d' | '30d';
export type TrendDirection = 'up' | 'down' | 'stable';
export type PredictionType = 'spike' | 'decline' | 'anomaly' | 'pattern';

export interface TrendingTopicData {
  id: string;
  topic: string;
  count: number;
  change: number;
  direction: TrendDirection;
  timeWindow: TimeWindow;
  category?: string;
  severity?: 'critical' | 'high' | 'medium' | 'low';
  relatedCases?: number;
  firstSeen?: string;
  lastSeen?: string;
  metadata?: Record<string, any>;
}

export interface CaseData {
  id: string;
  case_number: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: string;
  created_at: string;
}

export interface PredictedRisk {
  id: string;
  type: PredictionType;
  topic: string;
  description: string;
  confidence: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  predictedImpact: string;
  timeframe: string;
  affectedCases?: CaseData[];
  recommendations?: string[];
  metadata?: Record<string, any>;
}

export interface TrendChartDataPoint {
  timestamp: string;
  value: number;
  label?: string;
}

/**
 * Calculate trend direction based on change percentage
 */
export function getTrendDirection(change: number): TrendDirection {
  if (change > 5) return 'up';
  if (change < -5) return 'down';
  return 'stable';
}

/**
 * Format confidence score as percentage
 */
export function formatConfidence(confidence: number): string {
  return `${Math.round(confidence * 100)}%`;
}
