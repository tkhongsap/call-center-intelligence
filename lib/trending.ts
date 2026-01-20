/**
 * Trending Topic Analysis Service
 *
 * Implements term extraction and trend computation for call center cases:
 * - Extract significant terms from case descriptions
 * - Stop word removal
 * - Bigram extraction (two-word phrases)
 * - Term normalization
 * - Trend score calculation
 */

// ═══════════════════════════════════════════════════════════════════════════════
// Stop Words List
// ═══════════════════════════════════════════════════════════════════════════════

const STOP_WORDS = new Set([
  // Common English stop words
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
  'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought',
  'used', 'this', 'that', 'these', 'those', 'am', 'your', 'yours', 'yourself',
  'he', 'she', 'it', 'we', 'they', 'them', 'their', 'his', 'her', 'its',
  'our', 'me', 'him', 'my', 'i', 'you', 'who', 'whom', 'which', 'what',
  'where', 'when', 'why', 'how', 'all', 'each', 'every', 'both', 'few',
  'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only',
  'own', 'same', 'so', 'than', 'too', 'very', 'just', 'also', 'now',
  'here', 'there', 'then', 'once', 'if', 'because', 'until', 'while',
  'about', 'against', 'between', 'into', 'through', 'during', 'before',
  'after', 'above', 'below', 'up', 'down', 'out', 'off', 'over', 'under',
  'again', 'further', 'being', 'having', 'doing', 'any', 'dont', 'doesnt',
  'didnt', 'wont', 'wouldnt', 'couldnt', 'shouldnt', 'cant', 'cannot',
  'aint', 'isnt', 'wasnt', 'arent', 'werent', 'hasnt', 'havent', 'hadnt',
  'lets', 'thats', 'whos', 'whats', 'heres', 'theres', 'wheres', 'whens',
  'whys', 'hows', 'get', 'got', 'getting', 'go', 'going', 'gone', 'went',
  // Call center specific stop words
  'customer', 'call', 'called', 'calling', 'phone', 'email', 'sent', 'send',
  'service', 'support', 'help', 'request', 'requested', 'agent', 'rep',
  'representative', 'case', 'ticket', 'issue', 'problem', 'reported',
  'contacted', 'contact', 'inquiry', 'question', 'asked', 'ask', 'says',
  'said', 'told', 'tell', 'please', 'thank', 'thanks', 'regarding', 're',
  'per', 'via', 'etc', 'ie', 'eg', 'hello', 'hi', 'dear', 'sincerely',
  'regards', 'best', 'team', 'department', 'company', 'received', 'receive',
]);

// ═══════════════════════════════════════════════════════════════════════════════
// Term Extraction
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Normalize a term to lowercase and remove punctuation
 */
export function normalizeTerm(term: string): string {
  return term
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove punctuation except hyphens
    .replace(/\s+/g, ' ')     // Normalize whitespace
    .trim();
}

/**
 * Check if a term is significant (not a stop word and meets length requirements)
 */
export function isSignificantTerm(term: string): boolean {
  const normalized = normalizeTerm(term);
  // Must be at least 3 characters and not a stop word
  return normalized.length >= 3 && !STOP_WORDS.has(normalized);
}

/**
 * Extract individual words (unigrams) from text
 */
export function extractUnigrams(text: string): string[] {
  const normalized = normalizeTerm(text);
  const words = normalized.split(/\s+/);
  return words.filter(isSignificantTerm);
}

/**
 * Extract two-word phrases (bigrams) from text
 */
export function extractBigrams(text: string): string[] {
  const normalized = normalizeTerm(text);
  const words = normalized.split(/\s+/);
  const bigrams: string[] = [];

  for (let i = 0; i < words.length - 1; i++) {
    const word1 = words[i];
    const word2 = words[i + 1];

    // Both words must be significant for the bigram to be included
    if (isSignificantTerm(word1) && isSignificantTerm(word2)) {
      bigrams.push(`${word1} ${word2}`);
    }
  }

  return bigrams;
}

/**
 * Extract all significant terms from text (unigrams + bigrams)
 */
export function extractTerms(text: string): string[] {
  const unigrams = extractUnigrams(text);
  const bigrams = extractBigrams(text);
  return [...unigrams, ...bigrams];
}

