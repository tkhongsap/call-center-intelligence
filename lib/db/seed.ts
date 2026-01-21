/**
 * Seed script for Call Center Intelligence database
 * Generates deterministic test data for development and demos
 *
 * Run with: npm run db:seed
 */

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import path from 'path';
import fs from 'fs';
import { calculateTrendScore } from '../trending';

// ═══════════════════════════════════════════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════════════════════════════════════════
const DEMO_MODE = process.env.DEMO_MODE === 'true';
const SEED = 42; // Deterministic seed for reproducibility

// Deterministic random number generator
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
    return this.seed / 0x7fffffff;
  }

  pick<T>(arr: T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }

  pickMultiple<T>(arr: T[], count: number): T[] {
    const shuffled = [...arr].sort(() => this.next() - 0.5);
    return shuffled.slice(0, count);
  }

  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  bool(probability = 0.5): boolean {
    return this.next() < probability;
  }
}

const rng = new SeededRandom(SEED);

// ═══════════════════════════════════════════════════════════════════════════════
// Seed Data Constants
// ═══════════════════════════════════════════════════════════════════════════════
const BUSINESS_UNITS = [
  'Credit Cards', 'Mortgages', 'Personal Loans', 'Auto Finance',
  'Savings Accounts', 'Checking Accounts', 'Investments', 'Insurance',
  'Business Banking', 'Wealth Management', 'Mobile Banking', 'Online Banking',
  'Customer Support', 'Fraud Prevention', 'Collections'
];

const CHANNELS: Array<'phone' | 'email' | 'line' | 'web'> = ['phone', 'email', 'line', 'web'];

const CATEGORIES = [
  'Account Access', 'Payment Issues', 'Technical Support', 'Billing Dispute',
  'Product Inquiry', 'Complaint', 'Feedback', 'Cancellation Request',
  'Fraud Report', 'Documentation Request', 'Rate Inquiry', 'Balance Inquiry',
  'Card Activation', 'PIN Reset', 'Statement Request'
];

const SUBCATEGORIES: Record<string, string[]> = {
  'Account Access': ['Login Issues', 'Password Reset', 'Account Locked', 'MFA Problems'],
  'Payment Issues': ['Failed Transaction', 'Double Charge', 'Delayed Payment', 'Refund Request'],
  'Technical Support': ['App Crash', 'Website Error', 'Slow Performance', 'Feature Not Working'],
  'Billing Dispute': ['Incorrect Amount', 'Unauthorized Charge', 'Missing Credit', 'Late Fee'],
  'Fraud Report': ['Suspicious Activity', 'Identity Theft', 'Card Skimming', 'Phishing Attempt'],
};

const CUSTOMER_NAMES = [
  'John Smith', 'Maria Garcia', 'James Johnson', 'Sarah Williams', 'Michael Brown',
  'Jennifer Davis', 'Robert Miller', 'Linda Wilson', 'David Moore', 'Elizabeth Taylor',
  'Christopher Anderson', 'Patricia Thomas', 'Daniel Jackson', 'Barbara White', 'Matthew Harris',
  'Nancy Martin', 'Anthony Thompson', 'Karen Garcia', 'Mark Martinez', 'Lisa Robinson'
];

