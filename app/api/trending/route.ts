import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cases } from '@/lib/db/schema';
import { gte, lte, and } from 'drizzle-orm';
import {
  computeTrendingTopics,
  getTimeWindowRanges,
  type TimeWindow,
  type CaseData,
} from '@/lib/trending';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const window = (searchParams.get('window') || '24h') as TimeWindow;
  const limit = parseInt(searchParams.get('limit') || '5', 10);

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

  // Compute trending topics
  const topics = computeTrendingTopics(currentCaseData, baselineCaseData, limit);

  return NextResponse.json({
    topics,
    metadata: {
      window,
      currentPeriod: {
        start: ranges.currentStart.toISOString(),
        end: ranges.currentEnd.toISOString(),
        caseCount: currentCases.length,
      },
      baselinePeriod: {
        start: ranges.baselineStart.toISOString(),
        end: ranges.baselineEnd.toISOString(),
        caseCount: baselineCases.length,
      },
    },
  });
}
