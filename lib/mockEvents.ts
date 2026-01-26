/**
 * Mock Event Generator for Real-Time Demo Mode
 *
 * Generates realistic mock events including:
 * - New case arrivals
 * - Alert triggers
 * - Trending topic updates
 */

import { db } from '@/lib/db';
import { cases, alerts, trendingTopics, feedItems } from '@/lib/db/schema';
import type { NewCase, NewAlert, NewTrendingTopic, NewFeedItem } from '@/lib/db/schema';

// ═══════════════════════════════════════════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════════════════════════════════════════

export interface MockEventConfig {
  intervalMs: number; // Interval between events (default: 30-60 seconds)
  enabled: boolean;
}

const DEFAULT_CONFIG: MockEventConfig = {
  intervalMs: 45000, // 45 seconds default (range: 30-60 seconds)
  enabled: false,
};

let currentConfig = { ...DEFAULT_CONFIG };
let intervalId: NodeJS.Timeout | null = null;

// Track recent event types to ensure variety
let recentEventTypes: MockEventType[] = [];
const MAX_RECENT_EVENTS = 3; // Track last 3 events for variety

// ═══════════════════════════════════════════════════════════════════════════════
// Seed Data Constants
// ═══════════════════════════════════════════════════════════════════════════════

const BUSINESS_UNITS = [
  'Credit Cards', 'Mortgages', 'Personal Loans', 'Auto Finance',
  'Savings Accounts', 'Checking Accounts', 'Investments', 'Insurance',
  'Business Banking', 'Wealth Management', 'Mobile Banking', 'Online Banking',
];

const CHANNELS: Array<'phone' | 'email' | 'line' | 'web'> = ['phone', 'email', 'line', 'web'];

const CATEGORIES = [
  'Account Access', 'Payment Issues', 'Technical Support', 'Billing Dispute',
  'Product Inquiry', 'Complaint', 'Fraud Report', 'Documentation Request',
];

const SEVERITIES: Array<'low' | 'medium' | 'high' | 'critical'> = ['low', 'medium', 'high', 'critical'];
const SENTIMENTS: Array<'positive' | 'neutral' | 'negative'> = ['positive', 'neutral', 'negative'];
const STATUSES: Array<'open' | 'in_progress'> = ['open', 'in_progress'];

const CUSTOMER_NAMES = [
  'John Smith', 'Maria Garcia', 'James Johnson', 'Sarah Williams', 'Michael Brown',
  'Jennifer Davis', 'Robert Miller', 'Linda Wilson', 'David Moore', 'Elizabeth Taylor',
];

const CASE_SUMMARIES: Record<string, string[]> = {
  'Account Access': [
    'Customer unable to log into mobile banking app after update',
    'Password reset link not working for online account',
    'Account locked due to suspicious activity detection',
    'Two-factor authentication codes not being received',
  ],
  'Payment Issues': [
    'Payment failed but amount was deducted from account',
    'Customer charged twice for single transaction',
    'International transfer stuck in pending status',
    'Automatic payment not processed on due date',
  ],
  'Technical Support': [
    'Mobile app crashes when viewing transaction history',
    'Unable to download monthly statement PDF',
    'Push notifications not appearing on device',
    'Biometric login stopped working after update',
  ],
  'Billing Dispute': [
    'Customer disputes charge from unknown merchant',
    'Unauthorized subscription charge on statement',
    'Late fee charged despite on-time payment',
    'Incorrect interest rate applied to balance',
  ],
  'Product Inquiry': [
    'Customer wants information on credit card upgrade',
    'Inquiry about loan refinancing options',
    'Questions about rewards program benefits',
    'Request for higher credit limit',
  ],
  'Complaint': [
    'Long wait times on customer service line',
    'Poor service experience at branch location',
    'Representative provided incorrect information',
    'Dissatisfied with dispute resolution process',
  ],
  'Fraud Report': [
    'Suspicious transactions from foreign country',
    'Customer reports stolen card used for online purchases',
    'Potential identity theft - unfamiliar accounts',
    'Received phishing email claiming to be from bank',
  ],
  'Documentation Request': [
    'Request for tax documents and statements',
    'Need account verification letter for mortgage',
    'Requesting transaction history for audit',
    'Copy of signed loan agreement needed',
  ],
};