const CASE_SUMMARIES: Record<string, string[]> = {
  'Account Access': [
    'Customer unable to log into mobile banking app',
    'Password reset not working after multiple attempts',
    'Account locked after failed login attempts',
    'Two-factor authentication not receiving codes',
  ],
  'Payment Issues': [
    'Payment failed but amount deducted from account',
    'Customer charged twice for single transaction',
    'Payment pending for more than 5 business days',
    'Refund not received after 30 days',
  ],
  'Technical Support': [
    'Mobile app crashes on startup',
    'Unable to view account statements online',
    'Transfer feature not working properly',
    'Push notifications not being received',
  ],
  'Billing Dispute': [
    'Customer disputes charge from merchant',
    'Unauthorized subscription charge on statement',
    'Missing cashback reward credit',
    'Late fee charged despite on-time payment',
  ],
  'Fraud Report': [
    'Suspicious transactions from foreign country',
    'Customer reports stolen card used online',
    'Potential identity theft - new accounts opened',
    'Phishing email claiming to be from bank',
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// Predicted Risk Scenario Summaries
// These summaries contain specific terms that will create prediction patterns
// ═══════════════════════════════════════════════════════════════════════════════

// Scenario 1: "wire transfer" - 3+ consecutive day increase
const WIRE_TRANSFER_SUMMARIES = [
  'Customer reports failed wire transfer to international account',
  'Wire transfer funds not received after 5 business days',
  'Unable to initiate wire transfer through online banking',
  'Wire transfer rejected with no explanation provided',
  'Customer disputes wire transfer fee charges',
];

// Scenario 2: "system outage" - Approaching 85% of threshold (100)
const SYSTEM_OUTAGE_SUMMARIES = [
  'System outage preventing account access',
  'Unable to complete transactions due to system outage',
  'Customer impacted by system outage during payment',
  'System outage caused double billing issue',
  'Scheduled payment failed during system outage',
];

// Scenario 3: "overdraft fee" - Accelerating growth (rapid recent increase)
const OVERDRAFT_FEE_SUMMARIES = [
  'Customer disputes multiple overdraft fee charges',
  'Requesting overdraft fee waiver due to bank error',
  'Excessive overdraft fee complaints after balance change',
  'Overdraft fee charged despite positive balance',
  'Customer unhappy with repeated overdraft fee assessments',
];

// ═══════════════════════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════════════════════
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
}

function generateCaseNumber(index: number): string {
  return `CC-${String(index).padStart(6, '0')}`;
}

function getDateInRange(daysAgo: number): string {
  const now = DEMO_MODE ? new Date('2024-01-15T12:00:00Z') : new Date();
  const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  return date.toISOString();
}

function getRandomDateInRange(minDaysAgo: number, maxDaysAgo: number): string {
  const daysAgo = rng.int(minDaysAgo, maxDaysAgo);
  return getDateInRange(daysAgo);
}

// ═══════════════════════════════════════════════════════════════════════════════
// Seed Functions
// ═══════════════════════════════════════════════════════════════════════════════
function seedUsers(db: ReturnType<typeof drizzle>) {
  const users: schema.NewUser[] = [
    // Admins
    {
      id: 'user-admin-1',
      name: 'Alex Chen',
      email: 'alex.chen@company.com',
      role: 'admin',
      businessUnit: null,
      avatarUrl: null,
      createdAt: getDateInRange(365),
    },
    // BU Managers
    ...BUSINESS_UNITS.slice(0, 5).map((bu, i) => ({
      id: `user-manager-${i + 1}`,
      name: rng.pick(CUSTOMER_NAMES),
      email: `manager${i + 1}@company.com`,
      role: 'bu_manager' as const,
      businessUnit: bu,
      avatarUrl: null,
      createdAt: getDateInRange(180),
    })),
    // Supervisors
    ...Array.from({ length: 10 }, (_, i) => ({
      id: `user-supervisor-${i + 1}`,
      name: rng.pick(CUSTOMER_NAMES),
      email: `supervisor${i + 1}@company.com`,
      role: 'supervisor' as const,
      businessUnit: rng.pick(BUSINESS_UNITS),
      avatarUrl: null,
      createdAt: getDateInRange(90),
    })),
  ];

  db.insert(schema.users).values(users).run();
  console.log(`✓ Seeded ${users.length} users`);
  return users;
}

function seedCases(db: ReturnType<typeof drizzle>, count: number) {
  const cases: schema.NewCase[] = [];

  for (let i = 0; i < count; i++) {
    const category = rng.pick(CATEGORIES);
    const subcategories = SUBCATEGORIES[category];
    const summaries = CASE_SUMMARIES[category] || CASE_SUMMARIES['Technical Support'];

    const createdAt = getRandomDateInRange(0, 30);
    const status = rng.pick(['open', 'in_progress', 'resolved', 'closed'] as const);

    // Higher chance of negative sentiment for certain categories
    const isNegativeCategory = ['Complaint', 'Fraud Report', 'Billing Dispute'].includes(category);
    const sentimentWeights = isNegativeCategory
      ? ['negative', 'negative', 'negative', 'neutral', 'positive']
      : ['positive', 'neutral', 'neutral', 'negative'];

    // Risk flag for high-severity negative cases
    const severity = rng.pick(['low', 'medium', 'high', 'critical'] as const);
    const sentiment = rng.pick(sentimentWeights) as 'positive' | 'neutral' | 'negative';
    const riskFlag = sentiment === 'negative' && ['high', 'critical'].includes(severity) && rng.bool(0.3);
    const needsReviewFlag = rng.bool(0.1);

    cases.push({
      id: `case-${i + 1}`,
      caseNumber: generateCaseNumber(i + 1),
      channel: rng.pick(CHANNELS),
      status,
      category,
      subcategory: subcategories ? rng.pick(subcategories) : null,
      sentiment,
      severity,
      riskFlag,
      needsReviewFlag,
      businessUnit: rng.pick(BUSINESS_UNITS),
      summary: rng.pick(summaries),
      customerName: rng.pick(CUSTOMER_NAMES),
      agentId: `agent-${rng.int(1, 50)}`,
      assignedTo: rng.bool(0.7) ? `user-supervisor-${rng.int(1, 10)}` : null,
      createdAt,
      updatedAt: createdAt,
      resolvedAt: ['resolved', 'closed'].includes(status) ? getRandomDateInRange(0, 15) : null,
    });
  }

  // Batch insert
  const batchSize = 100;
  for (let i = 0; i < cases.length; i += batchSize) {
    const batch = cases.slice(i, i + batchSize);
    db.insert(schema.cases).values(batch).run();
  }

  console.log(`✓ Seeded ${cases.length} cases`);
  return cases;
}

/**
 * Seeds additional cases to create specific prediction scenarios:
 * 1. Wire Transfer: 3+ consecutive day increase (day0: 2, day1: 4, day2: 7, day3: 12)
 * 2. System Outage: Approaching 85% of 100 threshold (creates ~88 cases in last 7 days)
 * 3. Overdraft Fee: Accelerating growth (earlier: 3->4, recent: 6->12)
 */
function seedPredictedRiskCases(db: ReturnType<typeof drizzle>, startingId: number): schema.NewCase[] {
  const cases: schema.NewCase[] = [];
  let caseIndex = startingId;

  // Helper to create a case with specific date offset
  const createPredictionCase = (
    daysAgo: number,
    summary: string,
    businessUnit: string,
    category: string
  ): schema.NewCase => {
    const createdAt = getDateInRange(daysAgo);
    return {
      id: `case-${caseIndex++}`,
      caseNumber: generateCaseNumber(caseIndex),
      channel: rng.pick(CHANNELS),
      status: rng.pick(['open', 'in_progress', 'resolved', 'closed'] as const),
      category,
      subcategory: null,
      sentiment: rng.pick(['negative', 'negative', 'neutral'] as const),
      severity: rng.pick(['medium', 'high'] as const),
      riskFlag: rng.bool(0.2),
      needsReviewFlag: rng.bool(0.1),
      businessUnit,
      summary,
      customerName: rng.pick(CUSTOMER_NAMES),
      agentId: `agent-${rng.int(1, 50)}`,
      assignedTo: rng.bool(0.7) ? `user-supervisor-${rng.int(1, 10)}` : null,
      createdAt,
      updatedAt: createdAt,
      resolvedAt: null,
    };
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // Scenario 1: Wire Transfer - Consecutive Increase (3+ days)
  // Day 3 ago: 2 cases, Day 2 ago: 4 cases, Day 1 ago: 7 cases, Day 0: 12 cases
  // This creates a clear consecutive rising pattern
  // ═══════════════════════════════════════════════════════════════════════════════

  // Day 3 ago - 2 cases
  for (let i = 0; i < 2; i++) {
    cases.push(createPredictionCase(
      3,
      rng.pick(WIRE_TRANSFER_SUMMARIES),
      'Personal Loans',
      'Payment Issues'
    ));
  }

  // Day 2 ago - 4 cases
  for (let i = 0; i < 4; i++) {
    cases.push(createPredictionCase(
      2,
      rng.pick(WIRE_TRANSFER_SUMMARIES),
      'Personal Loans',
      'Payment Issues'
    ));
  }

  // Day 1 ago - 7 cases
  for (let i = 0; i < 7; i++) {
    cases.push(createPredictionCase(
      1,
      rng.pick(WIRE_TRANSFER_SUMMARIES),
      'Personal Loans',
      'Payment Issues'
    ));
  }

  // Today - 12 cases
  for (let i = 0; i < 12; i++) {
    cases.push(createPredictionCase(
      0,
      rng.pick(WIRE_TRANSFER_SUMMARIES),
      'Personal Loans',
      'Payment Issues'
    ));
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // Scenario 2: System Outage - Approaching Threshold (85-95% of 100)
  // Creates ~88 cases over the last 7 days to approach 100 threshold
  // Baseline (days 7-14): ~20 cases total
  // Current (days 0-7): ~88 cases total
  // ═══════════════════════════════════════════════════════════════════════════════

  // Baseline period (7-14 days ago) - lower volume
  for (let day = 14; day >= 7; day--) {
    const casesPerDay = rng.int(2, 4); // ~3 per day = ~24 total
    for (let i = 0; i < casesPerDay; i++) {
      cases.push(createPredictionCase(
        day,
        rng.pick(SYSTEM_OUTAGE_SUMMARIES),
        'Mobile Banking',
        'Technical Support'
      ));
    }
  }

  // Current period (0-7 days ago) - high volume approaching threshold
  for (let day = 6; day >= 0; day--) {
    const casesPerDay = rng.int(10, 15); // ~12-13 per day = ~88 total
    for (let i = 0; i < casesPerDay; i++) {
      cases.push(createPredictionCase(
        day,
        rng.pick(SYSTEM_OUTAGE_SUMMARIES),
        'Mobile Banking',
        'Technical Support'
      ));
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // Scenario 3: Overdraft Fee - Accelerating Growth
  // Earlier period growth: 3->4 (33% growth)
  // Recent period growth: 6->12 (100% growth) - much faster
  // ═══════════════════════════════════════════════════════════════════════════════

  // Day 6 ago - 3 cases (baseline start)
  for (let i = 0; i < 3; i++) {
    cases.push(createPredictionCase(
      6,
      rng.pick(OVERDRAFT_FEE_SUMMARIES),
      'Checking Accounts',
      'Billing Dispute'
    ));
  }

  // Day 5 ago - 4 cases (33% growth from day 6)
  for (let i = 0; i < 4; i++) {
    cases.push(createPredictionCase(
      5,
      rng.pick(OVERDRAFT_FEE_SUMMARIES),
      'Checking Accounts',
      'Billing Dispute'
    ));
  }

  // Day 4 ago - 4 cases (stable)
  for (let i = 0; i < 4; i++) {
    cases.push(createPredictionCase(
      4,
      rng.pick(OVERDRAFT_FEE_SUMMARIES),
      'Checking Accounts',
      'Billing Dispute'
    ));
  }

  // Day 3 ago - 5 cases (slight uptick)
  for (let i = 0; i < 5; i++) {
    cases.push(createPredictionCase(
      3,
      rng.pick(OVERDRAFT_FEE_SUMMARIES),
      'Checking Accounts',
      'Billing Dispute'
    ));
  }

  // Day 2 ago - 6 cases (acceleration begins)
  for (let i = 0; i < 6; i++) {
    cases.push(createPredictionCase(
      2,
      rng.pick(OVERDRAFT_FEE_SUMMARIES),
      'Checking Accounts',
      'Billing Dispute'
    ));
  }

  // Day 1 ago - 9 cases (50% growth)
  for (let i = 0; i < 9; i++) {
    cases.push(createPredictionCase(
      1,
      rng.pick(OVERDRAFT_FEE_SUMMARIES),
      'Checking Accounts',
      'Billing Dispute'
    ));
  }

  // Today - 15 cases (67% growth - clear acceleration)
  for (let i = 0; i < 15; i++) {
    cases.push(createPredictionCase(
      0,
      rng.pick(OVERDRAFT_FEE_SUMMARIES),
      'Checking Accounts',
      'Billing Dispute'
    ));
  }

  // Batch insert
  const batchSize = 100;
  for (let i = 0; i < cases.length; i += batchSize) {
    const batch = cases.slice(i, i + batchSize);
    db.insert(schema.cases).values(batch).run();
  }

  console.log(`✓ Seeded ${cases.length} predicted risk scenario cases`);
  console.log('  - Wire Transfer: Consecutive 3+ day increase pattern');
  console.log('  - System Outage: Approaching 85%+ of alert threshold');
  console.log('  - Overdraft Fee: Accelerating growth pattern');

  return cases;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function seedAlerts(db: ReturnType<typeof drizzle>, _cases: schema.NewCase[]) {
  const alerts: schema.NewAlert[] = [];

  // Create spike alerts (65%+ volume increase)
  const spikeAlerts = [
    {
      id: 'alert-spike-1',
      type: 'spike' as const,
      severity: 'high' as const,
      title: 'Fraud Reports Spike - Credit Cards',
      description: 'Fraud report volume increased by 78% in the last 4 hours compared to baseline',
      businessUnit: 'Credit Cards',
      category: 'Fraud Report',
      channel: 'phone',
      baselineValue: 45,
      currentValue: 80,
      percentageChange: 78,
      status: 'active' as const,
      createdAt: getDateInRange(0),
      updatedAt: getDateInRange(0),
    },
    {
      id: 'alert-spike-2',
      type: 'spike' as const,
      severity: 'critical' as const,
      title: 'Account Access Issues Surge - Mobile Banking',
      description: 'Login failure cases increased by 125% following app update',
      businessUnit: 'Mobile Banking',
      category: 'Account Access',
      channel: 'web',
      baselineValue: 20,
      currentValue: 45,
      percentageChange: 125,
      status: 'active' as const,
      createdAt: getDateInRange(0),
      updatedAt: getDateInRange(0),
    },
    {
      id: 'alert-spike-3',
      type: 'spike' as const,
      severity: 'medium' as const,
      title: 'Payment Issues Increase - Online Banking',
      description: 'Failed payment complaints up 67% in the last 2 hours',
      businessUnit: 'Online Banking',
      category: 'Payment Issues',
      channel: 'email',
      baselineValue: 30,
      currentValue: 50,
      percentageChange: 67,
      status: 'acknowledged' as const,
      acknowledgedBy: 'user-manager-1',
      acknowledgedAt: getDateInRange(0),
      createdAt: getDateInRange(1),
      updatedAt: getDateInRange(0),
    },
  ];

  // Create threshold alerts
  const thresholdAlerts = [
    {
      id: 'alert-threshold-1',
      type: 'threshold' as const,
      severity: 'medium' as const,
      title: 'High Negative Sentiment Rate',
      description: 'Negative sentiment cases exceeded 40% threshold in Collections',
      businessUnit: 'Collections',
      category: null,
      channel: null,
      baselineValue: 40,
      currentValue: 52,
      percentageChange: 30,
      status: 'active' as const,
      createdAt: getDateInRange(2),
      updatedAt: getDateInRange(2),
    },
    {
      id: 'alert-threshold-2',
      type: 'threshold' as const,
      severity: 'high' as const,
      title: 'Critical Cases Backlog',
      description: 'Unresolved critical cases exceeded 10 in Business Banking',
      businessUnit: 'Business Banking',
      category: null,
      channel: null,
      baselineValue: 10,
      currentValue: 15,
      percentageChange: 50,
      status: 'active' as const,
      createdAt: getDateInRange(1),
      updatedAt: getDateInRange(1),
    },
  ];

  // Create urgency alerts
  const urgencyAlerts = [
    {
      id: 'alert-urgency-1',
      type: 'urgency' as const,
      severity: 'critical' as const,
      title: 'VIP Customer Complaint - Wealth Management',
      description: 'High-value customer reporting unauthorized transactions',
      businessUnit: 'Wealth Management',
      category: 'Fraud Report',
      channel: 'phone',
      baselineValue: null,
      currentValue: null,
      percentageChange: null,
      status: 'active' as const,
      createdAt: getDateInRange(0),
      updatedAt: getDateInRange(0),
    },
  ];

  // Create misclassification alerts
  const misclassificationAlerts = [
    {
      id: 'alert-misclass-1',
      type: 'misclassification' as const,
      severity: 'high' as const,
      title: 'Review needed: 8 potentially misclassified cases in Auto Finance',
      description: 'Low-severity cases contain risk indicators (legal, complaint, lawsuit) that may warrant reclassification. Found in the last 24 hours. Keywords detected: legal, lawsuit, complaint. Review recommended to ensure proper severity assignment.',
      businessUnit: 'Auto Finance',
      category: 'Billing Dispute',
      channel: null,
      baselineValue: null,
      currentValue: 8,
      percentageChange: null,
      status: 'active' as const,
      createdAt: getDateInRange(1),
      updatedAt: getDateInRange(1),
    },
    {
      id: 'alert-misclass-2',
      type: 'misclassification' as const,
      severity: 'medium' as const,
      title: 'Review needed: 3 potentially misclassified cases in Insurance',
      description: 'Low-severity cases contain risk indicators (injury, accident) that may warrant reclassification. Found in the last 24 hours. Keywords detected: injury, accident. Review recommended to ensure proper severity assignment.',
      businessUnit: 'Insurance',
      category: 'Complaint',
      channel: null,
      baselineValue: null,
      currentValue: 3,
      percentageChange: null,
      status: 'acknowledged' as const,
      acknowledgedBy: 'user-manager-3',
      acknowledgedAt: getDateInRange(0),
      createdAt: getDateInRange(2),
      updatedAt: getDateInRange(0),
    },
  ];

  alerts.push(...spikeAlerts, ...thresholdAlerts, ...urgencyAlerts, ...misclassificationAlerts);
  db.insert(schema.alerts).values(alerts).run();
  console.log(`✓ Seeded ${alerts.length} alerts`);
  return alerts;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function seedTrendingTopics(db: ReturnType<typeof drizzle>, _cases: schema.NewCase[]) {
  // Helper to compute baseline count from current count and percentage change
  const computeBaseline = (current: number, percentChange: number): number => {
    if (percentChange === 0) return current;
    return Math.round(current / (1 + percentChange / 100));
  };

  const topics: schema.NewTrendingTopic[] = [
    {
      id: 'trend-1',
      topic: 'Mobile App Login Failures',
      description: 'Increasing reports of users unable to access accounts via mobile app',
      caseCount: 156,
      baselineCount: computeBaseline(156, 45),
      trend: 'rising',
      percentageChange: 45,
      trendScore: calculateTrendScore(156, computeBaseline(156, 45)),
      businessUnit: 'Mobile Banking',
      category: 'Account Access',
      sampleCaseIds: JSON.stringify(['case-1', 'case-5', 'case-12']),
      createdAt: getDateInRange(2),
      updatedAt: getDateInRange(0),
    },
    {
      id: 'trend-2',
      topic: 'Credit Card Fraud - International',
      description: 'Spike in fraud reports from international transactions',
      caseCount: 89,
      baselineCount: computeBaseline(89, 78),
      trend: 'rising',
      percentageChange: 78,
      trendScore: calculateTrendScore(89, computeBaseline(89, 78)),
      businessUnit: 'Credit Cards',
      category: 'Fraud Report',
      sampleCaseIds: JSON.stringify(['case-23', 'case-45', 'case-67']),
      createdAt: getDateInRange(1),
      updatedAt: getDateInRange(0),
    },
    {
      id: 'trend-3',
      topic: 'Payment Processing Delays',
      description: 'Multiple complaints about delayed payment processing',
      caseCount: 67,
      baselineCount: computeBaseline(67, 32),
      trend: 'rising',
      percentageChange: 32,
      trendScore: calculateTrendScore(67, computeBaseline(67, 32)),
      businessUnit: 'Online Banking',
      category: 'Payment Issues',
      sampleCaseIds: JSON.stringify(['case-89', 'case-112', 'case-134']),
      createdAt: getDateInRange(3),
      updatedAt: getDateInRange(0),
    },
    {
      id: 'trend-4',
      topic: 'Rate Increase Complaints',
      description: 'Customer complaints following interest rate changes',
      caseCount: 45,
      baselineCount: computeBaseline(45, 5),
      trend: 'stable',
      percentageChange: 5,
      trendScore: calculateTrendScore(45, computeBaseline(45, 5)),
      businessUnit: 'Mortgages',
      category: 'Complaint',
      sampleCaseIds: JSON.stringify(['case-156', 'case-178']),
      createdAt: getDateInRange(7),
      updatedAt: getDateInRange(1),
    },
    {
      id: 'trend-5',
      topic: 'Card Activation Issues',
      description: 'New card activation process causing confusion',
      caseCount: 34,
      baselineCount: computeBaseline(34, -15),
      trend: 'declining',
      percentageChange: -15,
      trendScore: calculateTrendScore(34, computeBaseline(34, -15)),
      businessUnit: 'Credit Cards',
      category: 'Technical Support',
      sampleCaseIds: JSON.stringify(['case-200', 'case-210']),
      createdAt: getDateInRange(10),
      updatedAt: getDateInRange(2),
    },
  ];

  db.insert(schema.trendingTopics).values(topics).run();
  console.log(`✓ Seeded ${topics.length} trending topics`);
  return topics;
}

function seedFeedItems(db: ReturnType<typeof drizzle>, alerts: schema.NewAlert[], topics: schema.NewTrendingTopic[]) {
  const feedItems: schema.NewFeedItem[] = [];

  // Add feed items for alerts
  alerts.forEach((alert, i) => {
    feedItems.push({
      id: `feed-alert-${i + 1}`,
      type: 'alert',
      title: alert.title,
      content: alert.description,
      metadata: JSON.stringify({ severity: alert.severity, type: alert.type }),
      priority: alert.severity === 'critical' ? 100 : alert.severity === 'high' ? 75 : 50,
      referenceId: alert.id,
      referenceType: 'alert',
      createdAt: alert.createdAt,
      expiresAt: null,
    });
  });

  // Add feed items for trending topics
  topics.filter(t => t.trend === 'rising').forEach((topic, i) => {
    feedItems.push({
      id: `feed-trend-${i + 1}`,
      type: 'trending',
      title: `Trending: ${topic.topic}`,
      content: topic.description || '',
      metadata: JSON.stringify({ caseCount: topic.caseCount, percentageChange: topic.percentageChange }),
      priority: 60,
      referenceId: topic.id,
      referenceType: 'trending_topic',
      createdAt: topic.createdAt,
      expiresAt: null,
    });
  });

  // Add highlight feed items
  feedItems.push({
    id: 'feed-highlight-1',
    type: 'highlight',
    title: 'Daily Summary: Top Issues',
    content: 'Mobile Banking and Credit Cards seeing highest case volumes today',
    metadata: JSON.stringify({
      topBUs: ['Mobile Banking', 'Credit Cards', 'Online Banking'],
      totalCases: 234,
    }),
    priority: 80,
    referenceId: null,
    referenceType: null,
    createdAt: getDateInRange(0),
    expiresAt: getDateInRange(-1), // Expires tomorrow
  });

  feedItems.push({
    id: 'feed-upload-1',
    type: 'upload',
    title: 'New Batch Upload Processed',
    content: '1,250 cases imported from overnight call recordings',
    metadata: JSON.stringify({
      recordCount: 1250,
      source: 'call_recordings',
      processingTime: '45 minutes',
    }),
    priority: 40,
    referenceId: null,
    referenceType: null,
    createdAt: getDateInRange(0),
    expiresAt: null,
  });

  db.insert(schema.feedItems).values(feedItems).run();
  console.log(`✓ Seeded ${feedItems.length} feed items`);
  return feedItems;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function seedShares(db: ReturnType<typeof drizzle>, _alerts: schema.NewAlert[], _users: schema.NewUser[]) {
  const shares: schema.NewShare[] = [
    {
      id: 'share-1',
      type: 'escalation',
      sourceType: 'alert',
      sourceId: 'alert-urgency-1',
      senderId: 'user-supervisor-1',
      recipientId: 'user-manager-1',
      channel: 'internal',
      message: 'VIP customer issue requiring immediate attention',
      status: 'pending',
      createdAt: getDateInRange(0),
      readAt: null,
      actionedAt: null,
    },
    {
      id: 'share-2',
      type: 'share',
      sourceType: 'alert',
      sourceId: 'alert-spike-1',
      senderId: 'user-manager-1',
      recipientId: 'user-admin-1',
      channel: 'email',
      message: 'FYI - Fraud spike may require additional resources',
      status: 'read',
      createdAt: getDateInRange(1),
      readAt: getDateInRange(0),
      actionedAt: null,
    },
    {
      id: 'share-3',
      type: 'escalation',
      sourceType: 'case',
      sourceId: 'case-1',
      senderId: 'user-supervisor-3',
      recipientId: 'user-manager-2',
      channel: 'line',
      message: 'Customer threatening legal action - needs immediate callback',
      status: 'actioned',
      createdAt: getDateInRange(2),
      readAt: getDateInRange(1),
      actionedAt: getDateInRange(0),
    },
  ];

  db.insert(schema.shares).values(shares).run();
  console.log(`✓ Seeded ${shares.length} shares`);
  return shares;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main Seed Function
// ═══════════════════════════════════════════════════════════════════════════════
async function main() {
  console.log('\n🌱 Seeding Call Center Intelligence Database\n');
  console.log(`Mode: ${DEMO_MODE ? 'Demo (deterministic timestamps)' : 'Development'}`);
  console.log('─'.repeat(50));

  // Setup database
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = path.join(dataDir, 'call-center.db');

  // Remove existing database
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log('✓ Removed existing database');
  }

  const sqlite = new Database(dbPath);
  const db = drizzle(sqlite, { schema });

  // Create tables
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      role TEXT NOT NULL,
      business_unit TEXT,
      avatar_url TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cases (
      id TEXT PRIMARY KEY,
      case_number TEXT NOT NULL UNIQUE,
      channel TEXT NOT NULL,
      status TEXT NOT NULL,
      category TEXT NOT NULL,
      subcategory TEXT,
      sentiment TEXT NOT NULL,
      severity TEXT NOT NULL,
      risk_flag INTEGER NOT NULL DEFAULT 0,
      needs_review_flag INTEGER NOT NULL DEFAULT 0,
      business_unit TEXT NOT NULL,
      summary TEXT NOT NULL,
      customer_name TEXT,
      agent_id TEXT,
      assigned_to TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      resolved_at TEXT
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      severity TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      business_unit TEXT,
      category TEXT,
      channel TEXT,
      baseline_value REAL,
      current_value REAL,
      percentage_change REAL,
      status TEXT NOT NULL DEFAULT 'active',
      acknowledged_by TEXT,
      acknowledged_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS trending_topics (
      id TEXT PRIMARY KEY,
      topic TEXT NOT NULL,
      description TEXT,
      case_count INTEGER NOT NULL DEFAULT 0,
      baseline_count INTEGER NOT NULL DEFAULT 0,
      trend TEXT NOT NULL,
      percentage_change REAL,
      trend_score REAL NOT NULL DEFAULT 0,
      business_unit TEXT,
      category TEXT,
      sample_case_ids TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS feed_items (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      metadata TEXT,
      priority INTEGER NOT NULL DEFAULT 0,
      reference_id TEXT,
      reference_type TEXT,
      created_at TEXT NOT NULL,
      expires_at TEXT
    );

    CREATE TABLE IF NOT EXISTS shares (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      source_type TEXT NOT NULL,
      source_id TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      recipient_id TEXT NOT NULL,
      channel TEXT NOT NULL DEFAULT 'internal',
      message TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL,
      read_at TEXT,
      actioned_at TEXT
    );

    -- Indexes for performance
    CREATE INDEX IF NOT EXISTS idx_cases_business_unit ON cases(business_unit);
    CREATE INDEX IF NOT EXISTS idx_cases_channel ON cases(channel);
    CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
    CREATE INDEX IF NOT EXISTS idx_cases_severity ON cases(severity);
    CREATE INDEX IF NOT EXISTS idx_cases_created_at ON cases(created_at);
    CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
    CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
    CREATE INDEX IF NOT EXISTS idx_feed_items_type ON feed_items(type);
    CREATE INDEX IF NOT EXISTS idx_feed_items_created_at ON feed_items(created_at);
    CREATE INDEX IF NOT EXISTS idx_shares_recipient ON shares(recipient_id);
    CREATE INDEX IF NOT EXISTS idx_shares_status ON shares(status);
  `);
  console.log('✓ Created tables and indexes');

  // Seed data
  const users = seedUsers(db);
  const cases = seedCases(db, 2000);
  const predictedCases = seedPredictedRiskCases(db, cases.length + 1);
  const alerts = seedAlerts(db, cases);
  const topics = seedTrendingTopics(db, cases);
  seedFeedItems(db, alerts, topics);
  seedShares(db, alerts, users);

  // Print summary
  const totalCases = cases.length + predictedCases.length;
  console.log('─'.repeat(50));
  console.log('\n✅ Database seeded successfully!\n');
  console.log(`   Database: ${dbPath}`);
  console.log(`   Total records: ${16 + totalCases + 8 + 5 + 11 + 3}`);
  console.log('\n   Run "npm run db:studio" to explore the data\n');

  sqlite.close();
}

main().catch(console.error);
