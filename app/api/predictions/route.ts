import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cases } from '@/lib/db/schema';
import { gte, lte, and } from 'drizzle-orm';
import {
  computePredictedRisksForWindow,
  type TimeWindow,
  type CaseData,
  PREDICTION_CONFIG,
} from '@/lib/trending';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const window = (searchParams.get('window') || '7d') as TimeWindow;
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const threshold = parseInt(
    searchParams.get('threshold') || String(PREDICTION_CONFIG.defaultAlertThreshold),
    10
  );

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

  // Compute predicted risks
  const predictions = computePredictedRisksForWindow(caseData, window, {
    threshold,
    limit,
  });

  return NextResponse.json({
    predictions,
    metadata: {
      window,
      threshold,
      totalCasesAnalyzed: allCases.length,
      analysisDate: now.toISOString(),
    },
  });
}
