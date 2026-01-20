import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { searchAnalytics } from '@/lib/db/schema';
import { desc, sql } from 'drizzle-orm';

/**
 * GET /api/search/analytics - Get popular searches
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const days = parseInt(searchParams.get('days') || '30', 10);

  try {
    // Calculate the date threshold
    const threshold = new Date();
    threshold.setDate(threshold.getDate() - days);
    const thresholdISO = threshold.toISOString();

    // Get popular searches grouped by normalized query
    const popularSearches = await db
      .select({
        query: searchAnalytics.normalizedQuery,
        searchCount: sql<number>`count(*)`.as('search_count'),
        avgResultCount: sql<number>`avg(${searchAnalytics.resultCount})`.as('avg_result_count'),
        avgExecutionTimeMs: sql<number>`avg(${searchAnalytics.executionTimeMs})`.as('avg_execution_time_ms'),
        lastSearched: sql<string>`max(${searchAnalytics.createdAt})`.as('last_searched'),
      })
      .from(searchAnalytics)
      .where(sql`${searchAnalytics.createdAt} >= ${thresholdISO}`)
      .groupBy(searchAnalytics.normalizedQuery)
      .orderBy(desc(sql`count(*)`))
      .limit(limit);

    return NextResponse.json({
      popularSearches: popularSearches.map((s) => ({
        query: s.query,
        searchCount: s.searchCount,
        avgResultCount: Math.round(s.avgResultCount || 0),
        avgExecutionTimeMs: Math.round(s.avgExecutionTimeMs || 0),
        lastSearched: s.lastSearched,
      })),
      period: `${days} days`,
    });
  } catch (error) {
    console.error('Search analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch search analytics' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/search/analytics - Log a search query
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, resultCount, executionTimeMs, userId } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    const normalizedQuery = query.toLowerCase().trim();

    // Don't log very short or empty queries
    if (normalizedQuery.length < 2) {
      return NextResponse.json({ success: true, logged: false });
    }

    const id = `search_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    await db.insert(searchAnalytics).values({
      id,
      query: query.trim(),
      normalizedQuery,
      resultCount: resultCount || 0,
      executionTimeMs: executionTimeMs || null,
      userId: userId || null,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, logged: true });
  } catch (error) {
    console.error('Search analytics log error:', error);
    // Don't fail the response - analytics logging shouldn't break the user experience
    return NextResponse.json({ success: true, logged: false });
  }
}