/**
 * Count term frequencies from an array of texts
 */
export function countTermFrequencies(texts: string[]): Map<string, number> {
  const frequencies = new Map<string, number>();

  for (const text of texts) {
    const terms = extractTerms(text);
    // Use a Set to count each term only once per document (document frequency)
    const uniqueTerms = new Set(terms);

    for (const term of uniqueTerms) {
      frequencies.set(term, (frequencies.get(term) || 0) + 1);
    }
  }

  return frequencies;
}

/**
 * Get top N terms by frequency
 */
export function getTopTerms(
  frequencies: Map<string, number>,
  limit: number = 10
): Array<{ term: string; count: number }> {
  const sorted = Array.from(frequencies.entries())
    .map(([term, count]) => ({ term, count }))
    .sort((a, b) => b.count - a.count);

  return sorted.slice(0, limit);
}

// ═══════════════════════════════════════════════════════════════════════════════
// Trend Score Calculation
// ═══════════════════════════════════════════════════════════════════════════════

export interface TrendData {
  term: string;
  currentCount: number;
  baselineCount: number;
  percentChange: number;
  trendScore: number;
  direction: 'rising' | 'stable' | 'declining';
}

/**
 * Configuration for trend computation
 */
export const TREND_CONFIG = {
  minOccurrences: 5,        // Minimum count to be considered a trend
  maxScore: 1000,           // Cap on trend score to prevent outliers
  velocityBonus: 1.5,       // Multiplier for rapid growth (>100% increase)
  stableThreshold: 10,      // +/- percentage for "stable" classification
};

/**
 * Calculate the percent change between baseline and current counts
 */
export function calculatePercentChange(current: number, baseline: number): number {
  if (baseline === 0) {
    return current > 0 ? 100 : 0; // New term = 100% increase
  }
  return ((current - baseline) / baseline) * 100;
}

/**
 * Calculate trend score using: percent_change * log(current_count + 1)
 * With velocity bonus for rapid growth
 */
export function calculateTrendScore(
  currentCount: number,
  baselineCount: number
): number {
  const percentChange = calculatePercentChange(currentCount, baselineCount);

  // Only positive trends get a score
  if (percentChange <= 0) {
    return 0;
  }

  // Base score: percent change * log of volume
  let score = percentChange * Math.log(currentCount + 1);

  // Velocity bonus for rapid growth (>100% increase)
  if (percentChange > 100) {
    score *= TREND_CONFIG.velocityBonus;
  }

  // Cap to prevent outliers
  return Math.min(score, TREND_CONFIG.maxScore);
}

/**
 * Determine trend direction based on percent change
 */
export function getTrendDirection(percentChange: number): 'rising' | 'stable' | 'declining' {
  if (percentChange > TREND_CONFIG.stableThreshold) {
    return 'rising';
  }
  if (percentChange < -TREND_CONFIG.stableThreshold) {
    return 'declining';
  }
  return 'stable';
}

/**
 * Compute trends by comparing current vs baseline term frequencies
 */
export function computeTrends(
  currentFrequencies: Map<string, number>,
  baselineFrequencies: Map<string, number>
): TrendData[] {
  const trends: TrendData[] = [];

  // Process all terms in current period
  for (const [term, currentCount] of currentFrequencies) {
    // Skip terms below minimum threshold
    if (currentCount < TREND_CONFIG.minOccurrences) {
      continue;
    }

    const baselineCount = baselineFrequencies.get(term) || 0;
    const percentChange = calculatePercentChange(currentCount, baselineCount);
    const trendScore = calculateTrendScore(currentCount, baselineCount);
    const direction = getTrendDirection(percentChange);

    trends.push({
      term,
      currentCount,
      baselineCount,
      percentChange,
      trendScore,
      direction,
    });
  }

  // Sort by trend score (highest first)
  return trends.sort((a, b) => b.trendScore - a.trendScore);
}

/**
 * Get top trending terms
 */
export function getTopTrending(
  currentFrequencies: Map<string, number>,
  baselineFrequencies: Map<string, number>,
  limit: number = 5
): TrendData[] {
  const trends = computeTrends(currentFrequencies, baselineFrequencies);
  // Only return rising trends
  return trends.filter(t => t.direction === 'rising').slice(0, limit);
}