const ALERT_TEMPLATES = [
  {
    type: 'spike' as const,
    title: (bu: string, cat: string) => `Case Volume Spike: ${cat} in ${bu}`,
    description: (bu: string, _cat: string, baseline: number, current: number) =>
      `Case volume has increased from ${baseline} to ${current} in the last hour`,
  },
  {
    type: 'threshold' as const,
    title: (bu: string, cat: string) => `Threshold Alert: ${cat} Cases`,
    description: (bu: string, _cat: string, baseline: number, current: number) =>
      `${bu} has reached ${current} cases, exceeding the ${baseline} threshold`,
  },
  {
    type: 'urgency' as const,
    title: (bu: string, cat: string) => `High Urgency: ${cat} Issues`,
    description: (bu: string, _cat: string, baseline: number, current: number) =>
      `${current} high-severity cases detected in ${bu}, up ${Math.round((current - baseline) / baseline * 100)}% from baseline`,
  },
];

const TRENDING_TOPICS = [
  'Mobile App Login Issues',
  'Payment Processing Delays',
  'Card Activation Problems',
  'Interest Rate Complaints',
  'ATM Withdrawal Errors',
  'Statement Discrepancies',
  'Reward Points Not Applied',
  'Account Security Concerns',
  'Wire Transfer Failures',
  'Direct Deposit Issues',
];

// ═══════════════════════════════════════════════════════════════════════════════
// Utility Functions
// ═══════════════════════════════════════════════════════════════════════════════

