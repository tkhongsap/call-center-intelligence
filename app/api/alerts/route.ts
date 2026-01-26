import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { alerts } from '@/lib/db/schema';
import { eq, and, gte, lte, sql, desc, asc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  // Parse filters from query params
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const offset = (page - 1) * limit;

  const type = searchParams.get('type');
  const severity = searchParams.get('severity');
  const status = searchParams.get('status');
  const bu = searchParams.get('bu');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') || 'desc';

  // Build conditions array
  const conditions = [];

  if (type) {
    conditions.push(eq(alerts.type, type as 'spike' | 'threshold' | 'urgency' | 'misclassification'));
  }

  if (severity) {
    conditions.push(eq(alerts.severity, severity as 'low' | 'medium' | 'high' | 'critical'));
  }

  if (status) {
    conditions.push(eq(alerts.status, status as 'active' | 'acknowledged' | 'resolved' | 'dismissed'));
  }

  if (bu) {
    conditions.push(eq(alerts.businessUnit, bu));
  }

  if (startDate) {
    conditions.push(gte(alerts.createdAt, startDate));
  }

  if (endDate) {
    conditions.push(lte(alerts.createdAt, endDate));
  }

  // Build where clause
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Get sort column
  const sortColumn = sortBy === 'createdAt' ? alerts.createdAt :
                     sortBy === 'severity' ? alerts.severity :
                     sortBy === 'status' ? alerts.status :
                     sortBy === 'type' ? alerts.type :
                     alerts.createdAt;

  const orderFn = sortOrder === 'asc' ? asc : desc;

  // Execute queries
  const [alertsList, countResult] = await Promise.all([
    db.select()
      .from(alerts)
      .where(whereClause)
      .orderBy(orderFn(sortColumn))
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`count(*)` })
      .from(alerts)
      .where(whereClause)
  ]);

  const total = countResult[0]?.count || 0;
  const totalPages = Math.ceil(total / limit);

  return NextResponse.json({
    alerts: alertsList,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    }
  });
}
