import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cases } from '@/lib/db/schema';
import { gte, lte, and } from 'drizzle-orm';
import {
  getTimeWindowRanges,
  getCasesWithTerm,
  getImpactedBUs,
  getTermDailyCounts,
  calculatePercentChange,
  calculateTrendScore,
  getTrendDirection,
  normalizeTerm,
  type TimeWindow,
  type CaseData,
} from '@/lib/trending';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ topic: string }> }
) {
  const { topic } = await params;
  const decodedTopic = decodeURIComponent(topic);
  const normalizedTopic = normalizeTerm(decodedTopic);

  const searchParams = request.nextUrl.searchParams;
  const window = (searchParams.get('window') || '7d') as TimeWindow;

  // Get time ranges for comparison
  const ranges = getTimeWindowRanges(window);

  // Fetch cases in both time periods
  const [currentCases, baselineCases] = await Promise.all([
    db
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
          gte(cases.createdAt, ranges.currentStart.toISOString()),
          lte(cases.createdAt, ranges.currentEnd.toISOString())
        )
      ),
    db
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
          gte(cases.createdAt, ranges.baselineStart.toISOString()),
          lte(cases.createdAt, ranges.baselineEnd.toISOString())
        )
      ),
  ]);

  // Transform to CaseData format
  const currentCaseData: CaseData[] = currentCases.map((c) => ({
    id: c.id,
    summary: c.summary,
    businessUnit: c.businessUnit,
    category: c.category,
    createdAt: c.createdAt,
  }));

  const baselineCaseData: CaseData[] = baselineCases.map((c) => ({
    id: c.id,
    summary: c.summary,
    businessUnit: c.businessUnit,
    category: c.category,
    createdAt: c.createdAt,
  }));

  // Get cases containing this topic
  const matchingCurrentCases = getCasesWithTerm(currentCaseData, normalizedTopic);
  const matchingBaselineCases = getCasesWithTerm(baselineCaseData, normalizedTopic);

  if (matchingCurrentCases.length === 0 && matchingBaselineCases.length === 0) {
    return NextResponse.json(
      { error: 'Topic not found', topic: decodedTopic },
      { status: 404 }
    );
  }

  // Calculate metrics
  const currentCount = matchingCurrentCases.length;
  const baselineCount = matchingBaselineCases.length;
  const percentChange = calculatePercentChange(currentCount, baselineCount);
  const trendScore = calculateTrendScore(currentCount, baselineCount);
  const direction = getTrendDirection(percentChange);
  const impactedBUs = getImpactedBUs(currentCaseData, normalizedTopic);

  // Get daily counts for trend visualization (last 14 days)
  const allRecentCases = await db
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
        gte(cases.createdAt, new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()),
        lte(cases.createdAt, new Date().toISOString())
      )
    );

  const allCaseData: CaseData[] = allRecentCases.map((c) => ({
    id: c.id,
    summary: c.summary,
    businessUnit: c.businessUnit,
    category: c.category,
    createdAt: c.createdAt,
  }));

  const dailyCounts = getTermDailyCounts(allCaseData, normalizedTopic, 14);

  // Create daily data with dates
  const dailyData = dailyCounts.map((count, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (13 - index));
    date.setHours(0, 0, 0, 0);
    return {
      date: date.toISOString().split('T')[0],
      count,
    };
  });

  // Get category breakdown
  const categoryBreakdown: Record<string, number> = {};
  for (const c of matchingCurrentCases) {
    categoryBreakdown[c.category] = (categoryBreakdown[c.category] || 0) + 1;
  }

  // Get BU breakdown
  const buBreakdown: Record<string, number> = {};
  for (const c of matchingCurrentCases) {
    buBreakdown[c.businessUnit] = (buBreakdown[c.businessUnit] || 0) + 1;
  }

  return NextResponse.json({
    topic: decodedTopic,
    normalizedTopic,
    metrics: {
      currentCount,
      baselineCount,
      percentChange,
      trendScore,
      direction,
    },
    impactedBUs,
    dailyTrend: dailyData,
    categoryBreakdown: Object.entries(categoryBreakdown)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count),
    buBreakdown: Object.entries(buBreakdown)
      .map(([bu, count]) => ({ businessUnit: bu, count }))
      .sort((a, b) => b.count - a.count),
    sampleCases: matchingCurrentCases.slice(0, 10),
    metadata: {
      window,
      currentPeriod: {
        start: ranges.currentStart.toISOString(),
        end: ranges.currentEnd.toISOString(),
      },
      baselinePeriod: {
        start: ranges.baselineStart.toISOString(),
        end: ranges.baselineEnd.toISOString(),
      },
    },
  });
}
