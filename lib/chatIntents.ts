/**
 * Chat Intent Recognition Module
 *
 * Implements intent classification for the chat assistant:
 * - Pattern matching for common user queries
 * - Entity extraction (BU names, dates, topics)
 * - Intent-based response routing
 */

// ═══════════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════════

export type ChatIntent =
  | 'show_trends'
  | 'find_cases'
  | 'show_urgent'
  | 'what_happening'
  | 'apply_filter'
  | 'general_question';

export interface ExtractedEntities {
  businessUnits: string[];
  channels: Channel[];
  severities: Severity[];
  categories: string[];
  timeRange: TimeRange | null;
  topics: string[];
  flags: QueryFlags;
}

export interface IntentResult {
  intent: ChatIntent;
  confidence: number;
  entities: ExtractedEntities;
  originalQuery: string;
}

export type Channel = 'phone' | 'email' | 'line' | 'web';
export type Severity = 'low' | 'medium' | 'high' | 'critical';

export interface TimeRange {
  label: string;
  start: Date;
  end: Date;
}

export interface QueryFlags {
  urgent: boolean;
  risk: boolean;
  needsReview: boolean;
  escalation: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Intent Patterns
// ═══════════════════════════════════════════════════════════════════════════════

interface IntentPattern {
  intent: ChatIntent;
  patterns: RegExp[];
  priority: number; // Higher priority patterns are checked first
}

const INTENT_PATTERNS: IntentPattern[] = [
  {
    intent: 'show_trends',
    patterns: [
      /\b(what(?:'s|s| is)? trending)\b/i,
      /\b(show(?:ing)?|see|view|display)?\s*(the\s+)?trend(?:s|ing)?\b/i,
      /\b(top|popular|hot)\s+(topic|issue|problem)s?\b/i,
      /\b(rising|growing|increasing)\s+(topic|issue|problem)s?\b/i,
      /\btrend(?:s|ing)?\s+(report|analysis|data|overview)\b/i,
    ],
    priority: 10,
  },
  {
    intent: 'find_cases',
    patterns: [
      /\b(find|search|look(?:ing)?\s+for|get|show(?:ing)?)\s+(?:me\s+)?(?:all\s+)?cases?\s+(?:about|related\s+to|with|for|on|regarding|involving)\b/i,
      /\b(search|find|look)\s+(?:for\s+)?['""]?(.+?)['""]?\b/i,
      /\b(any|all)\s+cases?\s+(?:about|related\s+to|with|for|regarding)\b/i,
      /\b(cases?|issues?|tickets?)\s+(?:about|related\s+to|with|for|regarding)\s+(.+)/i,
      /\bwhat\s+(?:cases?|issues?|tickets?)\s+(?:do\s+we\s+have|are\s+there)\s+(?:about|for|regarding|related\s+to)\b/i,
    ],
    priority: 9,
  },
  {
    intent: 'show_urgent',
    patterns: [
      /\b(show|see|view|display|get|list)\s+(?:me\s+)?(?:all\s+)?(?:the\s+)?(urgent|critical|high\s+(?:priority|severity))\s*(cases?|issues?|tickets?|alerts?|items?)?\b/i,
      /\b(urgent|critical|high\s+(?:priority|severity))\s*(cases?|issues?|tickets?|alerts?)?\b/i,
      /\b(escalation|escalated)\s*(cases?|issues?|tickets?|needed)?\b/i,
      /\b(what|any|which)\s+(?:needs?|requires?)\s+(escalation|attention|review)\b/i,
      /\b(needs?|requires?)\s+(escalation|immediate\s+attention|urgent\s+review)\b/i,
      /\bwhat(?:'s| is)?\s+(?:most\s+)?(urgent|critical|important)\b/i,
    ],
    priority: 8,
  },
  {
    intent: 'what_happening',
    patterns: [
      /\bwhat(?:'s| is)?\s+happening\b/i,
      /\bwhat(?:'s| is)?\s+going\s+on\b/i,
      /\b(give\s+me\s+(?:a\s+)?|show\s+(?:me\s+)?(?:a\s+)?|provide\s+(?:a\s+)?)?(?:today(?:'s)?|daily|current)\s+(summary|overview|report|status|update)\b/i,
      /\b(summary|overview|status|update)\s+(?:for\s+)?today\b/i,
      /\bhow(?:'s| is)?\s+(?:everything|things|it)\s+(?:going|looking)\b/i,
      /\b(what|how)\s+(?:are|is)\s+(?:we|things)\s+(?:doing|looking)\s+today\b/i,
      /\bgive\s+me\s+(?:the\s+)?(?:run\s*down|rundown|update|overview)\b/i,
      /\b(brief|quick)\s+(me|update)\b/i,
    ],
    priority: 7,
  },
  {
    intent: 'apply_filter',
    patterns: [
      /\b(filter|show(?:ing)?|display|view)\s+(?:to|by|only|for)?\s*(?:bu|business\s*unit)\s+(.+)/i,
      /\b(filter|show(?:ing)?|display|view)\s+(?:to|by|only|for)?\s*(?:channel)\s+(.+)/i,
      /\b(filter|show(?:ing)?|display|view)\s+(?:to|by|only|for)?\s*(?:last|past)\s+(\d+)\s*(day|week|month)s?\b/i,
      /\b(set|apply|add|change)\s+(?:a\s+)?filter\b/i,
      /\b(only|just)\s+(?:show|display|view)\s+(.+)/i,
      /\b(show|filter)\s+(?:me\s+)?(?:only\s+)?(.+?)\s+(?:cases?|issues?|data)\b/i,
    ],
    priority: 6,
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// Entity Constants
// ═══════════════════════════════════════════════════════════════════════════════

const BUSINESS_UNITS = [
  'Credit Cards', 'Mortgages', 'Personal Loans', 'Auto Finance',
  'Savings Accounts', 'Checking Accounts', 'Investments', 'Insurance',
  'Business Banking', 'Wealth Management', 'Mobile Banking', 'Online Banking',
  'Customer Support', 'Fraud Prevention', 'Collections'
];

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
  'chat': 'web',
};

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

// ═══════════════════════════════════════════════════════════════════════════════
// Intent Classification
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Classify the intent of a chat message
 */
export function classifyIntent(message: string): IntentResult {
  const normalized = message.toLowerCase().trim();

  // Sort patterns by priority (highest first)
  const sortedPatterns = [...INTENT_PATTERNS].sort((a, b) => b.priority - a.priority);

  // Check each intent's patterns
  for (const intentPattern of sortedPatterns) {
    for (const pattern of intentPattern.patterns) {
      if (pattern.test(normalized)) {
        const entities = extractEntities(message);
        return {
          intent: intentPattern.intent,
          confidence: calculateConfidence(intentPattern, normalized),
          entities,
          originalQuery: message,
        };
      }
    }
  }

  // Default to general_question
  const entities = extractEntities(message);
  return {
    intent: 'general_question',
    confidence: 0.3,
    entities,
    originalQuery: message,
  };
}

/**
 * Calculate confidence score for an intent match
 */
function calculateConfidence(intentPattern: IntentPattern, query: string): number {
  // Base confidence from priority
  let confidence = 0.5 + (intentPattern.priority / 20);

  // Bonus for longer matches (more specific queries)
  const matchingPatterns = intentPattern.patterns.filter(p => p.test(query));
  if (matchingPatterns.length > 1) {
    confidence += 0.1;
  }

  // Cap at 0.95
  return Math.min(confidence, 0.95);
}

// ═══════════════════════════════════════════════════════════════════════════════
// Entity Extraction
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Extract all entities from a message
 */
export function extractEntities(message: string): ExtractedEntities {
  const normalized = message.toLowerCase().trim();

  return {
    businessUnits: extractBusinessUnits(normalized),
    channels: extractChannels(normalized),
    severities: extractSeverities(normalized),
    categories: extractCategories(normalized),
    timeRange: extractTimeRange(normalized),
    topics: extractTopics(message),
    flags: extractFlags(normalized),
  };
}

/**
 * Extract business units from message
 */
function extractBusinessUnits(message: string): string[] {
  const found: Set<string> = new Set();

  // Check aliases (longer phrases first)
  const sortedAliases = Object.entries(BU_ALIASES).sort(
    (a, b) => b[0].length - a[0].length
  );

  for (const [alias, bu] of sortedAliases) {
    if (message.includes(alias)) {
      found.add(bu);
    }
  }

  // Check exact BU names (case-insensitive)
  for (const bu of BUSINESS_UNITS) {
    if (message.includes(bu.toLowerCase())) {
      found.add(bu);
    }
  }

  return Array.from(found);
}

/**
 * Extract channels from message
 */
function extractChannels(message: string): Channel[] {
  const found: Set<Channel> = new Set();

  for (const [alias, channel] of Object.entries(CHANNEL_ALIASES)) {
    const regex = new RegExp(`\\b${alias}\\b`, 'i');
    if (regex.test(message)) {
      found.add(channel);
    }
  }

  return Array.from(found);
}

/**
 * Extract categories from message
 */
function extractCategories(message: string): string[] {
  const found: Set<string> = new Set();

  const sortedAliases = Object.entries(CATEGORY_ALIASES).sort(
    (a, b) => b[0].length - a[0].length
  );

  for (const [alias, category] of sortedAliases) {
    if (message.includes(alias)) {
      found.add(category);
    }
  }

  return Array.from(found);
}

/**
 * Extract severity levels from message
 */
function extractSeverities(message: string): Severity[] {
  const found: Set<Severity> = new Set();

  for (const [indicator, severities] of Object.entries(SEVERITY_INDICATORS)) {
    const regex = new RegExp(`\\b${indicator}\\b`, 'i');
    if (regex.test(message)) {
      for (const severity of severities) {
        found.add(severity);
      }
    }
  }

  return Array.from(found);
}

/**
 * Extract time range from message
 */
function extractTimeRange(message: string): TimeRange | null {
  const now = new Date();

  // Check for "last N days" pattern
  const lastNDaysMatch = message.match(/(?:last|past)\s*(\d+)\s*days?/i);
  if (lastNDaysMatch) {
    const days = parseInt(lastNDaysMatch[1], 10);
    const start = new Date(now);
    start.setDate(start.getDate() - days);
    start.setHours(0, 0, 0, 0);
    return { label: `Last ${days} days`, start, end: now };
  }

  // Check for common time patterns
  const timePatterns: Array<{
    patterns: RegExp[];
    getDates: () => { start: Date; end: Date };
    label: string;
  }> = [
    {
      patterns: [/\btoday\b/i, /\bthis morning\b/i, /\bthis afternoon\b/i],
      getDates: () => {
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);
        return { start, end: now };
      },
      label: 'Today',
    },
    {
      patterns: [/\byesterday\b/i],
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
      patterns: [/\blast\s*week\b/i, /\bpast\s*week\b/i, /\bthis\s*week\b/i, /\bpast\s*7\s*days\b/i],
      getDates: () => {
        const start = new Date(now);
        start.setDate(start.getDate() - 7);
        start.setHours(0, 0, 0, 0);
        return { start, end: now };
      },
      label: 'Last 7 days',
    },
    {
      patterns: [/\blast\s*month\b/i, /\bpast\s*month\b/i, /\bthis\s*month\b/i, /\bpast\s*30\s*days\b/i],
      getDates: () => {
        const start = new Date(now);
        start.setDate(start.getDate() - 30);
        start.setHours(0, 0, 0, 0);
        return { start, end: now };
      },
      label: 'Last 30 days',
    },
  ];

  for (const pattern of timePatterns) {
    for (const regex of pattern.patterns) {
      if (regex.test(message)) {
        const { start, end } = pattern.getDates();
        return { label: pattern.label, start, end };
      }
    }
  }

  return null;
}

/**
 * Extract topic keywords from message (after removing intents and entities)
 */
function extractTopics(message: string): string[] {
  let remaining = message.toLowerCase();

  // Remove common intent words
  const intentWords = [
    'show', 'find', 'search', 'get', 'list', 'display', 'view', 'what',
    'is', 'are', 'the', 'me', 'all', 'about', 'related', 'to', 'with',
    'for', 'cases', 'case', 'issues', 'issue', 'tickets', 'ticket',
    'trends', 'trending', 'urgent', 'critical', 'high', 'priority',
    'happening', 'today', 'yesterday', 'last', 'past', 'week', 'month',
    'filter', 'only', 'days', 'day', 'please', 'can', 'you', 'i', 'need',
    'want', 'would', 'like', 'a', 'an', 'any', 'some', 'that', 'this',
  ];

  for (const word of intentWords) {
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

  // Split into words and filter
  const topics = remaining
    .split(/\s+/)
    .map(w => w.replace(/[^\w-]/g, '').trim())
    .filter(word => word.length > 2)
    .filter(word => !/^\d+$/.test(word));

  return [...new Set(topics)];
}

/**
 * Extract special flags from message
 */
function extractFlags(message: string): QueryFlags {
  return {
    urgent: /\b(urgent|asap|immediately|emergency)\b/i.test(message),
    risk: /\b(risk|risky|at[\s-]?risk)\b/i.test(message),
    needsReview: /\b(review|needs[\s-]?review|pending[\s-]?review)\b/i.test(message),
    escalation: /\b(escalat(?:e|ed|ion)|needs[\s-]?escalation)\b/i.test(message),
  };
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ═══════════════════════════════════════════════════════════════════════════════
// Utility Functions
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get a human-readable description of the detected intent
 */
export function getIntentDescription(intent: ChatIntent): string {
  const descriptions: Record<ChatIntent, string> = {
    show_trends: 'Show trending topics',
    find_cases: 'Search for specific cases',
    show_urgent: 'Show urgent or escalated cases',
    what_happening: 'Get a summary of current activity',
    apply_filter: 'Apply filters to the view',
    general_question: 'General inquiry',
  };
  return descriptions[intent];
}

/**
 * Check if an intent requires entity extraction
 */
export function intentRequiresEntities(intent: ChatIntent): boolean {
  return ['find_cases', 'apply_filter'].includes(intent);
}

/**
 * Get suggested follow-up based on intent and entities
 */
export function getSuggestedFollowUp(result: IntentResult): string | null {
  const { intent, entities } = result;

  if (intent === 'find_cases' && entities.topics.length === 0) {
    return 'What topic or keyword would you like to search for?';
  }

  if (intent === 'apply_filter' && entities.businessUnits.length === 0 && entities.channels.length === 0) {
    return 'Which business unit or channel would you like to filter by?';
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Exports
// ═══════════════════════════════════════════════════════════════════════════════

export { BUSINESS_UNITS, CHANNEL_ALIASES, CATEGORY_ALIASES, SEVERITY_INDICATORS };
