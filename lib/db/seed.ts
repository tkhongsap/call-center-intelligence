/**
 * Seed script for ThaiBev Call Center Intelligence database
 * Generates realistic test data for ThaiBev Group companies:
 * - ThaiBev (Beer & Spirits)
 * - Sermsuk (Non-Alcoholic Beverages)
 * - Oishi (Beverages & Restaurants)
 * - KFC Thailand (Delivery, Restaurants, Loyalty)
 *
 * Run with: npm run db:seed
 */

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import path from 'path';
import fs from 'fs';
import { calculateTrendScore } from '../trending';
import {
  BUSINESS_UNITS,
  BU_WEIGHTS,
  CATEGORIES,
  SUBCATEGORIES,
  BU_CATEGORIES,
  THAI_FIRST_NAMES,
  THAI_LAST_NAMES,
  ENGLISH_FIRST_NAMES,
  ENGLISH_LAST_NAMES,
  PRODUCTS,
  KFC_BRANCHES,
  OISHI_BRANCHES,
  RETAIL_STORES,
  CASE_SUMMARIES,
  KFC_APP_OUTAGE_SUMMARIES,
  OISHI_QUALITY_SUMMARIES,
  CHANG_PROMO_SUMMARIES,
  ALERT_TEMPLATES,
  TRENDING_TOPICS_TEMPLATES,
  type BusinessUnit,
  type Category,
} from './seed-data';

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

  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }

  pickMultiple<T>(arr: readonly T[], count: number): T[] {
    const shuffled = [...arr].sort(() => this.next() - 0.5);
    return shuffled.slice(0, count);
  }

  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  bool(probability = 0.5): boolean {
    return this.next() < probability;
  }

  // Weighted random selection
  weightedPick<T extends string>(weights: Record<T, number>): T {
    const entries = Object.entries(weights) as [T, number][];
    const totalWeight = entries.reduce((sum, [, weight]) => sum + weight, 0);
    let random = this.next() * totalWeight;

    for (const [item, weight] of entries) {
      random -= weight;
      if (random <= 0) return item;
    }

    return entries[0][0];
  }
}

const rng = new SeededRandom(SEED);

// ═══════════════════════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════════════════════

const CHANNELS: Array<'phone' | 'email' | 'line' | 'web'> = ['phone', 'email', 'line', 'web'];

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

function generateCustomerName(): string {
  // 70% Thai names, 30% English names
  if (rng.bool(0.7)) {
    return `${rng.pick(THAI_FIRST_NAMES)} ${rng.pick(THAI_LAST_NAMES)}`;
  }
  return `${rng.pick(ENGLISH_FIRST_NAMES)} ${rng.pick(ENGLISH_LAST_NAMES)}`;
}