// ═══════════════════════════════════════════════════════════════════════════════
// Time Window Types and Constants
// ═══════════════════════════════════════════════════════════════════════════════

export type TimeWindow = '24h' | '7d';

export interface TimeWindowRange {
  currentStart: Date;
  currentEnd: Date;
  baselineStart: Date;
  baselineEnd: Date;
}

/**
 * Get date ranges for a time window comparison
 * - 24h: Last 24 hours vs previous 24 hours (24-48h ago)
 * - 7d: Last 7 days vs previous 7 days (7-14d ago)
 */
export function getTimeWindowRanges(window: TimeWindow, referenceDate?: Date): TimeWindowRange {
  const now = referenceDate || new Date();

  if (window === '24h') {
    const currentEnd = now;
    const currentStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const baselineEnd = currentStart;
    const baselineStart = new Date(baselineEnd.getTime() - 24 * 60 * 60 * 1000);

    return { currentStart, currentEnd, baselineStart, baselineEnd };
  } else {
    // 7d window
    const currentEnd = now;
    const currentStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const baselineEnd = currentStart;
    const baselineStart = new Date(baselineEnd.getTime() - 7 * 24 * 60 * 60 * 1000);

    return { currentStart, currentEnd, baselineStart, baselineEnd };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Database-Backed Trend Computation
// ═══════════════════════════════════════════════════════════════════════════════

export interface CaseData {
  id: string;
  summary: string;
  businessUnit: string;
  category: string;
  createdAt: string;
}

export interface TrendingTopicData extends TrendData {
  impactedBUs: string[];
  sampleCases: CaseData[];
}

/**
 * Count term frequencies from cases within a date range
 */
export function countTermsInCases(cases: CaseData[]): Map<string, number> {
  return countTermFrequencies(cases.map(c => c.summary));
}

/**
 * Get cases containing a specific term
 */
export function getCasesWithTerm(cases: CaseData[], term: string): CaseData[] {
  const normalizedTerm = normalizeTerm(term);
  return cases.filter(c => {
    const caseTerms = extractTerms(c.summary);
    return caseTerms.includes(normalizedTerm);
  });
}

/**
 * Get impacted BUs for a term
 */
export function getImpactedBUs(cases: CaseData[], term: string): string[] {
  const matchingCases = getCasesWithTerm(cases, term);
  const buSet = new Set(matchingCases.map(c => c.businessUnit));
  return Array.from(buSet);
}

/**
 * Compute trending topics with full metadata from case data
 */
export function computeTrendingTopics(
  currentCases: CaseData[],
  baselineCases: CaseData[],
  limit: number = 5
): TrendingTopicData[] {
  const currentFrequencies = countTermsInCases(currentCases);
  const baselineFrequencies = countTermsInCases(baselineCases);

  const trends = getTopTrending(currentFrequencies, baselineFrequencies, limit);

  return trends.map(trend => {
    const matchingCases = getCasesWithTerm(currentCases, trend.term);
    const impactedBUs = getImpactedBUs(currentCases, trend.term);

    // Get up to 3 sample cases
    const sampleCases = matchingCases.slice(0, 3);

    return {
      ...trend,
      impactedBUs,
      sampleCases,
    };
  });
}

/**
 * Filter cases by date range
 */
export function filterCasesByDateRange(
  cases: CaseData[],
  startDate: Date,
  endDate: Date
): CaseData[] {
  const startISO = startDate.toISOString();
  const endISO = endDate.toISOString();

  return cases.filter(c => {
    return c.createdAt >= startISO && c.createdAt <= endISO;
  });
}

/**
 * Compute trending topics for a specific time window
 */
export function computeTrendingForWindow(
  allCases: CaseData[],
  window: TimeWindow,
  limit: number = 5,
  referenceDate?: Date
): TrendingTopicData[] {
  const ranges = getTimeWindowRanges(window, referenceDate);

  const currentCases = filterCasesByDateRange(
    allCases,
    ranges.currentStart,
    ranges.currentEnd
  );

  const baselineCases = filterCasesByDateRange(
    allCases,
    ranges.baselineStart,
    ranges.baselineEnd
  );

  return computeTrendingTopics(currentCases, baselineCases, limit);
}

// ═══════════════════════════════════════════════════════════════════════════════
// Predicted Risk Detection
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Configuration for predicted risk detection
 */
export const PREDICTION_CONFIG = {
  consecutiveWindowsThreshold: 3,      // Number of consecutive rising windows to trigger
  alertThresholdPercentage: 80,        // % of threshold to trigger "approaching threshold" warning
  defaultAlertThreshold: 100,          // Default threshold for spike alerts
  growthRateMultiplier: 1.5,           // Multiplier indicating accelerating growth
  minCasesForPrediction: 5,            // Minimum cases to generate a prediction
};

export type PredictionType =
  | 'consecutive_increase'
  | 'approaching_threshold'
  | 'accelerating_growth';

export interface PredictedRisk {
  id: string;
  term: string;
  type: PredictionType;
  severity: 'low' | 'medium' | 'high';
  title: string;
  explanation: string;
  currentCount: number;
  projectedCount?: number;
  threshold?: number;
  daysToThreshold?: number;
  consecutiveDays?: number;
  growthRate?: number;
  impactedBUs: string[];
  sampleCases: CaseData[];
  createdAt: string;
}

/**
 * Count cases per day for a term within a date range
 */
export function getTermDailyCounts(
  cases: CaseData[],
  term: string,
  days: number,
  referenceDate?: Date
): number[] {
  const now = referenceDate || new Date();
  const counts: number[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);
    dayStart.setDate(dayStart.getDate() - i);

    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);

    const dayCases = filterCasesByDateRange(cases, dayStart, dayEnd);
    const matchingCases = getCasesWithTerm(dayCases, term);
    counts.push(matchingCases.length);
  }

  return counts;
}

