import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cases, uploads, feedItems } from '@/lib/db/schema';
import { parseCSV, ParsedRow } from '@/lib/csvParser';
import { eq } from 'drizzle-orm';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function generateCaseId(): string {
  return `case-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      return NextResponse.json(
        { error: 'Invalid file type. Only CSV files are accepted.' },
        { status: 400 }
      );
    }

    // Read file content
    const csvText = await file.text();

    // Parse and validate CSV
    const parseResult = parseCSV(csvText);

    // Create upload record
    const uploadId = generateId();
    const now = new Date().toISOString();

    const uploadRecord = {
      id: uploadId,
      fileName: file.name,
      fileSize: file.size,
      status: 'processing' as const,
      totalRows: parseResult.totalRows,
      successCount: 0,
      errorCount: parseResult.errors.length,
      errors: parseResult.errors.length > 0 ? JSON.stringify(parseResult.errors) : null,
      createdAt: now,
    };

    await db.insert(uploads).values(uploadRecord);

    // If there are validation errors but some valid rows, process them
    // If all rows are invalid, mark as failed
    if (parseResult.validRows === 0 && parseResult.totalRows > 0) {
      await db
        .update(uploads)
        .set({
          status: 'failed',
          completedAt: now,
        })
        .where(eq(uploads.id, uploadId));

      return NextResponse.json({
        success: false,
        uploadId,
        message: 'All rows failed validation',
        totalRows: parseResult.totalRows,
        successCount: 0,
        errorCount: parseResult.invalidRows,
        errors: parseResult.errors,
      }, { status: 400 });
    }

    // Insert valid rows into cases table
    const insertedCases: string[] = [];
    const insertErrors: Array<{ row: number; error: string }> = [];

    for (let i = 0; i < parseResult.rows.length; i++) {
      const row = parseResult.rows[i];
      try {
        const caseId = generateCaseId();
        const caseRecord = mapParsedRowToCase(row, caseId, uploadId);
        await db.insert(cases).values(caseRecord);
        insertedCases.push(caseId);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        // Check for unique constraint violation
        if (errorMessage.includes('UNIQUE constraint')) {
          insertErrors.push({
            row: i + 2, // Account for header row and 0-indexing
            error: `Case number '${row.caseNumber}' already exists`,
          });
        } else {
          insertErrors.push({
            row: i + 2,
            error: errorMessage,
          });
        }
      }
    }

    // Determine final status
    const finalSuccessCount = insertedCases.length;
    const finalErrorCount = parseResult.errors.length + insertErrors.length;
    let finalStatus: 'completed' | 'partial' | 'failed';

    if (finalSuccessCount === 0) {
      finalStatus = 'failed';
    } else if (finalErrorCount > 0) {
      finalStatus = 'partial';
    } else {
      finalStatus = 'completed';
    }

    // Combine all errors
    const allErrors = [
      ...parseResult.errors,
      ...insertErrors.map(e => ({
        row: e.row,
        column: 'caseNumber',
        value: '',
        reason: e.error,
        suggestedFix: 'Use a unique case number',
      })),
    ];

    // Update upload record
    await db
      .update(uploads)
      .set({
        status: finalStatus,
        successCount: finalSuccessCount,
        errorCount: finalErrorCount,
        errors: allErrors.length > 0 ? JSON.stringify(allErrors) : null,
        completedAt: now,
        // Set recompute status to pending if upload was successful
        recomputeStatus: finalSuccessCount > 0 ? 'pending' : null,
      })
      .where(eq(uploads.id, uploadId));

    // Create feed item for successful upload
    if (finalSuccessCount > 0) {
      const feedItemId = generateId();
      await db.insert(feedItems).values({
        id: feedItemId,
        type: 'upload',
        title: 'New batch uploaded',
        content: `${finalSuccessCount} new case${finalSuccessCount > 1 ? 's' : ''} added from ${file.name}`,
        metadata: JSON.stringify({
          batchId: uploadId,
          fileName: file.name,
          caseCount: finalSuccessCount,
          status: finalStatus,
        }),
        priority: 5,
        referenceId: uploadId,
        referenceType: 'upload',
        createdAt: now,
      });
    }

    return NextResponse.json({
      success: finalStatus !== 'failed',
      uploadId,
      message: finalStatus === 'completed'
        ? 'Upload completed successfully'
        : finalStatus === 'partial'
          ? 'Upload completed with some errors'
          : 'Upload failed',
      totalRows: parseResult.totalRows,
      successCount: finalSuccessCount,
      errorCount: finalErrorCount,
      errors: allErrors.length > 0 ? allErrors : undefined,
      insertedCaseIds: insertedCases,
      recomputeStatus: finalSuccessCount > 0 ? 'pending' : null,
    });

  } catch (error) {
    console.error('Upload processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process upload' },
      { status: 500 }
    );
  }
}

function mapParsedRowToCase(row: ParsedRow, caseId: string, uploadId: string) {
  const now = new Date().toISOString();

  return {
    id: caseId,
    caseNumber: row.caseNumber,
    channel: row.channel as 'phone' | 'email' | 'line' | 'web',
    status: (row.status || 'open') as 'open' | 'in_progress' | 'resolved' | 'closed',
    category: row.category || 'General',
    sentiment: (row.sentiment || 'neutral') as 'positive' | 'neutral' | 'negative',
    severity: (row.severity || 'medium') as 'low' | 'medium' | 'high' | 'critical',
    riskFlag: false,
    needsReviewFlag: false,
    businessUnit: row.businessUnit,
    summary: row.summary || `Case ${row.caseNumber}`,
    customerName: row.customerName || null,
    createdAt: row.createdAt,
    updatedAt: now,
    uploadId, // Link case to upload batch for filtering
  };
}
