import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cases } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  const { id } = await params;

  const caseRecord = await db.select()
    .from(cases)
    .where(eq(cases.id, id))
    .limit(1);

  if (caseRecord.length === 0) {
    return NextResponse.json(
      { error: 'Case not found' },
      { status: 404 }
    );
  }

  const caseData = caseRecord[0];

  // Generate AI summary from case data
  const summary = generateAISummary(caseData);

  // Generate mock timeline
  const timeline = generateTimeline(caseData);

  return NextResponse.json({
    ...caseData,
    aiSummary: summary,
    timeline,
  });
}

function generateAISummary(caseData: typeof cases.$inferSelect) {
  const whatHappened = `Customer ${caseData.customerName || 'contacted support'} via ${caseData.channel} regarding ${caseData.category.toLowerCase()}${caseData.subcategory ? ` - ${caseData.subcategory}` : ''}. ${caseData.summary}`;

  const impactMap: Record<string, string> = {
    critical: 'Critical business impact requiring immediate attention. Potential for significant customer churn and reputation damage.',
    high: 'High impact on customer experience. May affect customer retention if not resolved promptly.',
    medium: 'Moderate impact on customer satisfaction. Standard resolution timeline acceptable.',
    low: 'Low impact on business operations. Routine issue that can be handled through normal channels.',
  };

  const sentimentActions: Record<string, string> = {
    negative: 'Prioritize empathetic communication and expedited resolution. Consider follow-up call after resolution.',
    neutral: 'Proceed with standard resolution process. Maintain professional and helpful tone.',
    positive: 'Maintain positive relationship. Use as opportunity to gather feedback and offer additional services.',
  };

  const statusActions: Record<string, string> = {
    open: 'Assign to available agent and initiate contact within SLA timeframe.',
    in_progress: 'Continue monitoring progress. Escalate if approaching SLA breach.',
    resolved: 'Send satisfaction survey. Archive case notes for future reference.',
    closed: 'No further action required. Case has been fully resolved and documented.',
  };

  return {
    whatHappened,
    impact: impactMap[caseData.severity],
    suggestedAction: `${statusActions[caseData.status]} ${sentimentActions[caseData.sentiment]}`,
  };
}

function generateTimeline(caseData: typeof cases.$inferSelect) {
  const events = [
    {
      id: '1',
      type: 'created',
      title: 'Case Created',
      description: `Case opened via ${caseData.channel} channel`,
      timestamp: caseData.createdAt,
    },
  ];

  // Add assignment event if assigned
  if (caseData.assignedTo) {
    const assignedDate = new Date(caseData.createdAt);
    assignedDate.setMinutes(assignedDate.getMinutes() + 5);
    events.push({
      id: '2',
      type: 'assigned',
      title: 'Agent Assigned',
      description: `Case assigned to agent ${caseData.agentId || 'unknown'}`,
      timestamp: assignedDate.toISOString(),
    });
  }

  // Add contact event for in-progress/resolved/closed cases
  if (['in_progress', 'resolved', 'closed'].includes(caseData.status)) {
    const contactDate = new Date(caseData.createdAt);
    contactDate.setMinutes(contactDate.getMinutes() + 15);
    events.push({
      id: '3',
      type: 'contact',
      title: 'Customer Contacted',
      description: 'Initial contact made with customer',
      timestamp: contactDate.toISOString(),
    });
  }

  // Add resolution event if resolved
  if (caseData.resolvedAt) {
    events.push({
      id: '4',
      type: 'resolved',
      title: 'Case Resolved',
      description: 'Issue has been resolved',
      timestamp: caseData.resolvedAt,
    });
  }

  return events;
}