/**
 * Detect if a term has been rising for N consecutive windows
 */
export function detectConsecutiveRising(
  dailyCounts: number[],
  threshold: number = PREDICTION_CONFIG.consecutiveWindowsThreshold
): { isRising: boolean; consecutiveDays: number } {
  if (dailyCounts.length < threshold) {
    return { isRising: false, consecutiveDays: 0 };
  }

  let consecutiveDays = 0;

  // Check from the most recent days backwards
  for (let i = dailyCounts.length - 1; i > 0; i--) {
    if (dailyCounts[i] > dailyCounts[i - 1]) {
      consecutiveDays++;
    } else {
      break;
    }
  }

  return {
    isRising: consecutiveDays >= threshold - 1,
    consecutiveDays: consecutiveDays + 1, // Add 1 because we count days not increases
  };
}

/**
 * Detect if a term is approaching alert threshold
 */
export function detectApproachingThreshold(
  currentCount: number,
  threshold: number = PREDICTION_CONFIG.defaultAlertThreshold,
  percentageThreshold: number = PREDICTION_CONFIG.alertThresholdPercentage
): { isApproaching: boolean; percentOfThreshold: number } {
  const percentOfThreshold = (currentCount / threshold) * 100;
  return {
    isApproaching: percentOfThreshold >= percentageThreshold && percentOfThreshold < 100,
    percentOfThreshold,
  };
}

/**
 * Calculate growth rate and detect accelerating growth
 */
export function detectAcceleratingGrowth(
  dailyCounts: number[]
): { isAccelerating: boolean; growthRate: number; projectedCount: number } {
  if (dailyCounts.length < 4) {
    return { isAccelerating: false, growthRate: 0, projectedCount: 0 };
  }

  // Calculate recent growth rate (last 2 days)
  const recentCounts = dailyCounts.slice(-2);
  const recentGrowth = recentCounts[0] > 0
    ? (recentCounts[1] - recentCounts[0]) / recentCounts[0]
    : 0;

  // Calculate earlier growth rate (2-4 days ago)
  const earlierCounts = dailyCounts.slice(-4, -2);
  const earlierGrowth = earlierCounts[0] > 0
    ? (earlierCounts[1] - earlierCounts[0]) / earlierCounts[0]
    : 0;

  // Check if growth is accelerating
  const isAccelerating = recentGrowth > earlierGrowth * PREDICTION_CONFIG.growthRateMultiplier
    && recentGrowth > 0.2; // At least 20% growth

  // Project count for next day
  const lastCount = dailyCounts[dailyCounts.length - 1];
  const projectedCount = Math.round(lastCount * (1 + recentGrowth));

  return {
    isAccelerating,
    growthRate: recentGrowth * 100,
    projectedCount,
  };
}

