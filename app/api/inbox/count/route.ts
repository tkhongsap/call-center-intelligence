import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { shares } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    // For now, use a mock current user ID (admin user)
    // In production, this would come from authentication
    const currentUserId = searchParams.get('userId') || 'user-admin-001';

    // Count pending shares for this user
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(shares)
      .where(
        and(
          eq(shares.recipientId, currentUserId),
          eq(shares.status, 'pending')
        )
      );

    // Count pending escalations specifically
    const escalationResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(shares)
      .where(
        and(
          eq(shares.recipientId, currentUserId),
          eq(shares.status, 'pending'),
          eq(shares.type, 'escalation')
        )
      );

    const count = countResult[0]?.count || 0;
    const escalationCount = escalationResult[0]?.count || 0;

    return NextResponse.json({
      count,
      hasEscalations: escalationCount > 0,
    });
  } catch (error) {
    console.error('Failed to fetch inbox count:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inbox count' },
      { status: 500 }
    );
  }
}
