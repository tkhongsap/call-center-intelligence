/**
 * Chat Response Generator Module
 *
 * Generates structured responses for each chat intent type:
 * - show_trends: Returns top trending topics
 * - find_cases: Searches for matching cases
 * - show_urgent: Returns urgent cases and alerts
 * - what_happening: Returns daily summary
 * - apply_filter: Confirms filter application
 * - general_question: Handles fallback queries
 */

import { db } from './db';
import { cases, alerts, trendingTopics } from './db/schema';
import type { Case, Alert, TrendingTopic } from './db/schema';
import { and, eq, gte, lte, or, desc, sql, like, type SQL } from 'drizzle-orm';
import type { IntentResult, ExtractedEntities } from './chatIntents';

// ═══════════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════════

export interface ChatAction {
  type: 'navigate' | 'apply_filter' | 'open_case' | 'open_alert';
  label: string;
  payload: Record<string, unknown>;
}

export interface TrendCard {
  topic: string;
  caseCount: number;
  percentChange: number;
  direction: 'rising' | 'stable' | 'declining';
  businessUnit?: string;
}

export interface CaseCard {
  id: string;
  caseNumber: string;
  summary: string;
  severity: string;
  businessUnit: string;
  channel: string;
  createdAt: string;
}

export interface AlertCard {
  id: string;
  type: string;
  severity: string;
  title: string;
  description: string;
  businessUnit?: string;
}

export interface StatsCard {
  label: string;
  value: number | string;
  change?: number;
  trend?: 'up' | 'down' | 'stable';
}

export type ResponseCard =
  | { type: 'trend'; data: TrendCard }
  | { type: 'case'; data: CaseCard }
  | { type: 'alert'; data: AlertCard }
  | { type: 'stats'; data: StatsCard };

export interface ChatResponse {
  message: string;
  cards: ResponseCard[];
  actions: ChatAction[];
  filterState?: FilterState;
}