/**
 * Estimate days until threshold is reached
 */
export function estimateDaysToThreshold(
  currentCount: number,
  growthRate: number,
  threshold: number
): number | null {
  if (growthRate <= 0 || currentCount >= threshold) {
    return null;
  }

  // Using exponential growth: threshold = current * (1 + rate)^days
  // Solving for days: days = log(threshold/current) / log(1 + rate)
  const dailyGrowthRate = growthRate / 100;
  if (dailyGrowthRate <= 0) return null;

  const days = Math.log(threshold / currentCount) / Math.log(1 + dailyGrowthRate);
  return Math.ceil(days);
}

/**
 * Generate explanation for a predicted risk
 */
export function generatePredictionExplanation(
  type: PredictionType,
  data: {
    term: string;
    consecutiveDays?: number;
    currentCount?: number;
    threshold?: number;
    percentOfThreshold?: number;
    growthRate?: number;
    projectedCount?: number;
    daysToThreshold?: number | null;
  }
): string {
  switch (type) {
    case 'consecutive_increase':
      return `"${data.term}" has increased for ${data.consecutiveDays} consecutive days, ` +
        `suggesting a sustained trend that may require attention.`;

    case 'approaching_threshold':
      return `"${data.term}" is at ${data.currentCount} cases, approaching the alert threshold of ${data.threshold} ` +
        `(${data.percentOfThreshold?.toFixed(0)}% of threshold). ` +
        (data.daysToThreshold
          ? `At current rate, will trigger spike alert in ~${data.daysToThreshold} days.`
          : 'Monitor closely for potential spike.');

    case 'accelerating_growth':
      return `"${data.term}" shows accelerating growth at ${data.growthRate?.toFixed(0)}% daily rate. ` +
        `Projected to reach ${data.projectedCount} cases tomorrow if trend continues.`;

    default:
      return `Potential risk detected for "${data.term}".`;
  }
}

/**
 * Determine severity of predicted risk
 */
export function determinePredictionSeverity(
  type: PredictionType,
  data: {
    consecutiveDays?: number;
    percentOfThreshold?: number;
    growthRate?: number;
  }
): 'low' | 'medium' | 'high' {
  switch (type) {
    case 'consecutive_increase':
      if (data.consecutiveDays && data.consecutiveDays >= 5) return 'high';
      if (data.consecutiveDays && data.consecutiveDays >= 4) return 'medium';
      return 'low';

    case 'approaching_threshold':
      if (data.percentOfThreshold && data.percentOfThreshold >= 95) return 'high';
      if (data.percentOfThreshold && data.percentOfThreshold >= 90) return 'medium';
      return 'low';

    case 'accelerating_growth':
      if (data.growthRate && data.growthRate >= 50) return 'high';
      if (data.growthRate && data.growthRate >= 30) return 'medium';
      return 'low';

    default:
      return 'low';
  }
}

/**
 * Generate a unique ID for a prediction
 */
function generatePredictionId(term: string, type: PredictionType): string {
  const timestamp = Date.now();
  const termSlug = term.toLowerCase().replace(/\s+/g, '-').slice(0, 20);
  return `pred-${type}-${termSlug}-${timestamp}`;
}

/**
 * Compute predicted risks from trending data
 */
