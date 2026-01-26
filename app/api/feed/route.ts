import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { feedItems } from '@/lib/db/schema';
import { eq, and, gte, sql, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  // Parse filters from query params
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const offset = (page - 1) * limit;

  const type = searchParams.get('type');
  const bu = searchParams.get('bu');
  const channel = searchParams.get('channel');
  const dateRange = searchParams.get('dateRange') || 'today';

  // Calculate date filter based on dateRange
  const now = new Date();
  let startDate: Date;
  switch (dateRange) {
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'today':
    default:
      startDate = new Date(now.setHours(0, 0, 0, 0));
      break;
  }

  // Build conditions array
  const conditions = [];

  if (type) {
    conditions.push(eq(feedItems.type, type as 'alert' | 'trending' | 'highlight' | 'upload'));
  }

  // Filter by date - items created on or after startDate
  conditions.push(gte(feedItems.createdAt, startDate.toISOString()));

  // Filter by business unit via metadata (JSON contains check)
  // Note: For SQLite, we use a simple LIKE pattern match on metadata
  if (bu) {
    conditions.push(sql`${feedItems.metadata} LIKE ${'%"businessUnit":"' + bu + '"%'}`);
  }

  // Filter by channel via metadata
  if (channel) {
    conditions.push(sql`${feedItems.metadata} LIKE ${'%"channel":"' + channel + '"%'}`);
  }

  // Build where clause
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Execute queries - sort by priority (highest first), then by createdAt (newest first)
  const [items, countResult] = await Promise.all([
    db.select()
      .from(feedItems)
      .where(whereClause)
      .orderBy(desc(feedItems.priority), desc(feedItems.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`count(*)` })
      .from(feedItems)
      .where(whereClause)
  ]);

  const total = countResult[0]?.count || 0;
  const totalPages = Math.ceil(total / limit);

  return NextResponse.json({
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    }
  });
}
