import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { uploads, cases } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

/**
 * GET /api/uploads/[id]
 * Get upload details including associated case count
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: uploadId } = await params;

    // Get the upload record
    const uploadResult = await db
      .select()
      .from(uploads)
      .where(eq(uploads.id, uploadId))
      .limit(1);

    if (uploadResult.length === 0) {
      return NextResponse.json(
        { error: 'Upload not found' },
        { status: 404 }
      );
    }

    const upload = uploadResult[0];

    // Get count of cases associated with this upload
    const caseCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(cases)
      .where(eq(cases.uploadId, uploadId));

    const caseCount = caseCountResult[0]?.count || 0;

    // Parse errors if they exist
    let parsedErrors = null;
    if (upload.errors) {
      try {
        parsedErrors = JSON.parse(upload.errors);
      } catch {
        parsedErrors = upload.errors;
      }
    }

    return NextResponse.json({
      ...upload,
      errors: parsedErrors,
      associatedCaseCount: caseCount,
    });
  } catch (error) {
    console.error('Failed to fetch upload details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch upload details' },
      { status: 500 }
    );
  }
}