export function computePredictedRisks(
  allCases: CaseData[],
  trendingTopics: TrendingTopicData[],
  options: {
    threshold?: number;
    lookbackDays?: number;
    referenceDate?: Date;
  } = {}
): PredictedRisk[] {
  const {
    threshold = PREDICTION_CONFIG.defaultAlertThreshold,
    lookbackDays = 7,
    referenceDate,
  } = options;

  const predictions: PredictedRisk[] = [];
  const now = referenceDate || new Date();

  for (const topic of trendingTopics) {
    // Skip topics with too few cases
    if (topic.currentCount < PREDICTION_CONFIG.minCasesForPrediction) {
      continue;
    }

    const dailyCounts = getTermDailyCounts(allCases, topic.term, lookbackDays, referenceDate);

    // Check for consecutive rising
    const consecutiveResult = detectConsecutiveRising(dailyCounts);
    if (consecutiveResult.isRising) {
      const severity = determinePredictionSeverity('consecutive_increase', {
        consecutiveDays: consecutiveResult.consecutiveDays,
      });

      predictions.push({
        id: generatePredictionId(topic.term, 'consecutive_increase'),
        term: topic.term,
        type: 'consecutive_increase',
        severity,
        title: `${topic.term} - Sustained Increase`,
        explanation: generatePredictionExplanation('consecutive_increase', {
          term: topic.term,
          consecutiveDays: consecutiveResult.consecutiveDays,
        }),
        currentCount: topic.currentCount,
        consecutiveDays: consecutiveResult.consecutiveDays,
        impactedBUs: topic.impactedBUs,
        sampleCases: topic.sampleCases,
        createdAt: now.toISOString(),
      });
    }

    // Check for approaching threshold
    const thresholdResult = detectApproachingThreshold(topic.currentCount, threshold);
    if (thresholdResult.isApproaching) {
      const accelerationResult = detectAcceleratingGrowth(dailyCounts);
      const daysToThreshold = estimateDaysToThreshold(
        topic.currentCount,
        accelerationResult.growthRate,
        threshold
      );

      const severity = determinePredictionSeverity('approaching_threshold', {
        percentOfThreshold: thresholdResult.percentOfThreshold,
      });

      predictions.push({
        id: generatePredictionId(topic.term, 'approaching_threshold'),
        term: topic.term,
        type: 'approaching_threshold',
        severity,
        title: `${topic.term} - Approaching Alert Threshold`,
        explanation: generatePredictionExplanation('approaching_threshold', {
          term: topic.term,
          currentCount: topic.currentCount,
          threshold,
          percentOfThreshold: thresholdResult.percentOfThreshold,
          daysToThreshold,
        }),
        currentCount: topic.currentCount,
        threshold,
        daysToThreshold: daysToThreshold ?? undefined,
        impactedBUs: topic.impactedBUs,
        sampleCases: topic.sampleCases,
        createdAt: now.toISOString(),
      });
    }

    // Check for accelerating growth
    const accelerationResult = detectAcceleratingGrowth(dailyCounts);
    if (accelerationResult.isAccelerating) {
      const severity = determinePredictionSeverity('accelerating_growth', {
        growthRate: accelerationResult.growthRate,
      });

      predictions.push({
        id: generatePredictionId(topic.term, 'accelerating_growth'),
        term: topic.term,
        type: 'accelerating_growth',
        severity,
        title: `${topic.term} - Accelerating Growth`,
        explanation: generatePredictionExplanation('accelerating_growth', {
          term: topic.term,
          growthRate: accelerationResult.growthRate,
          projectedCount: accelerationResult.projectedCount,
        }),
        currentCount: topic.currentCount,
        projectedCount: accelerationResult.projectedCount,
        growthRate: accelerationResult.growthRate,
        impactedBUs: topic.impactedBUs,
        sampleCases: topic.sampleCases,
        createdAt: now.toISOString(),
      });
    }
  }

  // Sort by severity (high first) and then by current count
  const severityOrder = { high: 0, medium: 1, low: 2 };
  return predictions.sort((a, b) => {
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (severityDiff !== 0) return severityDiff;
    return b.currentCount - a.currentCount;
  });
}

/**
 * Compute predicted risks for a specific time window
 */
export function computePredictedRisksForWindow(
  allCases: CaseData[],
  window: TimeWindow,
  options: {
    threshold?: number;
    referenceDate?: Date;
    limit?: number;
  } = {}
): PredictedRisk[] {
  const { threshold, referenceDate, limit = 10 } = options;

  // Get trending topics first
  const trendingTopics = computeTrendingForWindow(allCases, window, 10, referenceDate);

  // Compute predictions from trending topics
  const predictions = computePredictedRisks(allCases, trendingTopics, {
    threshold,
    lookbackDays: window === '24h' ? 4 : 14,
    referenceDate,
  });

  return predictions.slice(0, limit);
}
