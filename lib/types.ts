// Type definitions for the application
// These replace the database schema imports since we're using a FastAPI backend

export interface Case {
  id: string;
  title: string;
  summary: string;
  description: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  severity: "low" | "medium" | "high" | "critical";
  businessUnit: string;
  channel: "phone" | "email" | "line" | "web";
  sentiment: "positive" | "neutral" | "negative";
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface Alert {
  id: string;
  type: "spike" | "threshold" | "urgency" | "misclassification";
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "active" | "acknowledged" | "resolved" | "dismissed";
  businessUnit?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
  sampleCaseIds?: string[];
}

export interface FeedItem {
  id: string;
  type: "alert" | "trending" | "highlight" | "upload";
  title: string;
  content: string;
  priority: number;
  metadata?: Record<string, any>;
  referenceId?: string;
  referenceType?: string;
  createdAt: string;
  expiresAt?: string;
}

export interface Upload {
  id: string;
  fileName: string;
  status: "processing" | "completed" | "failed" | "partial";
  totalRows: number;
  processedRows: number;
  errorCount: number;
  createdAt: string;
  completedAt?: string;
  errors?: string[];
}

export interface TrendingTopic {
  id: string;
  topic: string;
  caseCount: number;
  trendScore: number;
  percentageChange?: number;
  businessUnit?: string;
  sampleCaseIds?: string[];
  createdAt: string;
}

export interface Share {
  id: string;
  type: "share" | "escalation";
  sourceType: "alert" | "case";
  sourceId: string;
  channel: "internal" | "email" | "line";
  status: "pending" | "read" | "actioned";
  recipientId: string;
  senderId: string;
  message?: string;
  createdAt: string;
  readAt?: string;
  actionedAt?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "bu_manager" | "supervisor";
  businessUnit?: string;
  createdAt: string;
  updatedAt: string;
}

// New type aliases for compatibility
export type NewCase = Omit<Case, "id" | "createdAt" | "updatedAt">;
export type NewAlert = Omit<Alert, "id" | "createdAt" | "updatedAt">;
export type NewFeedItem = Omit<FeedItem, "id" | "createdAt">;
export type NewUpload = Omit<Upload, "id" | "createdAt">;
export type NewTrendingTopic = Omit<TrendingTopic, "id" | "createdAt">;
export type NewShare = Omit<Share, "id" | "createdAt">;