function generateId(prefix: string): string {
  return `${prefix}-mock-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateCaseNumber(): string {
  const year = new Date().getFullYear();
  const num = randomInt(100000, 999999);
  return `CASE-${year}-${num}`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Event Generators
// ═══════════════════════════════════════════════════════════════════════════════

export type MockEventType = 'case' | 'alert' | 'trending';

export interface GeneratedEvent {
  type: MockEventType;
  id: string;
  data: NewCase | NewAlert | NewTrendingTopic;
  feedItem: NewFeedItem;
}

/**
 * Generate a new mock case
 */
export function generateMockCase(): GeneratedEvent {
  const now = new Date().toISOString();
  const category = pick(CATEGORIES);
  const businessUnit = pick(BUSINESS_UNITS);
  const severity = pick(SEVERITIES);
  const summaries = CASE_SUMMARIES[category] || CASE_SUMMARIES['Product Inquiry'];

  const id = generateId('case');
  const caseData: NewCase = {
    id,
    caseNumber: generateCaseNumber(),
    channel: pick(CHANNELS),
    status: pick(STATUSES),
    category,
    subcategory: null,
    sentiment: pick(SENTIMENTS),
    severity,
    riskFlag: severity === 'critical' || Math.random() < 0.15,
    needsReviewFlag: Math.random() < 0.2,
    businessUnit,
    summary: pick(summaries),
    customerName: pick(CUSTOMER_NAMES),
    agentId: `agent-${randomInt(1, 50)}`,
    assignedTo: Math.random() > 0.3 ? `user-supervisor-${randomInt(1, 10)}` : null,
    createdAt: now,
    updatedAt: now,
    resolvedAt: null,
  };

  const feedItem: NewFeedItem = {
    id: generateId('feed'),
    type: 'highlight',
    title: `New ${severity === 'high' || severity === 'critical' ? 'Urgent ' : ''}Case: ${category}`,
    content: caseData.summary,
    metadata: JSON.stringify({
      caseId: id,
      businessUnit,
      channel: caseData.channel,
      severity,
      customerName: caseData.customerName,
    }),
    priority: severity === 'critical' ? 3 : severity === 'high' ? 2 : 1,
    referenceId: id,
    referenceType: 'case',
    createdAt: now,
    expiresAt: null,
  };

  return { type: 'case', id, data: caseData, feedItem };
}

/**
 * Generate a new mock alert
 */
export function generateMockAlert(): GeneratedEvent {
  const now = new Date().toISOString();
  const template = pick(ALERT_TEMPLATES);
  const businessUnit = pick(BUSINESS_UNITS);
  const category = pick(CATEGORIES);
  const severity = pick(['medium', 'high', 'critical'] as const);

  const baselineValue = randomInt(10, 30);
  const currentValue = baselineValue + randomInt(10, 50);
  const percentageChange = Math.round((currentValue - baselineValue) / baselineValue * 100);

  const id = generateId('alert');
  const alertData: NewAlert = {
    id,
    type: template.type,
    severity,
    title: template.title(businessUnit, category),
    description: template.description(businessUnit, category, baselineValue, currentValue),
    businessUnit,
    category,
    channel: pick(CHANNELS),
    baselineValue,
    currentValue,
    percentageChange,
    status: 'active',
    acknowledgedBy: null,
    acknowledgedAt: null,
    createdAt: now,
    updatedAt: now,
  };

  const feedItem: NewFeedItem = {
    id: generateId('feed'),
    type: 'alert',
    title: alertData.title,
    content: alertData.description,
    metadata: JSON.stringify({
      alertId: id,
      alertType: template.type,
      businessUnit,
      category,
      severity,
      baselineValue,
      currentValue,
      percentageChange,
    }),
    priority: severity === 'critical' ? 4 : severity === 'high' ? 3 : 2,
    referenceId: id,
    referenceType: 'alert',
    createdAt: now,
    expiresAt: null,
  };

  return { type: 'alert', id, data: alertData, feedItem };
}

/**
 * Generate a trending topic update
 */
export function generateMockTrendingUpdate(): GeneratedEvent {
  const now = new Date().toISOString();
  const topic = pick(TRENDING_TOPICS);
  const businessUnit = pick(BUSINESS_UNITS);
  const category = pick(CATEGORIES);

  const baselineCount = randomInt(5, 20);
  const caseCount = baselineCount + randomInt(5, 30);
  const percentageChange = Math.round((caseCount - baselineCount) / baselineCount * 100);
  const trendScore = percentageChange / 10; // Simple trend score calculation

  const id = generateId('trending');
  const trendingData: NewTrendingTopic = {
    id,
    topic,
    description: `Increase in "${topic}" related cases in ${businessUnit}`,
    caseCount,
    baselineCount,
    trend: 'rising',
    percentageChange,
    trendScore,
    businessUnit,
    category,
    sampleCaseIds: null,
    createdAt: now,
    updatedAt: now,
  };

  const feedItem: NewFeedItem = {
    id: generateId('feed'),
    type: 'trending',
    title: `Trending: ${topic}`,
    content: `"${topic}" is trending with ${caseCount} cases (+${percentageChange}% from baseline)`,
    metadata: JSON.stringify({
      trendingId: id,
      topic,
      businessUnit,
      category,
      caseCount,
      percentageChange,
      trend: 'rising',
    }),
    priority: percentageChange > 100 ? 3 : percentageChange > 50 ? 2 : 1,
    referenceId: id,
    referenceType: 'trending',
    createdAt: now,
    expiresAt: null,
  };

  return { type: 'trending', id, data: trendingData, feedItem };
}

/**
 * Get event type weights, reducing probability for recently generated types
 */
function getEventTypeWeights(): { type: MockEventType; weight: number }[] {
  const baseWeights = [
    { type: 'case' as MockEventType, weight: 50 },
    { type: 'alert' as MockEventType, weight: 30 },
    { type: 'trending' as MockEventType, weight: 20 },
  ];

  // Reduce weight for types that were recently generated
  return baseWeights.map(item => {
    const recentCount = recentEventTypes.filter(t => t === item.type).length;
    // Each recent occurrence reduces weight by 40%, minimum 5%
    const reduction = recentCount * 0.4;
    const adjustedWeight = Math.max(5, item.weight * (1 - reduction));
    return { type: item.type, weight: adjustedWeight };
  });
}

/**
 * Select event type based on weighted random selection with variety tracking
 */
function selectEventType(): MockEventType {
  const weights = getEventTypeWeights();
  const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
  const roll = Math.random() * totalWeight;

  let cumulative = 0;
  for (const item of weights) {
    cumulative += item.weight;
    if (roll < cumulative) {
      return item.type;
    }
  }

  // Fallback (shouldn't happen)
  return 'case';
}

/**
 * Track generated event type for variety
 */
function trackEventType(type: MockEventType): void {
  recentEventTypes.push(type);
  if (recentEventTypes.length > MAX_RECENT_EVENTS) {
    recentEventTypes.shift();
  }
}

/**
 * Generate a random mock event with variety
 * Uses weighted random selection that reduces probability for recently generated types
 */
export function generateRandomEvent(): GeneratedEvent {
  const eventType = selectEventType();
  trackEventType(eventType);

  switch (eventType) {
    case 'case':
      return generateMockCase();
    case 'alert':
      return generateMockAlert();
    case 'trending':
      return generateMockTrendingUpdate();
    default:
      return generateMockCase();
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Database Operations
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Save a generated event to the database
 */
export async function saveEvent(event: GeneratedEvent): Promise<void> {
  try {
    // Save the main entity
    switch (event.type) {
      case 'case':
        await db.insert(cases).values(event.data as NewCase);
        break;
      case 'alert':
        await db.insert(alerts).values(event.data as NewAlert);
        break;
      case 'trending':
        await db.insert(trendingTopics).values(event.data as NewTrendingTopic);
        break;
    }

    // Save the feed item
    await db.insert(feedItems).values(event.feedItem);
  } catch (error) {
    console.error(`Failed to save mock event:`, error);
    throw error;
  }
}

/**
 * Generate and save a random event
 */
export async function generateAndSaveEvent(): Promise<GeneratedEvent> {
  const event = generateRandomEvent();
  await saveEvent(event);
  return event;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Demo Mode Controller
// ═══════════════════════════════════════════════════════════════════════════════

// Minimum and maximum interval bounds (30-60 seconds as per requirements)
const MIN_INTERVAL_MS = 30000;
const MAX_INTERVAL_MS = 60000;

/**
 * Calculate next interval with randomness, enforcing 30-60 second bounds
 */
function calculateNextInterval(baseInterval: number): number {
  // Add ±15 seconds of jitter
  const jitter = randomInt(-15000, 15000);
  const rawInterval = baseInterval + jitter;
  // Clamp to 30-60 second range
  return Math.max(MIN_INTERVAL_MS, Math.min(MAX_INTERVAL_MS, rawInterval));
}

/**
 * Start the mock event generator
 */
export function startMockEventGenerator(config?: Partial<MockEventConfig>): void {
  if (intervalId) {
    stopMockEventGenerator();
  }

  // Reset event type tracking for fresh variety
  recentEventTypes = [];

  // Clamp provided interval to valid range
  const providedInterval = config?.intervalMs ?? DEFAULT_CONFIG.intervalMs;
  const clampedInterval = Math.max(MIN_INTERVAL_MS, Math.min(MAX_INTERVAL_MS, providedInterval));

  currentConfig = { ...DEFAULT_CONFIG, ...config, intervalMs: clampedInterval, enabled: true };

  // Generate first event immediately
  generateAndSaveEvent()
    .then(event => console.log(`[Demo Mode] Generated ${event.type} event: ${event.id}`))
    .catch(err => console.error('[Demo Mode] Error generating event:', err));

  // Set up interval for subsequent events with randomness in 30-60 second range
  const scheduleNext = () => {
    const nextInterval = calculateNextInterval(currentConfig.intervalMs);

    intervalId = setTimeout(async () => {
      if (!currentConfig.enabled) return;

      try {
        const event = await generateAndSaveEvent();
        console.log(`[Demo Mode] Generated ${event.type} event: ${event.id}`);
      } catch (err) {
        console.error('[Demo Mode] Error generating event:', err);
      }

      scheduleNext();
    }, nextInterval);
  };

  scheduleNext();
  console.log(`[Demo Mode] Started with interval ~${currentConfig.intervalMs}ms (range: ${MIN_INTERVAL_MS}-${MAX_INTERVAL_MS}ms)`);
}

/**
 * Stop the mock event generator
 */
export function stopMockEventGenerator(): void {
  if (intervalId) {
    clearTimeout(intervalId);
    intervalId = null;
  }
  currentConfig.enabled = false;
  // Reset event type tracking
  recentEventTypes = [];
  console.log('[Demo Mode] Stopped');
}

/**
 * Check if mock event generator is running
 */
export function isMockEventGeneratorRunning(): boolean {
  return currentConfig.enabled && intervalId !== null;
}

/**
 * Get current configuration
 */
export function getMockEventConfig(): MockEventConfig {
  return { ...currentConfig };
}

/**
 * Update configuration (without stopping/starting)
 */
export function updateMockEventConfig(config: Partial<MockEventConfig>): void {
  currentConfig = { ...currentConfig, ...config };
}
