/**
 * Search module for Call Center Intelligence
 * Parses natural language queries and extracts filter parameters
 */

import { db } from './db';
import { cases, type Case } from './db/schema';
import { and, or, eq, gte, lte } from 'drizzle-orm';

// ═══════════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════════

export interface SearchResult {
  case: Case;
  relevanceScore: number;
  matchedFields: string[];
  highlightedSummary: string;
}

export interface SearchResponse {
  results: SearchResult[];
  totalCount: number;
  parsedQuery: ParsedQuery;
  suggestedFilters: SuggestedFilter[];
  executionTimeMs: number;
}

export interface SearchOptions {
  limit?: number;
  offset?: number;
  sortBy?: 'relevance' | 'date' | 'severity';
  sortOrder?: 'asc' | 'desc';
}

export interface ParsedQuery {
  keywords: string[];
  timeRange: TimeRange | null;
  businessUnits: string[];
  channels: Channel[];
  severities: Severity[];
  categories: string[];
  flags: QueryFlags;
  originalQuery: string;
}

export interface TimeRange {
  label: string;
  start: Date;
  end: Date;
}

export type Channel = 'phone' | 'email' | 'line' | 'web';
export type Severity = 'low' | 'medium' | 'high' | 'critical';

export interface QueryFlags {
  urgent: boolean;
  risk: boolean;
  needsReview: boolean;
}

export interface SuggestedFilter {
  type: 'businessUnit' | 'channel' | 'severity' | 'category' | 'timeRange' | 'flag';
  value: string;
  label: string;
  confidence: number; // 0-1 score of how confident we are about this filter
}

// ═══════════════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════════════

const BUSINESS_UNITS = [
  'Credit Cards', 'Mortgages', 'Personal Loans', 'Auto Finance',
  'Savings Accounts', 'Checking Accounts', 'Investments', 'Insurance',
  'Business Banking', 'Wealth Management', 'Mobile Banking', 'Online Banking',
  'Customer Support', 'Fraud Prevention', 'Collections'
];

// Business unit aliases for flexible matching
const BU_ALIASES: Record<string, string> = {
  'credit card': 'Credit Cards',
  'credit cards': 'Credit Cards',
  'cc': 'Credit Cards',
  'mortgage': 'Mortgages',
  'mortgages': 'Mortgages',
  'personal loan': 'Personal Loans',
  'personal loans': 'Personal Loans',
  'loan': 'Personal Loans',
  'loans': 'Personal Loans',
  'auto': 'Auto Finance',
  'auto finance': 'Auto Finance',
  'car loan': 'Auto Finance',
  'savings': 'Savings Accounts',
  'savings account': 'Savings Accounts',
  'savings accounts': 'Savings Accounts',
  'checking': 'Checking Accounts',
  'checking account': 'Checking Accounts',
  'checking accounts': 'Checking Accounts',
  'investment': 'Investments',
  'investments': 'Investments',
  'insurance': 'Insurance',
  'business banking': 'Business Banking',
  'business': 'Business Banking',
  'wealth': 'Wealth Management',
  'wealth management': 'Wealth Management',
  'mobile banking': 'Mobile Banking',
  'mobile': 'Mobile Banking',
  'online banking': 'Online Banking',
  'online': 'Online Banking',
  'support': 'Customer Support',
  'customer support': 'Customer Support',
  'fraud': 'Fraud Prevention',
  'fraud prevention': 'Fraud Prevention',
  'collection': 'Collections',
  'collections': 'Collections',
};

const CHANNELS: Channel[] = ['phone', 'email', 'line', 'web'];

const CHANNEL_ALIASES: Record<string, Channel> = {
  'phone': 'phone',
  'call': 'phone',
  'calls': 'phone',
  'telephone': 'phone',
  'email': 'email',
  'emails': 'email',
  'mail': 'email',
  'line': 'line',
  'web': 'web',
  'website': 'web',
  'online': 'web',
  'chat': 'web',
};