function generateLotNumber(): string {
  const year = rng.int(2024, 2025);
  const month = String(rng.int(1, 12)).padStart(2, '0');
  const day = String(rng.int(1, 28)).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function generateQuantity(): string {
  return String(rng.int(2, 20));
}

function processSummaryTemplate(template: string): string {
  return template
    .replace(/\{\{lot\}\}/g, generateLotNumber())
    .replace(/\{\{quantity\}\}/g, generateQuantity());
}

function getSummaryForCase(businessUnit: BusinessUnit, category: Category): string {
  const buSummaries = CASE_SUMMARIES[businessUnit];
  if (!buSummaries) return `Customer inquiry regarding ${category.toLowerCase()} for ${businessUnit}`;

  const categorySummaries = buSummaries[category];
  if (!categorySummaries || categorySummaries.length === 0) {
    // Generate a generic summary with context
    const product = rng.pick(PRODUCTS[businessUnit] || ['product']);
    return `Customer reported ${category.toLowerCase()} issue with ${product}`;
  }

  return processSummaryTemplate(rng.pick(categorySummaries));
}

function getLocationForBU(businessUnit: BusinessUnit): string | null {
  if (businessUnit === 'KFC Delivery' || businessUnit === 'KFC Restaurants' || businessUnit === 'KFC Loyalty') {
    return rng.pick(KFC_BRANCHES);
  }
  if (businessUnit === 'Oishi Restaurants') {
    return rng.pick(OISHI_BRANCHES);
  }
  if (businessUnit === 'Beer & Spirits' || businessUnit === 'Non-Alcoholic Beverages' || businessUnit === 'Oishi Beverages') {
    return rng.pick(RETAIL_STORES);
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Seed Functions
// ═══════════════════════════════════════════════════════════════════════════════
function seedUsers(db: ReturnType<typeof drizzle>) {
  const thaiManagerNames = [
    'สุรศักดิ์ วงศ์ประเสริฐ', 'พรรณี จันทร์เจริญ', 'วิชัย พิทักษ์ธรรม',
    'อรุณี สุขสมบูรณ์', 'ธนกร เจริญกิจ', 'มาลี ศรีสุข',
  ];

  const users: schema.NewUser[] = [
    // Admins
    {
      id: 'user-admin-1',
      name: 'ธนพล ธนะวัฒน์',
      email: 'thanapol.t@thaibev.com',
      role: 'admin',
      businessUnit: null,
      avatarUrl: null,
      createdAt: getDateInRange(365),
    },
    // BU Managers
    ...BUSINESS_UNITS.slice(0, 6).map((bu, i) => ({
      id: `user-manager-${i + 1}`,
      name: thaiManagerNames[i] || generateCustomerName(),
      email: `manager${i + 1}@thaibev.com`,
      role: 'bu_manager' as const,
      businessUnit: bu,
      avatarUrl: null,
      createdAt: getDateInRange(180),
    })),
    // Supervisors
    ...Array.from({ length: 10 }, (_, i) => ({
      id: `user-supervisor-${i + 1}`,
      name: generateCustomerName(),
      email: `supervisor${i + 1}@thaibev.com`,
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
    // Weighted business unit selection
    const businessUnit = rng.weightedPick(BU_WEIGHTS);

    // Get category relevant to business unit
    const relevantCategories = BU_CATEGORIES[businessUnit];
    const category = rng.pick(relevantCategories);

    const subcategories = SUBCATEGORIES[category];
    const subcategory = subcategories ? rng.pick(subcategories) : null;

    const createdAt = getRandomDateInRange(0, 30);
    const status = rng.pick(['open', 'in_progress', 'resolved', 'closed'] as const);

    // Higher chance of negative sentiment for certain categories
    const isNegativeCategory = ['Food Safety', 'Order Issues', 'Delivery Problems', 'Product Quality'].includes(category);
    const sentimentWeights = isNegativeCategory
      ? ['negative', 'negative', 'negative', 'neutral', 'positive']
      : ['positive', 'neutral', 'neutral', 'negative'];

    // Risk flag for high-severity negative cases
    const severity = rng.pick(['low', 'medium', 'high', 'critical'] as const);
    const sentiment = rng.pick(sentimentWeights) as 'positive' | 'neutral' | 'negative';
    const riskFlag = sentiment === 'negative' && ['high', 'critical'].includes(severity) && rng.bool(0.3);
    const needsReviewFlag = rng.bool(0.1);

    // Generate summary with location context
    let summary = getSummaryForCase(businessUnit, category);
    const location = getLocationForBU(businessUnit);
    if (location && rng.bool(0.4)) {
      summary = `${summary} - ${location}`;
    }

    cases.push({
      id: `case-${i + 1}`,
      caseNumber: generateCaseNumber(i + 1),
      channel: rng.pick(CHANNELS),
      status,
      category,
      subcategory,
      sentiment,
      severity,
      riskFlag,
      needsReviewFlag,
      businessUnit,
      summary,
      customerName: generateCustomerName(),
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
 * 1. KFC App Outage: 300% increase in App & Technical issues
 * 2. Oishi Green Tea Quality: Multiple quality complaints with same lot
 * 3. Chang Promotion Error: Spike in promotion issues
 */
function seedPredictedRiskCases(db: ReturnType<typeof drizzle>, startingId: number): schema.NewCase[] {
  const cases: schema.NewCase[] = [];
  let caseIndex = startingId;

  // Helper to create a case with specific date offset
  const createPredictionCase = (
    daysAgo: number,
    summary: string,
    businessUnit: BusinessUnit,
    category: Category
  ): schema.NewCase => {
    const createdAt = getDateInRange(daysAgo);
    const subcategories = SUBCATEGORIES[category];
    return {
      id: `case-${caseIndex++}`,
      caseNumber: generateCaseNumber(caseIndex),
      channel: rng.pick(CHANNELS),
      status: rng.pick(['open', 'in_progress', 'resolved', 'closed'] as const),
      category,
      subcategory: subcategories ? rng.pick(subcategories) : null,
      sentiment: rng.pick(['negative', 'negative', 'neutral'] as const),
      severity: rng.pick(['medium', 'high'] as const),
      riskFlag: rng.bool(0.2),
      needsReviewFlag: rng.bool(0.1),
      businessUnit,
      summary: processSummaryTemplate(summary),
      customerName: generateCustomerName(),
      agentId: `agent-${rng.int(1, 50)}`,
      assignedTo: rng.bool(0.7) ? `user-supervisor-${rng.int(1, 10)}` : null,
      createdAt,
      updatedAt: createdAt,
      resolvedAt: null,
    };
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // Scenario 1: KFC Delivery App Outage
  // Spike in "App Crash" and "Payment Failed" cases - 300% increase
  // ═══════════════════════════════════════════════════════════════════════════════

  // Day 3 ago - 3 cases (baseline)
  for (let i = 0; i < 3; i++) {
    cases.push(createPredictionCase(
      3,
      rng.pick(KFC_APP_OUTAGE_SUMMARIES),
      'KFC Delivery',
      'App & Technical'
    ));
  }

  // Day 2 ago - 5 cases
  for (let i = 0; i < 5; i++) {
    cases.push(createPredictionCase(
      2,
      rng.pick(KFC_APP_OUTAGE_SUMMARIES),
      'KFC Delivery',
      'App & Technical'
    ));
  }

  // Day 1 ago - 10 cases
  for (let i = 0; i < 10; i++) {
    cases.push(createPredictionCase(
      1,
      rng.pick(KFC_APP_OUTAGE_SUMMARIES),
      'KFC Delivery',
      'App & Technical'
    ));
  }

  // Today - 18 cases (300% increase)
  for (let i = 0; i < 18; i++) {
    cases.push(createPredictionCase(
      0,
      rng.pick(KFC_APP_OUTAGE_SUMMARIES),
      'KFC Delivery',
      'App & Technical'
    ));
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // Scenario 2: Oishi Green Tea Quality Issue
  // Multiple "Taste Complaint" and "Foreign Object" reports with same lot number
  // ═══════════════════════════════════════════════════════════════════════════════

  const problematicLot = '2025-01-10';

  // Baseline period (7-14 days ago) - lower volume
  for (let day = 14; day >= 7; day--) {
    const casesPerDay = rng.int(1, 2);
    for (let i = 0; i < casesPerDay; i++) {
      cases.push(createPredictionCase(
        day,
        rng.pick(OISHI_QUALITY_SUMMARIES).replace('{{lot}}', generateLotNumber()),
        'Oishi Beverages',
        'Product Quality'
      ));
    }
  }

  // Current period (0-7 days ago) - spike with same lot
  for (let day = 6; day >= 0; day--) {
    const casesPerDay = rng.int(3, 5);
    for (let i = 0; i < casesPerDay; i++) {
      // 80% of cases mention the problematic lot
      const lot = rng.bool(0.8) ? problematicLot : generateLotNumber();
      cases.push(createPredictionCase(
        day,
        rng.pick(OISHI_QUALITY_SUMMARIES).replace('{{lot}}', lot),
        'Oishi Beverages',
        'Product Quality'
      ));
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // Scenario 3: Chang Beer Promotion Error
  // Threshold breach - 50+ cases in 24 hours for promotion issues
  // ═══════════════════════════════════════════════════════════════════════════════

  // Baseline (days 7-3 ago) - normal volume
  for (let day = 7; day >= 3; day--) {
    const casesPerDay = rng.int(2, 4);
    for (let i = 0; i < casesPerDay; i++) {
      cases.push(createPredictionCase(
        day,
        rng.pick(CHANG_PROMO_SUMMARIES),
        'Beer & Spirits',
        'Promotions & Pricing'
      ));
    }
  }

  // Spike period (last 2 days) - promo goes wrong
  for (let day = 2; day >= 0; day--) {
    const casesPerDay = day === 0 ? 25 : 15;
    for (let i = 0; i < casesPerDay; i++) {
      cases.push(createPredictionCase(
        day,
        rng.pick(CHANG_PROMO_SUMMARIES),
        'Beer & Spirits',
        'Promotions & Pricing'
      ));
    }
  }

  // Batch insert
  const batchSize = 100;
  for (let i = 0; i < cases.length; i += batchSize) {
    const batch = cases.slice(i, i + batchSize);
    db.insert(schema.cases).values(batch).run();
  }

  console.log(`✓ Seeded ${cases.length} predicted risk scenario cases`);
  console.log('  - KFC App Outage: 300% increase in app/technical issues');
  console.log('  - Oishi Quality: Multiple complaints for lot ' + problematicLot);
  console.log('  - Chang Promo: 50+ cases approaching threshold');

  return cases;
}

function seedAlerts(db: ReturnType<typeof drizzle>) {
  const alerts: schema.NewAlert[] = [];

  // Spike alerts
  ALERT_TEMPLATES.spike.forEach((template, i) => {
    const percent = rng.int(65, 150);
    alerts.push({
      id: `alert-spike-${i + 1}`,
      type: 'spike' as const,
      severity: percent > 100 ? 'critical' as const : 'high' as const,
      title: template.title,
      description: template.description.replace('{{percent}}', String(percent)),
      businessUnit: template.businessUnit,
      category: template.category,
      channel: rng.pick(CHANNELS),
      baselineValue: rng.int(20, 50),
      currentValue: rng.int(60, 120),
      percentageChange: percent,
      status: i === 0 ? 'active' as const : rng.pick(['active', 'acknowledged'] as const),
      acknowledgedBy: i > 0 && rng.bool(0.5) ? 'user-manager-1' : null,
      acknowledgedAt: i > 0 && rng.bool(0.5) ? getDateInRange(0) : null,
      createdAt: getDateInRange(rng.int(0, 2)),
      updatedAt: getDateInRange(0),
    });
  });

  // Threshold alerts
  ALERT_TEMPLATES.threshold.forEach((template, i) => {
    alerts.push({
      id: `alert-threshold-${i + 1}`,
      type: 'threshold' as const,
      severity: 'high' as const,
      title: template.title,
      description: template.description,
      businessUnit: template.businessUnit,
      category: template.category,
      channel: null,
      baselineValue: rng.int(30, 50),
      currentValue: rng.int(55, 75),
      percentageChange: rng.int(20, 40),
      status: 'active' as const,
      acknowledgedBy: null,
      acknowledgedAt: null,
      createdAt: getDateInRange(rng.int(1, 3)),
      updatedAt: getDateInRange(1),
    });
  });

  // Urgency alerts
  ALERT_TEMPLATES.urgency.forEach((template, i) => {
    alerts.push({
      id: `alert-urgency-${i + 1}`,
      type: 'urgency' as const,
      severity: 'critical' as const,
      title: template.title,
      description: template.description,
      businessUnit: template.businessUnit,
      category: template.category,
      channel: rng.pick(CHANNELS),
      baselineValue: null,
      currentValue: null,
      percentageChange: null,
      status: 'active' as const,
      acknowledgedBy: null,
      acknowledgedAt: null,
      createdAt: getDateInRange(0),
      updatedAt: getDateInRange(0),
    });
  });

  // Misclassification alerts
  ALERT_TEMPLATES.misclassification.forEach((template, i) => {
    const count = rng.int(5, 12);
    alerts.push({
      id: `alert-misclass-${i + 1}`,
      type: 'misclassification' as const,
      severity: 'high' as const,
      title: template.title.replace('{{count}}', String(count)),
      description: template.description,
      businessUnit: template.businessUnit,
      category: template.category,
      channel: null,
      baselineValue: null,
      currentValue: count,
      percentageChange: null,
      status: rng.pick(['active', 'acknowledged'] as const),
      acknowledgedBy: rng.bool(0.3) ? 'user-manager-2' : null,
      acknowledgedAt: rng.bool(0.3) ? getDateInRange(0) : null,
      createdAt: getDateInRange(rng.int(0, 2)),
      updatedAt: getDateInRange(0),
    });
  });

  db.insert(schema.alerts).values(alerts).run();
  console.log(`✓ Seeded ${alerts.length} alerts`);
  return alerts;
}

function seedTrendingTopics(db: ReturnType<typeof drizzle>) {
  const computeBaseline = (current: number, percentChange: number): number => {
    if (percentChange === 0) return current;
    return Math.round(current / (1 + percentChange / 100));
  };

  const topics: schema.NewTrendingTopic[] = TRENDING_TOPICS_TEMPLATES.map((template, i) => {
    const caseCount = rng.int(30, 150);
    const percentageChange = rng.int(15, 85);
    const baselineCount = computeBaseline(caseCount, percentageChange);
    const trend = percentageChange > 30 ? 'rising' : percentageChange > 10 ? 'stable' : 'declining';

    return {
      id: `trend-${i + 1}`,
      topic: template.topic,
      description: template.description,
      caseCount,
      baselineCount,
      trend: trend as 'rising' | 'stable' | 'declining',
      percentageChange,
      trendScore: calculateTrendScore(caseCount, baselineCount),
      businessUnit: template.businessUnit,
      category: template.category,
      sampleCaseIds: JSON.stringify([`case-${rng.int(1, 100)}`, `case-${rng.int(101, 200)}`, `case-${rng.int(201, 300)}`]),
      createdAt: getDateInRange(rng.int(1, 5)),
      updatedAt: getDateInRange(0),
    };
  });

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

  // Add ThaiBev-themed highlight feed items
  feedItems.push({
    id: 'feed-highlight-1',
    type: 'highlight',
    title: 'Daily Summary: ThaiBev Group',
    content: 'KFC Delivery and Oishi Restaurants showing highest case volumes today. Chang promotion issues require attention.',
    metadata: JSON.stringify({
      topBUs: ['KFC Delivery', 'Oishi Restaurants', 'Beer & Spirits'],
      totalCases: rng.int(200, 350),
    }),
    priority: 80,
    referenceId: null,
    referenceType: null,
    createdAt: getDateInRange(0),
    expiresAt: getDateInRange(-1),
  });

  feedItems.push({
    id: 'feed-upload-1',
    type: 'upload',
    title: 'New Batch Upload Processed',
    content: '1,850 cases imported from overnight call recordings across all ThaiBev channels',
    metadata: JSON.stringify({
      recordCount: 1850,
      source: 'call_recordings',
      processingTime: '52 minutes',
      channels: ['KFC 1150 Hotline', 'Oishi Customer Service', 'ThaiBev Corporate'],
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
function seedShares(db: ReturnType<typeof drizzle>, alerts: schema.NewAlert[], _users: schema.NewUser[]) {
  const shares: schema.NewShare[] = [
    {
      id: 'share-1',
      type: 'escalation',
      sourceType: 'alert',
      sourceId: alerts.find(a => a.type === 'urgency')?.id || 'alert-urgency-1',
      senderId: 'user-supervisor-1',
      recipientId: 'user-manager-1',
      channel: 'internal',
      message: 'Food safety issue at KFC requires immediate attention from management',
      status: 'pending',
      createdAt: getDateInRange(0),
      readAt: null,
      actionedAt: null,
    },
    {
      id: 'share-2',
      type: 'share',
      sourceType: 'alert',
      sourceId: alerts.find(a => a.title.includes('App'))?.id || 'alert-spike-1',
      senderId: 'user-manager-1',
      recipientId: 'user-admin-1',
      channel: 'email',
      message: 'FYI - KFC app issues may require IT team involvement',
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
      message: 'Customer threatening social media exposure - needs immediate callback',
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
  console.log('\n🌱 Seeding ThaiBev Call Center Intelligence Database\n');
  console.log(`Mode: ${DEMO_MODE ? 'Demo (deterministic timestamps)' : 'Development'}`);
  console.log('Companies: ThaiBev, Sermsuk, Oishi, KFC Thailand');
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
      resolved_at TEXT,
      upload_id TEXT
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

    CREATE TABLE IF NOT EXISTS uploads (
      id TEXT PRIMARY KEY,
      file_name TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'processing',
      total_rows INTEGER NOT NULL DEFAULT 0,
      success_count INTEGER NOT NULL DEFAULT 0,
      error_count INTEGER NOT NULL DEFAULT 0,
      errors TEXT,
      uploaded_by TEXT,
      created_at TEXT NOT NULL,
      completed_at TEXT,
      recompute_status TEXT,
      recompute_started_at TEXT,
      recompute_completed_at TEXT,
      alerts_generated INTEGER DEFAULT 0,
      trending_updated INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS search_analytics (
      id TEXT PRIMARY KEY,
      query TEXT NOT NULL,
      normalized_query TEXT NOT NULL,
      result_count INTEGER NOT NULL DEFAULT 0,
      execution_time_ms INTEGER,
      user_id TEXT,
      created_at TEXT NOT NULL
    );

    -- Indexes for performance
    CREATE INDEX IF NOT EXISTS idx_cases_business_unit ON cases(business_unit);
    CREATE INDEX IF NOT EXISTS idx_cases_channel ON cases(channel);
    CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
    CREATE INDEX IF NOT EXISTS idx_cases_severity ON cases(severity);
    CREATE INDEX IF NOT EXISTS idx_cases_category ON cases(category);
    CREATE INDEX IF NOT EXISTS idx_cases_created_at ON cases(created_at);
    CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
    CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
    CREATE INDEX IF NOT EXISTS idx_alerts_business_unit ON alerts(business_unit);
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
  const alerts = seedAlerts(db);
  const topics = seedTrendingTopics(db);
  seedFeedItems(db, alerts, topics);
  seedShares(db, alerts, users);

  // Print summary
  const totalCases = cases.length + predictedCases.length;
  console.log('─'.repeat(50));
  console.log('\n✅ ThaiBev Database seeded successfully!\n');
  console.log(`   Database: ${dbPath}`);
  console.log(`   Total cases: ${totalCases}`);
  console.log(`   Business Units: ${BUSINESS_UNITS.length}`);
  console.log(`   Categories: ${CATEGORIES.length}`);
  console.log('\n   Run "npm run db:studio" to explore the data\n');

  sqlite.close();
}

main().catch(console.error);
