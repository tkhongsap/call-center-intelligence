/**
 * Alert Generation Service
 *
 * Implements detection algorithms for various alert types:
 * - Spike: Detects when current count > baseline * spike_factor
 * - Threshold: Detects when counts exceed configured limits
 * - Urgency: Detects cases with high severity + risk keywords
 * - Misclassification: Detects low severity cases with risky keywords
 */

import { db } from '@/lib/db';
import { cases, alerts } from '@/lib/db/schema';
import { sql, gte, and, eq } from 'drizzle-orm';
import type { NewAlert } from '@/lib/db/schema';

// Configuration for alert generation
export const ALERT_CONFIG = {
  spike: {
    factor: 1.5, // 50% increase triggers a spike alert
    minBaseline: 5, // Minimum baseline count to avoid false positives
  },
  threshold: {
    // Configurable thresholds per business unit (cases per time window)
    defaults: {
      hourly: 20,   // More than 20 cases in 4 hours
      daily: 100,   // More than 100 cases in 24 hours
      weekly: 500,  // More than 500 cases in a week
    },
    // Override thresholds for specific business units
    byBusinessUnit: {
      'Customer Service': { hourly: 30, daily: 150, weekly: 750 },
      'Technical Support': { hourly: 25, daily: 120, weekly: 600 },
    } as Record<string, { hourly: number; daily: number; weekly: number }>,
  },
  urgency: {
    // Risk keywords that trigger urgency alerts when found in high-severity cases
    riskKeywords: [
      'safety', 'legal', 'threat', 'lawsuit', 'injury', 'death',
      'dangerous', 'hazard', 'emergency', 'urgent', 'critical',
      'harm', 'accident', 'fatality', 'attorney', 'sue',
    ],
    // Severity levels that qualify for urgency alerts
    qualifyingSeverities: ['high', 'critical'] as const,
    // Minimum number of cases to trigger an alert (avoid noise)
    minCaseCount: 1,
  },
  misclassification: {
    // Risk keywords that suggest a case should have been classified higher
    riskKeywords: [
      'safety', 'legal', 'threat', 'lawsuit', 'injury', 'death',
      'dangerous', 'hazard', 'emergency', 'urgent', 'critical',
      'harm', 'accident', 'fatality', 'attorney', 'sue',
      'complaint', 'escalate', 'supervisor', 'manager', 'refund',
    ],
    // Severity levels that qualify for misclassification review (low severity with risk keywords)
    qualifyingSeverities: ['low', 'medium'] as const,
    // Minimum number of cases to trigger an alert
    minCaseCount: 1,
  },
  timeWindows: {
    hourly: { current: 4, baseline: 4, unit: 'hours' as const, label: 'vs previous 4 hours' },
    daily: { current: 24, baseline: 24, unit: 'hours' as const, label: 'vs previous 24 hours' },
    weekly: { current: 168, baseline: 168, unit: 'hours' as const, label: 'vs last week' },
  },
} as const;

export type TimeWindow = keyof typeof ALERT_CONFIG.timeWindows;

interface CaseAggregation {
  businessUnit: string;
  category: string;
  count: number;
}

