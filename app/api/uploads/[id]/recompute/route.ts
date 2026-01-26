import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { uploads, cases, trendingTopics } from '@/lib/db/schema';
import { eq, gte } from 'drizzle-orm';
import {
  generateSpikeAlerts,
  generateThresholdAlerts,
  generateUrgencyAlerts,
  generateMisclassificationAlerts,
} from '@/lib/alerts';
import {
  computeTrendingForWindow,
  type CaseData,
} from '@/lib/trending';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * POST /api/uploads/[id]/recompute
 * Trigger alert and trending recomputation after an upload
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: uploadId } = await params;

    // Get the upload record
    const upload = await db
      .select()
      .from(uploads)
      .where(eq(uploads.id, uploadId))
      .limit(1);

    if (upload.length === 0) {
      return NextResponse.json(
        { error: 'Upload not found' },
        { status: 404 }
      );
    }

    const uploadRecord = upload[0];

    // Check if recomputation is already in progress
    if (uploadRecord.recomputeStatus === 'processing') {
      return NextResponse.json({
        status: 'processing',
        message: 'Recomputation already in progress',
      });
    }

    // Mark as processing
    const now = new Date().toISOString();
    await db
      .update(uploads)
      .set({
        recomputeStatus: 'processing',
        recomputeStartedAt: now,
      })
      .where(eq(uploads.id, uploadId));

    // Simulate async processing with a small delay for prototype
    // In production, this would be a background job queue
    let totalAlertsGenerated = 0;

    try {
      // Generate all types of alerts
      const [spikeAlerts, thresholdAlerts, urgencyAlerts, misclassAlerts] = await Promise.all([
        generateSpikeAlerts('daily'),
        generateThresholdAlerts('daily'),
        generateUrgencyAlerts('daily'),
        generateMisclassificationAlerts('daily'),
      ]);

      totalAlertsGenerated =
        spikeAlerts.length +
        thresholdAlerts.length +
        urgencyAlerts.length +
        misclassAlerts.length;

      // Get cases for trending computation (last 14 days for 7d window)
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

      const recentCases = await db
        .select({
          id: cases.id,
          summary: cases.summary,
          businessUnit: cases.businessUnit,
          category: cases.category,
          createdAt: cases.createdAt,
        })
        .from(cases)
        .where(gte(cases.createdAt, twoWeeksAgo.toISOString()));

      // Compute trending topics
      const trendingData = computeTrendingForWindow(
        recentCases as CaseData[],
        '24h',
        10
      );

      // Clear old trending topics and insert new ones
      await db.delete(trendingTopics);

      if (trendingData.length > 0) {
        const trendingRecords = trendingData.map((topic, index) => ({
          id: `trending-${generateId()}-${index}`,
          topic: topic.term,
          description: `${topic.term} is trending with ${topic.currentCount} mentions`,
          caseCount: topic.currentCount,
          baselineCount: topic.baselineCount,
          trend: topic.direction,
          percentageChange: topic.percentChange,
          trendScore: topic.trendScore,
          businessUnit: topic.impactedBUs[0] || null,
          category: null,
          sampleCaseIds: JSON.stringify(topic.sampleCases.map(c => c.id)),
          createdAt: now,
          updatedAt: now,
        }));

        await db.insert(trendingTopics).values(trendingRecords);
      }

      // Mark recomputation as completed
      const completedAt = new Date().toISOString();
      await db
        .update(uploads)
        .set({
          recomputeStatus: 'completed',
          recomputeCompletedAt: completedAt,
          alertsGenerated: totalAlertsGenerated,
          trendingUpdated: true,
        })
        .where(eq(uploads.id, uploadId));

      return NextResponse.json({
        success: true,
        status: 'completed',
        alertsGenerated: totalAlertsGenerated,
        trendingUpdated: true,
        completedAt,
      });
    } catch (error) {
      // Mark as failed
      await db
        .update(uploads)
        .set({
          recomputeStatus: 'failed',
          recomputeCompletedAt: new Date().toISOString(),
        })
        .where(eq(uploads.id, uploadId));

      console.error('Recomputation error:', error);
      return NextResponse.json(
        { error: 'Recomputation failed', status: 'failed' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Recomputation API error:', error);
    return NextResponse.json(
      { error: 'Failed to process recomputation request' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/uploads/[id]/recompute
 * Check recomputation status for an upload
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: uploadId } = await params;

    const upload = await db
      .select({
        id: uploads.id,
        recomputeStatus: uploads.recomputeStatus,
        recomputeStartedAt: uploads.recomputeStartedAt,
        recomputeCompletedAt: uploads.recomputeCompletedAt,
        alertsGenerated: uploads.alertsGenerated,
        trendingUpdated: uploads.trendingUpdated,
      })
      .from(uploads)
      .where(eq(uploads.id, uploadId))
      .limit(1);

    if (upload.length === 0) {
      return NextResponse.json(
        { error: 'Upload not found' },
        { status: 404 }
      );
    }

    const uploadRecord = upload[0];

    return NextResponse.json({
      status: uploadRecord.recomputeStatus || 'pending',
      startedAt: uploadRecord.recomputeStartedAt,
      completedAt: uploadRecord.recomputeCompletedAt,
      alertsGenerated: uploadRecord.alertsGenerated || 0,
      trendingUpdated: uploadRecord.trendingUpdated || false,
    });
  } catch (error) {
    console.error('Get recompute status error:', error);
    return NextResponse.json(
      { error: 'Failed to get recomputation status' },
      { status: 500 }
    );
  }
}