export interface FilterState {
  businessUnits: string[];
  channels: string[];
  severities: string[];
  categories: string[];
  timeRange?: {
    label: string;
    start: string;
    end: string;
  };
  flags: {
    urgent: boolean;
    risk: boolean;
    needsReview: boolean;
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Response Generators
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate response based on classified intent
 */
export async function generateResponse(
  intentResult: IntentResult
): Promise<ChatResponse> {
  switch (intentResult.intent) {
    case 'show_trends':
      return generateShowTrendsResponse(intentResult.entities);
    case 'find_cases':
      return generateFindCasesResponse(intentResult);
    case 'show_urgent':
      return generateShowUrgentResponse(intentResult.entities);
    case 'what_happening':
      return generateWhatHappeningResponse(intentResult.entities);
    case 'apply_filter':
      return generateApplyFilterResponse(intentResult.entities);
    case 'general_question':
    default:
      return generateGeneralResponse(intentResult);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Show Trends Response
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate response for "show trends" intent
 * Returns top 3 trending topics with trend direction and percentage
 */
async function generateShowTrendsResponse(
  entities: ExtractedEntities
): Promise<ChatResponse> {
  // Get trending topics from database
  const conditions = [];

  if (entities.businessUnits.length > 0) {
    conditions.push(
      or(...entities.businessUnits.map(bu => eq(trendingTopics.businessUnit, bu)))
    );
  }

  let query = db
    .select()
    .from(trendingTopics)
    .where(eq(trendingTopics.trend, 'rising'))
    .orderBy(desc(trendingTopics.trendScore))
    .limit(3);

  if (conditions.length > 0) {
    query = db
      .select()
      .from(trendingTopics)
      .where(and(eq(trendingTopics.trend, 'rising'), ...conditions))
      .orderBy(desc(trendingTopics.trendScore))
      .limit(3);
  }

  const trends = await query;

  // If no trends in DB, generate mock data based on recent cases
  if (trends.length === 0) {
    const mockTrends = await generateMockTrends(entities.businessUnits);
    return formatTrendsResponse(mockTrends);
  }

  const trendCards: TrendCard[] = trends.map(t => ({
    topic: t.topic,
    caseCount: t.caseCount,
    percentChange: t.percentageChange || 0,
    direction: t.trend as 'rising' | 'stable' | 'declining',
    businessUnit: t.businessUnit || undefined,
  }));

  return formatTrendsResponse(trendCards);
}

/**
 * Generate mock trends from recent case data
 */
async function generateMockTrends(businessUnits: string[]): Promise<TrendCard[]> {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const conditions: SQL[] = [gte(cases.createdAt, oneDayAgo.toISOString())];

  if (businessUnits.length > 0) {
    const buCondition = or(...businessUnits.map(bu => eq(cases.businessUnit, bu)));
    if (buCondition) conditions.push(buCondition);
  }

  // Get category counts
  const categoryCounts = await db
    .select({
      category: cases.category,
      count: sql<number>`count(*)`.as('count'),
    })
    .from(cases)
    .where(and(...conditions))
    .groupBy(cases.category)
    .orderBy(desc(sql`count(*)`))
    .limit(3);

  return categoryCounts.map((c, i) => ({
    topic: c.category,
    caseCount: c.count,
    percentChange: 15 + (i * 10), // Mock percentage change
    direction: 'rising' as const,
  }));
}

/**
 * Format trends into chat response
 */
function formatTrendsResponse(trends: TrendCard[]): ChatResponse {
  if (trends.length === 0) {
    return {
      message: "I don't see any significant trending topics right now. The case volume appears stable across all categories.",
      cards: [],
      actions: [
        {
          type: 'navigate',
          label: 'View all topics',
          payload: { path: '/trending' },
        },
      ],
    };
  }

  const topTrend = trends[0];
  const message = `Here are the top ${trends.length} trending topics. **${topTrend.topic}** is leading with ${topTrend.caseCount} cases (+${Math.round(topTrend.percentChange)}%).`;

  const cards: ResponseCard[] = trends.map(t => ({
    type: 'trend' as const,
    data: t,
  }));

  return {
    message,
    cards,
    actions: [
      {
        type: 'navigate',
        label: 'View all trends',
        payload: { path: '/trending' },
      },
      {
        type: 'apply_filter',
        label: `Filter to ${topTrend.topic}`,
        payload: { category: topTrend.topic },
      },
    ],
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Find Cases Response
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate response for "find cases" intent
 * Searches for matching cases and returns count + top 3 results
 */
async function generateFindCasesResponse(
  intentResult: IntentResult
): Promise<ChatResponse> {
  const { entities } = intentResult;
  const conditions = [];

  // Add business unit filter
  if (entities.businessUnits.length > 0) {
    conditions.push(
      or(...entities.businessUnits.map(bu => eq(cases.businessUnit, bu)))
    );
  }

  // Add channel filter
  if (entities.channels.length > 0) {
    conditions.push(
      or(...entities.channels.map(ch => eq(cases.channel, ch)))
    );
  }

  // Add severity filter
  if (entities.severities.length > 0) {
    conditions.push(
      or(...entities.severities.map(sev => eq(cases.severity, sev)))
    );
  }

  // Add category filter
  if (entities.categories.length > 0) {
    conditions.push(
      or(...entities.categories.map(cat => eq(cases.category, cat)))
    );
  }

  // Add time range filter
  if (entities.timeRange) {
    conditions.push(gte(cases.createdAt, entities.timeRange.start.toISOString()));
    conditions.push(lte(cases.createdAt, entities.timeRange.end.toISOString()));
  }

  // Add flag filters
  if (entities.flags.urgent) {
    conditions.push(or(eq(cases.severity, 'high'), eq(cases.severity, 'critical')));
  }
  if (entities.flags.risk) {
    conditions.push(eq(cases.riskFlag, true));
  }
  if (entities.flags.needsReview) {
    conditions.push(eq(cases.needsReviewFlag, true));
  }

  // Add topic keyword search
  if (entities.topics.length > 0) {
    const topicConditions = entities.topics.map(topic =>
      like(cases.summary, `%${topic}%`)
    );
    conditions.push(or(...topicConditions));
  }

  // Execute query
  let matchingCases: Case[];
  if (conditions.length > 0) {
    matchingCases = await db
      .select()
      .from(cases)
      .where(and(...conditions))
      .orderBy(desc(cases.createdAt))
      .limit(50);
  } else {
    matchingCases = await db
      .select()
      .from(cases)
      .orderBy(desc(cases.createdAt))
      .limit(50);
  }

  const totalCount = matchingCases.length;
  const topCases = matchingCases.slice(0, 3);

  return formatCasesResponse(topCases, totalCount, intentResult.originalQuery, entities);
}

/**
 * Format cases into chat response
 */
function formatCasesResponse(
  topCases: Case[],
  totalCount: number,
  query: string,
  entities: ExtractedEntities
): ChatResponse {
  if (totalCount === 0) {
    return {
      message: `I couldn't find any cases matching "${query}". Try adjusting your search terms or filters.`,
      cards: [],
      actions: [
        {
          type: 'navigate',
          label: 'Browse all cases',
          payload: { path: '/cases' },
        },
      ],
    };
  }

  const searchTerms = entities.topics.length > 0
    ? entities.topics.join(', ')
    : 'your criteria';

  const message = `Found **${totalCount} case${totalCount !== 1 ? 's' : ''}** matching ${searchTerms}. Here are the most recent:`;

  const cards: ResponseCard[] = topCases.map(c => ({
    type: 'case' as const,
    data: {
      id: c.id,
      caseNumber: c.caseNumber,
      summary: c.summary.length > 100 ? c.summary.slice(0, 100) + '...' : c.summary,
      severity: c.severity,
      businessUnit: c.businessUnit,
      channel: c.channel,
      createdAt: c.createdAt,
    },
  }));

  const filterPayload: Record<string, unknown> = {};
  if (entities.businessUnits.length > 0) filterPayload.businessUnits = entities.businessUnits;
  if (entities.channels.length > 0) filterPayload.channels = entities.channels;
  if (entities.severities.length > 0) filterPayload.severities = entities.severities;
  if (entities.topics.length > 0) filterPayload.keywords = entities.topics;

  return {
    message,
    cards,
    actions: [
      {
        type: 'navigate',
        label: `See all ${totalCount} results`,
        payload: { path: '/search', query },
      },
      {
        type: 'apply_filter',
        label: 'Apply as filter',
        payload: filterPayload,
      },
    ],
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Show Urgent Response
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate response for "show urgent" intent
 * Returns urgent cases and alerts with counts by severity
 */
async function generateShowUrgentResponse(
  entities: ExtractedEntities
): Promise<ChatResponse> {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Build conditions for cases
  const caseConditions = [
    gte(cases.createdAt, oneDayAgo.toISOString()),
    or(eq(cases.severity, 'high'), eq(cases.severity, 'critical')),
  ];

  if (entities.businessUnits.length > 0) {
    caseConditions.push(
      or(...entities.businessUnits.map(bu => eq(cases.businessUnit, bu)))
    );
  }

  // Get urgent cases
  const urgentCases = await db
    .select()
    .from(cases)
    .where(and(...caseConditions))
    .orderBy(desc(cases.createdAt))
    .limit(10);

  // Build conditions for alerts
  const alertConditions = [
    eq(alerts.status, 'active'),
    or(eq(alerts.severity, 'high'), eq(alerts.severity, 'critical')),
  ];

  if (entities.businessUnits.length > 0) {
    alertConditions.push(
      or(...entities.businessUnits.map(bu => eq(alerts.businessUnit, bu)))
    );
  }

  // Get active alerts
  const activeAlerts = await db
    .select()
    .from(alerts)
    .where(and(...alertConditions))
    .orderBy(desc(alerts.createdAt))
    .limit(5);

  // Count by severity
  const criticalCases = urgentCases.filter(c => c.severity === 'critical').length;
  const highCases = urgentCases.filter(c => c.severity === 'high').length;
  const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical').length;
  const highAlerts = activeAlerts.filter(a => a.severity === 'high').length;

  return formatUrgentResponse(
    urgentCases.slice(0, 3),
    activeAlerts.slice(0, 2),
    { criticalCases, highCases, criticalAlerts, highAlerts }
  );
}

/**
 * Format urgent items into chat response
 */
function formatUrgentResponse(
  topCases: Case[],
  topAlerts: Alert[],
  counts: { criticalCases: number; highCases: number; criticalAlerts: number; highAlerts: number }
): ChatResponse {
  const totalCritical = counts.criticalCases + counts.criticalAlerts;
  const totalHigh = counts.highCases + counts.highAlerts;

  if (totalCritical === 0 && totalHigh === 0) {
    return {
      message: "Good news! There are no urgent cases or alerts requiring immediate attention right now.",
      cards: [],
      actions: [
        {
          type: 'navigate',
          label: 'View all cases',
          payload: { path: '/cases' },
        },
      ],
    };
  }

  let message = '🚨 ';
  if (totalCritical > 0) {
    message += `**${totalCritical} critical** item${totalCritical !== 1 ? 's' : ''} `;
  }
  if (totalHigh > 0) {
    message += totalCritical > 0 ? `and **${totalHigh} high priority**` : `**${totalHigh} high priority** item${totalHigh !== 1 ? 's' : ''}`;
  }
  message += ' need attention.';

  const cards: ResponseCard[] = [];

  // Add alert cards first (higher priority)
  for (const alert of topAlerts) {
    cards.push({
      type: 'alert' as const,
      data: {
        id: alert.id,
        type: alert.type,
        severity: alert.severity,
        title: alert.title,
        description: alert.description.length > 100
          ? alert.description.slice(0, 100) + '...'
          : alert.description,
        businessUnit: alert.businessUnit || undefined,
      },
    });
  }

  // Add case cards
  for (const caseItem of topCases) {
    cards.push({
      type: 'case' as const,
      data: {
        id: caseItem.id,
        caseNumber: caseItem.caseNumber,
        summary: caseItem.summary.length > 100
          ? caseItem.summary.slice(0, 100) + '...'
          : caseItem.summary,
        severity: caseItem.severity,
        businessUnit: caseItem.businessUnit,
        channel: caseItem.channel,
        createdAt: caseItem.createdAt,
      },
    });
  }

  return {
    message,
    cards,
    actions: [
      {
        type: 'navigate',
        label: 'View urgent cases',
        payload: { path: '/cases', severity: ['high', 'critical'] },
      },
      {
        type: 'navigate',
        label: 'View alerts',
        payload: { path: '/alerts' },
      },
    ],
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// What's Happening Response
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate response for "what's happening" intent
 * Returns today's summary with key metrics
 */
async function generateWhatHappeningResponse(
  entities: ExtractedEntities
): Promise<ChatResponse> {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  // Build base conditions
  const todayConditions: SQL[] = [gte(cases.createdAt, todayStart.toISOString())];
  const yesterdayConditions: SQL[] = [
    gte(cases.createdAt, yesterdayStart.toISOString()),
    lte(cases.createdAt, todayStart.toISOString()),
  ];

  if (entities.businessUnits.length > 0) {
    const buCondition = or(...entities.businessUnits.map(bu => eq(cases.businessUnit, bu)));
    if (buCondition) {
      todayConditions.push(buCondition);
      yesterdayConditions.push(buCondition);
    }
  }

  // Get today's case count
  const todayCases = await db
    .select({ count: sql<number>`count(*)`.as('count') })
    .from(cases)
    .where(and(...todayConditions));

  // Get yesterday's case count for comparison
  const yesterdayCases = await db
    .select({ count: sql<number>`count(*)`.as('count') })
    .from(cases)
    .where(and(...yesterdayConditions));

  const todayCount = todayCases[0]?.count || 0;
  const yesterdayCount = yesterdayCases[0]?.count || 0;
  const caseChange = yesterdayCount > 0
    ? Math.round(((todayCount - yesterdayCount) / yesterdayCount) * 100)
    : 0;

  // Get active alerts count
  const alertConditions: SQL[] = [eq(alerts.status, 'active')];
  if (entities.businessUnits.length > 0) {
    const buAlertCondition = or(...entities.businessUnits.map(bu => eq(alerts.businessUnit, bu)));
    if (buAlertCondition) alertConditions.push(buAlertCondition);
  }

  const activeAlertsResult = await db
    .select({ count: sql<number>`count(*)`.as('count') })
    .from(alerts)
    .where(and(...alertConditions));

  const activeAlertsCount = activeAlertsResult[0]?.count || 0;

  // Get top trending topic
  const trendConditions: SQL[] = [eq(trendingTopics.trend, 'rising')];
  if (entities.businessUnits.length > 0) {
    const buTrendCondition = or(...entities.businessUnits.map(bu => eq(trendingTopics.businessUnit, bu)));
    if (buTrendCondition) trendConditions.push(buTrendCondition);
  }

  const topTrend = await db
    .select()
    .from(trendingTopics)
    .where(and(...trendConditions))
    .orderBy(desc(trendingTopics.trendScore))
    .limit(1);

  // Get urgent cases count
  const severityCondition = or(eq(cases.severity, 'high'), eq(cases.severity, 'critical'));
  const urgentConditions: SQL[] = [
    gte(cases.createdAt, todayStart.toISOString()),
  ];
  if (severityCondition) urgentConditions.push(severityCondition);

  if (entities.businessUnits.length > 0) {
    const buUrgentCondition = or(...entities.businessUnits.map(bu => eq(cases.businessUnit, bu)));
    if (buUrgentCondition) urgentConditions.push(buUrgentCondition);
  }

  const urgentResult = await db
    .select({ count: sql<number>`count(*)`.as('count') })
    .from(cases)
    .where(and(...urgentConditions));

  const urgentCount = urgentResult[0]?.count || 0;

  return formatSummaryResponse({
    todayCount,
    caseChange,
    activeAlertsCount,
    urgentCount,
    topTrend: topTrend[0] || null,
    businessUnits: entities.businessUnits,
  });
}

/**
 * Format summary into chat response
 */
function formatSummaryResponse(data: {
  todayCount: number;
  caseChange: number;
  activeAlertsCount: number;
  urgentCount: number;
  topTrend: TrendingTopic | null;
  businessUnits: string[];
}): ChatResponse {
  const scopeText = data.businessUnits.length > 0
    ? ` for ${data.businessUnits.join(', ')}`
    : '';

  const changeText = data.caseChange > 0
    ? `(+${data.caseChange}% from yesterday)`
    : data.caseChange < 0
      ? `(${data.caseChange}% from yesterday)`
      : '(same as yesterday)';

  let message = `📊 **Today's Summary${scopeText}**\n\n`;
  message += `• **${data.todayCount}** cases today ${changeText}\n`;
  message += `• **${data.activeAlertsCount}** active alert${data.activeAlertsCount !== 1 ? 's' : ''}\n`;
  message += `• **${data.urgentCount}** urgent case${data.urgentCount !== 1 ? 's' : ''} requiring attention`;

  if (data.topTrend) {
    message += `\n• Top trending: **${data.topTrend.topic}** (+${Math.round(data.topTrend.percentageChange || 0)}%)`;
  }

  const cards: ResponseCard[] = [
    {
      type: 'stats' as const,
      data: {
        label: 'Cases Today',
        value: data.todayCount,
        change: data.caseChange,
        trend: data.caseChange > 0 ? 'up' : data.caseChange < 0 ? 'down' : 'stable',
      },
    },
    {
      type: 'stats' as const,
      data: {
        label: 'Active Alerts',
        value: data.activeAlertsCount,
      },
    },
    {
      type: 'stats' as const,
      data: {
        label: 'Urgent Cases',
        value: data.urgentCount,
      },
    },
  ];

  if (data.topTrend) {
    cards.push({
      type: 'trend' as const,
      data: {
        topic: data.topTrend.topic,
        caseCount: data.topTrend.caseCount,
        percentChange: data.topTrend.percentageChange || 0,
        direction: data.topTrend.trend as 'rising' | 'stable' | 'declining',
        businessUnit: data.topTrend.businessUnit || undefined,
      },
    });
  }

  return {
    message,
    cards,
    actions: [
      {
        type: 'navigate',
        label: 'View feed',
        payload: { path: '/home' },
      },
      {
        type: 'navigate',
        label: 'Show trends',
        payload: { path: '/trending' },
      },
      {
        type: 'navigate',
        label: 'View alerts',
        payload: { path: '/alerts' },
      },
    ],
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Apply Filter Response
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate response for "apply filter" intent
 * Confirms filter application and shows current filter state
 */
async function generateApplyFilterResponse(
  entities: ExtractedEntities
): Promise<ChatResponse> {
  const filterState: FilterState = {
    businessUnits: entities.businessUnits,
    channels: entities.channels,
    severities: entities.severities,
    categories: entities.categories,
    timeRange: entities.timeRange ? {
      label: entities.timeRange.label,
      start: entities.timeRange.start.toISOString(),
      end: entities.timeRange.end.toISOString(),
    } : undefined,
    flags: {
      urgent: entities.flags.urgent,
      risk: entities.flags.risk,
      needsReview: entities.flags.needsReview,
    },
  };

  // Build description of applied filters
  const filterParts: string[] = [];

  if (entities.businessUnits.length > 0) {
    filterParts.push(`**BU**: ${entities.businessUnits.join(', ')}`);
  }
  if (entities.channels.length > 0) {
    filterParts.push(`**Channel**: ${entities.channels.join(', ')}`);
  }
  if (entities.severities.length > 0) {
    filterParts.push(`**Severity**: ${entities.severities.join(', ')}`);
  }
  if (entities.categories.length > 0) {
    filterParts.push(`**Category**: ${entities.categories.join(', ')}`);
  }
  if (entities.timeRange) {
    filterParts.push(`**Time**: ${entities.timeRange.label}`);
  }
  if (entities.flags.urgent) {
    filterParts.push(`**Urgent only**`);
  }
  if (entities.flags.risk) {
    filterParts.push(`**At-risk cases**`);
  }
  if (entities.flags.needsReview) {
    filterParts.push(`**Needs review**`);
  }

  if (filterParts.length === 0) {
    return {
      message: "I couldn't identify any specific filters to apply. Try saying something like:\n• \"Filter to BU Credit Cards\"\n• \"Show only phone channel\"\n• \"Filter to last 7 days\"",
      cards: [],
      actions: [],
    };
  }

  const message = `✅ Applied filters:\n${filterParts.map(p => `• ${p}`).join('\n')}\n\nThe view will update to show matching results.`;

  return {
    message,
    cards: [],
    actions: [
      {
        type: 'apply_filter',
        label: 'Apply to feed',
        payload: filterState as unknown as Record<string, unknown>,
      },
      {
        type: 'navigate',
        label: 'View filtered cases',
        payload: { path: '/cases', filters: filterState },
      },
    ],
    filterState,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// General Response
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate response for general/unrecognized queries
 */
async function generateGeneralResponse(
  intentResult: IntentResult
): Promise<ChatResponse> {
  const suggestions = [
    "What's happening today?",
    "Show trending topics",
    "Find urgent cases",
    "Filter to BU Credit Cards",
  ];

  const message = `I'm not sure how to help with "${intentResult.originalQuery}". Here are some things I can do:\n\n` +
    `• **Ask about trends**: "What's trending?" or "Show top topics"\n` +
    `• **Find cases**: "Find cases about refunds" or "Search for payment issues"\n` +
    `• **Show urgent items**: "Show urgent cases" or "What needs attention?"\n` +
    `• **Get a summary**: "What's happening today?" or "Give me an update"\n` +
    `• **Apply filters**: "Filter to BU Credit Cards" or "Show last 7 days"`;

  return {
    message,
    cards: [],
    actions: suggestions.map(s => ({
      type: 'navigate' as const,
      label: s,
      payload: { suggestion: s },
    })),
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Utility Functions
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get quick action suggestions based on current context
 */
export function getQuickActions(): ChatAction[] {
  return [
    {
      type: 'navigate',
      label: "What's happening today?",
      payload: { suggestion: "What's happening today?" },
    },
    {
      type: 'navigate',
      label: 'Show trending topics',
      payload: { suggestion: 'Show trending topics' },
    },
    {
      type: 'navigate',
      label: 'Find urgent cases',
      payload: { suggestion: 'Show urgent cases' },
    },
  ];
}

/**
 * Format a filter state as a human-readable string
 */
export function formatFilterState(filterState: FilterState): string {
  const parts: string[] = [];

  if (filterState.businessUnits.length > 0) {
    parts.push(`BU: ${filterState.businessUnits.join(', ')}`);
  }
  if (filterState.channels.length > 0) {
    parts.push(`Channel: ${filterState.channels.join(', ')}`);
  }
  if (filterState.severities.length > 0) {
    parts.push(`Severity: ${filterState.severities.join(', ')}`);
  }
  if (filterState.categories.length > 0) {
    parts.push(`Category: ${filterState.categories.join(', ')}`);
  }
  if (filterState.timeRange) {
    parts.push(`Time: ${filterState.timeRange.label}`);
  }

  return parts.length > 0 ? parts.join(' | ') : 'No filters applied';
}
