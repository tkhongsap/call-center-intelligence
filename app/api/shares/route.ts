import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { shares, cases } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      type = 'share',
      sourceType,
      sourceId,
      senderId,
      recipientId,
      message,
      channel = 'internal',
    } = body;

    // Validate required fields
    if (!sourceType || !sourceId || !senderId || !recipientId) {
      return NextResponse.json(
        { error: 'Missing required fields: sourceType, sourceId, senderId, recipientId' },
        { status: 400 }
      );
    }

    // Create share record
    const shareId = randomUUID();
    const now = new Date().toISOString();

    await db.insert(shares).values({
      id: shareId,
      type: type as 'share' | 'escalation',
      sourceType: sourceType as 'alert' | 'case',
      sourceId,
      senderId,
      recipientId,
      channel: channel as 'internal' | 'email' | 'line',
      message: message || null,
      status: 'pending',
      createdAt: now,
    });

    // If it's an escalation for a case, update the case severity
    if (type === 'escalation' && sourceType === 'case') {
      await db.update(cases)
        .set({
          severity: 'critical',
          riskFlag: true,
          updatedAt: now,
        })
        .where(eq(cases.id, sourceId));
    }

    return NextResponse.json({
      id: shareId,
      message: `Successfully ${type === 'escalation' ? 'escalated' : 'shared'}`,
    });
  } catch (error) {
    console.error('Share creation failed:', error);
    return NextResponse.json(
      { error: 'Failed to create share' },
      { status: 500 }
    );
  }
}
