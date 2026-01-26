import { NextRequest, NextResponse } from 'next/server';
import { classifyIntent } from '@/lib/chatIntents';
import { generateResponse, type FilterState } from '@/lib/chatResponses';

interface ChatApiResponse {
  response: string;
  intent?: string;
  confidence?: number;
  filterState?: FilterState;
}

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Classify the intent
    const intentResult = classifyIntent(message);

    // Generate response based on intent
    const chatResponse = await generateResponse(intentResult);

    // Build API response
    const apiResponse: ChatApiResponse = {
      response: chatResponse.message,
      intent: intentResult.intent,
      confidence: intentResult.confidence,
    };

    // Include filter state if present (for apply_filter intent)
    if (chatResponse.filterState) {
      apiResponse.filterState = chatResponse.filterState;
    }

    return NextResponse.json(apiResponse);
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
