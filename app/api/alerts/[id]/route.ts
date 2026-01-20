import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { alerts, cases } from '@/lib/db/schema';
import { eq, and, gte, sql, desc } from 'drizzle-orm';
import { ALERT_CONFIG } from '@/lib/alerts';

/**
 * Get a single alert by ID with sample cases and contributing data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Get the alert
  const [alert] = await db
    .select()
    .from(alerts)
    .where(eq(alerts.id, id))
    .limit(1);

  if (!alert) {
    return NextResponse.json(
      { error: 'Alert not found' },
      { status: 404 }
    );
  }

  // Calculate time window for fetching related cases
  // Default to 24 hours if we can't determine from the alert
  const hoursAgo = 24;
  const periodStart = new Date();
  periodStart.setHours(periodStart.getHours() - hoursAgo);

  // Build conditions for fetching sample cases
  const conditions = [
    gte(cases.createdAt, periodStart.toISOString()),
  ];

  // Filter by business unit if the alert is BU-specific
  if (alert.businessUnit) {
    conditions.push(eq(cases.businessUnit, alert.businessUnit));
  }

  // Filter by category if the alert has one
  if (alert.category) {
    conditions.push(eq(cases.category, alert.category));
  }

  // For urgency/misclassification alerts, filter by severity
  if (alert.type === 'urgency') {
    conditions.push(sql`${cases.severity} IN ('high', 'critical')`);
  } else if (alert.type === 'misclassification') {
    conditions.push(sql`${cases.severity} IN ('low', 'medium')`);
  }

  // Fetch sample cases
  const sampleCases = await db
    .select({
      id: cases.id,
      caseNumber: cases.caseNumber,
      summary: cases.summary,
      severity: cases.severity,
      status: cases.status,
      businessUnit: cases.businessUnit,
      category: cases.category,
      createdAt: cases.createdAt,
    })
    .from(cases)
    .where(and(...conditions))
    .orderBy(desc(cases.createdAt))
    .limit(10);

  // Extract contributing phrases/keywords for urgency and misclassification alerts
  let contributingPhrases: string[] = [];
  if (alert.type === 'urgency' || alert.type === 'misclassification') {
    const keywords = alert.type === 'urgency'
      ? ALERT_CONFIG.urgency.riskKeywords
      : ALERT_CONFIG.misclassification.riskKeywords;

    // Find which keywords appear in the sample cases
    const foundKeywords = new Set<string>();
    for (const caseItem of sampleCases) {
      const lowerSummary = caseItem.summary.toLowerCase();
      for (const keyword of keywords) {
        if (lowerSummary.includes(keyword.toLowerCase())) {
          foundKeywords.add(keyword);
        }
      }
    }
    contributingPhrases = Array.from(foundKeywords).slice(0, 10);
  }

  // Determine time window label
  let timeWindow: string | undefined;
  if (alert.title.includes('vs last week')) {
    timeWindow = 'Last 7 days';
  } else if (alert.title.includes('vs previous 24 hours')) {
    timeWindow = 'Last 24 hours';
  } else if (alert.title.includes('vs previous 4 hours')) {
    timeWindow = 'Last 4 hours';
  } else if (alert.type === 'spike') {
    timeWindow = 'Comparison period';
  }

  return NextResponse.json({
    alert,
    sampleCases,
    contributingPhrases,
    timeWindow,
  });
}
