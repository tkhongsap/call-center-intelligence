import { NextRequest, NextResponse } from 'next/server';
import {
  startMockEventGenerator,
  stopMockEventGenerator,
  isMockEventGeneratorRunning,
  getMockEventConfig,
} from '@/lib/mockEvents';

export async function GET() {
  const config = getMockEventConfig();
  const isRunning = isMockEventGeneratorRunning();

  return NextResponse.json({
    enabled: isRunning,
    intervalMs: config.intervalMs,
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { enabled, intervalMs } = body;

    if (enabled) {
      startMockEventGenerator({
        intervalMs: intervalMs || 45000,
      });
    } else {
      stopMockEventGenerator();
    }

    const config = getMockEventConfig();
    const isRunning = isMockEventGeneratorRunning();

    return NextResponse.json({
      success: true,
      enabled: isRunning,
      intervalMs: config.intervalMs,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error toggling demo mode:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to toggle demo mode' },
      { status: 500 }
    );
  }
}
