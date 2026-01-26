import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { alerts } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function GET() {
  // Get count of active alerts (not resolved or dismissed)
  const [activeCount, criticalCount, highCount] = await Promise.all([
    db.select({ count: sql<number>`count(*)` })
      .from(alerts)
      .where(eq(alerts.status, 'active')),
    db.select({ count: sql<number>`count(*)` })
      .from(alerts)
      .where(sql`${alerts.status} = 'active' AND ${alerts.severity} = 'critical'`),
    db.select({ count: sql<number>`count(*)` })
      .from(alerts)
      .where(sql`${alerts.status} = 'active' AND ${alerts.severity} = 'high'`),
  ]);

  return NextResponse.json({
    total: activeCount[0]?.count || 0,
    critical: criticalCount[0]?.count || 0,
    high: highCount[0]?.count || 0,
    timestamp: new Date().toISOString(),
  });
}