interface SpikeDetectionResult {
  businessUnit: string;
  category: string;
  baselineCount: number;
  currentCount: number;
  percentageChange: number;
  timeWindow: TimeWindow;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface ThresholdDetectionResult {
  businessUnit: string;
  currentCount: number;
  thresholdValue: number;
  timeWindow: TimeWindow;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Get date string for hours ago
 */
function getDateHoursAgo(hours: number): string {
  const date = new Date();
  date.setHours(date.getHours() - hours);
  return date.toISOString();
}

/**
 * Calculate severity based on percentage change
 */
function calculateSpikeSeverity(percentageChange: number): 'low' | 'medium' | 'high' | 'critical' {
  if (percentageChange >= 200) return 'critical';
  if (percentageChange >= 100) return 'high';
  if (percentageChange >= 65) return 'medium';
  return 'low';
}

/**
 * Format spike alert title
 * Format: "BU X: [Topic] +65% vs last week"
 */
export function formatSpikeAlertTitle(
  businessUnit: string,
  category: string,
  percentageChange: number,
  timeWindow: TimeWindow
): string {
  const windowLabel = ALERT_CONFIG.timeWindows[timeWindow].label;
  return `${businessUnit}: ${category} +${Math.round(percentageChange)}% ${windowLabel}`;
}

/**
 * Format spike alert description
 */
export function formatSpikeAlertDescription(
  businessUnit: string,
  category: string,
  baselineCount: number,
  currentCount: number,
  percentageChange: number,
  timeWindow: TimeWindow
): string {
  const windowConfig = ALERT_CONFIG.timeWindows[timeWindow];
  const timeDescription = windowConfig.unit === 'hours'
    ? `${windowConfig.current} hours`
    : `${windowConfig.current / 24} days`;

  return `${category} case volume in ${businessUnit} increased by ${Math.round(percentageChange)}% ` +
    `in the last ${timeDescription}. Current: ${currentCount} cases (baseline: ${baselineCount}).`;
}

/**
 * Get case counts grouped by business unit and category for a time period
 */
async function getCaseCountsByGroup(
  startDate: string,
  endDate?: string
): Promise<CaseAggregation[]> {
  const conditions = [gte(cases.createdAt, startDate)];

  if (endDate) {
    conditions.push(sql`${cases.createdAt} < ${endDate}`);
  }

  const results = await db
    .select({
      businessUnit: cases.businessUnit,
      category: cases.category,
      count: sql<number>`count(*)`.as('count'),
    })
    .from(cases)
    .where(and(...conditions))
    .groupBy(cases.businessUnit, cases.category);

  return results;
}

/**
 * Detect spike alerts by comparing current period vs baseline period
 *
 * Algorithm:
 * 1. Get case counts for current time window (e.g., last 24 hours)
 * 2. Get case counts for baseline period (e.g., previous 24 hours)
 * 3. For each BU/category combination, check if current > baseline * spike_factor
 * 4. Generate alerts for detected spikes
 */
export async function detectSpikeAlerts(
  timeWindow: TimeWindow = 'daily'
): Promise<SpikeDetectionResult[]> {
  const config = ALERT_CONFIG.timeWindows[timeWindow];
  const spikeConfig = ALERT_CONFIG.spike;

  // Calculate time boundaries
  const now = new Date().toISOString();
  const currentPeriodStart = getDateHoursAgo(config.current);
  const baselinePeriodStart = getDateHoursAgo(config.current + config.baseline);
  const baselinePeriodEnd = currentPeriodStart;

  // Get counts for both periods
  const [currentCounts, baselineCounts] = await Promise.all([
    getCaseCountsByGroup(currentPeriodStart, now),
    getCaseCountsByGroup(baselinePeriodStart, baselinePeriodEnd),
  ]);

  // Create lookup map for baseline counts
  const baselineMap = new Map<string, number>();
  for (const item of baselineCounts) {
    const key = `${item.businessUnit}|${item.category}`;
    baselineMap.set(key, item.count);
  }

  // Detect spikes
  const spikes: SpikeDetectionResult[] = [];

  for (const current of currentCounts) {
    const key = `${current.businessUnit}|${current.category}`;
    const baselineCount = baselineMap.get(key) || 0;

    // Skip if baseline is too low (avoid false positives)
    if (baselineCount < spikeConfig.minBaseline) {
      continue;
    }

    // Calculate percentage change
    const percentageChange = ((current.count - baselineCount) / baselineCount) * 100;

    // Check if this qualifies as a spike
    if (current.count > baselineCount * spikeConfig.factor) {
      spikes.push({
        businessUnit: current.businessUnit,
        category: current.category,
        baselineCount,
        currentCount: current.count,
        percentageChange,
        timeWindow,
        severity: calculateSpikeSeverity(percentageChange),
      });
    }
  }

  // Sort by percentage change (highest first)
  return spikes.sort((a, b) => b.percentageChange - a.percentageChange);
}

/**
 * Generate spike alerts and save to database
 */
export async function generateSpikeAlerts(
  timeWindow: TimeWindow = 'daily'
): Promise<NewAlert[]> {
  const spikes = await detectSpikeAlerts(timeWindow);
  const windowConfig = ALERT_CONFIG.timeWindows[timeWindow];

  const newAlerts: NewAlert[] = spikes.map((spike, index) => ({
    id: `alert-spike-${Date.now()}-${index}`,
    type: 'spike' as const,
    severity: spike.severity,
    title: formatSpikeAlertTitle(
      spike.businessUnit,
      spike.category,
      spike.percentageChange,
      timeWindow
    ),
    description: formatSpikeAlertDescription(
      spike.businessUnit,
      spike.category,
      spike.baselineCount,
      spike.currentCount,
      spike.percentageChange,
      timeWindow
    ),
    businessUnit: spike.businessUnit,
    category: spike.category,
    channel: null,
    baselineValue: spike.baselineCount,
    currentValue: spike.currentCount,
    percentageChange: spike.percentageChange,
    status: 'active' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  // Insert alerts if any were generated
  if (newAlerts.length > 0) {
    await db.insert(alerts).values(newAlerts);
  }

  return newAlerts;
}

/**
 * Get time window display label for UI
 */
export function getTimeWindowLabel(timeWindow: TimeWindow): string {
  return ALERT_CONFIG.timeWindows[timeWindow].label;
}

/**
 * Get time window description for detailed view
 */
export function getTimeWindowDescription(timeWindow: TimeWindow): string {
  const config = ALERT_CONFIG.timeWindows[timeWindow];
  if (config.unit === 'hours') {
    if (config.current >= 24) {
      const days = config.current / 24;
      return `Last ${days} day${days > 1 ? 's' : ''} compared to previous ${days} day${days > 1 ? 's' : ''}`;
    }
    return `Last ${config.current} hours compared to previous ${config.baseline} hours`;
  }
  return config.label;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Threshold Alert Detection
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get the threshold value for a business unit and time window
 */
function getThresholdForBU(businessUnit: string, timeWindow: TimeWindow): number {
  const buThresholds = ALERT_CONFIG.threshold.byBusinessUnit[businessUnit];
  if (buThresholds) {
    return buThresholds[timeWindow];
  }
  return ALERT_CONFIG.threshold.defaults[timeWindow];
}

/**
 * Calculate severity based on how much the count exceeds the threshold
 * - 1.0x-1.5x threshold = low
 * - 1.5x-2.0x threshold = medium
 * - 2.0x-3.0x threshold = high
 * - 3.0x+ threshold = critical
 */
function calculateThresholdSeverity(
  count: number,
  threshold: number
): 'low' | 'medium' | 'high' | 'critical' {
  const ratio = count / threshold;
  if (ratio >= 3.0) return 'critical';
  if (ratio >= 2.0) return 'high';
  if (ratio >= 1.5) return 'medium';
  return 'low';
}

/**
 * Format threshold alert title
 * Format: "High volume: [Count] cases in [BU]"
 */
export function formatThresholdAlertTitle(
  businessUnit: string,
  count: number
): string {
  return `High volume: ${count} cases in ${businessUnit}`;
}

/**
 * Format threshold alert description
 */
export function formatThresholdAlertDescription(
  businessUnit: string,
  count: number,
  threshold: number,
  timeWindow: TimeWindow
): string {
  const windowConfig = ALERT_CONFIG.timeWindows[timeWindow];
  const timeDescription = windowConfig.unit === 'hours'
    ? windowConfig.current >= 24
      ? `${windowConfig.current / 24} days`
      : `${windowConfig.current} hours`
    : 'the period';

  const excess = count - threshold;
  const percentOver = Math.round(((count - threshold) / threshold) * 100);

  return `Case volume in ${businessUnit} has exceeded the threshold. ` +
    `Current: ${count} cases in the last ${timeDescription} ` +
    `(threshold: ${threshold}, +${excess} cases / +${percentOver}% over limit).`;
}

/**
 * Get case counts grouped by business unit for a time period
 */
async function getCaseCountsByBusinessUnit(
  startDate: string,
  endDate?: string
): Promise<{ businessUnit: string; count: number }[]> {
  const conditions = [gte(cases.createdAt, startDate)];

  if (endDate) {
    conditions.push(sql`${cases.createdAt} < ${endDate}`);
  }

  const results = await db
    .select({
      businessUnit: cases.businessUnit,
      count: sql<number>`count(*)`.as('count'),
    })
    .from(cases)
    .where(and(...conditions))
    .groupBy(cases.businessUnit);

  return results;
}

/**
 * Detect threshold alerts by comparing current counts against configured limits
 *
 * Algorithm:
 * 1. Get case counts for current time window grouped by business unit
 * 2. For each business unit, get the applicable threshold
 * 3. If count exceeds threshold, generate an alert
 */
export async function detectThresholdAlerts(
  timeWindow: TimeWindow = 'daily'
): Promise<ThresholdDetectionResult[]> {
  const windowConfig = ALERT_CONFIG.timeWindows[timeWindow];

  // Calculate time boundaries
  const now = new Date().toISOString();
  const periodStart = getDateHoursAgo(windowConfig.current);

  // Get counts for the current period
  const counts = await getCaseCountsByBusinessUnit(periodStart, now);

  // Detect threshold violations
  const violations: ThresholdDetectionResult[] = [];

  for (const { businessUnit, count } of counts) {
    const threshold = getThresholdForBU(businessUnit, timeWindow);

    if (count > threshold) {
      violations.push({
        businessUnit,
        currentCount: count,
        thresholdValue: threshold,
        timeWindow,
        severity: calculateThresholdSeverity(count, threshold),
      });
    }
  }

  // Sort by severity (critical first), then by count (highest first)
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  return violations.sort((a, b) => {
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (severityDiff !== 0) return severityDiff;
    return b.currentCount - a.currentCount;
  });
}

/**
 * Generate threshold alerts and save to database
 */
export async function generateThresholdAlerts(
  timeWindow: TimeWindow = 'daily'
): Promise<NewAlert[]> {
  const violations = await detectThresholdAlerts(timeWindow);

  const newAlerts: NewAlert[] = violations.map((violation, index) => ({
    id: `alert-threshold-${Date.now()}-${index}`,
    type: 'threshold' as const,
    severity: violation.severity,
    title: formatThresholdAlertTitle(
      violation.businessUnit,
      violation.currentCount
    ),
    description: formatThresholdAlertDescription(
      violation.businessUnit,
      violation.currentCount,
      violation.thresholdValue,
      timeWindow
    ),
    businessUnit: violation.businessUnit,
    category: null,
    channel: null,
    baselineValue: violation.thresholdValue,
    currentValue: violation.currentCount,
    percentageChange: ((violation.currentCount - violation.thresholdValue) / violation.thresholdValue) * 100,
    status: 'active' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  // Insert alerts if any were generated
  if (newAlerts.length > 0) {
    await db.insert(alerts).values(newAlerts);
  }

  return newAlerts;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Urgency Alert Detection
// ═══════════════════════════════════════════════════════════════════════════════

interface UrgencyDetectionResult {
  businessUnit: string;
  caseCount: number;
  matchedKeywords: string[];
  sampleCaseIds: string[];
  severity: 'high' | 'critical';
}

/**
 * Check if text contains any of the risk keywords
 */
function findMatchingKeywords(text: string): string[] {
  const lowerText = text.toLowerCase();
  return ALERT_CONFIG.urgency.riskKeywords.filter(keyword =>
    lowerText.includes(keyword.toLowerCase())
  );
}

/**
 * Calculate urgency alert severity based on case count and keyword matches
 * - 5+ cases or critical keywords = critical
 * - Otherwise = high
 */
function calculateUrgencySeverity(
  caseCount: number,
  matchedKeywords: string[]
): 'high' | 'critical' {
  const criticalKeywords = ['death', 'fatality', 'lawsuit', 'attorney', 'emergency'];
  const hasCriticalKeyword = matchedKeywords.some(k =>
    criticalKeywords.includes(k.toLowerCase())
  );

  if (caseCount >= 5 || hasCriticalKeyword) {
    return 'critical';
  }
  return 'high';
}

/**
 * Format urgency alert title
 * Format: "Urgent: [Count] high-risk cases detected"
 */
export function formatUrgencyAlertTitle(
  caseCount: number,
  businessUnit?: string
): string {
  const buSuffix = businessUnit ? ` in ${businessUnit}` : '';
  return `Urgent: ${caseCount} high-risk case${caseCount !== 1 ? 's' : ''} detected${buSuffix}`;
}

/**
 * Format urgency alert description
 */
export function formatUrgencyAlertDescription(
  caseCount: number,
  matchedKeywords: string[],
  businessUnit?: string,
  timeWindow: TimeWindow = 'daily'
): string {
  const windowConfig = ALERT_CONFIG.timeWindows[timeWindow];
  const timeDescription = windowConfig.unit === 'hours'
    ? windowConfig.current >= 24
      ? `${windowConfig.current / 24} days`
      : `${windowConfig.current} hours`
    : 'the period';

  const keywordsList = matchedKeywords.slice(0, 5).join(', ');
  const buPhrase = businessUnit ? ` in ${businessUnit}` : '';

  return `${caseCount} high-severity case${caseCount !== 1 ? 's' : ''}${buPhrase} ` +
    `contain${caseCount === 1 ? 's' : ''} risk indicators in the last ${timeDescription}. ` +
    `Keywords detected: ${keywordsList}${matchedKeywords.length > 5 ? ` (+${matchedKeywords.length - 5} more)` : ''}. ` +
    `Immediate review recommended.`;
}

/**
 * Get high-severity cases with risk keywords in their summary
 */
async function getHighRiskCases(
  startDate: string,
  endDate?: string
): Promise<{ id: string; businessUnit: string; summary: string; severity: string }[]> {
  const conditions = [
    gte(cases.createdAt, startDate),
    sql`${cases.severity} IN ('high', 'critical')`,
  ];

  if (endDate) {
    conditions.push(sql`${cases.createdAt} < ${endDate}`);
  }

  const results = await db
    .select({
      id: cases.id,
      businessUnit: cases.businessUnit,
      summary: cases.summary,
      severity: cases.severity,
    })
    .from(cases)
    .where(and(...conditions));

  return results;
}

/**
 * Detect urgency alerts by scanning high-severity cases for risk keywords
 *
 * Algorithm:
 * 1. Get all high/critical severity cases in the time window
 * 2. Scan each case summary for risk keywords
 * 3. Group matching cases by business unit
 * 4. Generate alerts for groups that meet the minimum threshold
 */
export async function detectUrgencyAlerts(
  timeWindow: TimeWindow = 'daily'
): Promise<UrgencyDetectionResult[]> {
  const windowConfig = ALERT_CONFIG.timeWindows[timeWindow];
  const urgencyConfig = ALERT_CONFIG.urgency;

  // Calculate time boundaries
  const now = new Date().toISOString();
  const periodStart = getDateHoursAgo(windowConfig.current);

  // Get high-severity cases
  const highSeverityCases = await getHighRiskCases(periodStart, now);

  // Group cases by business unit with keyword matches
  const buGroups = new Map<string, {
    caseIds: string[];
    keywords: Set<string>;
  }>();

  for (const caseItem of highSeverityCases) {
    const matchedKeywords = findMatchingKeywords(caseItem.summary);

    if (matchedKeywords.length > 0) {
      const existing = buGroups.get(caseItem.businessUnit);
      if (existing) {
        existing.caseIds.push(caseItem.id);
        matchedKeywords.forEach(k => existing.keywords.add(k));
      } else {
        buGroups.set(caseItem.businessUnit, {
          caseIds: [caseItem.id],
          keywords: new Set(matchedKeywords),
        });
      }
    }
  }

  // Build detection results
  const results: UrgencyDetectionResult[] = [];

  for (const [businessUnit, data] of buGroups) {
    if (data.caseIds.length >= urgencyConfig.minCaseCount) {
      const matchedKeywords = Array.from(data.keywords);
      results.push({
        businessUnit,
        caseCount: data.caseIds.length,
        matchedKeywords,
        sampleCaseIds: data.caseIds.slice(0, 5), // Keep up to 5 sample cases
        severity: calculateUrgencySeverity(data.caseIds.length, matchedKeywords),
      });
    }
  }

  // Sort by severity (critical first), then by case count (highest first)
  const severityOrder = { critical: 0, high: 1 };
  return results.sort((a, b) => {
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (severityDiff !== 0) return severityDiff;
    return b.caseCount - a.caseCount;
  });
}

/**
 * Generate urgency alerts and save to database
 */
export async function generateUrgencyAlerts(
  timeWindow: TimeWindow = 'daily'
): Promise<NewAlert[]> {
  const urgencyResults = await detectUrgencyAlerts(timeWindow);

  const newAlerts: NewAlert[] = urgencyResults.map((result, index) => ({
    id: `alert-urgency-${Date.now()}-${index}`,
    type: 'urgency' as const,
    severity: result.severity,
    title: formatUrgencyAlertTitle(result.caseCount, result.businessUnit),
    description: formatUrgencyAlertDescription(
      result.caseCount,
      result.matchedKeywords,
      result.businessUnit,
      timeWindow
    ),
    businessUnit: result.businessUnit,
    category: null,
    channel: null,
    baselineValue: null, // Urgency alerts don't have baseline values
    currentValue: result.caseCount,
    percentageChange: null,
    status: 'active' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  // Insert alerts if any were generated
  if (newAlerts.length > 0) {
    await db.insert(alerts).values(newAlerts);
  }

  return newAlerts;
}

/**
 * Get sample cases for an urgency alert
 */
export async function getUrgencySampleCases(
  businessUnit: string,
  timeWindow: TimeWindow = 'daily',
  limit: number = 5
): Promise<{ id: string; caseNumber: string; summary: string; severity: string; matchedKeywords: string[] }[]> {
  const windowConfig = ALERT_CONFIG.timeWindows[timeWindow];
  const periodStart = getDateHoursAgo(windowConfig.current);
  const now = new Date().toISOString();

  const highSeverityCases = await db
    .select({
      id: cases.id,
      caseNumber: cases.caseNumber,
      summary: cases.summary,
      severity: cases.severity,
    })
    .from(cases)
    .where(and(
      gte(cases.createdAt, periodStart),
      sql`${cases.createdAt} < ${now}`,
      eq(cases.businessUnit, businessUnit),
      sql`${cases.severity} IN ('high', 'critical')`
    ))
    .limit(limit * 2); // Get more than needed to filter

  // Filter to cases with risk keywords
  const matchingCases = highSeverityCases
    .map(c => ({
      ...c,
      matchedKeywords: findMatchingKeywords(c.summary),
    }))
    .filter(c => c.matchedKeywords.length > 0)
    .slice(0, limit);

  return matchingCases;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Misclassification Alert Detection
// ═══════════════════════════════════════════════════════════════════════════════

interface MisclassificationDetectionResult {
  businessUnit: string;
  caseCount: number;
  matchedKeywords: string[];
  sampleCaseIds: string[];
  severity: 'medium' | 'high';
}

/**
 * Check if text contains any of the misclassification risk keywords
 */
function findMisclassificationKeywords(text: string): string[] {
  const lowerText = text.toLowerCase();
  return ALERT_CONFIG.misclassification.riskKeywords.filter(keyword =>
    lowerText.includes(keyword.toLowerCase())
  );
}

/**
 * Calculate misclassification alert severity based on case count and keyword matches
 * - 5+ cases or critical keywords = high
 * - Otherwise = medium
 */
function calculateMisclassificationSeverity(
  caseCount: number,
  matchedKeywords: string[]
): 'medium' | 'high' {
  const highPriorityKeywords = ['death', 'fatality', 'lawsuit', 'attorney', 'emergency', 'injury'];
  const hasHighPriorityKeyword = matchedKeywords.some(k =>
    highPriorityKeywords.includes(k.toLowerCase())
  );

  if (caseCount >= 5 || hasHighPriorityKeyword) {
    return 'high';
  }
  return 'medium';
}

/**
 * Format misclassification alert title
 * Format: "Review needed: [Count] potentially misclassified"
 */
export function formatMisclassificationAlertTitle(
  caseCount: number,
  businessUnit?: string
): string {
  const buSuffix = businessUnit ? ` in ${businessUnit}` : '';
  return `Review needed: ${caseCount} potentially misclassified case${caseCount !== 1 ? 's' : ''}${buSuffix}`;
}

/**
 * Format misclassification alert description
 */
export function formatMisclassificationAlertDescription(
  caseCount: number,
  matchedKeywords: string[],
  businessUnit?: string,
  timeWindow: TimeWindow = 'daily'
): string {
  const windowConfig = ALERT_CONFIG.timeWindows[timeWindow];
  const timeDescription = windowConfig.unit === 'hours'
    ? windowConfig.current >= 24
      ? `${windowConfig.current / 24} days`
      : `${windowConfig.current} hours`
    : 'the period';

  const keywordsList = matchedKeywords.slice(0, 5).join(', ');
  const buPhrase = businessUnit ? ` in ${businessUnit}` : '';

  return `${caseCount} low-severity case${caseCount !== 1 ? 's' : ''}${buPhrase} ` +
    `contain${caseCount === 1 ? 's' : ''} risk indicators that may warrant reclassification. ` +
    `Found in the last ${timeDescription}. ` +
    `Keywords detected: ${keywordsList}${matchedKeywords.length > 5 ? ` (+${matchedKeywords.length - 5} more)` : ''}. ` +
    `Review recommended to ensure proper severity assignment.`;
}

/**
 * Get low-severity cases with risk keywords in their summary
 */
async function getLowSeverityCasesWithRiskKeywords(
  startDate: string,
  endDate?: string
): Promise<{ id: string; businessUnit: string; summary: string; severity: string }[]> {
  const conditions = [
    gte(cases.createdAt, startDate),
    sql`${cases.severity} IN ('low', 'medium')`,
  ];

  if (endDate) {
    conditions.push(sql`${cases.createdAt} < ${endDate}`);
  }

  const results = await db
    .select({
      id: cases.id,
      businessUnit: cases.businessUnit,
      summary: cases.summary,
      severity: cases.severity,
    })
    .from(cases)
    .where(and(...conditions));

  return results;
}

/**
 * Detect misclassification alerts by scanning low-severity cases for risk keywords
 *
 * Algorithm:
 * 1. Get all low/medium severity cases in the time window
 * 2. Scan each case summary for risk keywords
 * 3. Group matching cases by business unit
 * 4. Generate alerts for groups that meet the minimum threshold
 */
export async function detectMisclassificationAlerts(
  timeWindow: TimeWindow = 'daily'
): Promise<MisclassificationDetectionResult[]> {
  const windowConfig = ALERT_CONFIG.timeWindows[timeWindow];
  const misclassConfig = ALERT_CONFIG.misclassification;

  // Calculate time boundaries
  const now = new Date().toISOString();
  const periodStart = getDateHoursAgo(windowConfig.current);

  // Get low-severity cases
  const lowSeverityCases = await getLowSeverityCasesWithRiskKeywords(periodStart, now);

  // Group cases by business unit with keyword matches
  const buGroups = new Map<string, {
    caseIds: string[];
    keywords: Set<string>;
  }>();

  for (const caseItem of lowSeverityCases) {
    const matchedKeywords = findMisclassificationKeywords(caseItem.summary);

    if (matchedKeywords.length > 0) {
      const existing = buGroups.get(caseItem.businessUnit);
      if (existing) {
        existing.caseIds.push(caseItem.id);
        matchedKeywords.forEach(k => existing.keywords.add(k));
      } else {
        buGroups.set(caseItem.businessUnit, {
          caseIds: [caseItem.id],
          keywords: new Set(matchedKeywords),
        });
      }
    }
  }

  // Build detection results
  const results: MisclassificationDetectionResult[] = [];

  for (const [businessUnit, data] of buGroups) {
    if (data.caseIds.length >= misclassConfig.minCaseCount) {
      const matchedKeywords = Array.from(data.keywords);
      results.push({
        businessUnit,
        caseCount: data.caseIds.length,
        matchedKeywords,
        sampleCaseIds: data.caseIds.slice(0, 5), // Keep up to 5 sample cases
        severity: calculateMisclassificationSeverity(data.caseIds.length, matchedKeywords),
      });
    }
  }

  // Sort by severity (high first), then by case count (highest first)
  const severityOrder = { high: 0, medium: 1 };
  return results.sort((a, b) => {
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (severityDiff !== 0) return severityDiff;
    return b.caseCount - a.caseCount;
  });
}

/**
 * Generate misclassification alerts and save to database
 */
export async function generateMisclassificationAlerts(
  timeWindow: TimeWindow = 'daily'
): Promise<NewAlert[]> {
  const misclassResults = await detectMisclassificationAlerts(timeWindow);

  const newAlerts: NewAlert[] = misclassResults.map((result, index) => ({
    id: `alert-misclass-${Date.now()}-${index}`,
    type: 'misclassification' as const,
    severity: result.severity,
    title: formatMisclassificationAlertTitle(result.caseCount, result.businessUnit),
    description: formatMisclassificationAlertDescription(
      result.caseCount,
      result.matchedKeywords,
      result.businessUnit,
      timeWindow
    ),
    businessUnit: result.businessUnit,
    category: null,
    channel: null,
    baselineValue: null, // Misclassification alerts don't have baseline values
    currentValue: result.caseCount,
    percentageChange: null,
    status: 'active' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  // Insert alerts if any were generated
  if (newAlerts.length > 0) {
    await db.insert(alerts).values(newAlerts);
  }

  return newAlerts;
}

/**
 * Get sample cases for a misclassification alert
 */
export async function getMisclassificationSampleCases(
  businessUnit: string,
  timeWindow: TimeWindow = 'daily',
  limit: number = 5
): Promise<{ id: string; caseNumber: string; summary: string; severity: string; matchedKeywords: string[] }[]> {
  const windowConfig = ALERT_CONFIG.timeWindows[timeWindow];
  const periodStart = getDateHoursAgo(windowConfig.current);
  const now = new Date().toISOString();

  const lowSeverityCases = await db
    .select({
      id: cases.id,
      caseNumber: cases.caseNumber,
      summary: cases.summary,
      severity: cases.severity,
    })
    .from(cases)
    .where(and(
      gte(cases.createdAt, periodStart),
      sql`${cases.createdAt} < ${now}`,
      eq(cases.businessUnit, businessUnit),
      sql`${cases.severity} IN ('low', 'medium')`
    ))
    .limit(limit * 2); // Get more than needed to filter

  // Filter to cases with risk keywords
  const matchingCases = lowSeverityCases
    .map(c => ({
      ...c,
      matchedKeywords: findMisclassificationKeywords(c.summary),
    }))
    .filter(c => c.matchedKeywords.length > 0)
    .slice(0, limit);

  return matchingCases;
}