const CATEGORIES = [
  'Account Access', 'Payment Issues', 'Technical Support', 'Billing Dispute',
  'Product Inquiry', 'Complaint', 'Feedback', 'Cancellation Request',
  'Fraud Report', 'Documentation Request', 'Rate Inquiry', 'Balance Inquiry',
  'Card Activation', 'PIN Reset', 'Statement Request'
];

const CATEGORY_ALIASES: Record<string, string> = {
  'account access': 'Account Access',
  'login': 'Account Access',
  'password': 'Account Access',
  'payment': 'Payment Issues',
  'payment issues': 'Payment Issues',
  'payments': 'Payment Issues',
  'refund': 'Payment Issues',
  'refunds': 'Payment Issues',
  'charge': 'Payment Issues',
  'charges': 'Payment Issues',
  'technical': 'Technical Support',
  'technical support': 'Technical Support',
  'tech support': 'Technical Support',
  'billing': 'Billing Dispute',
  'billing dispute': 'Billing Dispute',
  'dispute': 'Billing Dispute',
  'product': 'Product Inquiry',
  'product inquiry': 'Product Inquiry',
  'inquiry': 'Product Inquiry',
  'complaint': 'Complaint',
  'complaints': 'Complaint',
  'feedback': 'Feedback',
  'cancellation': 'Cancellation Request',
  'cancel': 'Cancellation Request',
  'fraud report': 'Fraud Report',
  'fraud': 'Fraud Report',
  'documentation': 'Documentation Request',
  'documents': 'Documentation Request',
  'rate': 'Rate Inquiry',
  'rates': 'Rate Inquiry',
  'interest rate': 'Rate Inquiry',
  'balance': 'Balance Inquiry',
  'activation': 'Card Activation',
  'card activation': 'Card Activation',
  'activate': 'Card Activation',
  'pin': 'PIN Reset',
  'pin reset': 'PIN Reset',
  'statement': 'Statement Request',
  'statements': 'Statement Request',
};

const SEVERITY_INDICATORS: Record<string, Severity[]> = {
  'urgent': ['high', 'critical'],
  'critical': ['critical'],
  'high': ['high'],
  'medium': ['medium'],
  'low': ['low'],
  'important': ['high', 'critical'],
  'priority': ['high', 'critical'],
  'severe': ['critical'],
  'serious': ['high', 'critical'],
  'minor': ['low'],
};

