import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// ═══════════════════════════════════════════════════════════════════════════════
// Users Table - Mock user directory
// ═══════════════════════════════════════════════════════════════════════════════
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  role: text('role', { enum: ['admin', 'bu_manager', 'supervisor'] }).notNull(),
  businessUnit: text('business_unit'),
  avatarUrl: text('avatar_url'),
  createdAt: text('created_at').notNull(),
});

// ═══════════════════════════════════════════════════════════════════════════════
// Cases Table - Customer service cases
// ═══════════════════════════════════════════════════════════════════════════════
export const cases = sqliteTable('cases', {
  id: text('id').primaryKey(),
  caseNumber: text('case_number').notNull().unique(),
  channel: text('channel', { enum: ['phone', 'email', 'line', 'web'] }).notNull(),
  status: text('status', { enum: ['open', 'in_progress', 'resolved', 'closed'] }).notNull(),
  category: text('category').notNull(),
  subcategory: text('subcategory'),
  sentiment: text('sentiment', { enum: ['positive', 'neutral', 'negative'] }).notNull(),
  severity: text('severity', { enum: ['low', 'medium', 'high', 'critical'] }).notNull(),
  riskFlag: integer('risk_flag', { mode: 'boolean' }).notNull().default(false),
  needsReviewFlag: integer('needs_review_flag', { mode: 'boolean' }).notNull().default(false),
  businessUnit: text('business_unit').notNull(),
  summary: text('summary').notNull(),
  customerName: text('customer_name'),
  agentId: text('agent_id'),
  assignedTo: text('assigned_to'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  resolvedAt: text('resolved_at'),
});

// ═══════════════════════════════════════════════════════════════════════════════
// Alerts Table - System alerts
// ═══════════════════════════════════════════════════════════════════════════════
export const alerts = sqliteTable('alerts', {
  id: text('id').primaryKey(),
  type: text('type', { enum: ['spike', 'threshold', 'urgency', 'misclassification'] }).notNull(),
  severity: text('severity', { enum: ['low', 'medium', 'high', 'critical'] }).notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  businessUnit: text('business_unit'),
  category: text('category'),
  channel: text('channel'),
  baselineValue: real('baseline_value'),
  currentValue: real('current_value'),
  percentageChange: real('percentage_change'),
  status: text('status', { enum: ['active', 'acknowledged', 'resolved', 'dismissed'] }).notNull().default('active'),
  acknowledgedBy: text('acknowledged_by'),
  acknowledgedAt: text('acknowledged_at'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// ═══════════════════════════════════════════════════════════════════════════════
// Trending Topics Table - Trending issues
// ═══════════════════════════════════════════════════════════════════════════════
export const trendingTopics = sqliteTable('trending_topics', {
  id: text('id').primaryKey(),
  topic: text('topic').notNull(),
  description: text('description'),
  caseCount: integer('case_count').notNull().default(0),
  trend: text('trend', { enum: ['rising', 'stable', 'declining'] }).notNull(),
  percentageChange: real('percentage_change'),
  businessUnit: text('business_unit'),
  category: text('category'),
  sampleCaseIds: text('sample_case_ids'), // JSON array of case IDs
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// ═══════════════════════════════════════════════════════════════════════════════
// Feed Items Table - Home feed items
// ═══════════════════════════════════════════════════════════════════════════════
export const feedItems = sqliteTable('feed_items', {
  id: text('id').primaryKey(),
  type: text('type', { enum: ['alert', 'trending', 'highlight', 'upload'] }).notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  metadata: text('metadata'), // JSON object for type-specific data
  priority: integer('priority').notNull().default(0),
  referenceId: text('reference_id'), // ID of related alert, topic, etc.
  referenceType: text('reference_type'),
  createdAt: text('created_at').notNull(),
  expiresAt: text('expires_at'),
});

// ═══════════════════════════════════════════════════════════════════════════════
// Shares Table - Alert/case shares
// ═══════════════════════════════════════════════════════════════════════════════
export const shares = sqliteTable('shares', {
  id: text('id').primaryKey(),
  type: text('type', { enum: ['share', 'escalation'] }).notNull(),
  sourceType: text('source_type', { enum: ['alert', 'case'] }).notNull(),
  sourceId: text('source_id').notNull(),
  senderId: text('sender_id').notNull(),
  recipientId: text('recipient_id').notNull(),
  channel: text('channel', { enum: ['internal', 'email', 'line'] }).notNull().default('internal'),
  message: text('message'),
  status: text('status', { enum: ['pending', 'read', 'actioned'] }).notNull().default('pending'),
  createdAt: text('created_at').notNull(),
  readAt: text('read_at'),
  actionedAt: text('actioned_at'),
});

// ═══════════════════════════════════════════════════════════════════════════════
// Relations
// ═══════════════════════════════════════════════════════════════════════════════
export const usersRelations = relations(users, ({ many }) => ({
  sentShares: many(shares, { relationName: 'sender' }),
  receivedShares: many(shares, { relationName: 'recipient' }),
}));

export const sharesRelations = relations(shares, ({ one }) => ({
  sender: one(users, {
    fields: [shares.senderId],
    references: [users.id],
    relationName: 'sender',
  }),
  recipient: one(users, {
    fields: [shares.recipientId],
    references: [users.id],
    relationName: 'recipient',
  }),
}));

// ═══════════════════════════════════════════════════════════════════════════════
// Type exports
// ═══════════════════════════════════════════════════════════════════════════════
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Case = typeof cases.$inferSelect;
export type NewCase = typeof cases.$inferInsert;

export type Alert = typeof alerts.$inferSelect;
export type NewAlert = typeof alerts.$inferInsert;

export type TrendingTopic = typeof trendingTopics.$inferSelect;
export type NewTrendingTopic = typeof trendingTopics.$inferInsert;

export type FeedItem = typeof feedItems.$inferSelect;
export type NewFeedItem = typeof feedItems.$inferInsert;

export type Share = typeof shares.$inferSelect;
export type NewShare = typeof shares.$inferInsert;
