import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cases, trendingTopics } from '@/lib/db/schema';
import { gte, lte, and, eq } from 'drizzle-orm';
import {
  computeTrendingForWindow,
  computePredictedRisksForWindow,
  type TimeWindow,
  type CaseData,
} from '@/lib/trending';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const window = (body.window || '24h') as TimeWindow;
  const limit = parseInt(body.limit || '10', 10);

  // Fetch cases from the last 14 days for analysis
  const lookbackDays = 14;
  const now = new Date();
  const startDate = new Date(now.getTime() - lookbackDays * 24 * 60 * 60 * 1000);

  const allCases = await db
    .select({
      id: cases.id,
      summary: cases.summary,
      businessUnit: cases.businessUnit,
      category: cases.category,
      createdAt: cases.createdAt,
    })
    .from(cases)
    .where(
      and(
        gte(cases.createdAt, startDate.toISOString()),
        lte(cases.createdAt, now.toISOString())
      )
    );

  // Transform to CaseData format
  const caseData: CaseData[] = allCases.map((c) => ({
    id: c.id,
    summary: c.summary,
    businessUnit: c.businessUnit,
    category: c.category,
    createdAt: c.createdAt,
  }));

  // Compute trending topics
  const topics = computeTrendingForWindow(caseData, window, limit);

  // Compute predicted risks
  const predictions = computePredictedRisksForWindow(caseData, window, { limit });

  // Clear existing trending topics for this window
  // In a production system, you might want to archive old data instead
  const existingTopics = await db
    .select({ id: trendingTopics.id })
    .from(trendingTopics);

  for (const existing of existingTopics) {
    await db.delete(trendingTopics).where(eq(trendingTopics.id, existing.id));
  }

  // Insert new trending topics
  const newTopics = topics.map((topic, index) => ({
    id: `trend-computed-${Date.now()}-${index}`,
    topic: topic.term,
    description: `Trending topic: ${topic.term}`,
    caseCount: topic.currentCount,
    baselineCount: topic.baselineCount,
    trend: topic.direction,
    percentageChange: topic.percentChange,
    trendScore: topic.trendScore,
    businessUnit: topic.impactedBUs[0] || null,
    category: topic.sampleCases[0]?.category || null,
    sampleCaseIds: JSON.stringify(topic.sampleCases.map((c) => c.id)),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  }));

  if (newTopics.length > 0) {
    await db.insert(trendingTopics).values(newTopics);
  }

  return NextResponse.json({
    success: true,
    computed: {
      trendingTopics: topics.length,
      predictedRisks: predictions.length,
    },
    topics,
    predictions,
    metadata: {
      window,
      computedAt: now.toISOString(),
      totalCasesAnalyzed: allCases.length,
    },
  });
}
