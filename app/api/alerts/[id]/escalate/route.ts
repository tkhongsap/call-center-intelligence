import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { alerts, shares } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: alertId } = await params;
    const body = await request.json();

    const {
      senderId,
      recipientId,
      message,
      channel = 'internal',
    } = body;

    // Validate required fields
    if (!senderId || !recipientId) {
      return NextResponse.json(
        { error: 'Missing required fields: senderId, recipientId' },
        { status: 400 }
      );
    }

    // Verify the alert exists
    const [existingAlert] = await db
      .select()
      .from(alerts)
      .where(eq(alerts.id, alertId))
      .limit(1);

    if (!existingAlert) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      );
    }

    const now = new Date().toISOString();

    // Update alert severity to critical if not already
    if (existingAlert.severity !== 'critical') {
      await db.update(alerts)
        .set({
          severity: 'critical',
          updatedAt: now,
        })
        .where(eq(alerts.id, alertId));
    }

    // Create an escalation share record
    const shareId = randomUUID();
    await db.insert(shares).values({
      id: shareId,
      type: 'escalation',
      sourceType: 'alert',
      sourceId: alertId,
      senderId,
      recipientId,
      channel: channel as 'internal' | 'email' | 'line',
      message: message || null,
      status: 'pending',
      createdAt: now,
    });

    return NextResponse.json({
      success: true,
      id: shareId,
      alertId,
      message: 'Alert escalated successfully',
    });
  } catch (error) {
    console.error('Failed to escalate alert:', error);
    return NextResponse.json(
      { error: 'Failed to escalate alert' },
      { status: 500 }
    );
  }
}