// Time pattern definitions
interface TimePattern {
  patterns: RegExp[];
  getDates: () => { start: Date; end: Date };
  label: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Query Parser
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Parse a natural language query into structured filter parameters
 */
export function parseQuery(query: string): ParsedQuery {
  const normalized = query.toLowerCase().trim();

  const result: ParsedQuery = {
    keywords: [],
    timeRange: null,
    businessUnits: [],
    channels: [],
    severities: [],
    categories: [],
    flags: {
      urgent: false,
      risk: false,
      needsReview: false,
    },
    originalQuery: query,
  };

  // Extract time range first (before removing words)
  result.timeRange = extractTimeRange(normalized);

  // Extract business units
  result.businessUnits = extractBusinessUnits(normalized);

  // Extract channels
  result.channels = extractChannels(normalized);

  // Extract categories
  result.categories = extractCategories(normalized);

  // Extract severities
  result.severities = extractSeverities(normalized);

  // Extract flags
  result.flags = extractFlags(normalized);

  // Extract remaining keywords (after removing matched entities)
  result.keywords = extractKeywords(normalized, result);

  return result;
}

/**
 * Extract time range from query
 */
function extractTimeRange(query: string): TimeRange | null {
  const now = new Date();

  const timePatterns: TimePattern[] = [
    {
      patterns: [/today/i, /this morning/i, /this afternoon/i],
      getDates: () => {
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);
        return { start, end: now };
      },
      label: 'Today',
    },
    {
      patterns: [/yesterday/i],
      getDates: () => {
        const start = new Date(now);
        start.setDate(start.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setHours(23, 59, 59, 999);
        return { start, end };
      },
      label: 'Yesterday',
    },
    {
      patterns: [/last\s*week/i, /past\s*week/i, /this\s*week/i, /past\s*7\s*days/i, /last\s*7\s*days/i],
      getDates: () => {
        const start = new Date(now);
        start.setDate(start.getDate() - 7);
        start.setHours(0, 0, 0, 0);
        return { start, end: now };
      },
      label: 'Last 7 days',
    },
    {
      patterns: [/last\s*month/i, /past\s*month/i, /this\s*month/i, /past\s*30\s*days/i, /last\s*30\s*days/i],
      getDates: () => {
        const start = new Date(now);
        start.setDate(start.getDate() - 30);
        start.setHours(0, 0, 0, 0);
        return { start, end: now };
      },
      label: 'Last 30 days',
    },
    {
      patterns: [/last\s*(\d+)\s*days?/i, /past\s*(\d+)\s*days?/i],
      getDates: () => {
        // This will be handled specially below
        const start = new Date(now);
        start.setDate(start.getDate() - 7); // default
        return { start, end: now };
      },
      label: 'Last N days',
    },
    {
      patterns: [/last\s*quarter/i, /past\s*quarter/i, /past\s*90\s*days/i, /last\s*90\s*days/i],
      getDates: () => {
        const start = new Date(now);
        start.setDate(start.getDate() - 90);
        start.setHours(0, 0, 0, 0);
        return { start, end: now };
      },
      label: 'Last 90 days',
    },
  ];

  // Check for "last N days" pattern specifically
  const lastNDaysMatch = query.match(/(?:last|past)\s*(\d+)\s*days?/i);
  if (lastNDaysMatch) {
    const days = parseInt(lastNDaysMatch[1], 10);
    const start = new Date(now);
    start.setDate(start.getDate() - days);
    start.setHours(0, 0, 0, 0);
    return {
      label: `Last ${days} days`,
      start,
      end: now,
    };
  }

  // Check other patterns
  for (const pattern of timePatterns) {
    for (const regex of pattern.patterns) {
      if (regex.test(query)) {
        const { start, end } = pattern.getDates();
        return {
          label: pattern.label,
          start,
          end,
        };
      }
    }
  }

  return null;
}

/**
 * Extract business units from query
 */
function extractBusinessUnits(query: string): string[] {
  const found: Set<string> = new Set();

  // Check aliases (longer phrases first)
  const sortedAliases = Object.entries(BU_ALIASES).sort(
    (a, b) => b[0].length - a[0].length
  );

  for (const [alias, bu] of sortedAliases) {
    if (query.includes(alias)) {
      found.add(bu);
    }
  }

  // Check exact BU names (case-insensitive)
  for (const bu of BUSINESS_UNITS) {
    if (query.includes(bu.toLowerCase())) {
      found.add(bu);
    }
  }

  return Array.from(found);
}

/**
 * Extract channels from query
 */
function extractChannels(query: string): Channel[] {
  const found: Set<Channel> = new Set();

  for (const [alias, channel] of Object.entries(CHANNEL_ALIASES)) {
    // Use word boundaries to avoid partial matches
    const regex = new RegExp(`\\b${alias}\\b`, 'i');
    if (regex.test(query)) {
      found.add(channel);
    }
  }

  return Array.from(found);
}

/**
 * Extract categories from query
 */
function extractCategories(query: string): string[] {
  const found: Set<string> = new Set();

  // Check aliases (longer phrases first)
  const sortedAliases = Object.entries(CATEGORY_ALIASES).sort(
    (a, b) => b[0].length - a[0].length
  );

  for (const [alias, category] of sortedAliases) {
    if (query.includes(alias)) {
      found.add(category);
    }
  }

  return Array.from(found);
}

/**
 * Extract severity levels from query
 */
function extractSeverities(query: string): Severity[] {
  const found: Set<Severity> = new Set();

  for (const [indicator, severities] of Object.entries(SEVERITY_INDICATORS)) {
    const regex = new RegExp(`\\b${indicator}\\b`, 'i');
    if (regex.test(query)) {
      for (const severity of severities) {
        found.add(severity);
      }
    }
  }

  return Array.from(found);
}

/**
 * Extract special flags from query
 */
function extractFlags(query: string): QueryFlags {
  return {
    urgent: /\b(urgent|asap|immediately|emergency)\b/i.test(query),
    risk: /\b(risk|risky|at[\s-]?risk)\b/i.test(query),
    needsReview: /\b(review|needs[\s-]?review|pending[\s-]?review)\b/i.test(query),
  };
}

/**
 * Extract remaining keywords after removing matched entities
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function extractKeywords(query: string, _parsed: ParsedQuery): string[] {
  let remaining = query.toLowerCase();

  // Remove time-related words
  const timeWords = [
    'today', 'yesterday', 'last', 'past', 'this', 'week', 'month', 'quarter',
    'days', 'day', 'morning', 'afternoon', '\\d+'
  ];
  for (const word of timeWords) {
    remaining = remaining.replace(new RegExp(`\\b${word}\\b`, 'gi'), ' ');
  }

  // Remove business unit aliases
  for (const alias of Object.keys(BU_ALIASES)) {
    remaining = remaining.replace(new RegExp(`\\b${escapeRegex(alias)}\\b`, 'gi'), ' ');
  }

  // Remove channel aliases
  for (const alias of Object.keys(CHANNEL_ALIASES)) {
    remaining = remaining.replace(new RegExp(`\\b${escapeRegex(alias)}\\b`, 'gi'), ' ');
  }

  // Remove category aliases
  for (const alias of Object.keys(CATEGORY_ALIASES)) {
    remaining = remaining.replace(new RegExp(`\\b${escapeRegex(alias)}\\b`, 'gi'), ' ');
  }

  // Remove severity indicators
  for (const indicator of Object.keys(SEVERITY_INDICATORS)) {
    remaining = remaining.replace(new RegExp(`\\b${indicator}\\b`, 'gi'), ' ');
  }

  // Remove flag-related words
  const flagWords = ['urgent', 'asap', 'immediately', 'emergency', 'risk', 'risky', 'review', 'pending'];
  for (const word of flagWords) {
    remaining = remaining.replace(new RegExp(`\\b${word}\\b`, 'gi'), ' ');
  }

  // Remove common stop words
  const stopWords = [
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need',
    'cases', 'case', 'issues', 'issue', 'problems', 'problem', 'trend',
    'trends', 'show', 'find', 'search', 'get', 'list', 'all', 'about',
    'bu', 'channel'
  ];
  for (const word of stopWords) {
    remaining = remaining.replace(new RegExp(`\\b${word}\\b`, 'gi'), ' ');
  }

  // Split into words and filter out empty strings
  const keywords = remaining
    .split(/\s+/)
    .filter(word => word.length > 2)
    .filter(word => !/^\d+$/.test(word)); // Remove pure numbers

  return [...new Set(keywords)]; // Remove duplicates
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ═══════════════════════════════════════════════════════════════════════════════
// Suggested Filters Generator
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate suggested filters from a parsed query
 */
export function getSuggestedFilters(parsed: ParsedQuery): SuggestedFilter[] {
  const filters: SuggestedFilter[] = [];

  // Business unit filters
  for (const bu of parsed.businessUnits) {
    filters.push({
      type: 'businessUnit',
      value: bu,
      label: `BU: ${bu}`,
      confidence: 0.9,
    });
  }

  // Channel filters
  for (const channel of parsed.channels) {
    filters.push({
      type: 'channel',
      value: channel,
      label: `Channel: ${channel}`,
      confidence: 0.9,
    });
  }

  // Severity filters
  for (const severity of parsed.severities) {
    filters.push({
      type: 'severity',
      value: severity,
      label: `Severity: ${severity}`,
      confidence: 0.85,
    });
  }

  // Category filters
  for (const category of parsed.categories) {
    filters.push({
      type: 'category',
      value: category,
      label: `Category: ${category}`,
      confidence: 0.85,
    });
  }

  // Time range filter
  if (parsed.timeRange) {
    filters.push({
      type: 'timeRange',
      value: JSON.stringify({ start: parsed.timeRange.start, end: parsed.timeRange.end }),
      label: `Date: ${parsed.timeRange.label}`,
      confidence: 0.95,
    });
  }

  // Flag filters
  if (parsed.flags.urgent) {
    filters.push({
      type: 'flag',
      value: 'urgent',
      label: 'Urgent only',
      confidence: 0.9,
    });
  }
  if (parsed.flags.risk) {
    filters.push({
      type: 'flag',
      value: 'risk',
      label: 'At-risk cases',
      confidence: 0.9,
    });
  }
  if (parsed.flags.needsReview) {
    filters.push({
      type: 'flag',
      value: 'needsReview',
      label: 'Needs review',
      confidence: 0.9,
    });
  }

  // Sort by confidence
  return filters.sort((a, b) => b.confidence - a.confidence);
}

// ═══════════════════════════════════════════════════════════════════════════════
// Search Scoring
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Calculate relevance score for a case based on search query
 */
export function calculateRelevanceScore(
  caseData: {
    summary: string;
    category: string;
    subcategory?: string | null;
    businessUnit: string;
    channel: string;
    severity: string;
  },
  parsed: ParsedQuery
): number {
  let score = 0;
  const maxScore = 100;

  // Keyword matching (up to 40 points)
  const keywordScore = calculateKeywordScore(caseData, parsed.keywords);
  score += keywordScore * 40;

  // Filter matching (up to 60 points)
  let filterPoints = 0;
  let totalFilterWeight = 0;

  // Business unit match (weight: 15)
  if (parsed.businessUnits.length > 0) {
    totalFilterWeight += 15;
    if (parsed.businessUnits.includes(caseData.businessUnit)) {
      filterPoints += 15;
    }
  }

  // Channel match (weight: 10)
  if (parsed.channels.length > 0) {
    totalFilterWeight += 10;
    if (parsed.channels.includes(caseData.channel as Channel)) {
      filterPoints += 10;
    }
  }

  // Severity match (weight: 15)
  if (parsed.severities.length > 0) {
    totalFilterWeight += 15;
    if (parsed.severities.includes(caseData.severity as Severity)) {
      filterPoints += 15;
    }
  }

  // Category match (weight: 20)
  if (parsed.categories.length > 0) {
    totalFilterWeight += 20;
    if (parsed.categories.includes(caseData.category)) {
      filterPoints += 20;
    }
  }

  // Normalize filter score if filters were applied
  if (totalFilterWeight > 0) {
    score += (filterPoints / totalFilterWeight) * 60;
  } else if (parsed.keywords.length > 0) {
    // No filters applied, keyword score is the main factor
    score = keywordScore * 100;
  }

  return Math.min(Math.round(score), maxScore);
}

/**
 * Calculate keyword match score (0-1)
 */
function calculateKeywordScore(
  caseData: {
    summary: string;
    category: string;
    subcategory?: string | null;
  },
  keywords: string[]
): number {
  if (keywords.length === 0) return 1; // No keywords means everything matches

  const searchText = [
    caseData.summary,
    caseData.category,
    caseData.subcategory || '',
  ].join(' ').toLowerCase();

  let matchCount = 0;
  for (const keyword of keywords) {
    if (searchText.includes(keyword.toLowerCase())) {
      matchCount++;
    }
  }

  return keywords.length > 0 ? matchCount / keywords.length : 1;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Search Implementation
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Main search function - searches cases with full-text matching and filter application
 */
export async function searchCases(
  query: string,
  options: SearchOptions = {}
): Promise<SearchResponse> {
  const startTime = Date.now();
  const { limit = 50, offset = 0, sortBy = 'relevance', sortOrder = 'desc' } = options;

  // Parse the natural language query
  const parsed = parseQuery(query);
  const suggestedFilters = getSuggestedFilters(parsed);

  // Build filter conditions
  const conditions = buildFilterConditions(parsed);

  // Fetch cases matching filters
  let caseResults: Case[];
  if (conditions.length > 0) {
    caseResults = await db
      .select()
      .from(cases)
      .where(and(...conditions))
      .all();
  } else {
    caseResults = await db.select().from(cases).all();
  }

  // Apply keyword search and calculate relevance scores
  const scoredResults = caseResults
    .map((c) => {
      const { score, matchedFields } = calculateDetailedRelevanceScore(c, parsed);
      return {
        case: c,
        relevanceScore: score,
        matchedFields,
        highlightedSummary: highlightMatches(c.summary, parsed.keywords),
      };
    })
    .filter((r) => {
      // If keywords are present, filter out results with no keyword matches
      if (parsed.keywords.length > 0) {
        return r.matchedFields.length > 0 || parsed.keywords.length === 0;
      }
      return true;
    });

  // Sort results
  const sortedResults = sortResults(scoredResults, sortBy, sortOrder);

  // Apply pagination
  const paginatedResults = sortedResults.slice(offset, offset + limit);

  const executionTimeMs = Date.now() - startTime;

  return {
    results: paginatedResults,
    totalCount: sortedResults.length,
    parsedQuery: parsed,
    suggestedFilters,
    executionTimeMs,
  };
}

/**
 * Build Drizzle filter conditions from parsed query
 */
function buildFilterConditions(parsed: ParsedQuery) {
  const conditions = [];

  // Business unit filter
  if (parsed.businessUnits.length > 0) {
    if (parsed.businessUnits.length === 1) {
      conditions.push(eq(cases.businessUnit, parsed.businessUnits[0]));
    } else {
      conditions.push(
        or(...parsed.businessUnits.map((bu) => eq(cases.businessUnit, bu)))
      );
    }
  }

  // Channel filter
  if (parsed.channels.length > 0) {
    if (parsed.channels.length === 1) {
      conditions.push(eq(cases.channel, parsed.channels[0]));
    } else {
      conditions.push(
        or(...parsed.channels.map((ch) => eq(cases.channel, ch)))
      );
    }
  }

  // Severity filter
  if (parsed.severities.length > 0) {
    if (parsed.severities.length === 1) {
      conditions.push(eq(cases.severity, parsed.severities[0]));
    } else {
      conditions.push(
        or(...parsed.severities.map((sev) => eq(cases.severity, sev)))
      );
    }
  }

  // Category filter
  if (parsed.categories.length > 0) {
    if (parsed.categories.length === 1) {
      conditions.push(eq(cases.category, parsed.categories[0]));
    } else {
      conditions.push(
        or(...parsed.categories.map((cat) => eq(cases.category, cat)))
      );
    }
  }

  // Time range filter
  if (parsed.timeRange) {
    conditions.push(gte(cases.createdAt, parsed.timeRange.start.toISOString()));
    conditions.push(lte(cases.createdAt, parsed.timeRange.end.toISOString()));
  }

  // Flag filters
  if (parsed.flags.urgent) {
    conditions.push(
      or(eq(cases.severity, 'high'), eq(cases.severity, 'critical'))
    );
  }
  if (parsed.flags.risk) {
    conditions.push(eq(cases.riskFlag, true));
  }
  if (parsed.flags.needsReview) {
    conditions.push(eq(cases.needsReviewFlag, true));
  }

  return conditions;
}

/**
 * Calculate detailed relevance score with matched field tracking
 */
function calculateDetailedRelevanceScore(
  caseData: Case,
  parsed: ParsedQuery
): { score: number; matchedFields: string[] } {
  const matchedFields: string[] = [];
  let score = 0;

  // Base score for filter matches
  let filterScore = 0;
  let filterCount = 0;

  if (parsed.businessUnits.length > 0) {
    filterCount++;
    if (parsed.businessUnits.includes(caseData.businessUnit)) {
      filterScore += 1;
      matchedFields.push('businessUnit');
    }
  }

  if (parsed.channels.length > 0) {
    filterCount++;
    if (parsed.channels.includes(caseData.channel as Channel)) {
      filterScore += 1;
      matchedFields.push('channel');
    }
  }

  if (parsed.severities.length > 0) {
    filterCount++;
    if (parsed.severities.includes(caseData.severity as Severity)) {
      filterScore += 1;
      matchedFields.push('severity');
    }
  }

  if (parsed.categories.length > 0) {
    filterCount++;
    if (parsed.categories.includes(caseData.category)) {
      filterScore += 1;
      matchedFields.push('category');
    }
  }

  // Calculate filter contribution (up to 40 points)
  if (filterCount > 0) {
    score += (filterScore / filterCount) * 40;
  }

  // Keyword matching (up to 60 points)
  if (parsed.keywords.length > 0) {
    const keywordResults = matchKeywords(caseData, parsed.keywords);
    score += keywordResults.score * 60;
    matchedFields.push(...keywordResults.matchedFields);
  } else if (filterCount === 0) {
    // No keywords and no filters - give base score
    score = 50;
  } else {
    // Filters but no keywords - boost filter score
    score = filterScore > 0 ? (score / 40) * 100 : 0;
  }

  return {
    score: Math.round(Math.min(score, 100)),
    matchedFields: [...new Set(matchedFields)],
  };
}

/**
 * Match keywords against case fields and calculate score
 */
function matchKeywords(
  caseData: Case,
  keywords: string[]
): { score: number; matchedFields: string[] } {
  const matchedFields: string[] = [];
  let totalScore = 0;

  const summaryLower = caseData.summary.toLowerCase();
  const categoryLower = caseData.category.toLowerCase();
  const subcategoryLower = (caseData.subcategory || '').toLowerCase();

  for (const keyword of keywords) {
    const kw = keyword.toLowerCase();
    let keywordScore = 0;

    // Summary match (highest weight)
    if (summaryLower.includes(kw)) {
      keywordScore += 0.6;
      if (!matchedFields.includes('summary')) matchedFields.push('summary');
    }

    // Category match
    if (categoryLower.includes(kw)) {
      keywordScore += 0.25;
      if (!matchedFields.includes('category')) matchedFields.push('category');
    }

    // Subcategory match
    if (subcategoryLower.includes(kw)) {
      keywordScore += 0.15;
      if (!matchedFields.includes('subcategory')) matchedFields.push('subcategory');
    }

    totalScore += Math.min(keywordScore, 1);
  }

  return {
    score: keywords.length > 0 ? totalScore / keywords.length : 0,
    matchedFields,
  };
}

/**
 * Highlight matched keywords in text
 */
function highlightMatches(text: string, keywords: string[]): string {
  if (keywords.length === 0) return text;

  let highlighted = text;
  for (const keyword of keywords) {
    const regex = new RegExp(`(${escapeRegex(keyword)})`, 'gi');
    highlighted = highlighted.replace(regex, '**$1**');
  }
  return highlighted;
}

/**
 * Sort search results
 */
function sortResults(
  results: SearchResult[],
  sortBy: 'relevance' | 'date' | 'severity',
  sortOrder: 'asc' | 'desc'
): SearchResult[] {
  const sorted = [...results];

  sorted.sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'relevance':
        comparison = a.relevanceScore - b.relevanceScore;
        break;
      case 'date':
        comparison =
          new Date(a.case.createdAt).getTime() -
          new Date(b.case.createdAt).getTime();
        break;
      case 'severity': {
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        comparison =
          (severityOrder[a.case.severity as keyof typeof severityOrder] || 0) -
          (severityOrder[b.case.severity as keyof typeof severityOrder] || 0);
        break;
      }
    }

    return sortOrder === 'desc' ? -comparison : comparison;
  });

  return sorted;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Exports
// ═══════════════════════════════════════════════════════════════════════════════

export { BUSINESS_UNITS, CHANNELS, CATEGORIES };
