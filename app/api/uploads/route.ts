import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { uploads } from '@/lib/db/schema';
import { desc, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(uploads);
    const total = countResult[0]?.count || 0;

    // Get uploads
    const uploadList = await db
      .select()
      .from(uploads)
      .orderBy(desc(uploads.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);

    return NextResponse.json({
      uploads: uploadList,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Failed to fetch uploads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch uploads' },
      { status: 500 }
    );
  }
}
