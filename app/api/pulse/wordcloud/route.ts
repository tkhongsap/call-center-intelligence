import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cases } from '@/lib/db/schema';
import { sql, gte } from 'drizzle-orm';

export async function GET() {
  // Get cases from the last 7 days for word cloud
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoISO = weekAgo.toISOString();

  // Get category counts from recent cases
  const categoryCounts = await db
    .select({
      category: cases.category,
      count: sql<number>`count(*)`,
    })
    .from(cases)
    .where(gte(cases.createdAt, weekAgoISO))
    .groupBy(cases.category)
    .orderBy(sql`count(*) DESC`);

  // Transform to word cloud format
  const words = categoryCounts.map((row) => ({
    text: row.category,
    count: row.count,
    category: row.category,
  }));

  return NextResponse.json({
    words,
    generatedAt: new Date().toISOString(),
  });
}
