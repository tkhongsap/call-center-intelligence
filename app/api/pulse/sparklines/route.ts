import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cases } from '@/lib/db/schema';
import { and, gte, sql, or, eq } from 'drizzle-orm';

interface DayData {
  label: string;
  value: number;
}

export async function GET() {
  // Generate 7-day trend data
  const now = new Date();
  const days: { start: Date; end: Date; label: string }[] = [];

  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date(now);
    dayStart.setDate(dayStart.getDate() - i);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);

    const dayLabel = i === 0 ? 'Today' : i === 1 ? 'Yesterday' : dayStart.toLocaleDateString('en-US', { weekday: 'short' });

    days.push({ start: dayStart, end: dayEnd, label: dayLabel });
  }

  // For each day, get the metrics
  const sparklineData = await Promise.all(
    days.map(async (day) => {
      const dayStartISO = day.start.toISOString();
      const dayEndISO = day.end.toISOString();

      const [totalCasesResult, openCasesResult, criticalCasesResult, resolvedCasesResult] = await Promise.all([
        // Total cases created on this day
        db.select({ count: sql<number>`count(*)` })
          .from(cases)
          .where(and(
            gte(cases.createdAt, dayStartISO),
            sql`${cases.createdAt} <= ${dayEndISO}`
          )),

        // Open cases as of this day (simplified: cases created before end of day that are still open)
        db.select({ count: sql<number>`count(*)` })
          .from(cases)
          .where(and(
            sql`${cases.createdAt} <= ${dayEndISO}`,
            or(eq(cases.status, 'open'), eq(cases.status, 'in_progress'))
          )),

        // Critical/urgent cases created on this day
        db.select({ count: sql<number>`count(*)` })
          .from(cases)
          .where(and(
            gte(cases.createdAt, dayStartISO),
            sql`${cases.createdAt} <= ${dayEndISO}`,
            or(eq(cases.severity, 'high'), eq(cases.severity, 'critical'))
          )),

        // Resolved cases on this day
        db.select({ count: sql<number>`count(*)` })
          .from(cases)
          .where(and(
            gte(cases.resolvedAt, dayStartISO),
            sql`${cases.resolvedAt} <= ${dayEndISO}`
          )),
      ]);

      return {
        label: day.label,
        totalCases: totalCasesResult[0]?.count || 0,
        openCases: openCasesResult[0]?.count || 0,
        criticalCases: criticalCasesResult[0]?.count || 0,
        resolvedCases: resolvedCasesResult[0]?.count || 0,
      };
    })
  );

  // Transform into sparkline format
  const totalCasesTrend: DayData[] = sparklineData.map((d) => ({
    label: d.label,
    value: d.totalCases,
  }));

  const openCasesTrend: DayData[] = sparklineData.map((d) => ({
    label: d.label,
    value: d.openCases,
  }));

  const criticalCasesTrend: DayData[] = sparklineData.map((d) => ({
    label: d.label,
    value: d.criticalCases,
  }));

  const resolvedCasesTrend: DayData[] = sparklineData.map((d) => ({
    label: d.label,
    value: d.resolvedCases,
  }));

  // Calculate current values (last day)
  const current = sparklineData[sparklineData.length - 1];

  return NextResponse.json({
    sparklines: {
      totalCases: {
        data: totalCasesTrend,
        currentValue: current.totalCases,
      },
      openCases: {
        data: openCasesTrend,
        currentValue: current.openCases,
      },
      criticalCases: {
        data: criticalCasesTrend,
        currentValue: current.criticalCases,
      },
      resolvedCases: {
        data: resolvedCasesTrend,
        currentValue: current.resolvedCases,
      },
    },
  });
}
