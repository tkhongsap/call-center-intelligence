import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cases } from '@/lib/db/schema';
import { eq, and, like, gte, lte, sql, desc, asc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  // Parse filters from query params
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const offset = (page - 1) * limit;

  const bu = searchParams.get('bu');
  const channel = searchParams.get('channel');
  const category = searchParams.get('category');
  const severity = searchParams.get('severity');
  const status = searchParams.get('status');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const search = searchParams.get('search');
  const uploadBatch = searchParams.get('uploadBatch');
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') || 'desc';

  // Build conditions array
  const conditions = [];

  if (bu) {
    conditions.push(eq(cases.businessUnit, bu));
  }

  if (channel) {
    conditions.push(eq(cases.channel, channel as 'phone' | 'email' | 'line' | 'web'));
  }

  if (category) {
    conditions.push(eq(cases.category, category));
  }

  if (severity) {
    conditions.push(eq(cases.severity, severity as 'low' | 'medium' | 'high' | 'critical'));
  }

  if (status) {
    conditions.push(eq(cases.status, status as 'open' | 'in_progress' | 'resolved' | 'closed'));
  }

  if (startDate) {
    conditions.push(gte(cases.createdAt, startDate));
  }

  if (endDate) {
    conditions.push(lte(cases.createdAt, endDate));
  }

  if (search) {
    conditions.push(like(cases.summary, `%${search}%`));
  }

  if (uploadBatch) {
    conditions.push(eq(cases.uploadId, uploadBatch));
  }

  // Build where clause
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Get sort column
  const sortColumn = sortBy === 'createdAt' ? cases.createdAt :
                     sortBy === 'severity' ? cases.severity :
                     sortBy === 'status' ? cases.status :
                     sortBy === 'caseNumber' ? cases.caseNumber :
                     cases.createdAt;

  const orderFn = sortOrder === 'asc' ? asc : desc;

  // Execute queries
  const [casesList, countResult] = await Promise.all([
    db.select()
      .from(cases)
      .where(whereClause)
      .orderBy(orderFn(sortColumn))
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`count(*)` })
      .from(cases)
      .where(whereClause)
  ]);

  const total = countResult[0]?.count || 0;
  const totalPages = Math.ceil(total / limit);

  return NextResponse.json({
    cases: casesList,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    }
  });
}
