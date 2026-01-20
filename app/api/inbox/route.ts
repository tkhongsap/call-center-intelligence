import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { shares, users, alerts, cases } from '@/lib/db/schema';
import { eq, or, desc, and, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // For now, use a mock current user ID (admin user)
    // In production, this would come from authentication
    const currentUserId = searchParams.get('userId') || 'user-admin-001';
    const status = searchParams.get('status'); // pending, read, actioned, or 'all'
    const type = searchParams.get('type'); // share, escalation, or 'all'
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // Build conditions
    const conditions = [eq(shares.recipientId, currentUserId)];

    if (status && status !== 'all') {
      conditions.push(eq(shares.status, status as 'pending' | 'read' | 'actioned'));
    }

    if (type && type !== 'all') {
      conditions.push(eq(shares.type, type as 'share' | 'escalation'));
    }

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(shares)
      .where(and(...conditions));
    const total = countResult[0]?.count || 0;

    // Get inbox items with sender info
    const inboxItems = await db
      .select({
        id: shares.id,
        type: shares.type,
        sourceType: shares.sourceType,
        sourceId: shares.sourceId,
        senderId: shares.senderId,
        message: shares.message,
        channel: shares.channel,
        status: shares.status,
        createdAt: shares.createdAt,
        readAt: shares.readAt,
        actionedAt: shares.actionedAt,
      })
      .from(shares)
      .where(and(...conditions))
      .orderBy(desc(shares.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);

    // Enrich with sender info and source details
    const enrichedItems = await Promise.all(
      inboxItems.map(async (item) => {
        // Get sender info
        const [sender] = await db
          .select({
            id: users.id,
            name: users.name,
            email: users.email,
            role: users.role,
            avatarUrl: users.avatarUrl,
          })
          .from(users)
          .where(eq(users.id, item.senderId))
          .limit(1);

        // Get source details (alert or case)
        let source = null;
        if (item.sourceType === 'alert') {
          const [alert] = await db
            .select({
              id: alerts.id,
              type: alerts.type,
              severity: alerts.severity,
              title: alerts.title,
              description: alerts.description,
              businessUnit: alerts.businessUnit,
              status: alerts.status,
            })
            .from(alerts)
            .where(eq(alerts.id, item.sourceId))
            .limit(1);
          source = alert ? { ...alert, sourceType: 'alert' as const } : null;
        } else if (item.sourceType === 'case') {
          const [caseItem] = await db
            .select({
              id: cases.id,
              caseNumber: cases.caseNumber,
              severity: cases.severity,
              summary: cases.summary,
              businessUnit: cases.businessUnit,
              status: cases.status,
              category: cases.category,
            })
            .from(cases)
            .where(eq(cases.id, item.sourceId))
            .limit(1);
          source = caseItem ? { ...caseItem, sourceType: 'case' as const } : null;
        }

        return {
          ...item,
          sender: sender || null,
          source,
        };
      })
    );

    return NextResponse.json({
      items: enrichedItems,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Failed to fetch inbox:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inbox items' },
      { status: 500 }
    );
  }
}

// Mark item as read
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Missing required field: id' },
        { status: 400 }
      );
    }

    const validStatuses = ['pending', 'read', 'actioned'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: pending, read, actioned' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const updateData: Record<string, string | null> = {};

    if (status === 'read') {
      updateData.status = 'read';
      updateData.readAt = now;
    } else if (status === 'actioned') {
      updateData.status = 'actioned';
      updateData.actionedAt = now;
      // Also set readAt if not already set
      updateData.readAt = now;
    } else if (status === 'pending') {
      updateData.status = 'pending';
      updateData.readAt = null;
      updateData.actionedAt = null;
    }

    await db
      .update(shares)
      .set(updateData)
      .where(eq(shares.id, id));

    return NextResponse.json({ success: true, id, status });
  } catch (error) {
    console.error('Failed to update inbox item:', error);
    return NextResponse.json(
      { error: 'Failed to update inbox item' },
      { status: 500 }
    );
  }
}
